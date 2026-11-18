/** An optional scenario. The confirmed salary remains the source of truth. */
export type SalaryGrowth = { annualPercent: number; firstMonth: string; baseIncomeMonthly: number };

const validMonth = (v: unknown): v is string => typeof v === 'string' && /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(v);
export function readSalaryGrowth(value: unknown): SalaryGrowth | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const s = value as SalaryGrowth;
  return Number.isFinite(s.annualPercent) && s.annualPercent >= 0 && s.annualPercent <= 100 &&
    validMonth(s.firstMonth) && Number.isFinite(s.baseIncomeMonthly) && s.baseIncomeMonthly > 0 && s.baseIncomeMonthly <= 1e9
    ? { annualPercent: s.annualPercent, firstMonth: s.firstMonth, baseIncomeMonthly: s.baseIncomeMonthly } : undefined;
}

/** Compound on each anniversary, round once, and pause when the actual salary changes. */
export function projectedSalary(incomeMonthly: number, month: string, value?: SalaryGrowth): number {
  const growth = readSalaryGrowth(value);
  if (!growth || growth.annualPercent === 0 || growth.baseIncomeMonthly !== incomeMonthly || !validMonth(month) || month < growth.firstMonth) return incomeMonthly;
  const elapsed = (Number(month.slice(0,4)) - Number(growth.firstMonth.slice(0,4))) * 12 + Number(month.slice(5)) - Number(growth.firstMonth.slice(5));
  const amount = incomeMonthly * (1 + growth.annualPercent / 100) ** (Math.floor(elapsed / 12) + 1);
  return Math.round(Math.min(amount, 1e9) * 100) / 100;
}
