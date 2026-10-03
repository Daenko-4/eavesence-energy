export type IncomeExtra = { id: string; kind: "salary13" | "salary14" | "bonus"; amount: number; month: number; year?: number };
export type IncomeProfile = { incomeAmount?: number; incomeFrequency?: "monthly" | "yearly"; incomeExtras?: IncomeExtra[] };
export type IncomeExtraDraft = { id: string; kind: IncomeExtra["kind"]; amount: string; month: string; year: string; yearly: boolean };

/** Reject damaged extra-payment records atomically, including duplicate IDs. */
export function readIncomeExtras(value: unknown): IncomeExtra[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 50) return null;
  if (value.some(item => !item || typeof item !== "object" || typeof item.id !== "string" || !item.id.trim() || item.id.length > 100 ||
    !["salary13", "salary14", "bonus"].includes(item.kind) || typeof item.amount !== "number" || !Number.isFinite(item.amount) || item.amount <= 0 || item.amount > 1e9 ||
    !Number.isInteger(item.month) || item.month < 1 || item.month > 12 || (item.year !== undefined && (!Number.isInteger(item.year) || item.year < 1900 || item.year > 2200)))) return null;
  if (new Set(value.map(item => item.id)).size !== value.length) return null;
  return value as IncomeExtra[];
}

export function incomeExtraDrafts(extras: IncomeExtra[] = [], year = new Date().getFullYear()): IncomeExtraDraft[] {
  return extras.map(extra => ({ id: extra.id, kind: extra.kind, amount: String(extra.amount), month: String(extra.month), year: String(extra.year ?? year), yearly: extra.year === undefined }));
}
export function newIncomeExtraDraft(kind: IncomeExtra["kind"], now = new Date()): IncomeExtraDraft {
  return { id: `income-${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`, kind, amount: "", month: "", year: String(now.getFullYear()), yearly: kind !== "bonus" };
}
/** Accept localized grouping and cents without silently turning 2.400 into 2.4. */
export function parseIncomeAmount(value: string, locale: "de" | "en" = "de") {
  const clean = value.trim().replace(/€|CHF|\s/g, "");
  if (!clean) return NaN;
  let normalized = clean;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(clean) && (locale === "de" || clean.includes(","))) normalized = clean.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(clean) && (locale === "en" || clean.includes("."))) normalized = clean.replace(/,/g, "");
  else if (/^\d+([.,]\d{1,2})?$/.test(clean)) normalized = clean.replace(",", ".");
  else return NaN;
  return Number(normalized);
}
export function incomeExtrasFromDraft(drafts: IncomeExtraDraft[], locale: "de" | "en" = "de"): IncomeExtra[] | null {
  return readIncomeExtras(drafts.map(draft => ({ id: draft.id, kind: draft.kind, amount: parseIncomeAmount(draft.amount, locale), month: Number(draft.month), ...(!draft.yearly ? { year: /^\d{4}$/.test(draft.year) ? Number(draft.year) : NaN } : {}) })));
}
export function extraIncomeForMonth(extras: IncomeExtra[], month: string): number {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return 0;
  const [year, number] = month.split("-").map(Number);
  return extras.filter(extra => extra.month === number && (extra.year === undefined || extra.year === year)).reduce((sum, extra) => sum + extra.amount, 0);
}
export function summarizeIncome(profile: IncomeProfile, year = new Date().getFullYear()) {
  const annualAverage = profile.incomeFrequency === "yearly";
  const amount = profile.incomeAmount ?? 0;
  const monthly = annualAverage ? amount / 12 : amount;
  // Legacy annual net may already include all bonuses. Never add extras twice.
  const extras = annualAverage ? [] : readIncomeExtras(profile.incomeExtras) ?? [];
  const extraTotal = extras.filter(extra => extra.year === undefined || extra.year === year).reduce((sum, extra) => sum + extra.amount, 0);
  const annual = annualAverage ? amount : monthly * 12 + extraTotal;
  return { monthly, annualAverage, annual, average: annual / 12, extraTotal, extras, year };
}
export function incomeExtraLabel(kind: IncomeExtra["kind"], locale: "de" | "en") {
  return kind === "salary13" ? locale === "de" ? "13. Gehalt" : "13th salary" : kind === "salary14" ? locale === "de" ? "14. Gehalt" : "14th salary" : "Bonus";
}
export function incomeMonthLabel(month: number, locale: "de" | "en") {
  return new Intl.DateTimeFormat(locale === "de" ? "de-AT" : "en-GB", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, month - 1, 1)));
}
