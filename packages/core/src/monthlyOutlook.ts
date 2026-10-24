import { summarizeIncome, extraIncomeForMonth, type IncomeProfile } from './income.ts';
import { monthChecklist, readActualPayments } from './paymentChecklist.ts';
import type { HouseholdCost } from './householdCosts.ts';

/** A whole-month forecast, including all payments rather than only unpaid ones. */
export function monthlyOutlook({ profile, incomeKnown, costs, month, actualPayments }: {
  profile: IncomeProfile;
  incomeKnown: boolean;
  costs: HouseholdCost[];
  month: string;
  actualPayments?: unknown;
}) {
  const list = monthChecklist(costs, month, [], readActualPayments(actualPayments));
  const summary = summarizeIncome(profile, Number(month.slice(0, 4)));
  const round = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;
  const extraIncome = round(extraIncomeForMonth(summary.extras, month));
  const income = incomeKnown ? round(summary.monthly + extraIncome) : null;
  const total = round(list.payments.reduce((sum, payment) => sum + payment.cost.amount, 0));
  const complete = income !== null && costs.length > 0 && list.missing.length === 0;
  return {
    month, payments: list.payments, missing: list.missing,
    total, income, extraIncome, regularIncome: summary.monthly,
    remaining: complete ? round(income - total) : null,
    incomeIsAverage: summary.annualAverage,
    estimated: summary.annualAverage || list.payments.some(payment => payment.estimated),
    undatedMonthlyCount: list.payments.filter(payment => payment.date === null).length,
    hasCosts: costs.length > 0,
  };
}
export type MonthlyOutlook = ReturnType<typeof monthlyOutlook>;
