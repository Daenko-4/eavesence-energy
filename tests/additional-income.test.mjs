import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdditionalIncome,readAdditionalIncome,summarizeIncome,additionalIncomeForMonth} from '../packages/core/src/income.ts';
import {monthlyOutlook} from '../packages/core/src/monthlyOutlook.ts';
import {createSavingsPlan} from '../packages/core/src/savingsPlan.ts';
import {planningFingerprint,readPlanningData} from '../packages/core/src/planning.ts';
import {forecast90Days} from '../packages/core/src/proInsights.ts';
import {paydayForecast} from '../packages/core/src/homeValue.ts';
import {createHouseholdProfile,createHouseholdBackup,readHouseholdBackup,readHouseholdProfile} from '../src/lib/household.ts';
import {convertWebBackup} from '../apps/mobile/src/webBackup.ts';
import {createMobileBackup,readMobileBackup} from '../apps/mobile/src/backup.ts';
const today='2026-11-01';
const sale={id:'sale',name:'Verkauf auf eBay',amount:500,date:today,status:'received'};
const rent={id:'rent',name:'Rent',amount:800,category:'housing',frequency:'monthly',nextDueDate:today,updatedAt:`${today}T12:00:00Z`};
const profile={incomeAmount:2400,incomeFrequency:'monthly',additionalIncome:[sale]};
const input={incomeMonthly:2400,incomeKnown:true,additionalIncome:[sale],costs:[rent],variableMonthly:500,bufferMonthly:0,goalMonthly:0,startMonth:'2026-11'};
const data=readPlanningData({cash:{balance:1000,asOf:today,payday:'2026-11-25',protected:0,everydayRemaining:0}});
test('a sale increases only its dated month and year, without changing regular net income',()=>{
 assert.equal(summarizeIncome(profile,2026).monthly,2400);
 assert.equal(summarizeIncome(profile,2026).annual,29300);
 assert.equal(summarizeIncome(profile,2027).annual,28800);
 for(const [month,expected] of [['2026-11',2100],['2026-12',1600],['2027-11',1600]]){
  const result=monthlyOutlook({profile,incomeKnown:true,costs:[rent],month});assert.equal(result.remaining,expected);
 }
 assert.equal(additionalIncomeForMonth([sale],'2026-1'),0);
});
test('annual-net legacy keeps salary extras but adds genuinely additional receipts once',()=>{
 const legacy={...profile,incomeAmount:33600,incomeFrequency:'yearly',incomeExtras:[{id:'13',kind:'salary13',amount:2400,month:11}]};
 const result=summarizeIncome(legacy,2026);assert.equal(result.annual,34100);assert.equal(result.monthly,2800);assert.deepEqual(result.extras,[]);
 assert.equal(monthlyOutlook({profile:legacy,incomeKnown:true,costs:[rent],month:'2026-11'}).remaining,2500);
 assert.equal(legacy.incomeExtras.length,1);
});
test('quick entry defaults can be unnamed, validate dates, round cents and reject future received money',()=>{
 assert.deepEqual(createAdditionalIncome({...sale,name:'  eBay sale  '},today),{...sale,name:'eBay sale'});
 assert.equal(createAdditionalIncome({...sale,name:'',amount:10.005},today).amount,10.01);
 assert.equal(createAdditionalIncome({...sale,date:'2026-11-02'},today),null);
 assert.ok(createAdditionalIncome({...sale,date:'2026-11-02',status:'planned'},today));
 for(const patch of [{date:'2026-02-30'},{date:'2026-13-01'},{date:'1800-01-01'},{date:'2201-01-01'},{amount:0},{amount:NaN},{amount:Infinity},{amount:-1},{status:'unknown'},{name:'x'.repeat(101)}])assert.equal(readAdditionalIncome([{...sale,...patch}]),null);
 assert.equal(readAdditionalIncome([sale,sale]),null);assert.equal(readAdditionalIncome(Array.from({length:501},(_,i)=>({...sale,id:String(i)}))),null);assert.deepEqual(readAdditionalIncome(undefined),[]);
});
test('12-month planning assigns received and planned additional income to their month exactly once',()=>{
 const planned={...sale,id:'refund',date:'2026-12-02',status:'planned',amount:100};
 const result=createSavingsPlan({...input,additionalIncome:[sale,planned]});
 assert.equal(result.months[0].remaining,1600);assert.equal(result.months[1].remaining,1200);assert.equal(result.months[2].remaining,1100);
 assert.equal(planningFingerprint({...input,additionalIncome:[sale,planned]}),planningFingerprint({...input,additionalIncome:[planned,sale]}));
 assert.notEqual(planningFingerprint(input),planningFingerprint({...input,additionalIncome:[{...sale,amount:600}]}));
 assert.equal(createSavingsPlan({...input,additionalIncome:[{...sale,date:'invalid'}]}),null);
});
test('confirmed balance includes received money once; 90-day forecast adds only future planned receipts on exact days',()=>{
 const base={...input,incomeMonthly:0,variableMonthly:0,costs:[]};
 const received=forecast90Days(base,data,today).result;assert.equal(received.closing,1000);
 const planned={...sale,id:'future',amount:500,date:'2026-11-10',status:'planned'};
 const bill={...rent,amount:1200,nextDueDate:'2026-11-11',frequency:'yearly'};
 const future=forecast90Days({...base,costs:[bill],additionalIncome:[sale,planned]},data,today).result;
 assert.equal(future.closing,300);assert.equal(future.firstShortfall,null);
 assert.equal(forecast90Days({...base,costs:[{...bill,nextDueDate:'2026-11-09'}],additionalIncome:[planned]},data,today).result.firstShortfall,'2026-11-09');
 for(const date of ['2026-10-31',today,'2027-02-01'])assert.equal(forecast90Days({...base,additionalIncome:[{...planned,date}]},data,today).result.closing,1000);
 assert.equal(paydayForecast([],data.cash,0,today).remaining,1000);
});
test('additional income survives web and app backup restore and corrupt receipts reject the whole backup',()=>{
 const base=createHouseholdProfile({name:'Home',currency:'EUR',electricityPrice:.3,savingsGoalPercent:10,roomNames:[]});
 const web=createHouseholdBackup({profile:{...base,...profile},costs:[rent],devices:[],history:[]});
 assert.deepEqual(readHouseholdBackup(JSON.stringify(web)).profile.additionalIncome,[sale]);
 const app=convertWebBackup(JSON.stringify(web));assert.deepEqual(app.profile.additionalIncome,[sale]);
 const backup=createMobileBackup(app);assert.deepEqual(readMobileBackup(JSON.stringify(backup)).profile.additionalIncome,[sale]);
 assert.equal(readHouseholdProfile(JSON.stringify({...web.profile,additionalIncome:[sale,sale]})),null);
 assert.equal(readMobileBackup(JSON.stringify({...backup,profile:{...backup.profile,additionalIncome:[{...sale,amount:-500}]}})),null);
 assert.ok(readHouseholdProfile(JSON.stringify({...web.profile,additionalIncome:undefined})));
});
