import { paymentsForMonth, type HouseholdCost, type HouseholdCostFrequency } from './householdCosts.ts';

/** Manual confirmations, separate from the recurring cost definition. */
export type PaidPayment = {
  costId: string; month: string; date: string | null; amount: number;
  frequency: HouseholdCostFrequency; anchor: string | null; paidAt: string;
};
export type ActualPayment = {costId:string;month:string;date:string|null;amount:number;plannedAmount:number;frequency:HouseholdCostFrequency;anchor:string|null;updatedAt:string;estimated?:boolean};
export type MonthReview = {month:string;planned:number;paid:number;count:number;closedAt:string};
export type MonthPayment = { cost: HouseholdCost; month: string; date: string | null; plannedAmount?:number; estimated?:boolean };
export function readActualPayments(value:unknown):ActualPayment[] {
  if(!Array.isArray(value))return [];
  const seen=new Set<string>();
  return value.filter((p):p is ActualPayment=>{
    if(!p || (p.estimated!==undefined&&typeof p.estimated!=='boolean') || !Number.isFinite(p.plannedAmount) || p.plannedAmount<=0 || !Number.isFinite(p.amount) || p.amount<0 || typeof p.updatedAt!=='string' || !Number.isFinite(Date.parse(p.updatedAt)))return false;
    if(!readPaidPayments([{...p,paidAt:p.updatedAt}]).length)return false;
    const key=paymentKey(p);if(seen.has(key))return false;seen.add(key);return true;
  }).slice(-5000);
}
export function readMonthReviews(value:unknown):MonthReview[] {
  if(!Array.isArray(value))return [];
  const seen=new Set<string>();return value.filter((r):r is MonthReview=>{
    if(!r||typeof r.month!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.month)||!Number.isFinite(r.planned)||r.planned<0||!Number.isFinite(r.paid)||r.paid<0||!Number.isInteger(r.count)||r.count<1||typeof r.closedAt!=='string'||!Number.isFinite(Date.parse(r.closedAt))||seen.has(r.month))return false;
    seen.add(r.month);return true;
  }).slice(-120);
}
export function resolvePayment(payment:MonthPayment,actual:ActualPayment[]=[]):MonthPayment {
  const found=actual.find(p=>paymentKey(p)===paymentKey({costId:payment.cost.id,month:payment.month,date:payment.date})&&p.frequency===payment.cost.frequency&&p.anchor===(payment.cost.nextDueDate||null));
  return {...payment,plannedAmount:found?.plannedAmount??payment.cost.amount,estimated:!!payment.cost.variableAmount&&(!found||found.estimated===true),cost:found?{...payment.cost,amount:found.amount}:payment.cost};
}
export function saveActualPayment(actual:ActualPayment[],payment:MonthPayment,amount:number,updatedAt:string) {
  if(!Number.isFinite(amount)||amount<0)throw new Error('Invalid actual amount');
  const entry:ActualPayment={costId:payment.cost.id,month:payment.month,date:payment.date,amount,plannedAmount:payment.plannedAmount??payment.cost.amount,frequency:payment.cost.frequency,anchor:payment.cost.nextDueDate||null,updatedAt};
  return [...actual.filter(p=>paymentKey(p)!==paymentKey(entry)),entry];
}
export function monthlyReview(list:ReturnType<typeof monthChecklist>) {
  const planned=list.payments.reduce((sum,p)=>sum+(p.plannedAmount??p.cost.amount),0);
  const estimated=list.payments.filter(p=>p.estimated).length;
  const complete=list.payments.length>0&&!list.open.length&&!list.missing.length&&!estimated;
  return {planned,paid:list.paidTotal,count:list.payments.length,estimated,complete,difference:complete?Math.round((planned-list.paidTotal)*100)/100:null};
}
const dayOK = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0,10) === v;
export const paymentKey = (p: { costId: string; month: string; date: string | null }) => JSON.stringify([p.costId,p.month,p.date]);
export function readPaidPayments(value: unknown): PaidPayment[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((p): p is PaidPayment => {
    if (!p || typeof p.costId !== 'string' || !p.costId || typeof p.month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(p.month) || typeof p.amount !== 'number' || !Number.isFinite(p.amount) || p.amount < 0 || !['weekly','monthly','quarterly','half-yearly','yearly'].includes(p.frequency) || !(p.anchor === null || dayOK(p.anchor)) || typeof p.paidAt !== 'string' || Number.isNaN(Date.parse(p.paidAt))) return false;
    if (p.date === null ? p.frequency !== 'monthly' || p.anchor !== null : !dayOK(p.date) || p.date.slice(0,7) !== p.month || p.anchor === null) return false;
    const key = paymentKey(p); if (seen.has(key)) return false; seen.add(key); return true;
  });
}
export function paymentIsPaid(payment: MonthPayment, paid: PaidPayment[]) {
  return paid.some(p => p.costId === payment.cost.id && p.month === payment.month && p.date === payment.date && p.amount === payment.cost.amount && p.frequency === payment.cost.frequency && p.anchor === (payment.cost.nextDueDate || null));
}
export function monthChecklist(costs: HouseholdCost[], month: string, paid: PaidPayment[] = [], actual:ActualPayment[] = []) {
  const scheduled = paymentsForMonth(costs, month).payments.map(p => ({...p,month}));
  // A monthly cost without a date still belongs to each month. Other rhythms need an anchor.
  const monthly = costs.filter(c => !c.nextDueDate && c.frequency === 'monthly').map(cost => ({cost,month,date:null}));
  const payments: MonthPayment[] = [...scheduled,...monthly].map(p=>resolvePayment(p,actual)).sort((a,b) => (a.date ?? `${month}-99`).localeCompare(b.date ?? `${month}-99`) || a.cost.name.localeCompare(b.cost.name));
  const open = payments.filter(p => !paymentIsPaid(p,paid));
  return { payments, open, nextDue:open.find(p=>p.date !== null) ?? null, openTotal:open.reduce((sum,p)=>sum+p.cost.amount,0), paidTotal:payments.filter(p=>paymentIsPaid(p,paid)).reduce((sum,p)=>sum+p.cost.amount,0), missing:costs.filter(c=>!c.nextDueDate && c.frequency !== 'monthly') };
}
export function togglePayment(paid: PaidPayment[], payment: MonthPayment, paidAt: string): PaidPayment[] {
  const key = paymentKey({costId:payment.cost.id,month:payment.month,date:payment.date});
  const next = paid.filter(p => paymentKey(p) !== key);
  if (!paymentIsPaid(payment,paid)) next.push({costId:payment.cost.id,month:payment.month,date:payment.date,amount:payment.cost.amount,frequency:payment.cost.frequency,anchor:payment.cost.nextDueDate || null,paidAt});
  return next;
}
