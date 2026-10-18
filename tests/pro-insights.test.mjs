import test from 'node:test';
import assert from 'node:assert/strict';
import {variablePlanSuggestions,applyVariablePlan,forecast90Days,compareSwitch,readSwitchPlans} from '../packages/core/src/proInsights.ts';
import {readPlanningData,readPlanningBackup} from '../packages/core/src/planning.ts';
import {monthChecklist,saveActualPayment,togglePayment} from '../packages/core/src/paymentChecklist.ts';
const today='2026-10-18',stamp=`${today}T12:00:00Z`;
const cost=(patch={})=>({id:'internet',name:'Internet',amount:40,category:'subscriptions',frequency:'monthly',nextDueDate:'2026-10-20',updatedAt:stamp,...patch});
const input=(costs=[],patch={})=>({incomeMonthly:2400,incomeKnown:true,variableMonthly:0,bufferMonthly:0,goalMonthly:0,costs,startMonth:'2026-10',...patch});
const planning=(patch={})=>readPlanningData({cash:{balance:1000,asOf:today,payday:'2026-10-25',protected:100,everydayRemaining:0},...patch});
function invoices(c,amounts,months=['2026-07','2026-08','2026-09']){
 let actual=[];for(let i=0;i<amounts.length;i++)actual=saveActualPayment(actual,monthChecklist([c],months[i]).payments[0],amounts[i],stamp);return actual;
}
test('variable suggestions need three matching invoices and preserve zero invoices in the average',()=>{
 const c=cost({variableAmount:true,amount:80,nextDueDate:"2026-01-20"});
 assert.equal(variablePlanSuggestions([c],{actualPayments:invoices(c,[60,80])},today).length,0);
 const data=planning({actualPayments:invoices(c,[0,80,100])}),s=variablePlanSuggestions([c],data,today)[0];
 assert.equal(s.amount,60);assert.equal(s.min,0);assert.equal(s.max,100);assert.equal(s.count,3);assert.equal(s.changed,true);
 const next=applyVariablePlan([c],data,s,today);
 assert.equal(next.costs[0].amount,60);assert.equal(next.costs[0].variableAmount,true);assert.deepEqual(next.planning.actualPayments,data.actualPayments);assert.equal(next.planning.cash.needsRefresh,true);
 assert.equal(monthChecklist(next.costs,'2026-09',[],next.planning.actualPayments).payments[0].cost.amount,100);
 assert.equal(variablePlanSuggestions(next.costs,next.planning,today)[0].changed,false);
});
test('invoice proposals exclude future, stale schedules, foreign costs and old samples',()=>{
 const c=cost({variableAmount:true,nextDueDate:"2026-01-20"}),rows=invoices(c,[50,60,70]);
 const bad=[{...rows[0],month:'2026-01',date:'2026-01-21'},{...rows[0],month:'2025-06',date:'2025-06-20'},{...rows[0],month:'2026-11',date:'2026-11-20'},{...rows[0],costId:'other',month:'2026-06',date:'2026-06-20'}];
 const s=variablePlanSuggestions([c],{actualPayments:[...rows,...bad]},today)[0];assert.equal(s.count,3);assert.equal(s.amount,60);
 assert.equal(variablePlanSuggestions([{...c,nextDueDate:'2026-10-21'}],{actualPayments:rows},today).length,0);
 assert.equal(variablePlanSuggestions([{...c,variableAmount:false}],{actualPayments:rows},today).length,0);
 const six=invoices(c,[10,20,30,40,50,60,70],['2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
 assert.equal(variablePlanSuggestions([c],{actualPayments:six},today)[0].amount,45);
});
test('applying a suggestion rejects intervening edits and tampered proposals',()=>{
 const c=cost({variableAmount:true,nextDueDate:"2026-01-20"}),data=planning({actualPayments:invoices(c,[50,60,70])}),s=variablePlanSuggestions([c],data,today)[0];
 assert.throws(()=>applyVariablePlan([{...c,amount:45}],data,s,today),/STALE/);
 assert.throws(()=>applyVariablePlan([c],{...data,actualPayments:data.actualPayments.slice(0,2)},s,today),/STALE/);
 assert.throws(()=>applyVariablePlan([c],data,{...s,amount:1},today),/STALE/);
 assert.deepEqual(variablePlanSuggestions([c],{actualPayments:invoices(c,[0,0,0])},today),[]);
});
test('90-day forecast uses actual dates, protects cash once and includes salary and future bonuses',()=>{
 const c=cost(),i=input([c],{incomeExtras:[{id:'x',kind:'salary14',amount:2000,month:11}],bufferMonthly:999,goalMonthly:999});
 const f=forecast90Days(i,planning(),today);
 assert.equal(f.end,'2027-01-15');assert.equal(f.result.months.length,4);
 assert.equal(f.result.months[0].income,2400);assert.equal(f.result.months[1].extras,2000);
 assert.equal(f.result.closing,9980); // 900 + 3 salaries + bonus - 3 payments
 assert.equal(f.result.lowest,860);assert.equal(f.result.firstShortfall,null);
});
test('same-day bills are considered before salary and month-end bonus cannot hide an earlier shortfall',()=>{
 const c=cost({amount:1200,nextDueDate:'2026-11-10'}),i=input([c],{incomeMonthly:0,incomeExtras:[{id:'x',kind:'bonus',amount:3000,month:11,year:2026}]});
 const f=forecast90Days(i,planning(),today).result;
 assert.equal(f.firstShortfall,'2026-11-10');assert.equal(f.months[1].closing,2700);assert.equal(f.months[1].lowest,-300);
 const same=forecast90Days(input([cost({amount:1000,nextDueDate:'2026-10-25'})]),planning(),today).result;
 assert.equal(same.firstShortfall,'2026-10-25');assert.ok(same.months[0].closing>0);
});
test('this month bonuses are not counted a second time and stale or incomplete data has no numeric result',()=>{
 const i=input([],{incomeMonthly:0,incomeExtras:[{id:'x',kind:'salary13',amount:1000,month:10}]});
 assert.equal(forecast90Days(i,planning(),today).result.closing,900);
 for(const data of [undefined,planning({cash:{...planning().cash,asOf:'2026-10-17'}}),planning({cash:{...planning().cash,needsRefresh:true}})])assert.equal(forecast90Days(i,data,today).result,null);
 assert.equal(forecast90Days({...i,incomeKnown:false},planning(),today).reason,'income');
 assert.equal(forecast90Days({...i,incomeIsAnnualAverage:true},planning(),today).reason,'income');
 assert.equal(forecast90Days({...i,variableMonthly:null},planning(),today).reason,'everyday');
 assert.equal(forecast90Days(input([cost({nextDueDate:''})]),planning(),today).reason,'dates');
});
test('forecast uses recorded and paid amounts; an unpaid earlier invoice remains included once',()=>{
 const c=cost({amount:80,variableAmount:true,nextDueDate:'2026-10-01'}),p=monthChecklist([c],'2026-10').payments[0];
 const actual=saveActualPayment([],p,60,stamp),data=planning({actualPayments:actual});
 const f=forecast90Days(input([c]),data,today).result;
 assert.equal(f.overdue,1);assert.equal(f.months[0].bills,60);assert.equal(f.estimatedBills,3);
 const paid=togglePayment([],monthChecklist([c],'2026-10',[],actual).payments[0],stamp);
 assert.equal(forecast90Days(input([c]),{...data,paidPayments:paid},today).result.months[0].bills,0);
});
test('salary dates preserve the original 31st through February and daily everyday estimates are calendar based',()=>{
 const day='2028-01-30',data=planning({cash:{balance:1000,asOf:day,payday:'2028-01-31',protected:0,everydayRemaining:5}});
 const f=forecast90Days(input([],{incomeMonthly:100,variableMonthly:310}),data,day).result;
 assert.equal(f.months[0].everyday,15); // Jan30 exact remaining 5 + Jan31 monthly estimate 10
 assert.equal(f.months[1].income,100);assert.equal(f.months[2].income,100);
 assert.equal(f.months[1].everyday,310);
});
const draft=(patch={})=>({costId:'internet',newAmount:20,start:'2026-10-20',fee:60,overlapMonths:0,...patch});
test('switch comparison includes fees, overlap, payoff and immediate cash impact without mutating plans',()=>{
 const c=cost(),i=input([c]),data=planning(),before=JSON.stringify({i,data});
 const r=compareSwitch(i,data,draft(),today);
 assert.equal(r.firstYear,180);assert.equal(r.secondYear,420);assert.equal(r.breakEven,'2027-01-19');
 assert.equal(r.before,860);assert.equal(r.after,820); // old40 replaced by new20 + fee60
 const overlap=compareSwitch(i,data,draft({overlapMonths:1}),today);
 assert.equal(overlap.overlapCost,40);assert.equal(overlap.firstYear,140);assert.equal(overlap.breakEven,'2027-03-19');assert.equal(overlap.after,780);
 assert.equal(JSON.stringify({i,data}),before);
});
test('switch previews preserve paid and recorded invoices and never apply retrospective credits',()=>{
 const c=cost(),p=monthChecklist([c],'2026-10').payments[0],actual=saveActualPayment([],p,40,stamp);
 const known=compareSwitch(input([c]),planning({actualPayments:actual}),draft(),today);
 assert.equal(known.knownInvoices,1);assert.equal(known.firstYear,140);assert.equal(known.after,780);
 const paid=togglePayment([],p,stamp),r=compareSwitch(input([c]),planning({paidPayments:paid}),draft(),today);
 assert.equal(r.before,900);assert.equal(r.after,820);assert.equal(r.firstYear,140);
 const later=compareSwitch(input([c]),planning(),draft({start:'2026-11-01'}),today);assert.equal(later.after,later.before);
 assert.equal(compareSwitch(input([c]),planning({cash:{...planning().cash,needsRefresh:true}}),draft(),today).after,null);
 assert.equal(compareSwitch(input([c]),planning(),draft({fee:10000}),today).breakEven,null);
});
test('switch inputs validate amounts, dates, intervals and applicable cost schedules',()=>{
 const i=input([cost()]);
 for(const patch of [{newAmount:40},{newAmount:-1},{newAmount:NaN},{fee:-1},{overlapMonths:13},{overlapMonths:.5},{start:'2026-02-31'},{start:'2026-10-17'}])assert.equal(compareSwitch(i,planning(),draft(patch),today),null);
 for(const patch of [{variableAmount:true},{frequency:'yearly'},{nextDueDate:''}])assert.equal(compareSwitch(input([cost(patch)]),planning(),draft(),today),null);
});
test('saved comparisons validate strictly and travel through backups without touching savings history',async()=>{
 const saved={...draft(),id:'x',name:'Internet',originalAmount:40,anchor:'2026-10-20',updatedAt:stamp};
 const data=readPlanningData({switchPlans:[saved]});assert.deepEqual(data.switchPlans,[saved]);
 assert.deepEqual(readPlanningBackup(JSON.parse(JSON.stringify(data))),data);
 for(const patch of [{fee:-1},{overlapMonths:13},{newAmount:40},{anchor:'2026-02-31'}])assert.equal(readSwitchPlans([{...saved,...patch}]).length,0);
 assert.equal(readPlanningBackup({switchPlans:[{...saved,fee:-1}]}),null);
 assert.equal(readPlanningBackup({switchPlans:[saved,saved]}),null);
 const {createHouseholdProfile,createHouseholdBackup,readHouseholdBackup}=await import('../src/lib/household.ts');
 const {createMobileBackup,readMobileBackup}=await import('../apps/mobile/src/backup.ts');
 const {convertWebBackup}=await import('../apps/mobile/src/webBackup.ts');
 const profile={...createHouseholdProfile({name:'Home',currency:'EUR',electricityPrice:.3,savingsGoalPercent:1,roomNames:[]}),planning:data};
 const web=createHouseholdBackup({profile,costs:[cost()],devices:[],history:[],tiles:[{id:'default-costs',kind:'costs',title:'Costs'}]});
 assert.deepEqual(readHouseholdBackup(JSON.stringify(web)).profile.planning.switchPlans,[saved]);
 assert.deepEqual(convertWebBackup(JSON.stringify(web)).profile.planning.switchPlans,[saved]);
 const mobile=createMobileBackup({profile:{name:'Home',electricityPrice:.3,savingsGoalPercent:1,createdAt:stamp,planning:data},costs:[cost()],devices:[],history:[],tiles:[{id:'default-costs',kind:'costs',title:'Costs'}],betaInterested:false});
 assert.deepEqual(readMobileBackup(JSON.stringify(mobile)).profile.planning.switchPlans,[saved]);
});
test('changing a variable plan preserves checked-off estimates without turning them into learning samples',()=>{
 const c=cost({variableAmount:true,amount:80,nextDueDate:'2026-01-20'}),data=planning({actualPayments:invoices(c,[60,70,80])});
 data.paidPayments=togglePayment([],monthChecklist([c],'2026-10').payments[0],stamp);
 const s=variablePlanSuggestions([c],data,today)[0],next=applyVariablePlan([c],data,s,today);
 const checklist=monthChecklist(next.costs,'2026-10',next.planning.paidPayments,next.planning.actualPayments);
 assert.equal(checklist.open.length,0);assert.equal(checklist.paidTotal,80);assert.equal(checklist.payments[0].estimated,true);
 assert.equal(variablePlanSuggestions(next.costs,next.planning,'2026-10-22')[0].count,3);
 assert.equal(readPlanningBackup({...next.planning,actualPayments:[{...next.planning.actualPayments[0],estimated:'yes'}]}),null);
});

test('a plan suggestion never revalidates a checkmark invalidated by an earlier manual price change',()=>{
 const c=cost({variableAmount:true,amount:90,nextDueDate:'2026-01-20'}),data=planning({actualPayments:invoices(c,[100,120,140])});
 data.paidPayments=togglePayment([],monthChecklist([{...c,amount:80}],'2026-10').payments[0],stamp);
 const s=variablePlanSuggestions([c],data,today)[0],next=applyVariablePlan([c],data,s,today);
 assert.equal(monthChecklist(next.costs,'2026-10',next.planning.paidPayments,next.planning.actualPayments).open.length,1);
});
