import { monthlyCost, paymentsForMonth, type HouseholdCost } from './householdCosts.ts';
import { localToday, paydayForecast, validDay } from './homeValue.ts';
import { paymentIsPaid } from './paymentChecklist.ts';
import { monthsBetween, readPlanningData, shiftPlanningMonth, type PlanningData } from './planning.ts';
import type { SavingsAction, SavingsPlanInput } from './savingsPlan.ts';

export function upcomingBillReserves(costs: HouseholdCost[], value: PlanningData | undefined, today=localToday()) {
  const data=readPlanningData(value);
  return costs.filter(c=>['quarterly','half-yearly','yearly'].includes(c.frequency)).map(cost=>{
    let dueDate: string | null=null;
    for(let i=0;i<13&&!dueDate;i++) {
      const month=shiftPlanningMonth(today.slice(0,7),i);
      dueDate=paymentsForMonth([cost],month).payments.find(p=>!paymentIsPaid({...p,month},data.paidPayments??[]))?.date??null;
    }
    if (!dueDate && cost.nextDueDate && validDay(cost.nextDueDate) && cost.nextDueDate > today) dueDate=cost.nextDueDate;
    const reserve=data.reserves.find(r=>r.costId===cost.id);
    const saved=reserve && (!reserve.dueDate || reserve.dueDate===dueDate) ? reserve.saved : 0;
    const missing=Math.max(0,cost.amount-saved);
    const months=dueDate ? Math.max(1,monthsBetween(today.slice(0,7),dueDate.slice(0,7))+1):null;
    return {cost,dueDate,saved,missing,months,monthly:months?Math.ceil(missing/months*100)/100:null,average:monthlyCost(cost.amount,cost.frequency),overdue:!!dueDate&&dueDate<today};
  }).sort((a,b)=>(a.dueDate??'9999').localeCompare(b.dueDate??'9999'));
}

/** A preview only: replace future monthly charges, never already paid charges. */
export function compareAnnualSubscription(input: SavingsPlanInput, data: PlanningData | undefined, cost: HouseholdCost | undefined, annual: number, start: string, today=localToday()) {
  if(!cost || cost.frequency!=='monthly' || !Number.isFinite(annual)||annual<=0||!validDay(start)||start<today) return null;
  const p=readPlanningData(data), forecast=paydayForecast(input.costs,p.cash,input.variableMonthly,today,p.paidPayments);
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
      const payment=paymentsForMonth([cost],month).payments.find(p=>p.date>today);
      if(payment){upcoming.push({date:payment.date,amount:payment.cost.amount});break;}
    }
  }
  const first=upcoming.sort((a,b)=>a.date.localeCompare(b.date))[0];
  return first?{date:first.date,amount:upcoming.filter(p=>p.date===first.date).reduce((sum,p)=>sum+p.amount,0)}:null;
}

export function quickCheckFingerprint(input: SavingsPlanInput, data: PlanningData | undefined) {
  const p=readPlanningData(data);
  return JSON.stringify([input.variableMonthly,[...input.costs].sort((a,b)=>a.id.localeCompare(b.id)).map(c=>[c.id,c.amount,c.frequency,c.nextDueDate]),p.cash,p.paidPayments]);
}
