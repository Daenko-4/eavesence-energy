export const HOUSEHOLD_COSTS_STORAGE_KEY = "eavesence-home-costs-v1";

export type HouseholdCostCategory =
  | "housing"
  | "energy"
  | "insurance"
  | "mobility"
  | "subscriptions"
  | "financing"
  | "leisure"
  | "other";

export type HouseholdCostFrequency =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "yearly";

export type HouseholdCost = {
  id: string;
  name: string;
  category: HouseholdCostCategory;
  amount: number;
  frequency: HouseholdCostFrequency;
  tileId?: string;
  nextDueDate: string;
  cancellationDeadline?: string;
  updatedAt: string;
};

export type HouseholdCostSummary = {
  monthlyTotal: number;
  annualTotal: number;
  entryCount: number;
  categoryTotals: Array<{
    category: HouseholdCostCategory;
    monthlyTotal: number;
    annualTotal: number;
    entryCount: number;
  }>;
  largestCategory: HouseholdCostCategory | null;
  largestCategoryMonthlyTotal: number;
  nextDueCost: HouseholdCost | null;
};

const categories: HouseholdCostCategory[] = [
  "housing",
  "energy",
  "insurance",
  "mobility",
  "subscriptions",
  "financing",
  "leisure",
  "other",
];

const frequencies: HouseholdCostFrequency[] = [
  "weekly",
  "monthly",
  "quarterly",
  "half-yearly",
  "yearly",
];

export function monthlyCost(amount: number, frequency: HouseholdCostFrequency) {
  if (!Number.isFinite(amount) || amount < 0) return 0;
  if (frequency === "weekly") return (amount * 52) / 12;
  if (frequency === "quarterly") return amount / 3;
  if (frequency === "half-yearly") return amount / 6;
  if (frequency === "yearly") return amount / 12;
  return amount;
}

export function annualCost(amount: number, frequency: HouseholdCostFrequency) {
  return monthlyCost(amount, frequency) * 12;
}

export function createHouseholdCost({
  id,
  name,
  category,
  amount,
  frequency,
  tileId,
  nextDueDate = "",
  cancellationDeadline = "",
  now = new Date(),
}: {
  id?: string;
  name: string;
  category: HouseholdCostCategory;
  amount: number;
  frequency: HouseholdCostFrequency;
  tileId?: string;
  nextDueDate?: string;
  cancellationDeadline?: string;
  now?: Date;
}): HouseholdCost | null {
  const trimmedName = name.trim();
  if (
    !trimmedName ||
    !categories.includes(category) ||
    !frequencies.includes(frequency) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    (nextDueDate !== "" && !validDate(nextDueDate)) ||
    (cancellationDeadline !== "" && !validDate(cancellationDeadline))
  ) {
    return null;
  }

  return {
    id:
      id ??
      `cost-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmedName,
    category,
    amount,
    frequency,
    ...(tileId ? { tileId } : {}),
    nextDueDate,
    ...(cancellationDeadline ? { cancellationDeadline } : {}),
    updatedAt: now.toISOString(),
  };
}

function isHouseholdCost(value: unknown): value is HouseholdCost {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<HouseholdCost>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    categories.includes(candidate.category as HouseholdCostCategory) &&
    frequencies.includes(candidate.frequency as HouseholdCostFrequency) &&
    typeof candidate.amount === "number" &&
    Number.isFinite(candidate.amount) &&
    candidate.amount > 0 &&
    (candidate.tileId === undefined || typeof candidate.tileId === "string") &&
    typeof candidate.nextDueDate === "string" &&
    (candidate.nextDueDate === "" || validDate(candidate.nextDueDate)) &&
    (candidate.cancellationDeadline === undefined || validDate(candidate.cancellationDeadline)) &&
    typeof candidate.updatedAt === "string"
  );
}

export function readHouseholdCosts(value: string | null) {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHouseholdCost);
  } catch {
    return [];
  }
}

export function upsertHouseholdCost(
  costs: HouseholdCost[],
  nextCost: HouseholdCost,
) {
  const existingIndex = costs.findIndex((cost) => cost.id === nextCost.id);
  if (existingIndex < 0) return [nextCost, ...costs];
  const next = [...costs];
  next[existingIndex] = nextCost;
  return next;
}

export function removeHouseholdCost(costs: HouseholdCost[], id: string) {
  return costs.filter((cost) => cost.id !== id);
}

export function reorderHouseholdCosts(
  costs: HouseholdCost[],
  sourceId: string,
  targetId: string,
) {
  if (sourceId === targetId) return costs;
  const sourceIndex = costs.findIndex((cost) => cost.id === sourceId);
  const targetIndex = costs.findIndex((cost) => cost.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return costs;
  const next = [...costs];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function monthKey(date: Date, offset = 0) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth() + offset, 1))
    .toISOString().slice(0, 7);
}

export function paymentsForMonth(costs: HouseholdCost[], month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Invalid month");
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  const payments: Array<{ cost: HouseholdCost; date: string }> = [];
  const intervalMonths: Partial<Record<HouseholdCostFrequency, number>> = {
    monthly: 1,
    quarterly: 3,
    "half-yearly": 6,
    yearly: 12,
  };

  for (const cost of costs) {
    if (!cost.nextDueDate) continue;
    const first = new Date(`${cost.nextDueDate}T00:00:00Z`);
    if (Number.isNaN(first.getTime())) continue;
    const step = intervalMonths[cost.frequency];
    // Keep the original due day as the anchor, even after a short month.
    for (let occurrence = 0; occurrence < 6000; occurrence++) {
      const due = step
        ? (() => {
            const dueMonth = first.getUTCMonth() + occurrence * step;
            const firstOfMonth = new Date(Date.UTC(first.getUTCFullYear(), dueMonth, 1));
            const lastDay = new Date(Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() + 1, 0)).getUTCDate();
            return new Date(Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth(), Math.min(first.getUTCDate(), lastDay)));
          })()
        : new Date(first.getTime() + occurrence * 7 * 86_400_000);
      if (due >= end) break;
      if (due >= start) payments.push({ cost, date: due.toISOString().slice(0, 10) });
    }
  }

  payments.sort((a, b) => b.cost.amount - a.cost.amount || a.date.localeCompare(b.date) || a.cost.name.localeCompare(b.cost.name));
  return {
    month,
    payments,
    total: payments.reduce((total, payment) => total + payment.cost.amount, 0),
    undatedCount: costs.filter((cost) => !cost.nextDueDate).length,
  };
}

export function paymentsNextMonth(costs: HouseholdCost[], today = new Date()) {
  return paymentsForMonth(costs, monthKey(today, 1));
}

export function nextPaymentForCost(cost: HouseholdCost, today = new Date()) {
  if (!cost.nextDueDate) return null;
  const todayKey = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  for (let offset = 0; offset <= 12; offset++) {
    const match = paymentsForMonth([cost], monthKey(today, offset)).payments
      .find((payment) => payment.date >= todayKey);
    if (match) return match.date;
  }
  return null;
}

export function forecastHouseholdCosts(costs: HouseholdCost[], today = new Date()) {
  const summary = summarizeHouseholdCosts(costs, today);
  const next = paymentsNextMonth(costs, today);
  const complete = costs.length > 0 && next.undatedCount === 0;
  const difference = next.total - summary.monthlyTotal;
  const drivers = next.payments
    .map(({ cost, date }) => ({ cost, date, extra: cost.amount - monthlyCost(cost.amount, cost.frequency) }))
    .filter(({ extra }) => extra > 0.01)
    .sort((a, b) => b.extra - a.extra);
  return { summary, next, complete, difference, drivers };
}

export function summarizeHouseholdCosts(
  costs: HouseholdCost[],
  today = new Date(),
): HouseholdCostSummary {
  const categoryTotals = categories
    .map((category) => {
      const entries = costs.filter((cost) => cost.category === category);
      const monthlyTotal = entries.reduce(
        (total, cost) => total + monthlyCost(cost.amount, cost.frequency),
        0,
      );
      return {
        category,
        monthlyTotal,
        annualTotal: monthlyTotal * 12,
        entryCount: entries.length,
      };
    })
    .filter((category) => category.entryCount > 0);
  const largest = [...categoryTotals].sort(
    (a, b) => b.monthlyTotal - a.monthlyTotal,
  )[0] ?? null;
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const nextDueCost = costs
    .filter((cost) => cost.nextDueDate && cost.nextDueDate >= todayKey)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))[0] ?? null;
  const monthlyTotal = categoryTotals.reduce(
    (total, category) => total + category.monthlyTotal,
    0,
  );

  return {
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
    entryCount: costs.length,
    categoryTotals,
    largestCategory: largest?.category ?? null,
    largestCategoryMonthlyTotal: largest?.monthlyTotal ?? 0,
    nextDueCost,
  };
}
