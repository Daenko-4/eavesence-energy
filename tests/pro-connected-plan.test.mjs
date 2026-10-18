import test from 'node:test';
import assert from 'node:assert/strict';
import { compareSavingsActions, createSavingsAction, readSavingsActions } from '../packages/core/src/savingsPlan.ts';
import { confirmSavingsChange, paydayForecast, savingsToDate } from '../packages/core/src/homeValue.ts';
import { nextSavingsPayment, savingsPaydayImpact } from '../packages/core/src/proValue.ts';
import { monthChecklist, togglePayment } from '../packages/core/src/paymentChecklist.ts';
import { readPlanningBackup, readPlanningData } from '../packages/core/src/planning.ts';
const today='2026-10-07';
const bill=(overrides={})=>({id:'internet',name:'Internet',amount:40,frequency:'monthly',category:'subscriptions',nextDueDate:'2026-10-10',updatedAt:'2026-10-01T12:00:00Z',...overrides});
const input=costs=>({incomeMonthly:2400,variableMonthly:500,bufferMonthly:0,goalMonthly:0,costs,startMonth:'2026-10'});
const planning=()=>readPlanningData({cash:{balance:500,asOf:today,payday:'2026-10-25',protected:50,everydayRemaining:100}});
function paidData(cost,date=cost.nextDueDate){const data=planning();data.paidPayments=togglePayment([],{cost,month:date.slice(0,7),date},`${today}T10:00:00Z`);return data;}
test('a proposed reduction connects to payday without changing stored money or costs',()=>{
 const cost=bill(),data=planning(),action=createSavingsAction(cost,30,'2026-10');
 const before=JSON.stringify({cost,data,action});
 assert.deepEqual(savingsPaydayImpact(input([cost]),data,action,today),{before:310,after:320,saving:10,payday:'2026-10-25'});
 assert.equal(JSON.stringify({cost,data,action}),before);
 assert.equal(savingsToDate([action],today).total,0);
 assert.equal(savingsPaydayImpact(input([cost]),data,{...action,effectiveMonth:'2026-11'},today).saving,0);
 const annual=bill({frequency:'yearly',nextDueDate:'2026-12-10'});
 assert.equal(savingsPaydayImpact(input([annual]),data,createSavingsAction(annual,30,'2026-10'),today).saving,0);
});
test('payday preview keeps overdue, prepaid and recorded invoices unchanged',()=>{
 const cost=bill(),action=createSavingsAction(cost,30,'2026-10');
 assert.equal(savingsPaydayImpact(input([cost]),paidData(cost),action,today).saving,0);
 const old=bill({nextDueDate:'2026-10-01'});
 assert.equal(savingsPaydayImpact(input([old]),planning(),createSavingsAction(old,30,'2026-10'),today).saving,0);
 const actual={...planning(),actualPayments:[{costId:cost.id,month:'2026-10',date:cost.nextDueDate,frequency:cost.frequency,anchor:cost.nextDueDate,amount:40,plannedAmount:40,updatedAt:`${today}T12:00:00Z`}]};
 assert.equal(savingsPaydayImpact(input([cost]),actual,action,today).saving,0);
 const weekly=bill({frequency:'weekly',nextDueDate:'2026-10-01'});
 assert.equal(savingsPaydayImpact(input([weekly]),planning(),createSavingsAction(weekly,30,'2026-10'),today).saving,30);
});
test('incomplete or stale payday data never produces a reassuring preview',()=>{
 const cost=bill(),action=createSavingsAction(cost,30,'2026-10'),data=planning();
 for(const cash of [undefined,{...data.cash,asOf:'2026-10-06'},{...data.cash,needsRefresh:true},{...data.cash,everydayRemaining:null}]){
  assert.equal(savingsPaydayImpact({...input([cost]),variableMonthly:null},{...data,cash},action,today),null);
 }
 assert.equal(savingsPaydayImpact(input([cost,bill({id:'undated',nextDueDate:undefined})]),data,action,today),null);
 assert.equal(savingsPaydayImpact(input([bill({nextDueDate:'2026-10-12'})]),data,action,today),null);
});
test('confirmation preserves a paid occurrence and requires a fresh bank balance',()=>{
 const cost=bill(),data=paidData(cost),action=createSavingsAction(cost,30,'2026-10');
 const result=confirmSavingsChange([cost],[action],action,today,data);
 const checklist=monthChecklist(result.costs,'2026-10',result.planning.paidPayments,result.planning.actualPayments);
 assert.equal(checklist.open.length,0);assert.equal(checklist.paidTotal,40);
 assert.equal(result.costs[0].amount,30);assert.equal(result.planning.cash.balance,500);assert.equal(result.planning.cash.needsRefresh,true);
 assert.equal(paydayForecast(result.costs,result.planning.cash,500,today,result.planning.paidPayments,result.planning.actualPayments),null);
 assert.equal(savingsToDate(result.actions,'2026-10-10').scheduled,0);
 assert.deepEqual(nextSavingsPayment(result.actions,today),{date:'2026-11-10',amount:10});
 assert.equal(savingsToDate(result.actions,'2026-11-10').scheduled,10);
 assert.deepEqual(readPlanningBackup(JSON.parse(JSON.stringify(result.planning))),result.planning);
});
test('confirming after a bill date never retroactively claims that bill as saved',()=>{
 const cost=bill({nextDueDate:'2026-10-01'}),action=createSavingsAction(cost,30,'2026-10');
 const result=confirmSavingsChange([cost],[action],action,today,planning());
 assert.equal(result.actions[0].savingsFrom,today);
 assert.equal(savingsToDate(result.actions,today).scheduled,0);
 assert.equal(savingsToDate(result.actions,'2026-11-01').scheduled,10);
 const preview=compareSavingsActions(input([cost]),[{...action,savingsFrom:today}]);
 assert.equal(preview.totalDifference,110);assert.equal(preview.firstBenefitMonth,'2026-11');
});
test('new saving metadata roundtrips while legacy confirmations retain their history',()=>{
 const cost=bill(),action={...createSavingsAction(cost,30,'2026-10'),status:'confirmed'};
 assert.equal(savingsToDate([action],'2026-10-10').scheduled,10);
 const updated={...action,savingsFrom:today,excludedDates:['2026-10-10']};
 assert.deepEqual(readSavingsActions(JSON.parse(JSON.stringify([updated]))),[updated]);
 assert.deepEqual(readSavingsActions([{...updated,savingsFrom:'2026-02-31'},{...updated,excludedDates:['2026-02-31']}]),[]);
});
test('confirmation rejects changed due dates, stale prices and a duplicate confirmation',()=>{
 const cost=bill(),action=createSavingsAction(cost,30,'2026-10');
 assert.throws(()=>confirmSavingsChange([bill({nextDueDate:'2026-10-12'})],[action],action,today,planning()),/ACTION_STALE/);
 assert.throws(()=>confirmSavingsChange([bill({amount:45})],[action],action,today,planning()),/ACTION_STALE/);
 const result=confirmSavingsChange([cost],[action],action,today,planning());
 assert.throws(()=>confirmSavingsChange(result.costs,result.actions,action,today,result.planning),/ACTION_STALE/);
});
test('earlier unpaid invoices keep their original price and cannot vanish on cancellation',()=>{
 const cost=bill({nextDueDate:'2026-10-01'}),data=planning(),action=createSavingsAction(cost,30,'2026-10');
 const result=confirmSavingsChange([cost],[action],action,today,data);
 const list=monthChecklist(result.costs,'2026-10',result.planning.paidPayments,result.planning.actualPayments);
 assert.equal(list.openTotal,40);assert.equal(list.open.length,1);
 const cancel=createSavingsAction(cost,0,'2026-10');
 assert.throws(()=>confirmSavingsChange([cost],[cancel],cancel,today,data),/ACTION_UNPAID_HISTORY/);
 assert.equal(confirmSavingsChange([cost],[cancel],cancel,today,paidData(cost)).costs.length,0);
});
