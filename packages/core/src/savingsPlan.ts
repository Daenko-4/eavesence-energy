import { monthlyCost, paymentsForMonth, type HouseholdCost } from "./householdCosts.ts";

export type SavingsPlanInput = {
  incomeMonthly: number;
  variableMonthly: number | null;
  bufferMonthly: number;
  goalMonthly: number;
  costs: HouseholdCost[];
  startMonth: string;
};

export function createSavingsPlan(input: SavingsPlanInput) {
  const { incomeMonthly, variableMonthly, bufferMonthly, goalMonthly, costs, startMonth } = input;
  const safe = (value: number) => Number.isFinite(value) && value >= 0;
  if (![incomeMonthly, bufferMonthly, goalMonthly].every(safe) ||
    (variableMonthly !== null && !safe(variableMonthly)) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(startMonth)) return null;

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
    actions: [...costs]
      .filter((cost) => cost.category === "subscriptions" || cost.category === "insurance" || !!cost.cancellationDeadline)
      .sort((a, b) => (b.cancellationDeadline ? 1 : 0) - (a.cancellationDeadline ? 1 : 0) || monthlyCost(b.amount, b.frequency) - monthlyCost(a.amount, a.frequency))
      .slice(0, 3)
      .map((cost) => ({ id: cost.id, name: cost.name, annual: monthlyCost(cost.amount, cost.frequency) * 12,
        exampleAtTenPercent: monthlyCost(cost.amount, cost.frequency) * 12 * 0.1, deadline: cost.cancellationDeadline ?? null })),
  };
}
