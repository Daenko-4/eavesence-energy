import assert from 'node:assert/strict';
import test from 'node:test';
import { createSavingsAction, upsertSavingsPlan, closeSavingsHistory, readSavingsActions } from '../packages/core/src/savingsPlan.ts';
import { confirmSavingsChange, savingsToDate } from '../packages/core/src/homeValue.ts';
import { compareAnnualSubscription, upcomingBillReserves, nextSavingsPayment, quickCheckFingerprint } from '../packages/core/src/proValue.ts';
import { readPlanningData } from '../packages/core/src/planning.ts';
const cost=(id,amount,frequency='monthly',date='2026-10-10')=>({id,name:id,amount,frequency,nextDueDate:date,category:'subscriptions',updatedAt:'2026-10-01T00:00:00Z'});
const input=costs=>({incomeMonthly:2400,variableMonthly:500,bufferMonthly:0,goalMonthly:0,costs,startMonth:'2026-11'});
test('successive reductions retain confirmations and accrue deltas without counting the baseline twice',()=>{
  const bill=cost('internet',100),a=createSavingsAction(bill,80,'2026-10');
  const first=confirmSavingsChange([bill],[a],a,'2026-10-01');
  const b=createSavingsAction(first.costs[0],70,'2026-11');
  const planned=upsertSavingsPlan(first.actions,b);
  assert.equal(planned.length,2);assert.equal(savingsToDate(planned,'2026-10-10').scheduled,20);
  const second=confirmSavingsChange(first.costs,planned,b,'2026-11-01');
  assert.equal(second.actions.length,2);assert.equal(second.actions[1].newAmount,80);
  assert.equal(savingsToDate(second.actions,'2026-11-10').scheduled,50); // Oct 20 + Nov 20+10
  assert.deepEqual(readSavingsActions(JSON.parse(JSON.stringify(second.actions))),second.actions);
});
test('manual cost edits preserve accrued history but stop later accrual, including paid edit-day dates',()=>{
  const bill=cost('internet',100),draft=createSavingsAction(bill,80,'2026-10');
  const confirmed=confirmSavingsChange([bill],[draft],draft,'2026-10-01');
  const history=closeSavingsHistory(confirmed.actions,confirmed.costs,[{...confirmed.costs[0],amount:90}],'2026-11-10');
  assert.equal(history[0].endedOn,'2026-11-10');
  assert.equal(savingsToDate(history,'2026-12-10').scheduled,40);
  assert.equal(closeSavingsHistory(history,[],[],'2026-12-01')[0].endedOn,'2026-11-10');
  assert.deepEqual(closeSavingsHistory(confirmed.actions,confirmed.costs,[{...confirmed.costs[0],name:'Renamed'}],'2026-11-01'),confirmed.actions);
});
test('legacy saving identities remain confirmable while unknown actions and malformed history are rejected',()=>{
  const bill=cost('legacy',40),draft=createSavingsAction(bill,30,'2026-10');delete draft.id;
  assert.equal(confirmSavingsChange([bill],[draft],draft,'2026-10-01').actions[0].status,'confirmed');
  assert.throws(()=>confirmSavingsChange([bill],[],draft,'2026-10-01'),/ACTION_STALE/);
  assert.deepEqual(readSavingsActions([{...draft,endedOn:'2026-02-31'},{...draft,endedOn:'2026-99-99'}]),[]);
});
test('first saving is shown at the actual next payment, not as already saved',()=>{
  const a={...createSavingsAction(cost('annual',600,'yearly','2026-12-10'),480,'2026-10'),status:'confirmed'};
  assert.equal(savingsToDate([a],'2026-10-07').scheduled,0);
  assert.deepEqual(nextSavingsPayment([a],'2026-10-07'),{date:'2026-12-10',amount:120});
});
test('reserves use the current month, distinguish average from contribution and reset for a paid cycle',()=>{
  const bill=cost('annual',600,'yearly','2026-12-10');
  const data=readPlanningData({reserves:[{costId:bill.id,saved:200,dueDate:'2026-12-10'}]});
  const r=upcomingBillReserves([bill],data,'2026-10-07')[0];
  assert.equal(r.months,3);assert.equal(r.monthly,133.34);assert.equal(r.average,50);assert.equal(r.missing,400);
  data.paidPayments=[{costId:bill.id,month:'2026-12',date:'2026-12-10',amount:600,frequency:'yearly',anchor:bill.nextDueDate,paidAt:'2026-12-10T12:00:00Z'}];
  const next=upcomingBillReserves([bill],data,'2026-12-10')[0];
  assert.equal(next.dueDate,'2027-12-10');assert.equal(next.saved,0);
  assert.equal(upcomingBillReserves([cost('missing',600,'yearly','')],data,'2026-10-07')[0].monthly,null);
});
test('annual subscription comparison replaces unpaid future monthly bills but keeps older outstanding charges',()=>{
  const bill=cost('stream',20),cash={balance:500,asOf:'2026-10-07',payday:'2026-10-31',protected:100,everydayRemaining:100};
  const comparison=compareAnnualSubscription(input([bill]),readPlanningData({cash}),bill,180,'2026-10-07','2026-10-07');
  assert.equal(comparison.annualSaving,60);assert.equal(comparison.upfront,180);assert.equal(comparison.removed,20);assert.equal(comparison.after,120);
  assert.equal(compareAnnualSubscription(input([bill]),readPlanningData({cash}),bill,180,'2026-11-01','2026-10-07').after,280);
  const past=cost('stream',20,'monthly','2026-10-01');
  assert.equal(compareAnnualSubscription(input([past]),readPlanningData({cash}),past,180,'2026-10-07','2026-10-07').after,100);
  assert.equal(compareAnnualSubscription(input([bill]),readPlanningData({cash:{...cash,needsRefresh:true}}),bill,180,'2026-10-07','2026-10-07').after,null);
  assert.equal(compareAnnualSubscription(input([bill]),undefined,bill,180,'2026-02-31','2026-10-07'),null);
});
test('quick check completion is retained through planning storage and invalidated by a balance or cost change',()=>{
  const i=input([cost('bill',20)]),data=readPlanningData({cash:{balance:500,asOf:'2026-10-07',payday:'2026-10-31',protected:0,everydayRemaining:100}});
  const fingerprint=quickCheckFingerprint(i,data);
  const saved=readPlanningData({...data,quickCheck:{day:'2026-10-07',checkedAt:'2026-10-07T12:00:00Z',fingerprint}});
  assert.equal(saved.quickCheck.fingerprint,fingerprint);
  assert.notEqual(quickCheckFingerprint(i,{...saved,cash:{...saved.cash,balance:400}}),fingerprint);
  assert.notEqual(quickCheckFingerprint({...i,costs:[cost('bill',25)]},saved),fingerprint);
});
