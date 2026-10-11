import test from 'node:test';
import assert from 'node:assert/strict';
import {monthChecklist,monthlyReview,saveActualPayment,togglePayment,readActualPayments,readMonthReviews} from '../packages/core/src/paymentChecklist.ts';
import {readPlanningData} from '../packages/core/src/planning.ts';
import {paydayForecast} from '../packages/core/src/homeValue.ts';
import {createHouseholdCost,readHouseholdCosts,upsertHouseholdCost} from '../packages/core/src/householdCosts.ts';
import {costPriceChanges,subscriptionOutcome} from '../packages/core/src/proValue.ts';
const stamp='2026-10-11T12:00:00Z';
const cost=(patch={})=>({id:'electric',name:'Electricity',category:'energy',amount:80,variableAmount:true,frequency:'monthly',nextDueDate:'2026-10-12',updatedAt:stamp,...patch});
test('a real invoice changes just its payment, including zero, and preserves the original plan',()=>{
 const costs=[cost()],p=monthChecklist(costs,'2026-10').payments[0];
 assert.equal(p.estimated,true);
 const actual=saveActualPayment([],p,76.40,stamp),oct=monthChecklist(costs,'2026-10',[],actual);
 assert.equal(oct.openTotal,76.40);assert.equal(oct.payments[0].plannedAmount,80);assert.equal(oct.payments[0].estimated,false);
 assert.equal(monthChecklist(costs,'2026-11',[],actual).openTotal,80);assert.equal(costs[0].amount,80);
 const zero=saveActualPayment(actual,oct.payments[0],0,stamp);assert.equal(monthChecklist(costs,'2026-10',[],zero).openTotal,0);
 assert.equal(monthChecklist([cost({amount:90})],'2026-10',[],actual).openTotal,76.40);
 assert.equal(monthChecklist([cost({amount:90})],'2026-10',[],actual).payments[0].plannedAmount,80);
});
test('weekly invoices in the same month remain independent and do not transfer to another schedule',()=>{
 const c=cost({frequency:'weekly',nextDueDate:'2026-10-02'}),p=monthChecklist([c],'2026-10').payments;
 const actual=saveActualPayment([],p[1],12,stamp),list=monthChecklist([c],'2026-10',[],actual);
 assert.equal(list.payments[0].cost.amount,80);assert.equal(list.payments[1].cost.amount,12);
 assert.equal(monthChecklist([{...c,nextDueDate:'2026-10-03'}],'2026-10',[],actual).payments[1].cost.amount,80);
});
test('payday uses known invoice amounts, labels estimates and excludes paid actual invoices',()=>{
 const costs=[cost()],cash={balance:1000,asOf:'2026-10-11',payday:'2026-10-30',protected:100,everydayRemaining:200};
 const p=monthChecklist(costs,'2026-10').payments[0],actual=saveActualPayment([],p,76.40,stamp);
 assert.equal(paydayForecast(costs,cash,null,'2026-10-11').estimatedBills,1);
 const result=paydayForecast(costs,cash,null,'2026-10-11',[],actual);
 assert.equal(result.fixed,76.4);assert.equal(result.estimatedBills,0);assert.ok(Math.abs(result.remaining-623.6)<.001);
 const paid=togglePayment([],monthChecklist(costs,'2026-10',[],actual).payments[0],stamp);
 assert.equal(paydayForecast(costs,cash,null,'2026-10-11',paid,actual).fixed,0);
});
test('review cannot count unpaid or estimated invoices as savings; closed totals survive later changes',()=>{
 const costs=[cost()],p=monthChecklist(costs,'2026-10').payments[0];
 assert.equal(monthlyReview(monthChecklist(costs,'2026-10',togglePayment([],p,stamp))).difference,null);
 const actual=saveActualPayment([],p,76.4,stamp),invoice=monthChecklist(costs,'2026-10',[],actual).payments[0];
 const review=monthlyReview(monthChecklist(costs,'2026-10',togglePayment([],invoice,stamp),actual));
 assert.equal(review.complete,true);assert.ok(Math.abs(review.difference-3.6)<.001);
 const saved=readPlanningData(JSON.parse(JSON.stringify({actualPayments:actual,monthReviews:[{month:'2026-10',planned:review.planned,paid:review.paid,count:review.count,closedAt:stamp}]})));
 assert.equal(saved.monthReviews[0].planned,80);assert.equal(saved.monthReviews[0].paid,76.4);
 assert.equal(monthlyReview(monthChecklist([...costs,cost({id:'missing',frequency:'yearly',nextDueDate:''})],'2026-10',togglePayment([],invoice,stamp),actual)).complete,false);
});
test('new payment metadata validates dates, money and unique occurrence keys',()=>{
 const actual=saveActualPayment([],monthChecklist([cost()],'2026-10').payments[0],76.4,stamp);
 assert.deepEqual(readActualPayments([...actual,...actual]),actual);
 for(const patch of [{amount:-1},{amount:'76'},{plannedAmount:0},{date:'2026-10-32'},{month:'2026-11'},{updatedAt:'bad'}])assert.equal(readActualPayments([{...actual[0],...patch}]).length,0);
 assert.equal(readMonthReviews([{month:'2026-10',planned:80,paid:76,count:1,closedAt:stamp}]).length,1);
 assert.equal(readMonthReviews([{month:'2026-10',planned:80,paid:76,count:1.5,closedAt:stamp}]).length,0);
 const c=createHouseholdCost({...cost()});assert.equal(c.variableAmount,true);assert.equal(readHouseholdCosts(JSON.stringify([c]))[0].variableAmount,true);
});
test('fixed price changes preserve prior prices but variable invoices and frequency switches are not price hikes',()=>{
 const previous=cost({variableAmount:false,category:'subscriptions',amount:20});
 const updated=upsertHouseholdCost([previous],{...previous,amount:25})[0];
 assert.equal(costPriceChanges([updated],'2026-10-11')[0].annualDifference,60);
 const cheaper=upsertHouseholdCost([updated],{...updated,amount:15})[0];assert.equal(costPriceChanges([cheaper],'2026-10-11')[0].annualDifference,-120);
 assert.equal(upsertHouseholdCost([cost()],cost({amount:100}))[0].priceChanges,undefined);
 assert.equal(upsertHouseholdCost([previous],{...previous,amount:200,frequency:'yearly'})[0].priceChanges,undefined);
 assert.equal(costPriceChanges([updated],'2027-02-01').length,0);
});
test('annual decisions record no realised benefit until the switch is confirmed and a yearly bill is paid',()=>{
 const plan={id:'plan',costId:'internet',name:'Internet',monthly:18,annual:180,start:'2026-10-12',remindAt:'2026-10-11'};
 const switched=cost({id:'internet',variableAmount:false,amount:180,frequency:'yearly'});
 const payment=monthChecklist([switched],'2026-10').payments[0],paid=togglePayment([],payment,stamp);
 assert.equal(subscriptionOutcome(plan,[switched],paid).actualSaving,null);
 assert.equal(subscriptionOutcome({...plan,confirmedAt:stamp},[switched],[]).actualSaving,null);
 const outcome=subscriptionOutcome({...plan,confirmedAt:stamp},[switched],paid);
 assert.equal(outcome.matches,true);assert.equal(outcome.actualSaving,36);assert.equal(outcome.paidYears,1);
 assert.equal(subscriptionOutcome({...plan,confirmedAt:stamp},[switched],[{...paid[0],amount:200}]).actualSaving,16);
 assert.equal(subscriptionOutcome({...plan,confirmedAt:stamp},[switched],[{...paid[0],anchor:'2026-10-13'}]).actualSaving,null);
});
