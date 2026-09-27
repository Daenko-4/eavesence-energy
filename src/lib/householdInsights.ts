import {
  annualCost,
  monthKey,
  monthlyCost,
  nextPaymentForCost,
  paymentsForMonth,
  summarizeHouseholdCosts,
  type HouseholdCost,
} from "./householdCosts";

export const COST_EVENTS_STORAGE_KEY = "eavesence-home-cost-events-v1";

export type CostEvent = {
  id: string;
  month: string;
  name: string;
  kind: "added" | "changed" | "removed";
  previousMonthly: number;
  monthly: number;
};

export function readCostEvents(value: string | null): CostEvent[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CostEvent => {
      if (!item || typeof item !== "object") return false;
      const event = item as Partial<CostEvent>;
      return typeof event.id === "string" && typeof event.name === "string" &&
        typeof event.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(event.month) &&
        ["added", "changed", "removed"].includes(event.kind ?? "") &&
        typeof event.previousMonthly === "number" && Number.isFinite(event.previousMonthly) &&
        typeof event.monthly === "number" && Number.isFinite(event.monthly);
    }).slice(0, 100);
  } catch {
    return [];
  }
}

export function changesInCosts(before: HouseholdCost[], after: HouseholdCost[], today = new Date()): CostEvent[] {
  const previous = new Map(before.map((cost) => [cost.id, cost]));
  const next = new Map(after.map((cost) => [cost.id, cost]));
  const events: CostEvent[] = [];
  for (const cost of after) {
    const old = previous.get(cost.id);
    const oldMonthly = old ? monthlyCost(old.amount, old.frequency) : 0;
    const newMonthly = monthlyCost(cost.amount, cost.frequency);
    if (!old || Math.abs(oldMonthly - newMonthly) > 0.005) {
      events.push({ id: cost.id, name: cost.name, month: monthKey(today), kind: old ? "changed" : "added", previousMonthly: oldMonthly, monthly: newMonthly });
    }
  }
  for (const cost of before) {
    if (!next.has(cost.id)) {
      events.push({ id: cost.id, name: cost.name, month: monthKey(today), kind: "removed", previousMonthly: monthlyCost(cost.amount, cost.frequency), monthly: 0 });
    }
  }
  return events;
}

export function householdInsights(costs: HouseholdCost[], today = new Date()) {
  const summary = summarizeHouseholdCosts(costs, today);
  const next = paymentsForMonth(costs, monthKey(today, 1));
  const current = paymentsForMonth(costs, monthKey(today));
  const previous = paymentsForMonth(costs, monthKey(today, -1));
  const complete = costs.length > 0 && next.undatedCount === 0;
  const difference = next.total - summary.monthlyTotal;
  const drivers = next.payments
    .map(({ cost, date }) => ({ cost, date, extra: cost.amount - monthlyCost(cost.amount, cost.frequency) }))
    .filter(({ extra }) => extra > 0.01)
    .sort((a, b) => b.extra - a.extra);
  const reviewCandidates = costs
    .filter((cost) => ["subscriptions", "insurance", "energy", "mobility", "financing"].includes(cost.category))
    .map((cost) => ({ cost, yearly: annualCost(cost.amount, cost.frequency), nextDate: nextPaymentForCost(cost, today) }))
    .sort((a, b) => b.yearly - a.yearly)
    .slice(0, 3);

  return { summary, next, current, previous, complete, difference, drivers, reviewCandidates };
}
