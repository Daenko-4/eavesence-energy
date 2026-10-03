import assert from "node:assert/strict";
import test from "node:test";
import { incomeExtraDrafts, incomeExtrasFromDraft, newIncomeExtraDraft, parseIncomeAmount, readIncomeExtras, summarizeIncome, extraIncomeForMonth } from "../packages/core/src/income.ts";
import { createSavingsPlan, compareSavingsActions, createSavingsAction } from "../packages/core/src/savingsPlan.ts";
import { planningFingerprint } from "../packages/core/src/planning.ts";
import { paydayForecast } from "../packages/core/src/homeValue.ts";
import { createHouseholdProfile, createHouseholdBackup, readHouseholdBackup, readHouseholdProfile } from "../src/lib/household.ts";
import { convertWebBackup } from "../apps/mobile/src/webBackup.ts";
import { createMobileBackup, readMobileBackup } from "../apps/mobile/src/backup.ts";
const extras = [{ id:"13", kind:"salary13", amount:2400, month:6 }, { id:"14", kind:"salary14", amount:2400, month:11 }, { id:"bonus", kind:"bonus", amount:600, month:11, year:2026 }];
const rent = { id:"rent",name:"Rent",category:"housing",amount:800,frequency:"monthly",nextDueDate:"2026-10-01",updatedAt:"2026-10-01T00:00:00Z" };
const input = { incomeMonthly:2400, incomeExtras:extras, variableMonthly:500, bufferMonthly:0, goalMonthly:0, costs:[rent],startMonth:"2026-10" };

test("regular income stays separate from annual averages, one-off bonuses and yearly salary extras", () => {
  const profile={incomeAmount:2400,incomeFrequency:"monthly",incomeExtras:extras};
  const current=summarizeIncome(profile,2026),next=summarizeIncome(profile,2027);
  assert.equal(current.monthly,2400);assert.equal(current.annual,34200);assert.equal(current.average,2850);
  assert.equal(next.annual,33600);assert.equal(next.average,2800);
  assert.equal(extraIncomeForMonth(extras,"2026-11"),3000);
  assert.equal(extraIncomeForMonth(extras,"2027-11"),2400);
  assert.equal(extraIncomeForMonth(extras,"2026-10"),0);
});
test("legacy annual income is kept as an average and extras cannot be counted twice", () => {
  const profile={incomeAmount:33600,incomeFrequency:"yearly",incomeExtras:extras};
  const snapshot=structuredClone(profile),summary=summarizeIncome(profile,2026);
  assert.equal(summary.monthly,2800);assert.equal(summary.annualAverage,true);assert.equal(summary.annual,33600);
  assert.deepEqual(summary.extras,[]);assert.equal(summary.extraTotal,0);assert.deepEqual(profile,snapshot);
});
test("localized income entry handles grouping and cents without silently reducing thousands", () => {
  for (const [text,locale,amount] of [["2.400","de",2400],["2,400","en",2400],["2.400,50 €","de",2400.5],["2,400.50","en",2400.5],["2400.50","de",2400.5],["2400,50","en",2400.5]]) assert.equal(parseIncomeAmount(text,locale),amount);
  for(const text of ["","-1","2e3","12 apples","24.1234"]) assert.ok(Number.isNaN(parseIncomeAmount(text)));
});
test("extra-payment drafts require amount and month, with one-off bonus year explicit", () => {
  const salary=newIncomeExtraDraft("salary13",new Date("2026-10-03T00:00:00Z")),bonus=newIncomeExtraDraft("bonus",new Date("2026-10-03T00:00:00Z"));
  assert.equal(salary.month,"");assert.equal(salary.yearly,true);assert.equal(bonus.yearly,false);assert.equal(bonus.year,"2026");
  assert.equal(incomeExtrasFromDraft([salary]),null);
  assert.deepEqual(incomeExtrasFromDraft(incomeExtraDrafts(extras)),extras);
  assert.equal(incomeExtrasFromDraft([{...bonus,amount:"100",month:"11",year:""}]),null);
  assert.equal(readIncomeExtras([{...extras[0],month:13}]),null);
  assert.equal(readIncomeExtras([{...extras[0],amount:Infinity}]),null);
  assert.equal(readIncomeExtras([extras[0],extras[0]]),null);
});
test("monthly forecast assigns extras only to payment months; recurring saving and actual cash remain separate", () => {
  const plan=createSavingsPlan(input);
  assert.equal(plan.averageRoom,1100);
  assert.equal(plan.months.find(m=>m.month==="2026-10").remaining,1100);
  assert.equal(plan.months.find(m=>m.month==="2026-11").remaining,4100);
  assert.equal(plan.months.find(m=>m.month==="2027-06").remaining,3500);
  const action=createSavingsAction(rent,750,"2026-11");
  assert.equal(compareSavingsActions(input,[action]).months.find(m=>m.month==="2026-11").remaining,4150);
  const cash={balance:1000,asOf:"2026-10-01",payday:"2026-10-25",protected:0,everydayRemaining:100};
  assert.equal(paydayForecast(input.costs,cash,input.variableMonthly,"2026-10-01").remaining,100);
});
test("extra changes invalidate planning checks while list order does not", () => {
  assert.equal(planningFingerprint(input),planningFingerprint({...input,incomeExtras:[...extras].reverse()}));
  assert.notEqual(planningFingerprint(input),planningFingerprint({...input,incomeExtras:extras.map(e=>({...e,amount:e.amount+1}))}));
});
test("extras survive website and app backup restore; broken extras reject the entire import", () => {
  const profile={...createHouseholdProfile({name:"Home",currency:"EUR",electricityPrice:.3,savingsGoalPercent:10,roomNames:[]}),incomeAmount:2400,incomeFrequency:"monthly",incomeExtras:extras};
  const web=createHouseholdBackup({profile,devices:[],history:[],costs:[rent]});
  assert.deepEqual(readHouseholdBackup(JSON.stringify(web)).profile.incomeExtras,extras);
  const app=convertWebBackup(JSON.stringify(web));assert.ok(app);assert.deepEqual(app.profile.incomeExtras,extras);
  const backup=createMobileBackup({...app});assert.deepEqual(readMobileBackup(JSON.stringify(backup)).profile.incomeExtras,extras);
  assert.equal(readHouseholdProfile(JSON.stringify({...profile,incomeExtras:[{...extras[0],month:0}]})),null);
  assert.equal(readMobileBackup(JSON.stringify({...backup,profile:{...backup.profile,incomeExtras:[extras[0],extras[0]]}})),null);
  assert.ok(readHouseholdProfile(JSON.stringify({...profile,incomeExtras:undefined})));
});
