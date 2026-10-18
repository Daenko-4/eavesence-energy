import { useRef, useState } from "react";
import { localToday, parseMoney, savingsToDate } from "./homeValue.ts";
import { readPlanningData, type PlanningData } from "./planning.ts";
import {
  createSavingsAction,
  upsertSavingsPlan,
  savingsActionKey,
  compareSavingsActions,
  savingsReviewCandidates,
  type SavingsAction,
  type SavingsPlanInput,
} from "./savingsPlan.ts";
import { monthlyCost, type HouseholdCost } from "./householdCosts.ts";
import { savingsPaydayImpact } from "./proValue.ts";
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
  const [detailsOpen, setDetailsOpen] = useState(false), [justConfirmed, setJustConfirmed] = useState(false);
  const saving = useRef(false);
  const tasks = savingsReviewCandidates(input.costs, today)
    .filter(
      (c) =>
        !actions.some((a) => a.costId === c.id && a.status === "planned") &&
        !p.reviews?.some(
          (r) =>
            r.costId === c.id &&
            r.updatedAt === c.updatedAt &&
            r.until >= today,
        ),
    )
    .slice(0, 3);
  const reviewable = input.costs.filter(c => !c.variableAmount);
  const outdated = actions.filter(a => a.status === "planned" && !reviewable.some(c => c.id === a.costId && c.amount === a.originalAmount && c.frequency === a.frequency && (c.nextDueDate || "") === (a.nextDueDate || "")));
  const totals = savingsToDate(actions, today);
  async function run(work: () => void | Promise<void>) {
    if (saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      return true;
    } catch (error) {
      setError(
        error instanceof Error && error.message === "ACTION_UNPAID_HISTORY"
          ? de ? "Prüfe vor dem Beenden die früheren Zahlungen dieser Ausgabe in My Home und hake bezahlte Rechnungen ab. Offene Rechnungen dürfen nicht verschwinden." : "Before ending this cost, review its earlier payments in My Home and check off paid bills. Unpaid bills must not disappear."
          : de
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
    if (!action || effective < today.slice(0,7) || actions.some(a=>a.costId===action.costId && a.status==="confirmed" && a.effectiveMonth>action.effectiveMonth)) {
      setError(
        de
          ? "Neuen Betrag ab 0, kleiner als bisher, und den aktuellen oder einen späteren Monat eingeben."
          : "Enter a non-negative amount lower than before and the current or a later month.",
      );
      return;
    }
    return run(async () => {
      await onActions(upsertSavingsPlan(actions, action));
      setSelected(null);
      setDetailsOpen(true);
      setJustConfirmed(false);
      setNotice(de ? "Vorhaben gespeichert. Sobald es umgesetzt ist, bestätige es unten. Bis dahin bleiben deine Kosten unverändert." : "Plan saved. Once it happens, confirm it below. Until then your costs stay unchanged.");
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
  const preview = candidate ? compareSavingsActions(input, [{...candidate, savingsFrom: today, excludedDates: [...(p.paidPayments ?? []), ...(p.actualPayments ?? [])].filter(row=>row.costId===candidate.costId && row.frequency===candidate.frequency && row.anchor===(candidate.nextDueDate||null)).flatMap(row=>row.date?[row.date]:[])}]) : null;
  return {
    detailsOpen, setDetailsOpen, justConfirmed, reviewable,
    cashImpact: candidate ? savingsPaydayImpact(input, p, candidate, today) : null,
    planned: actions.filter(a => a.status === "planned"),
    notice,
    plannedMonthly: actions.filter(a => a.status === "planned" && !outdated.includes(a)).reduce((sum,a) => sum + monthlyCost(a.originalAmount-a.newAmount,a.frequency),0),
    confirmedMonthly: actions.filter(a => a.status === "confirmed" && (!a.endedOn || a.endedOn > today)).reduce((sum,a) => sum + monthlyCost(a.originalAmount-a.newAmount,a.frequency),0),
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
    confirm: (a: SavingsAction) => run(async () => { await onConfirm(a); setJustConfirmed(true); setNotice(de ? "Umsetzung bestätigt, Kosten aktualisiert. Die Ersparnis zählt ab heute zu den passenden Zahlungsterminen; bereits bezahlte Rechnungen bleiben ausgenommen." : "Change confirmed, costs updated. Savings count from today on the relevant payment dates; bills already paid are excluded."); }),
    discard: (a: SavingsAction) =>
      run(() => onActions(actions.filter((item) => savingsActionKey(item) !== savingsActionKey(a)))),
  };
}
