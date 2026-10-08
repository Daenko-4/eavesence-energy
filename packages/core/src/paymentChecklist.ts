import { paymentsForMonth, type HouseholdCost, type HouseholdCostFrequency } from './householdCosts.ts';

/** Manual confirmations, separate from the recurring cost definition. */
export type PaidPayment = {
  costId: string; month: string; date: string | null; amount: number;
  frequency: HouseholdCostFrequency; anchor: string | null; paidAt: string;
};
export type MonthPayment = { cost: HouseholdCost; month: string; date: string | null };
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
export function monthChecklist(costs: HouseholdCost[], month: string, paid: PaidPayment[] = []) {
  const scheduled = paymentsForMonth(costs, month).payments.map(p => ({...p,month}));
  // A monthly cost without a date still belongs to each month. Other rhythms need an anchor.
  const monthly = costs.filter(c => !c.nextDueDate && c.frequency === 'monthly').map(cost => ({cost,month,date:null}));
  const payments: MonthPayment[] = [...scheduled,...monthly].sort((a,b) => (a.date ?? `${month}-99`).localeCompare(b.date ?? `${month}-99`) || a.cost.name.localeCompare(b.cost.name));
  const open = payments.filter(p => !paymentIsPaid(p,paid));
  return { payments, open, nextDue:open.find(p=>p.date !== null) ?? null, openTotal:open.reduce((sum,p)=>sum+p.cost.amount,0), paidTotal:payments.filter(p=>paymentIsPaid(p,paid)).reduce((sum,p)=>sum+p.cost.amount,0), missing:costs.filter(c=>!c.nextDueDate && c.frequency !== 'monthly') };
}
export function togglePayment(paid: PaidPayment[], payment: MonthPayment, paidAt: string): PaidPayment[] {
  const key = paymentKey({costId:payment.cost.id,month:payment.month,date:payment.date});
  const next = paid.filter(p => paymentKey(p) !== key);
  if (!paymentIsPaid(payment,paid)) next.push({costId:payment.cost.id,month:payment.month,date:payment.date,amount:payment.cost.amount,frequency:payment.cost.frequency,anchor:payment.cost.nextDueDate || null,paidAt});
  return next;
}
