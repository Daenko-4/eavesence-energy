import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyOutlook } from '../packages/core/src/monthlyOutlook.ts';
import { monthChecklist, saveActualPayment } from '../packages/core/src/paymentChecklist.ts';
const cost = (patch = {}) => ({id:'rent', name:'Rent', amount:900, category:'housing', frequency:'monthly', nextDueDate:'2026-10-01', updatedAt:'2026-10-24T12:00:00Z', ...patch});
const profile = {incomeAmount:2400, incomeFrequency:'monthly', incomeExtras:[{id:'salary',kind:'salary13',amount:2000,month:11},{id:'bonus',kind:'bonus',amount:500,month:11,year:2026}]};
const outlook = (changes={}) => monthlyOutlook({profile, incomeKnown:true, costs:[cost()], month:'2026-11', ...changes});

test('a specific month includes its extras and full due annual bills, not monthly averages', () => {
  const costs=[cost(),cost({id:'insurance',name:'Insurance',amount:600,frequency:'yearly',nextDueDate:'2026-11-15'})];
  const snapshot=structuredClone({profile,costs});
  const november=outlook({costs});assert.equal(november.income,4900);assert.equal(november.extraIncome,2500);assert.equal(november.total,1500);assert.equal(november.remaining,3400);
  const december=outlook({costs,month:'2026-12'});assert.equal(december.income,2400);assert.equal(december.total,900);assert.equal(december.remaining,1500);
  assert.deepEqual({profile,costs},snapshot);
});
test('year boundaries retain recurring extras but exclude one-off bonuses from other years',()=>{
  const nextYear=outlook({month:'2027-11'});assert.equal(nextYear.extraIncome,2000);assert.equal(nextYear.income,4400);
  const january=outlook({month:'2027-01'});assert.equal(january.extraIncome,0);assert.equal(january.income,2400);
});
test('annual net remains an explicitly estimated average without double-counting extras',()=>{
  const result=outlook({profile:{...profile,incomeAmount:33600,incomeFrequency:'yearly'}});
  assert.equal(result.income,2800);assert.equal(result.extraIncome,0);assert.equal(result.remaining,1900);assert.equal(result.incomeIsAverage,true);assert.equal(result.estimated,true);
});
test('monthly undated costs count once, but undated non-monthly costs block a misleading remainder',()=>{
  const monthly=cost({nextDueDate:''});const result=outlook({costs:[monthly]});
  assert.equal(result.total,900);assert.equal(result.remaining,4000);assert.equal(result.undatedMonthlyCount,1);assert.equal(result.missing.length,0);
  const incomplete=outlook({costs:[monthly,cost({id:'annual',amount:1200,frequency:'yearly',nextDueDate:''})]});
  assert.equal(incomplete.total,900);assert.equal(incomplete.missing.length,1);assert.equal(incomplete.remaining,null);
});
test('missing income and a completely empty cost list never imply safely available money',()=>{
  assert.equal(outlook({incomeKnown:false}).income,null);assert.equal(outlook({incomeKnown:false}).remaining,null);
  assert.equal(outlook({costs:[]}).remaining,null);
  const zero=outlook({profile:{incomeAmount:0}});assert.equal(zero.income,0);assert.equal(zero.remaining,-900);
});
test('a month with no bills due can still show income remaining before everyday spending',()=>{
  const result=outlook({costs:[cost({frequency:'yearly',nextDueDate:'2026-12-01'})]});
  assert.equal(result.total,0);assert.equal(result.remaining,4900);
});
test('variable bills use matching month-specific invoices, including zero, without altering future plans',()=>{
  const costs=[cost({id:'energy',amount:80,variableAmount:true,nextDueDate:'2026-10-12'})];
  const planned=outlook({costs});assert.equal(planned.total,80);assert.equal(planned.estimated,true);
  const payment=monthChecklist(costs,'2026-11').payments[0];const actual=saveActualPayment([],payment,95,'2026-10-24T12:00:00Z');
  const actualMonth=outlook({costs,actualPayments:actual});assert.equal(actualMonth.total,95);assert.equal(actualMonth.estimated,false);
  assert.equal(outlook({costs,actualPayments:actual,month:'2026-12'}).total,80);
  const zero=saveActualPayment(actual,payment,0,'2026-10-24T12:00:00Z');assert.equal(outlook({costs,actualPayments:zero}).total,0);
});
test('every weekly occurrence and the monthly undated cost count once, with cent rounding',()=>{
  const costs=[cost({amount:0.1,frequency:'weekly',nextDueDate:'2026-11-01'}),cost({id:'net',amount:0.2,nextDueDate:''})];
  const result=outlook({profile:{incomeAmount:10},costs});assert.equal(result.payments.length,6);assert.equal(result.total,0.7);assert.equal(result.remaining,9.3);
});
