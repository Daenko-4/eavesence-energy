import { monthlyCost, paymentsForMonth, type HouseholdCost, type HouseholdCostFrequency } from "./householdCosts.ts";

export type SavingsPlanInput = {
  incomeMonthly: number;
  variableMonthly: number | null;
  bufferMonthly: number;
  goalMonthly: number;
  costs: HouseholdCost[];
  startMonth: string;
};

export type SavingsAction = {
  costId: string;
  name: string;
  frequency: HouseholdCostFrequency;
  originalAmount: number;
  newAmount: number;
  effectiveMonth: string;
  status: "planned" | "confirmed";
  confirmedAt?: string;
};

const validMonth = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

export function createSavingsAction(cost: HouseholdCost, newAmount: number, effectiveMonth: string): SavingsAction | null {
  if (!validMonth(effectiveMonth) || !Number.isFinite(newAmount) || newAmount < 0 || newAmount >= cost.amount) return null;
  return { costId: cost.id, name: cost.name, frequency: cost.frequency, originalAmount: cost.amount, newAmount, effectiveMonth, status: "planned" };
}

export function readSavingsActions(value: unknown): SavingsAction[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SavingsAction => item && typeof item === "object" &&
    typeof item.costId === "string" && item.costId.length > 0 &&
    typeof item.name === "string" && item.name.trim().length > 0 &&
    ["weekly", "monthly", "quarterly", "half-yearly", "yearly"].includes(item.frequency) &&
    typeof item.originalAmount === "number" && Number.isFinite(item.originalAmount) && item.originalAmount > 0 &&
    typeof item.newAmount === "number" && Number.isFinite(item.newAmount) && item.newAmount >= 0 && item.newAmount < item.originalAmount &&
    typeof item.effectiveMonth === "string" && validMonth(item.effectiveMonth) &&
    (item.status === "planned" || item.status === "confirmed") &&
    (item.confirmedAt === undefined || (typeof item.confirmedAt === "string" && !Number.isNaN(Date.parse(item.confirmedAt)))));
}

/** Favor an upcoming contract deadline, then the largest recurring review opportunity. */
export function savingsReviewCandidates(costs: HouseholdCost[], today: string) {
  const reviewable = costs.filter((cost) => cost.category === "subscriptions" || cost.category === "insurance" || cost.category === "energy" || cost.cancellationDeadline);
  return [...reviewable].sort((a, b) => {
    const aUpcoming = Boolean(a.cancellationDeadline && a.cancellationDeadline >= today);
    const bUpcoming = Boolean(b.cancellationDeadline && b.cancellationDeadline >= today);
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    if (aUpcoming && bUpcoming) return a.cancellationDeadline!.localeCompare(b.cancellationDeadline!);
    return monthlyCost(b.amount, b.frequency) - monthlyCost(a.amount, a.frequency);
  });
}

/** Scenarios change only the named cost from the chosen month; no saving is inferred from its deadline. */
export function compareSavingsActions(input: SavingsPlanInput, actions: SavingsAction[]) {
  const baseline = createSavingsPlan(input);
  if (!baseline) return null;
  const valid = readSavingsActions(actions).filter((action) =>
    input.costs.some((cost) => cost.id === action.costId && cost.amount === action.originalAmount));
  const unique = valid.filter((action, index) => valid.findIndex((item) => item.costId === action.costId) === index);
  const months = baseline.months.map((month) => {
    const changed = input.costs.map((cost) => {
      const action = unique.find((item) => item.costId === cost.id && item.effectiveMonth <= month.month);
      return action ? { ...cost, amount: action.newAmount } : cost;
    }).filter((cost) => cost.amount > 0);
    const dated = paymentsForMonth(changed, month.month).total;
    const undated = changed.filter((cost) => !cost.nextDueDate)
      .reduce((sum, cost) => sum + monthlyCost(cost.amount, cost.frequency), 0);
    const fixed = dated + undated;
    const saved = month.fixed - fixed;
    return { ...month, fixed, remaining: month.remaining + saved, afterGoal: month.afterGoal + saved, saved };
  });
  return {
    months,
    baselineTightMonths: baseline.tightMonths.length,
    tightMonths: months.filter((month) => month.afterGoal < 0).length,
    totalDifference: months.reduce((sum, month) => sum + month.saved, 0),
    firstBenefitMonth: months.find((month) => month.saved > 0.001)?.month ?? null,
    staleCostIds: actions.filter((action) => !unique.includes(action)).map((action) => action.costId),
  };
}

export function createSavingsPlan(input: SavingsPlanInput) {
  const { incomeMonthly, variableMonthly, bufferMonthly, goalMonthly, costs, startMonth } = input;
  const safe = (value: number) => Number.isFinite(value) && value >= 0;
  if (![incomeMonthly, bufferMonthly, goalMonthly].every(safe) ||
    (variableMonthly !== null && !safe(variableMonthly)) || !validMonth(startMonth)) return null;

  const averageFixed = costs.reduce((sum, cost) => sum + monthlyCost(cost.amount, cost.frequency), 0);
  const undatedCount = costs.filter((cost) => !cost.nextDueDate).length;
  const averageRoom = incomeMonthly - averageFixed - (variableMonthly ?? 0) - bufferMonthly;
  const months = Array.from({ length: 12 }, (_, offset) => {
    const [year, month] = startMonth.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1 + offset, 1));
    const key = date.toISOString().slice(0, 7);
    const scheduled = paymentsForMonth(costs, key);
    const unplannedAverage = costs.filter((cost) => !cost.nextDueDate)
      .reduce((sum, cost) => sum + monthlyCost(cost.amount, cost.frequency), 0);
    const fixed = scheduled.total + unplannedAverage;
    const remaining = incomeMonthly - fixed - (variableMonthly ?? 0) - bufferMonthly;
    return { month: key, fixed, remaining, afterGoal: remaining - goalMonthly };
  });
  return {
    averageFixed,
    averageRoom,
    undatedCount,
    complete: variableMonthly !== null && costs.length > 0 && undatedCount === 0 && incomeMonthly > 0,
    months,
    tightMonths: months.filter((month) => month.afterGoal < 0),
  };
}
