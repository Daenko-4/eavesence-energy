import { paymentsForMonth, type HouseholdCost } from './householdCosts.ts';
import { localToday, paydayForecast, validDay } from './homeValue.ts';
import { extraIncomeForMonth, readIncomeExtras } from './income.ts';
import { paymentIsPaid, paymentKey, resolvePayment } from './paymentChecklist.ts';
import { readPlanningData, shiftPlanningMonth, type PlanningData } from './planning.ts';
import type { SavingsPlanInput } from './savingsPlan.ts';

const cents = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const iso = (n: number) => new Date(n).toISOString().slice(0,10);
const plusDays = (day: string, n: number) => iso(Date.parse(day) + n * 86400000);
const monthDays = (month: string) => new Date(Date.UTC(Number(month.slice(0,4)), Number(month.slice(5,7)), 0)).getUTCDate();
const lastDay = (month: string) => `${month}-${monthDays(month)}`;
/** Preserve the original day through February and other short months. */
const monthlyDate = (anchor: string, offset: number) => {
  const month = shiftPlanningMonth(anchor.slice(0,7),offset);
  return `${month}-${String(Math.min(Number(anchor.slice(8)),monthDays(month))).padStart(2,'0')}`;
};
const sameSchedule = (row: {costId:string;frequency:string;anchor:string|null}, cost: HouseholdCost) => row.costId === cost.id && row.frequency === cost.frequency && row.anchor === (cost.nextDueDate || null);

export type VariablePlanSuggestion = {cost: HouseholdCost; amount: number; min: number; max: number; count: number; from: string; to: string; fingerprint: string; changed: boolean};
/** Recorded invoices, not a bank feed or a prediction of seasonal consumption. */
export function variablePlanSuggestions(costs: HouseholdCost[], value: PlanningData | undefined, today=localToday()): VariablePlanSuggestion[] {
  if (!validDay(today)) return [];
  const data = readPlanningData(value), earliest = shiftPlanningMonth(today.slice(0,7),-11);
  return costs.filter(cost => cost.variableAmount).flatMap(cost => {
    const rows = (data.actualPayments ?? []).filter(row => {
      if (row.estimated || !sameSchedule(row,cost) || row.month < earliest || row.month > today.slice(0,7) || (row.date !== null && row.date > today)) return false;
      return row.date === null ? !cost.nextDueDate && cost.frequency === 'monthly' : paymentsForMonth([cost],row.month).payments.some(p => p.date === row.date);
    }).sort((a,b) => (b.date ?? `${b.month}-01`).localeCompare(a.date ?? `${a.month}-01`)).slice(0,6);
    if (rows.length < 3) return [];
    const amount = Math.ceil(rows.reduce((sum,row) => sum + row.amount,0) / rows.length * 100 - 1e-8) / 100;
    // Recurring cost definitions require a positive amount. Zero invoices remain in the sample.
    if (amount <= 0) return [];
    return [{cost, amount, count:rows.length, min:Math.min(...rows.map(r=>r.amount)), max:Math.max(...rows.map(r=>r.amount)), from:rows.at(-1)!.date ?? `${rows.at(-1)!.month}-01`, to:rows[0].date ?? `${rows[0].month}-01`, changed:Math.abs(amount-cost.amount)>=.01, fingerprint:JSON.stringify([cost,rows.map(row=>[paymentKey(row),row.amount,row.updatedAt])])}];
  });
}
export function applyVariablePlan(costs:HouseholdCost[], value:PlanningData|undefined, proposal:VariablePlanSuggestion, today=localToday()) {
  const current=variablePlanSuggestions(costs,value,today).find(s=>s.cost.id===proposal.cost.id && s.fingerprint===proposal.fingerprint && s.amount===proposal.amount && s.changed);
  if(!current)throw new Error('SUGGESTION_STALE');
  const data=readPlanningData(value);
  const actualPayments=[...(data.actualPayments??[])];
  for(const paid of data.paidPayments??[]){
    if(sameSchedule(paid,current.cost)&&paid.amount===current.cost.amount&&!actualPayments.some(p=>paymentKey(p)===paymentKey(paid)&&sameSchedule(p,current.cost))){
      // A checked-off estimate stays paid, but never becomes a learning sample or a real invoice.
      actualPayments.push({costId:paid.costId,month:paid.month,date:paid.date,amount:paid.amount,plannedAmount:current.cost.amount,frequency:paid.frequency,anchor:paid.anchor,updatedAt:paid.paidAt,estimated:true});
    }
  }
  return {costs:costs.map(c=>c.id===current.cost.id?{...c,amount:current.amount,updatedAt:new Date().toISOString()}:c),planning:{...data,actualPayments,...(data.cash?{cash:{...data.cash,needsRefresh:true}}:{})}};
}

export type ForecastInput = SavingsPlanInput & {incomeKnown?:boolean; incomeIsAnnualAverage?:boolean};
export function forecast90Days(input:ForecastInput,value:PlanningData|undefined,today=localToday()) {
  const data=readPlanningData(value), cash=data.cash, end=validDay(today)?plusDays(today,89):today;
  const missingDates=input.costs.filter(c=>!validDay(c.nextDueDate));
  const reason = !validDay(today) || !cash || cash.asOf!==today || cash.needsRefresh || cash.payday<=today || (Date.parse(cash.payday)-Date.parse(today))/86400000>90 ? 'balance'
    : input.incomeKnown===false || input.incomeIsAnnualAverage || !Number.isFinite(input.incomeMonthly) || input.incomeMonthly<0 ? 'income'
    : input.variableMonthly===null || !Number.isFinite(input.variableMonthly) || input.variableMonthly<0 ? 'everyday'
    : missingDates.length ? 'dates' : null;
  if(reason) return {reason,missingDates,end,result:null};
  if(readIncomeExtras(input.incomeExtras)===null)return {reason:'income' as const,missingDates,end,result:null};
  const events=new Map<string,{bills:number;income:number;extras:number;estimated:number}>();
  const at=(date:string)=>{const key=date<today?today:date;let row=events.get(key);if(!row){row={bills:0,income:0,extras:0,estimated:0};events.set(key,row);}return row;};
  let overdue=0;
  for(let month=today.slice(0,7);month<=end.slice(0,7);month=shiftPlanningMonth(month,1)){
    for(const raw of paymentsForMonth(input.costs,month).payments){
      if(raw.date>end)continue;
      const payment=resolvePayment({...raw,month},data.actualPayments);
      if(paymentIsPaid(payment,data.paidPayments??[]))continue;
      const event=at(raw.date);event.bills+=payment.cost.amount;event.estimated+=payment.estimated?1:0;
      if(raw.date<today)overdue++;
    }
    // Only future months: this month's extras may already be in today's balance.
    const date=lastDay(month);
    if(month>today.slice(0,7)&&date<=end)at(date).extras+=extraIncomeForMonth(input.incomeExtras??[],month);
  }
  for(let offset=0;offset<4;offset++){
    const date=monthlyDate(cash!.payday,offset);
    if(date>end)break;
    if(date>=today)at(date).income+=input.incomeMonthly;
  }
  type Month={month:string;from:string;to:string;income:number;extras:number;bills:number;everyday:number;closing:number;lowest:number;lowDate:string};
  const months:Month[]=[];
  let available=cash!.balance-cash!.protected,lowest=available,lowDate=today,firstShortfall:string|null=available<0?today:null,estimatedBills=0;
  const daysToPayday=(Date.parse(cash!.payday)-Date.parse(today))/86400000;
  for(let date=today;date<=end;date=plusDays(date,1)){
    let month=months.at(-1);
    if(month?.month!==date.slice(0,7)){month={month:date.slice(0,7),from:date,to:date,income:0,extras:0,bills:0,everyday:0,closing:available,lowest:available,lowDate:date};months.push(month);}
    const event=events.get(date)??{bills:0,income:0,extras:0,estimated:0};
    const everyday=date<cash!.payday && cash!.everydayRemaining!==null ? cash!.everydayRemaining/daysToPayday : input.variableMonthly!/monthDays(date.slice(0,7));
    available-=event.bills+everyday;
    // Expenses first on shared dates: never rely on an unknown order of bank bookings.
    if(available<lowest){lowest=available;lowDate=date;}
    if(available<month!.lowest){month!.lowest=available;month!.lowDate=date;}
    if(available<-.005&&!firstShortfall)firstShortfall=date;
    available+=event.income+event.extras;
    month!.to=date;month!.income+=event.income;month!.extras+=event.extras;month!.bills+=event.bills;month!.everyday+=everyday;month!.closing=available;
    estimatedBills+=event.estimated;
  }
  return {reason:null,missingDates,end,result:{lowest:cents(lowest),lowDate,firstShortfall,closing:cents(available),overdue,estimatedBills,protected:cash!.protected,months:months.map(m=>({...m,income:cents(m.income),extras:cents(m.extras),bills:cents(m.bills),everyday:cents(m.everyday),closing:cents(m.closing),lowest:cents(m.lowest)}))}};
}

export type SwitchDraft={costId:string;newAmount:number;start:string;fee:number;overlapMonths:number};
export type SwitchPlan=SwitchDraft & {id:string;name:string;originalAmount:number;anchor:string;updatedAt:string};
export function readSwitchPlans(value:unknown):SwitchPlan[]{
  if(!Array.isArray(value))return [];
  const seen=new Set<string>();
  return value.filter((p):p is SwitchPlan=>{
    if(!p || typeof p.id!=='string'||!p.id||seen.has(p.id)||typeof p.costId!=='string'||!p.costId||typeof p.name!=='string'||!p.name.trim()||!validDay(p.anchor)||!validDay(p.start)||typeof p.originalAmount!=='number'||!Number.isFinite(p.originalAmount)||p.originalAmount<=0||typeof p.newAmount!=='number'||!Number.isFinite(p.newAmount)||p.newAmount<0||p.newAmount>=p.originalAmount||typeof p.fee!=='number'||!Number.isFinite(p.fee)||p.fee<0||!Number.isInteger(p.overlapMonths)||p.overlapMonths<0||p.overlapMonths>12||typeof p.updatedAt!=='string'||!Number.isFinite(Date.parse(p.updatedAt)))return false;
    seen.add(p.id);return true;
  }).slice(-25);
}
/** Compare real scheduled charges over 24 contract months; fees and overlap are costs, not savings. */
export function compareSwitch(input:SavingsPlanInput,value:PlanningData|undefined,draft:SwitchDraft,today=localToday()) {
  const cost=input.costs.find(c=>c.id===draft.costId), {newAmount,start,fee,overlapMonths}=draft;
  if(!cost||cost.variableAmount||cost.frequency!=='monthly'||!validDay(cost.nextDueDate)||!validDay(today)||!validDay(start)||start<today||!Number.isFinite(newAmount)||newAmount<0||newAmount>=cost.amount||!Number.isFinite(fee)||fee<0||!Number.isInteger(overlapMonths)||overlapMonths<0||overlapMonths>12)return null;
  const data=readPlanningData(value),end=plusDays(monthlyDate(start,24),-1),overlapEnd=monthlyDate(start,overlapMonths);
  const delta=new Map<string,number>();
  const add=(date:string,amount:number)=>delta.set(date,(delta.get(date)??0)+amount);
  let overlapCost=0,knownInvoices=0;
  for(let month=start.slice(0,7);month<=end.slice(0,7);month=shiftPlanningMonth(month,1)){
    for(const raw of paymentsForMonth([cost],month).payments){
      if(raw.date<start||raw.date>end)continue;
      const p=resolvePayment({...raw,month},data.actualPayments);
      if(paymentIsPaid(p,data.paidPayments??[]))continue;
      const known=(data.actualPayments??[]).some(a=>sameSchedule(a,cost)&&a.date===raw.date&&a.month===month);
      if(raw.date<overlapEnd){overlapCost+=p.cost.amount;continue;}
      if(known){knownInvoices++;continue;}
      add(raw.date,p.cost.amount);
    }
  }
  for(let i=0;i<24;i++)add(monthlyDate(start,i),-newAmount);
  add(start,-fee);
  let total=0,untilPayday=0;
  const months:Array<{end:string;saving:number;cumulative:number}>=[];
  let cursor=start;
  for(let i=0;i<24;i++){
    const monthEnd=plusDays(monthlyDate(start,i+1),-1);let saving=0;
    while(cursor<=monthEnd){const change=delta.get(cursor)??0;saving+=change;if(data.cash&&cursor<data.cash.payday)untilPayday+=change;cursor=plusDays(cursor,1);}
    total+=saving;months.push({end:monthEnd,saving:cents(saving),cumulative:cents(total)});
  }
  const breakEven=months.find((month,index)=>month.cumulative>=-.005 && months.slice(index).every(m=>m.cumulative>=-.005))??null;
  const forecast=paydayForecast(input.costs,data.cash,input.variableMonthly,today,data.paidPayments,data.actualPayments);
  const complete=forecast&&forecast.remaining!==null&&forecast.missingDates===0;
  return {monthlySaving:cents(cost.amount-newAmount),fee,overlapCost:cents(overlapCost),knownInvoices,firstYear:cents(months[11].cumulative),secondYear:cents(months[23].cumulative),breakEven:breakEven?.end??null,months,before:complete?forecast.remaining:null,after:complete?cents(forecast.remaining!+untilPayday):null,payday:data.cash?.payday??null};
}
