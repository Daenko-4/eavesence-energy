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
  now = new Date(),
}: {
  id?: string;
  name: string;
  category: HouseholdCostCategory;
  amount: number;
  frequency: HouseholdCostFrequency;
  tileId?: string;
  nextDueDate?: string;
  now?: Date;
}): HouseholdCost | null {
  const trimmedName = name.trim();
  if (
    !trimmedName ||
    !categories.includes(category) ||
    !frequencies.includes(frequency) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    (nextDueDate !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(nextDueDate))
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
    (candidate.nextDueDate === "" ||
      /^\d{4}-\d{2}-\d{2}$/.test(candidate.nextDueDate)) &&
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
