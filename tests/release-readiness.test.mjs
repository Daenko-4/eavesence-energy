import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {paydayForecast,paydayPayments,parseMoney,savingsToDate,confirmSavingsChange} from '../packages/core/src/homeValue.ts';
import {createSavingsAction} from '../packages/core/src/savingsPlan.ts';
import {monthChecklist,togglePayment} from '../packages/core/src/paymentChecklist.ts';
import {usePaymentChecklist} from '../packages/core/src/usePaymentChecklist.ts';
import {useSavingsCoach} from '../packages/core/src/useSavingsCoach.ts';
import {createHouseholdProfile,createHouseholdBackup} from '../src/lib/household.ts';
import {convertWebBackup} from '../apps/mobile/src/webBackup.ts';
import {createMobileBackup,readMobileBackup} from '../apps/mobile/src/backup.ts';
const stamp='2026-10-04T08:00:00Z';
const cost=(changes={})=>({id:'rent',name:'Rent',category:'housing',amount:900,frequency:'monthly',nextDueDate:'2026-10-01',updatedAt:stamp,...changes});
const cash={balance:1400,asOf:'2026-10-04',payday:'2026-10-25',protected:100,everydayRemaining:200};

test('payday includes earlier unchecked bills this month, excludes paid ones and preserves next month',()=>{
 const costs=[cost(),cost({id:'stream',name:'Streaming',category:'subscriptions',amount:18,nextDueDate:'2026-10-04'})];
 const before=structuredClone(costs),forecast=paydayForecast(costs,cash,null,'2026-10-04');
 assert.equal(forecast.overdue,1);assert.equal(forecast.fixed,918);assert.equal(forecast.remaining,182);
 const rent=monthChecklist(costs,'2026-10').payments.find(p=>p.cost.id==='rent');
 const paid=togglePayment([],rent,stamp),after=paydayForecast(costs,cash,null,'2026-10-04',paid);
 assert.equal(after.overdue,0);assert.equal(after.remaining,1082);
 assert.equal(monthChecklist(costs,'2026-11',paid).openTotal,918);assert.deepEqual(costs,before);
});
test('negative balance shows a real shortfall, while invalid spending and stale cash remain rejected',()=>{
 assert.equal(paydayForecast([], {...cash,balance:-50},null,'2026-10-04').remaining,-350);
 assert.equal(paydayForecast([], {...cash,asOf:'2026-10-03'},null,'2026-10-04'),null);
 assert.equal(parseMoney('-1.234,50','de'),-1234.5);assert.equal(parseMoney('1,234.50','en'),1234.5);
 assert.ok(Number.isNaN(parseMoney('12 euros','en')));
});
test('planned savings never count, dated savings and estimates stay separate, annual savings wait for the bill',()=>{
 const dated={...createSavingsAction(cost({id:'stream',category:'subscriptions',amount:18,nextDueDate:'2026-10-04'}),0,'2026-10'),status:'confirmed',confirmedAt:stamp};
 const undated={...createSavingsAction(cost({id:'net',category:'subscriptions',amount:40,nextDueDate:''}),30,'2026-10'),status:'confirmed',confirmedAt:stamp};
 const annual={...createSavingsAction(cost({id:'annual',amount:120,frequency:'yearly',nextDueDate:'2026-12-01'}),100,'2026-10'),status:'confirmed',confirmedAt:stamp};
 const planned=createSavingsAction(cost({id:'planned',amount:300}),0,'2026-10');
 const totals=savingsToDate([dated,undated,annual,planned],'2026-10-04');
 assert.equal(totals.scheduled,18);assert.ok(totals.estimated>0&&totals.estimated<2);
 assert.equal(savingsToDate([annual],'2026-12-01').scheduled,20);
 assert.equal(savingsToDate([planned],'2026-12-01').total,0);
});
test('confirmation rejects a changed billing frequency even when the entered new amount matches',()=>{
 const original=cost({amount:40,category:'subscriptions'}),action=createSavingsAction(original,30,'2026-10');
 assert.throws(()=>confirmSavingsChange([{...original,amount:30,frequency:'yearly'}],[action],action,'2026-10-04'),/ACTION_STALE/);
});
test('savings confirmation serializes duplicate taps and failed persistence never reports success',async()=>{
 const original=cost({amount:40,category:'subscriptions'}),action=createSavingsAction(original,30,'2026-10');
 const input={incomeMonthly:2400,variableMonthly:500,bufferMonthly:0,goalMonthly:0,costs:[original],startMonth:'2026-10'};
 let controls,writes=0,release;
 function Probe(){controls=useSavingsCoach(input,[action],undefined,async()=>{},async()=>{},async()=>{writes++;await new Promise(resolve=>{release=resolve;});},false);return null;}
 renderToStaticMarkup(React.createElement(Probe));
 const first=controls.confirm(action);assert.equal(await controls.confirm(action),false);assert.equal(writes,1);release();assert.equal(await first,true);
 function Failing(){controls=useSavingsCoach(input,[action],undefined,async()=>{},async()=>{},async()=>{throw new Error('Storage full');},false);return null;}
 renderToStaticMarkup(React.createElement(Failing));assert.equal(await controls.confirm(action),false);assert.equal(action.status,'planned');
});
test('website backup import keeps the selected app language and complete savings/memo data',()=>{
 const profile=createHouseholdProfile({name:'Home',electricityPrice:.3,currency:'EUR',savingsGoalPercent:10,roomNames:[],now:new Date(stamp)});profile.backupReminderDismissed=true;
 profile.planning={goals:[],reserves:[],checks:[],memos:[{id:'memo',text:'Review subscriptions',date:'2026-12-28',done:false,updatedAt:stamp}]};
 const web=createHouseholdBackup({profile,devices:[],history:[],costs:[],tiles:[{id:'default-costs',kind:'costs',title:null}]});
 for(const locale of ['de','en']) {const imported=convertWebBackup(JSON.stringify(web),locale);assert.equal(imported.profile.locale,locale);assert.equal(imported.profile.backupReminderDismissed,true);assert.deepEqual(imported.profile.planning.memos,profile.planning.memos);}
 const mobile=createMobileBackup(convertWebBackup(JSON.stringify(web),'en'));
 assert.equal(readMobileBackup(JSON.stringify({...mobile,profile:{...mobile.profile,backupReminderDismissed:'yes'}})),null);
});

test('payday bill selection keeps paid bills available for undo across the salary window',()=>{
 const costs=[cost(),cost({id:'stream',amount:18,nextDueDate:'2026-10-05'})];
 const bills=paydayPayments(costs,{...cash,payday:'2026-11-08'},'2026-10-05');
 assert.equal(bills.length,4);assert.equal(bills[0].date,'2026-10-01');assert.equal(bills[3].month,'2026-11');
 assert.equal(paydayPayments(costs,{...cash,payday:'2027-01-25'},'2026-10-05').length,0);
});

test('checking an earlier unpaid bill invalidates the balance and serializes duplicate taps',async()=>{
 const original=cost(),payment={cost:original,date:'2026-10-01',month:'2026-10'};let controls,saved,writes=0,release;
 function Probe(){controls=usePaymentChecklist([original],{cash},async data=>{writes++;await new Promise(resolve=>{release=resolve;});saved=data;},false);return null;}
 renderToStaticMarkup(React.createElement(Probe));const first=controls.toggle(payment);await controls.toggle(payment);assert.equal(writes,1);release();await first;assert.equal(saved.cash.needsRefresh,true);assert.equal(saved.paidPayments.length,1);assert.equal(cash.needsRefresh,undefined);assert.equal(original.amount,900);
});
