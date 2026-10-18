import { monthlyCost, paymentsForMonth, type HouseholdCost } from './householdCosts.ts';
import { localToday, paydayForecast, validDay } from './homeValue.ts';
import { resolvePayment, paymentIsPaid } from './paymentChecklist.ts';
import { monthsBetween, readPlanningData, shiftPlanningMonth, type PlanningData } from './planning.ts';
import type { SavingsAction, SavingsPlanInput } from './savingsPlan.ts';

/** Preview only. A proposal never changes the stored balance or payment checklist. */
export function savingsPaydayImpact(input: SavingsPlanInput, value: PlanningData | undefined, action: SavingsAction, today=localToday()) {
  const data = readPlanningData(value);
  const cost = input.costs.find(c => c.id === action.costId);
  if (!cost || cost.variableAmount || cost.amount !== action.originalAmount || cost.frequency !== action.frequency || (cost.nextDueDate || '') !== (action.nextDueDate || '') || !Number.isFinite(action.newAmount) || action.newAmount < 0 || action.newAmount >= action.originalAmount) return null;
  const forecast = paydayForecast(input.costs, data.cash, input.variableMonthly, today, data.paidPayments, data.actualPayments);
  if (!forecast || forecast.remaining === null || forecast.missingDates) return null;
  const affected = forecast.payments.filter(p => p.cost.id === action.costId && p.date >= today && p.date.slice(0,7) >= action.effectiveMonth && !(data.actualPayments ?? []).some(a => a.costId === p.cost.id && a.month === p.month && a.date === p.date && a.frequency === p.cost.frequency && a.anchor === (p.cost.nextDueDate || null)));
  const saving = Math.round(affected.reduce((sum,p) => sum + Math.max(0,p.cost.amount - action.newAmount),0) * 100) / 100;
  return {before: forecast.remaining, after: forecast.remaining + saving, saving, payday: data.cash!.payday};
}

export function upcomingBillReserves(costs: HouseholdCost[], value: PlanningData | undefined, today=localToday()) {
  const data=readPlanningData(value);
  return costs.filter(c=>['quarterly','half-yearly','yearly'].includes(c.frequency)).map(cost=>{
    let dueDate: string | null=null;let effectiveCost=cost;
    for(let i=0;i<13&&!dueDate;i++) {
      const month=shiftPlanningMonth(today.slice(0,7),i);
      const payment=paymentsForMonth([cost],month).payments.map(p=>({...resolvePayment({...p,month},data.actualPayments??[]),date:p.date})).find(p=>!paymentIsPaid(p,data.paidPayments??[]));
      dueDate=payment?.date??null;if(payment)effectiveCost=payment.cost;
    }
    if (!dueDate && cost.nextDueDate && validDay(cost.nextDueDate) && cost.nextDueDate > today) dueDate=cost.nextDueDate;
    const reserve=data.reserves.find(r=>r.costId===cost.id);
    const saved=reserve && (!reserve.dueDate || reserve.dueDate===dueDate) ? reserve.saved : 0;
    const missing=Math.max(0,effectiveCost.amount-saved);
    const months=dueDate ? Math.max(1,monthsBetween(today.slice(0,7),dueDate.slice(0,7))+1):null;
    return {cost:effectiveCost,dueDate,saved,missing,months,monthly:months?Math.ceil(missing/months*100)/100:null,average:monthlyCost(cost.amount,cost.frequency),overdue:!!dueDate&&dueDate<today};
  }).sort((a,b)=>(a.dueDate??'9999').localeCompare(b.dueDate??'9999'));
}

/** A preview only: replace future monthly charges, never already paid charges. */
export function compareAnnualSubscription(input: SavingsPlanInput, data: PlanningData | undefined, cost: HouseholdCost | undefined, annual: number, start: string, today=localToday()) {
  if(!cost || cost.variableAmount || cost.frequency!=='monthly' || !Number.isFinite(annual)||annual<=0||!validDay(start)||start<today) return null;
  const p=readPlanningData(data), forecast=paydayForecast(input.costs,p.cash,input.variableMonthly,today,p.paidPayments,p.actualPayments);
  const annualSaving=cost.amount*12-annual;
  const removed=forecast?.payments.filter(pay=>pay.cost.id===cost.id&&pay.date>=start).reduce((sum,pay)=>sum+pay.cost.amount,0)??0;
  const inWindow=!!p.cash&&start<p.cash.payday;
  const additionalNow=inWindow?annual-removed:0;
  const cashComplete=forecast&&forecast.missingDates===0&&forecast.remaining!==null;
  return {annualSaving,monthlyEquivalent:annual/12,upfront:annual,removed,additionalNow,inWindow,after:cashComplete?forecast.remaining!-additionalNow:null,payday:p.cash?.payday??null};
}

export function nextSavingsPayment(actions: SavingsAction[], today=localToday()) {
  const upcoming:Array<{date:string;amount:number}>=[];
  for(const a of actions.filter(a=>a.status==='confirmed'&&!a.endedOn&&a.nextDueDate)) {
    const cost={id:a.costId,name:a.name,amount:a.originalAmount-a.newAmount,frequency:a.frequency,category:'other' as const,nextDueDate:a.nextDueDate!,updatedAt:a.confirmedAt??''};
    for(let i=0;i<13;i++) {
      const month=shiftPlanningMonth(today.slice(0,7),i);
      if(month<a.effectiveMonth) continue;
      const payment=paymentsForMonth([cost],month).payments.find(p=>p.date>today && (!a.savingsFrom || p.date >= a.savingsFrom) && !a.excludedDates?.includes(p.date));
      if(payment){upcoming.push({date:payment.date,amount:payment.cost.amount});break;}
    }
  }
  const first=upcoming.sort((a,b)=>a.date.localeCompare(b.date))[0];
  return first?{date:first.date,amount:upcoming.filter(p=>p.date===first.date).reduce((sum,p)=>sum+p.amount,0)}:null;
}

export function quickCheckFingerprint(input: SavingsPlanInput, data: PlanningData | undefined) {
  const p=readPlanningData(data);
  return JSON.stringify([input.variableMonthly,[...input.costs].sort((a,b)=>a.id.localeCompare(b.id)).map(c=>[c.id,c.amount,c.frequency,c.nextDueDate]),p.cash,p.paidPayments,p.actualPayments]);
}

/** Changes to a fixed planning price, never fluctuations in a variable invoice. */
export function costPriceChanges(costs:HouseholdCost[],today=localToday()) {
  return costs.filter(c=>!c.variableAmount).flatMap(cost=>{
    const change=cost.priceChanges?.at(-1);
    if(!change||change.to!==cost.amount||change.frequency!==cost.frequency)return [];
    const age=(Date.parse(today)-Date.parse(change.changedAt.slice(0,10)))/86400000;
    if(age<0||age>90)return [];
    return [{cost,change,annualDifference:(monthlyCost(change.to,cost.frequency)-monthlyCost(change.from,cost.frequency))*12}];
  });
}
export function subscriptionOutcome(plan:import('./planning.ts').SubscriptionPlan,costs:HouseholdCost[],paid:import('./paymentChecklist.ts').PaidPayment[]) {
  const cost=costs.find(c=>c.id===plan.costId);
  const matches=!!cost&&!cost.variableAmount&&cost.frequency==='yearly'&&cost.amount===plan.annual&&cost.nextDueDate===plan.start;
  const payments=plan.confirmedAt?paid.filter(p=>p.costId===plan.costId&&p.frequency==='yearly'&&p.anchor===plan.start&&p.date!==null&&p.date>=plan.start):[];
  const actualSaving=payments.length?payments.reduce((sum,p)=>sum+plan.monthly*12-p.amount,0):null;
  return {plan,cost,matches,paidYears:payments.length,actualSaving:actualSaving===null?null:Math.round(actualSaving*100)/100,estimatedSaving:Math.round((plan.monthly*12-plan.annual)*100)/100};
}
