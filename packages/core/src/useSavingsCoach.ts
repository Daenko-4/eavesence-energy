import { useState } from "react";
import { localToday, parseMoney, savingsToDate } from "./homeValue.ts";
import { readPlanningData, type PlanningData } from "./planning.ts";
import {
  createSavingsAction,
  savingsReviewCandidates,
  type SavingsAction,
  type SavingsPlanInput,
} from "./savingsPlan.ts";
import type { HouseholdCost } from "./householdCosts.ts";
export function useSavingsCoach(
  input: SavingsPlanInput,
  actions: SavingsAction[],
  data: PlanningData | undefined,
  onSave: (data: PlanningData) => void | Promise<void>,
  onActions: (actions: SavingsAction[]) => void | Promise<void>,
  onConfirm: (action: SavingsAction) => void | Promise<void>,
  de: boolean,
) {
  const p = readPlanningData(data),
    today = localToday();
  const [selected, setSelected] = useState<HouseholdCost | null>(null),
    [amount, setAmount] = useState(""),
    [effective, setEffective] = useState(today.slice(0, 7)),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const tasks = savingsReviewCandidates(input.costs, today)
    .filter(
      (c) =>
        !actions.some((a) => a.costId === c.id) &&
        !p.reviews?.some(
          (r) =>
            r.costId === c.id &&
            r.updatedAt === c.updatedAt &&
            r.until >= today,
        ),
    )
    .slice(0, 3);
  const outdated = actions.filter(
    (a) =>
      a.status === "confirmed" &&
      !input.costs.some(
        (c) =>
          c.id === a.costId &&
          c.amount === a.newAmount &&
          c.frequency === a.frequency,
      ) &&
      !(a.newAmount === 0 && !input.costs.some((c) => c.id === a.costId)),
  );
  const totals = savingsToDate(
    actions.filter((a) => !outdated.includes(a)),
    today,
  );
  async function run(work: () => void | Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await work();
    } catch {
      setError(
        de
          ? "Speichern fehlgeschlagen oder Angaben inzwischen geändert. Bitte prüfen."
          : "Could not save or the entries have changed. Please review.",
      );
    } finally {
      setBusy(false);
    }
  }
  function choose(c: HouseholdCost) {
    setSelected(c);
    setAmount("");
    setEffective(today.slice(0, 7));
    setError("");
  }
  async function plan() {
    const action = selected
      ? createSavingsAction(selected, parseMoney(amount), effective)
      : null;
    if (!action) {
      setError(
        de
          ? "Neuen Betrag ab 0, kleiner als bisher, und gültigen Monat eingeben."
          : "Enter a non-negative amount lower than before and a valid month.",
      );
      return;
    }
    await run(async () => {
      await onActions([
        action,
        ...actions.filter((a) => a.costId !== action.costId),
      ]);
      setSelected(null);
    });
  }
  function later(c: HouseholdCost) {
    const until = new Date(Date.parse(today) + 30 * 86400000)
      .toISOString()
      .slice(0, 10);
    void run(() =>
      onSave({
        ...p,
        reviews: [
          ...(p.reviews ?? []).filter((r) => r.costId !== c.id),
          { costId: c.id, updatedAt: c.updatedAt, until },
        ],
      }),
    );
  }
  return {
    tasks,
    totals,
    outdated,
    selected,
    choose,
    amount,
    setAmount,
    effective,
    setEffective,
    error,
    busy,
    plan,
    later,
    today,
    cancel: () => setSelected(null),
    confirm: (a: SavingsAction) => run(() => onConfirm(a)),
    discard: (a: SavingsAction) =>
      run(() => onActions(actions.filter((item) => item.costId !== a.costId))),
  };
}
