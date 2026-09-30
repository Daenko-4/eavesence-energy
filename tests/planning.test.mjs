import { test } from 'node:test';
import assert from 'node:assert/strict';
import { billReservePlan, goalProgress, planningFingerprint, planningSuggestions, purchaseImpact, readPlanningData } from '../packages/core/src/planning.ts';
import { createSavingsPlan } from '../packages/core/src/savingsPlan.ts';
import { convertWebBackup } from '../apps/mobile/src/webBackup.ts';
import { createMobileBackup, readMobileBackup } from '../apps/mobile/src/backup.ts';
const cost=(id,amount,frequency,nextDueDate,category='insurance')=>({id,name:id,amount,frequency,nextDueDate,category,updatedAt:'2026-09-30T00:00:00Z'});
const input={incomeMonthly:2400,variableMonthly:600,bufferMonthly:0,goalMonthly:300,costs:[cost('rent',900,'monthly','2026-10-01','housing'),cost('bill',600,'yearly','2027-01-15')],startMonth:'2026-10'};
test('bill reserves prepare an existing bill without changing or double-deducting the budget',()=>{
 const before=createSavingsPlan(input);const data=readPlanningData({reserves:[{costId:'bill',saved:200}]});
 const reserve=billReservePlan(input,data)[0];assert.equal(reserve.monthly,100);assert.equal(reserve.dueMonth,'2027-01');assert.equal(reserve.missing,400);
 assert.deepEqual(createSavingsPlan(input),before);assert.equal(before.averageFixed,950);
});
test('undated bills have no fabricated reserve deadline and fully reserved bills need no more',()=>{
 assert.equal(billReservePlan({...input,costs:[cost('bill',600,'yearly','')]},readPlanningData(null))[0].monthly,null);
 assert.equal(billReservePlan(input,readPlanningData({reserves:[{costId:'bill',saved:700}]}))[0].monthly,0);
});
test('goal contributions derive only from the explicitly saved balance and target date',()=>{
 const goal={id:'g',name:'Holiday',target:1200,saved:400,targetMonth:'2027-01'};
 assert.equal(goalProgress(goal,'2026-10').monthly,200);assert.equal(goalProgress({...goal,saved:1200},'2026-10').percent,100);
 assert.equal(goalProgress({...goal,targetMonth:'2026-01'},'2026-10').overdue,true);
});
test('purchase preview distinguishes monthly cash flow from separately entered available funds',()=>{
 const result=purchaseImpact(input,500,'2027-01',1000);
 assert.equal(result.before,0);assert.equal(result.after,-500);assert.equal(result.availableAfter,500);assert.equal(result.later,'2027-02');assert.equal(result.goalShortfall,300);
 assert.equal(purchaseImpact({...input,variableMonthly:null},700,'2027-01',null),null);
 assert.equal(purchaseImpact(input,0,'2027-01',null),null);
 assert.equal(purchaseImpact(input,700,'2030-01',null),null);
});
test('recommendations stay bounded and do not suggest rent as an easy saving',()=>{
 const rows=planningSuggestions(input,'2026-09-30');assert.ok(rows.length<=3);assert.ok(!rows.some(r=>r.costId==='rent'));
 assert.deepEqual(planningSuggestions({...input,costs:[input.costs[0]],goalMonthly:0},'2026-09-30'),[]);
});
test('monthly check fingerprints ignore ordering but invalidate on changed income, dates or savings',()=>{
 assert.equal(planningFingerprint(input),planningFingerprint({...input,costs:[...input.costs].reverse()}));
 assert.notEqual(planningFingerprint(input),planningFingerprint({...input,goalMonthly:400}));
 assert.notEqual(planningFingerprint(input),planningFingerprint({...input,costs:input.costs.map(c=>({...c,nextDueDate:'2026-11-01'}))}));
});
test('planning readers discard invalid and duplicate entries',()=>{
 const good={id:'g',name:'Holiday',target:1000,saved:50,targetMonth:'2027-01'};
 assert.equal(readPlanningData({goals:[good,good,{...good,id:'bad',saved:-1}],reserves:[{costId:'b',saved:Infinity}]}).goals.length,1);
 assert.equal(readPlanningData({reserves:[{costId:'b',saved:Infinity}]}).reserves.length,0);
});
test('planning data survives web to mobile conversion and mobile backup restore',()=>{
 const planning=readPlanningData({goals:[{id:'g',name:'Holiday',target:1000,saved:50,targetMonth:'2027-01'}],reserves:[{costId:'bill',saved:200}]});
 const converted=convertWebBackup(JSON.stringify({version:1,exportedAt:'2026-09-30T00:00:00Z',profile:{version:1,rooms:[],deviceRooms:{},updatedAt:'2026-09-30T00:00:00Z',onboardingCompletedAt:'2026-09-30T00:00:00Z',name:'Home',electricityPrice:.3,savingsGoalPercent:10,currency:'EUR',createdAt:'2026-09-30T00:00:00Z',planning},devices:[],history:[],costs:[],tiles:[]}));
 assert.ok(converted);assert.deepEqual(converted.profile.planning,planning);
 const backup=createMobileBackup({...converted});assert.deepEqual(readMobileBackup(JSON.stringify(backup)).profile.planning,planning);
});
