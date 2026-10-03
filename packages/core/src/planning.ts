import { readCashWindow, type CashWindow } from './homeValue.ts';
import { createSavingsPlan, savingsReviewCandidates, type SavingsPlanInput } from './savingsPlan.ts';
import { paymentsForMonth } from './householdCosts.ts';

export type NamedGoal = { id: string; name: string; target: number; saved: number; targetMonth: string };
export type BillReserve = { costId: string; saved: number };
export type MonthlyCheck = { month: string; checkedAt: string; incomeMonthly: number; variableMonthly: number; fixedMonthly: number; fingerprint: string };
export type PlanningData = { goals: NamedGoal[]; reserves: BillReserve[]; checks: MonthlyCheck[]; cash?: CashWindow; reviews?: Array<{costId:string;updatedAt:string;until:string}> };
const monthOK = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
const nonnegative = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
export function readPlanningData(value: unknown): PlanningData {
  const data = value && typeof value === 'object' ? value as Partial<PlanningData> : {};
  const unique = <T>(rows: T[], key: (row: T) => string) => rows.filter((row, i) => rows.findIndex(r => key(r) === key(row)) === i);
  return {
    ...(readCashWindow(data.cash) ? {cash:readCashWindow(data.cash)} : {}),
    reviews:(Array.isArray(data.reviews)?data.reviews:[]).filter(r=>r&&typeof r.costId==='string'&&typeof r.updatedAt==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.until)),
    goals: unique((Array.isArray(data.goals) ? data.goals : []).filter((g): g is NamedGoal => !!g && typeof g.id === 'string' && !!g.id && typeof g.name === 'string' && !!g.name.trim() && nonnegative(g.target) && g.target > 0 && nonnegative(g.saved) && monthOK(g.targetMonth)), g => g.id),
    reserves: unique((Array.isArray(data.reserves) ? data.reserves : []).filter((r): r is BillReserve => !!r && typeof r.costId === 'string' && !!r.costId && nonnegative(r.saved)), r => r.costId),
    checks: unique((Array.isArray(data.checks) ? data.checks : []).filter((c): c is MonthlyCheck => !!c && monthOK(c.month) && typeof c.checkedAt === 'string' && !Number.isNaN(Date.parse(c.checkedAt)) && nonnegative(c.incomeMonthly) && nonnegative(c.variableMonthly) && nonnegative(c.fixedMonthly) && typeof c.fingerprint === 'string'), c => c.month).sort((a,b) => b.month.localeCompare(a.month)).slice(0,24),
  };
}
export function monthsBetween(start: string, end: string) {
  const [sy, sm] = start.split('-').map(Number); const [ey, em] = end.split('-').map(Number);
  return (ey - sy) * 12 + em - sm;
}
export function shiftPlanningMonth(start: string, by: number) {
  const [y,m] = start.split('-').map(Number);
  return new Date(Date.UTC(y,m-1+by,1)).toISOString().slice(0,7);
}
export function goalProgress(goal: NamedGoal, startMonth: string) {
  const remaining = Math.max(0, goal.target - goal.saved);
  const months = Math.max(1, monthsBetween(startMonth, goal.targetMonth) + 1);
  return { remaining, monthly: Math.ceil(remaining / months * 100) / 100, percent: Math.min(100, goal.saved / goal.target * 100), overdue: goal.targetMonth < startMonth && remaining > 0 };
}
export function planningFingerprint(input: SavingsPlanInput) {
  const base = [input.incomeMonthly,input.variableMonthly,input.bufferMonthly,input.goalMonthly,[...input.costs].sort((a,b)=>a.id.localeCompare(b.id)).map(c=>[c.id,c.amount,c.frequency,c.nextDueDate,c.cancellationDeadline])];
  return JSON.stringify(input.incomeExtras?.length ? [...base,[...input.incomeExtras].sort((a,b)=>a.id.localeCompare(b.id)).map(e=>[e.id,e.kind,e.amount,e.month,e.year])] : base);
}
export function billReservePlan(input: SavingsPlanInput, data: PlanningData) {
  return input.costs.filter(c => ['quarterly','half-yearly','yearly'].includes(c.frequency)).map(cost => {
    let dueMonth: string | null = null;
    for(let i=0;i<12;i++) { const month=shiftPlanningMonth(input.startMonth,i); if(paymentsForMonth([cost],month).payments.length) {dueMonth=month;break;} }
    const saved=data.reserves.find(r=>r.costId===cost.id)?.saved ?? 0;
    const missing=Math.max(0,cost.amount-saved);
    return {cost,saved,dueMonth,missing,monthly: dueMonth ? Math.ceil(missing/(monthsBetween(input.startMonth,dueMonth)+1)*100)/100 : null};
  });
}
export function purchaseImpact(input: SavingsPlanInput, amount: number, month: string, available: number | null) {
  const plan=createSavingsPlan(input);
  if(!plan || input.incomeMonthly<=0 || input.variableMonthly===null || !nonnegative(amount) || amount<=0 || !monthOK(month) || (available !== null && !nonnegative(available))) return null;
  const selected=plan.months.find(m=>m.month===month); if(!selected) return null;
  const after=selected.afterGoal-amount;
  const later=plan.months.find(m=>m.month>month && m.afterGoal>=amount)?.month ?? null;
  return {before:selected.afterGoal,after,goalShortfall:Math.min(input.goalMonthly,Math.max(0,-after)),later,availableAfter:available===null ? null : available-amount};
}
export function planningSuggestions(input: SavingsPlanInput, today: string) {
  const suggestions: Array<{kind:'dates'|'deadline'|'review'|'tight';costId?:string;name?:string;month?:string;date?:string}> = [];
  const review=savingsReviewCandidates(input.costs.filter(c=>['subscriptions','insurance','energy'].includes(c.category) || !!c.cancellationDeadline),today);
  const deadline=review.find(c=>c.cancellationDeadline && c.cancellationDeadline>=today);
  if(deadline) suggestions.push({kind:'deadline',costId:deadline.id,name:deadline.name,date:deadline.cancellationDeadline});
  if(input.costs.some(c=>!c.nextDueDate)) suggestions.push({kind:'dates'});
  const plan=createSavingsPlan(input);
  if(input.incomeMonthly>0 && input.variableMonthly!==null && plan?.tightMonths.length) suggestions.push({kind:'tight',month:plan.tightMonths[0].month});
  const cost=review.find(c=>c.id!==deadline?.id);
  if(cost) suggestions.push({kind:'review',costId:cost.id,name:cost.name});
  return suggestions.slice(0,3);
}
