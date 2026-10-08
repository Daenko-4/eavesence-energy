import test from 'node:test';
import assert from 'node:assert/strict';
import { monthChecklist, paymentIsPaid, togglePayment, readPaidPayments } from '../packages/core/src/paymentChecklist.ts';
import { readPlanningData } from '../packages/core/src/planning.ts';
import { paydayForecast } from '../packages/core/src/homeValue.ts';
import { createHouseholdProfile, createHouseholdBackup, readHouseholdBackup } from '../src/lib/household.ts';
import { createMobileBackup, readMobileBackup } from '../apps/mobile/src/backup.ts';
import { convertWebBackup } from '../apps/mobile/src/webBackup.ts';
const cost=(changes={})=>({id:'rent',name:'Rent',category:'housing',amount:900,frequency:'monthly',nextDueDate:'2026-10-05',updatedAt:'2026-10-01T00:00:00Z',...changes});
const stamp='2026-10-05T12:00:00Z';

test('confirming one payment leaves the recurring cost and next month untouched; undo is exact',()=>{
 const costs=[cost(),cost({id:'net',name:'Internet',amount:40,nextDueDate:''})], before=structuredClone(costs);
 const october=monthChecklist(costs,'2026-10');assert.equal(october.openTotal,940);
 const paid=togglePayment([],october.payments[0],stamp),checked=monthChecklist(costs,'2026-10',paid);
 assert.equal(checked.openTotal,40);assert.equal(checked.paidTotal,900);assert.equal(checked.open.length,1);
 assert.equal(monthChecklist(costs,'2026-11',paid).openTotal,940);assert.deepEqual(costs,before);
 assert.deepEqual(togglePayment(paid,october.payments[0],stamp),[]);
 const monthlyPaid=togglePayment(paid,october.payments[1],stamp);
 assert.equal(monthChecklist(costs,'2026-10',monthlyPaid).openTotal,0);
 assert.equal(monthChecklist(costs,'2026-11',monthlyPaid).openTotal,940);
});

test('weekly dates are independent and recurrence stays anchored across short months and years',()=>{
 const weekly=cost({frequency:'weekly',amount:20,nextDueDate:'2026-10-02'}),oct=monthChecklist([weekly],'2026-10');
 assert.equal(oct.payments.length,5);assert.equal(oct.openTotal,100);
 const paid=togglePayment([],oct.payments[2],stamp);
 assert.equal(monthChecklist([weekly],'2026-10',paid).open.length,4);
 assert.equal(paymentIsPaid(oct.payments[3],paid),false);
 const end=cost({nextDueDate:'2026-12-31'});
 assert.equal(monthChecklist([end],'2027-02').payments[0].date,'2027-02-28');
 assert.equal(monthChecklist([end],'2027-03').payments[0].date,'2027-03-31');
 assert.equal(monthChecklist([end],'2026-11').payments.length,0);
});

test('undated monthly costs count once; other rhythms never fabricate a due month',()=>{
 const costs=[cost({nextDueDate:''}),cost({id:'annual',frequency:'yearly',amount:600,nextDueDate:''}),cost({id:'quarter',frequency:'quarterly',amount:120,nextDueDate:''})];
 const c=monthChecklist(costs,'2026-10');assert.equal(c.payments.length,1);assert.equal(c.payments[0].date,null);assert.equal(c.openTotal,900);assert.equal(c.missing.length,2);
});

test('amount, frequency or anchor changes require a fresh confirmation, while renaming preserves it',()=>{
 const initial=cost(),p=monthChecklist([initial],'2026-10').payments[0],paid=togglePayment([],p,stamp);
 assert.equal(paymentIsPaid({...p,cost:{...initial,name:'New label'}},paid),true);
 for(const changes of [{amount:910},{frequency:'quarterly'},{nextDueDate:'2026-09-05'}]) assert.equal(paymentIsPaid({...p,cost:{...initial,...changes}},paid),false);
 const updated={...p,cost:{...initial,amount:910}};
 const renewed=togglePayment(paid,updated,stamp);assert.equal(renewed.length,1);assert.equal(paymentIsPaid(updated,renewed),true);
});

test('paid records reject impossible dates, wrong periods, nonfinite money and invalid undated rhythms',()=>{
 const paid=togglePayment([],monthChecklist([cost()],'2026-10').payments[0],stamp)[0];
 const invalid=[{...paid,date:'2026-02-30',month:'2026-02'},{...paid,date:'2026-11-05'},{...paid,amount:NaN},{...paid,paidAt:'bad'},{...paid,date:null,anchor:null,frequency:'weekly'},{...paid,anchor:'2026-02-30'}];
 assert.deepEqual(readPaidPayments([null,...invalid,paid,paid]),[paid]);
 assert.deepEqual(readPlanningData({paidPayments:[...invalid,paid]}).paidPayments,[paid]);
});

test('paid dated bills are not charged twice in the payday forecast, and stale balance cannot claim available cash',()=>{
 const costs=[cost(),cost({id:'net',amount:40,nextDueDate:'2026-10-20'})];
 const cash={balance:1100,asOf:'2026-10-05',payday:'2026-10-30',protected:100,everydayRemaining:200};
 const paid=togglePayment([],monthChecklist(costs,'2026-10').payments[0],stamp);
 assert.equal(paydayForecast(costs,cash,null,'2026-10-05').remaining,-140);
 const after=paydayForecast(costs,cash,null,'2026-10-05',paid);
 assert.equal(after.fixed,40);assert.equal(after.remaining,760);
 assert.equal(paydayForecast(costs,{...cash,needsRefresh:true},null,'2026-10-05',paid),null);
 assert.equal(paydayForecast(costs,cash,null,'2026-10-06',paid),null);
 assert.equal(paydayForecast(costs,cash,null,'2026-10-05',[]).fixed,940);
});

test('website, mobile and website-to-app backup imports preserve payment confirmations',()=>{
 const costs=[cost()],paid=togglePayment([],monthChecklist(costs,'2026-10').payments[0],stamp),planning=readPlanningData({paidPayments:paid});
 const profile={...createHouseholdProfile({name:'Test',currency:'EUR',electricityPrice:.3,savingsGoalPercent:1,roomNames:[]}),planning};
 const web=createHouseholdBackup({profile,costs,devices:[],history:[],tiles:[{id:'default-costs',kind:'costs',title:'Costs'}]});
 const restoredWeb=readHouseholdBackup(JSON.stringify(web));assert.deepEqual(restoredWeb.profile.planning.paidPayments,paid);
 const converted=convertWebBackup(JSON.stringify(web));assert.deepEqual(converted.profile.planning.paidPayments,paid);
 const mobile=createMobileBackup({profile:{name:'Test',electricityPrice:.3,savingsGoalPercent:1,createdAt:stamp,planning},costs,devices:[],history:[],tiles:[{id:'default-costs',kind:'costs',title:'Costs'}],betaInterested:false});
 assert.deepEqual(readMobileBackup(JSON.stringify(mobile)).profile.planning.paidPayments,paid);
 assert.equal(monthChecklist(costs,'2026-10',restoredWeb.profile.planning.paidPayments).openTotal,0);
});

test('next due follows the earliest unpaid dated payment and never assigns a date to an undated cost',()=>{
 const costs=[cost(),cost({id:'internet',name:'Internet',amount:40,nextDueDate:'2026-10-10'}),cost({id:'undated',nextDueDate:'',amount:25})];
 const initial=monthChecklist(costs,'2026-10');assert.equal(initial.nextDue.cost.id,'rent');
 const paid=togglePayment([],initial.nextDue,stamp),next=monthChecklist(costs,'2026-10',paid);
 assert.equal(next.nextDue.cost.id,'internet');assert.equal(next.openTotal,65);assert.equal(next.paidTotal,900);
 const both=togglePayment(paid,next.nextDue,stamp),undated=monthChecklist(costs,'2026-10',both);
 assert.equal(undated.nextDue,null);assert.equal(undated.openTotal,25);
 assert.equal(monthChecklist(costs,'2026-11',both).nextDue.cost.id,'rent');
});
