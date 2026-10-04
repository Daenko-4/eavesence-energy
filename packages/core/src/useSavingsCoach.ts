import { useRef, useState } from "react";
import { localToday, parseMoney, savingsToDate } from "./homeValue.ts";
import { readPlanningData, type PlanningData } from "./planning.ts";
import {
  createSavingsAction,
  compareSavingsActions,
  savingsReviewCandidates,
  type SavingsAction,
  type SavingsPlanInput,
} from "./savingsPlan.ts";
import { monthlyCost, type HouseholdCost } from "./householdCosts.ts";
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
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const saving = useRef(false);
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
      a.status === "planned" ? !input.costs.some(c => c.id === a.costId && c.amount === a.originalAmount && c.frequency === a.frequency) :
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
    if (saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      return true;
    } catch {
      setError(
        de
          ? "Speichern fehlgeschlagen oder Angaben inzwischen geändert. Bitte prüfen."
          : "Could not save or the entries have changed. Please review.",
      );
      return false;
    } finally {
      saving.current = false;
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
    if (selected && !input.costs.some(c => c.id === selected.id && c.updatedAt === selected.updatedAt)) {
      setError(de ? "Dieser Kostenposten wurde geändert. Wähle ihn erneut aus." : "This cost has changed. Select it again.");
      return;
    }
    const action = selected
      ? createSavingsAction(selected, parseMoney(amount, de ? "de" : "en"), effective)
      : null;
    if (!action) {
      setError(
        de
          ? "Neuen Betrag ab 0, kleiner als bisher, und gültigen Monat eingeben."
          : "Enter a non-negative amount lower than before and a valid month.",
      );
      return;
    }
    return run(async () => {
      await onActions([
        action,
        ...actions.filter((a) => a.costId !== action.costId),
      ]);
      setSelected(null);
      setNotice(de ? "Änderung vorgemerkt. Deine Kosten bleiben bis zur Bestätigung unverändert." : "Change planned. Your costs stay unchanged until you confirm it happened.");
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
  const candidate = selected ? createSavingsAction(selected, parseMoney(amount, de ? "de" : "en"), effective) : null;
  const preview = candidate ? compareSavingsActions(input, [candidate]) : null;
  return {
    notice,
    plannedMonthly: actions.filter(a => a.status === "planned" && !outdated.includes(a)).reduce((sum,a) => sum + monthlyCost(a.originalAmount-a.newAmount,a.frequency),0),
    confirmedMonthly: actions.filter(a => a.status === "confirmed" && !outdated.includes(a)).reduce((sum,a) => sum + monthlyCost(a.originalAmount-a.newAmount,a.frequency),0),
    preview,
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
    confirm: (a: SavingsAction) => run(async () => { await onConfirm(a); setNotice(de ? "Umsetzung bestätigt und laufende Kosten aktualisiert. Die Ersparnis findest du unter Erspart." : "Change confirmed and recurring costs updated. Find the savings under Saved."); }),
    discard: (a: SavingsAction) =>
      run(() => onActions(actions.filter((item) => item.costId !== a.costId))),
  };
}
