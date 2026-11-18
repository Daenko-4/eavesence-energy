import test from 'node:test';
import assert from 'node:assert/strict';
import { projectedSalary, readSalaryGrowth } from '../packages/core/src/salaryGrowth.ts';
import { createSavingsPlan } from '../packages/core/src/savingsPlan.ts';
import { forecast90Days } from '../packages/core/src/proInsights.ts';
import { readPlanningBackup, readPlanningData } from '../packages/core/src/planning.ts';

const growth={annualPercent:3,firstMonth:'2026-12',baseIncomeMonthly:3450};
const input={incomeMonthly:3450,variableMonthly:0,bufferMonthly:0,goalMonthly:0,costs:[],startMonth:'2026-11'};

test('salary assumptions compound only from the first month and each anniversary',()=>{
  assert.equal(projectedSalary(3450,'2026-11',growth),3450);
  assert.equal(projectedSalary(3450,'2026-12',growth),3553.5);
  assert.equal(projectedSalary(3450,'2027-11',growth),3553.5);
  assert.equal(projectedSalary(3450,'2027-12',growth),3660.11);
  assert.equal(projectedSalary(3450,'2026-12'),3450);
  assert.equal(projectedSalary(3450,'2026-12',{...growth,annualPercent:0}),3450);
});
test('a changed confirmed salary pauses the scenario instead of increasing the new salary again',()=>{
  assert.equal(projectedSalary(3553.5,'2027-12',growth),3553.5);
});
test('damaged salary assumptions are rejected by backup validation',()=>{
  for(const value of [{...growth,annualPercent:-1},{...growth,annualPercent:101},{...growth,annualPercent:Infinity},{...growth,firstMonth:'2026-13'},{...growth,firstMonth:'2026-1'},{...growth,baseIncomeMonthly:0},null,[]]){
    assert.equal(readSalaryGrowth(value),undefined);
    assert.equal(readPlanningData({salaryGrowth:value}).salaryGrowth,undefined);
    assert.equal(readPlanningBackup({salaryGrowth:value}),null);
  }
  assert.deepEqual(readPlanningBackup({salaryGrowth:growth}).salaryGrowth,growth);
});
test('12-month projections preserve the current budget and fixed extra income',()=>{
  const extra={id:'bonus',kind:'bonus',amount:2871,month:12};
  const source={...input,salaryGrowth:growth,incomeExtras:[extra]};
  const before=JSON.stringify(source),plan=createSavingsPlan(source);
  assert.equal(plan.averageRoom,3450);
  assert.equal(plan.months[0].regularIncome,3450);
  assert.equal(plan.months[1].regularIncome,3553.5);
  assert.equal(plan.months[1].extraIncome,2871);
  assert.equal(plan.months[1].remaining,6424.5);
  assert.equal(JSON.stringify(source),before);
  assert.equal(createSavingsPlan({...source,incomeIsAnnualAverage:true}).months[1].regularIncome,3450);
});
test('90-day projections apply salary growth on future paydays, preserving the confirmed balance',()=>{
  const data={salaryGrowth:growth,cash:{balance:1000,asOf:'2026-11-18',payday:'2026-11-26',protected:0,everydayRemaining:0}};
  const before=JSON.stringify(data),f=forecast90Days(input,data,'2026-11-18').result;
  assert.equal(f.months[0].income,3450);
  assert.equal(f.months[0].closing,4450);
  assert.equal(f.months[1].income,3553.5);
  assert.equal(f.months[2].income,3553.5);
  assert.equal(forecast90Days({...input,incomeMonthly:3553.5},data,'2026-11-18').result.months[1].income,3553.5);
  assert.equal(JSON.stringify(data),before);
});
