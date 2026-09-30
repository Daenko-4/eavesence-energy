"use client";

import { useState } from "react";
import { compareSavingsActions, createSavingsAction, savingsReviewCandidates, type SavingsAction, type SavingsPlanInput } from "@eavesence/core/savingsPlan";
import { monthlyCost, type HouseholdCostFrequency } from "@eavesence/core/householdCosts";
import type { Locale } from "@/i18n/config";

export default function SavingsActionsPanel({ locale, currency, input, actions, onChange }: {
  locale: Locale;
  currency: string;
  input: SavingsPlanInput;
  actions: SavingsAction[];
  onChange: (actions: SavingsAction[]) => void;
}) {
  const de = locale === "de";
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const suggested = savingsReviewCandidates(input.costs, today)[0];
  const [costId, setCostId] = useState(suggested?.id ?? input.costs[0]?.id ?? "");
  const [mode, setMode] = useState<"reduce" | "stop">("reduce");
  const [amount, setAmount] = useState("");
  const [effectiveMonth, setEffectiveMonth] = useState(input.startMonth);
  const [error, setError] = useState("");
  const selected = input.costs.find((cost) => cost.id === costId) ?? input.costs[0];
  const cadence = (frequency: HouseholdCostFrequency) => (de ? { weekly: "pro Woche", monthly: "pro Monat", quarterly: "alle 3 Monate", "half-yearly": "alle 6 Monate", yearly: "pro Jahr" } : { weekly: "per week", monthly: "per month", quarterly: "every 3 months", "half-yearly": "every 6 months", yearly: "per year" })[frequency];
  const target = mode === "stop" ? 0 : Number(amount.trim().replace(",", "."));
  const draft = selected && (mode === "stop" || amount.trim()) ? createSavingsAction(selected, target, effectiveMonth) : null;
  const preview = draft ? compareSavingsActions(input, [draft]) : null;
  const combined = compareSavingsActions(input, actions);
  const money = (value: number) => new Intl.NumberFormat(de ? "de-AT" : "en-GB", { style: "currency", currency }).format(value);
  const month = (value: string) => new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T00:00:00Z`));
  const currentMonth = today.slice(0, 7);
  const confirmedAnnual = actions.filter((action) => action.status === "confirmed" &&
    (input.costs.some((cost) => cost.id === action.costId && (cost.amount === action.originalAmount || cost.amount === action.newAmount)) ||
      (action.newAmount === 0 && !input.costs.some((cost) => cost.id === action.costId))))
    .reduce((sum, action) => sum + monthlyCost(action.originalAmount - action.newAmount, action.frequency) * 12, 0);
  const months = Array.from({ length: 12 }, (_, index) => {
    const [year, number] = input.startMonth.split("-").map(Number);
    return new Date(Date.UTC(year, number - 1 + index, 1)).toISOString().slice(0, 7);
  });

  function save() {
    if (!draft) { setError(de ? "Wähle einen kleineren Betrag als bisher." : "Choose an amount lower than the current cost."); return; }
    onChange([draft, ...actions.filter((action) => action.costId !== draft.costId)]);
    setError(""); setAmount("");
  }

  return <div className="mt-5 rounded-xl border border-[#cddbd0] bg-white p-4">
    <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--brand-green)]">{de ? "DEIN NÄCHSTER SCHRITT" : "YOUR NEXT STEP"}</p>
    <h3 className="mt-1 text-[17px] font-extrabold">{de ? "Was wäre, wenn du weniger zahlst?" : "What if you paid less?"}</h3>
    <p className="mt-1 text-[12px] leading-5 text-[#52605b]">{de ? "Teste eine günstigere Ausgabe oder eine Kündigung. Wir zeigen dir die mögliche Ersparnis. Deine eingetragenen Kosten werden dabei nicht geändert." : "Try a lower cost or a cancellation to see the possible saving. Your recorded costs stay the same."}</p>
    {suggested && <p className="mt-3 text-[12px] text-[#52605b]">{de ? "Vorschlag zum Start" : "Suggested starting point"}: <strong>{suggested.name}</strong>.</p>}
    {input.costs.length > 0 ? <>
      <label className="mt-4 grid gap-1 text-[12px] font-semibold text-[#52605b]">{de ? "1. Welche Ausgabe?" : "1. Which cost?"}<select value={selected?.id ?? ""} onChange={(event) => { setCostId(event.target.value); setAmount(""); }} className="min-h-11 rounded-xl border border-[#cddbd0] bg-white px-3 text-[15px] text-[#17211f]">{input.costs.map((cost) => <option key={cost.id} value={cost.id}>{cost.name} · {money(cost.amount)} {cadence(cost.frequency)}</option>)}</select></label>
      <p className="mt-3 text-[12px] font-semibold text-[#52605b]">{de ? "2. Wie möchtest du sparen?" : "2. How would you save?"}</p>
      <div className="mt-2 flex flex-wrap gap-2">{(["reduce", "stop"] as const).map((value) => <button type="button" key={value} onClick={() => setMode(value)} aria-pressed={mode === value} className={`rounded-full px-3 py-2 text-[12px] font-bold ${mode === value ? "bg-[#087a45] text-white" : "bg-[#eefbf3] text-[#087a45]"}`}>{value === "reduce" ? de ? "Günstiger zahlen" : "Pay less" : de ? "Ausgabe beenden" : "End this cost"}</button>)}</div>
      {mode === "reduce" && <label className="mt-3 grid max-w-sm gap-1 text-[12px] font-semibold text-[#52605b]">{de ? `Neuer Betrag ${selected ? cadence(selected.frequency) : ""}` : `New amount ${selected ? cadence(selected.frequency) : ""}`}<input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={de ? "z. B. 25" : "e.g. 25"} className="min-h-11 rounded-xl border border-[#cddbd0] bg-white px-3 text-[16px] text-[#17211f]" /></label>}
      <label className="mt-3 grid max-w-sm gap-1 text-[12px] font-semibold text-[#52605b]">{de ? "3. Ab welchem Monat zahlst du weniger?" : "3. From which month will you pay less?"}<select value={effectiveMonth} onChange={(event) => setEffectiveMonth(event.target.value)} className="min-h-11 rounded-xl border border-[#cddbd0] bg-white px-3 text-[15px] text-[#17211f]">{months.map((value) => <option key={value} value={value}>{month(value)}</option>)}</select></label>
      <p className="mt-2 text-[11px] text-[#52605b]">{de ? "Wähle den Monat, ab dem der neue Preis gilt oder die Kündigung wirksam ist." : "Choose the month when the new price or cancellation takes effect."}</p>
      {selected?.cancellationDeadline && <p className="mt-3 text-[12px] font-semibold text-amber-800">{de ? "Eingetragene Kündigungsfrist" : "Saved cancellation deadline"}: {selected.cancellationDeadline.split("-").reverse().join(".")}{selected.cancellationDeadline < today ? de ? " · bereits vergangen – Vertrag prüfen" : " · passed – check the contract" : ""}</p>}
      {preview && selected && <div className="mt-3 rounded-xl bg-[#eefbf3] p-4 text-[#17211f]">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]"><p>{de ? "Bisher" : "Before"}: <strong>{money(selected.amount)}</strong> {cadence(selected.frequency)}</p><p>{de ? "Danach" : "After"}: <strong>{money(target)}</strong> {cadence(selected.frequency)}</p></div>
        <p className="mt-3 text-[12px]">{de ? "Weniger Ausgaben in den nächsten 12 Monaten" : "Lower spending over the next 12 months"}</p><p className="mt-1 text-2xl font-extrabold">{money(preview.totalDifference)}</p>
        <p className="mt-2 text-[12px]">{preview.firstBenefitMonth ? `${de ? "Erste niedrigere Zahlung" : "First lower payment"}: ${month(preview.firstBenefitMonth)}.` : de ? "Im angezeigten Zeitraum wird noch keine Zahlung günstiger." : "No payment changes within the period shown."}</p>
      </div>}
      <button type="button" onClick={save} className="eavesence-pill-button home-primary-action mt-3">{de ? "Änderung vormerken" : "Save this plan"}</button>
      {error && <p role="alert" className="mt-2 text-[12px] text-red-700">{error}</p>}
    </> : <p className="mt-3 text-[12px] text-[#52605b]">{de ? "Erfasse zuerst eine regelmäßige Ausgabe." : "Add a recurring cost first."}</p>}
    {actions.length > 0 && <div className="mt-5 border-t border-[#dfe5dd] pt-4"><h4 className="text-[14px] font-extrabold">{de ? "Deine Vorhaben" : "Your plans"}</h4><div className="mt-2 grid gap-2">{actions.map((action) => {
      const cost = input.costs.find((item) => item.id === action.costId);
      const impact = compareSavingsActions(input, [action]);
      const applied = cost?.amount === action.newAmount || (!cost && action.newAmount === 0);
      const changed = !applied && (!cost || cost.amount !== action.originalAmount);
      const due = cost?.cancellationDeadline;
      const soon = due && due >= today && due <= new Date(Date.parse(`${today}T00:00:00Z`) + 30 * 86_400_000).toISOString().slice(0, 10);
      return <div key={action.costId} className="rounded-xl bg-[#f4f6f2] p-3 text-[12px]">
        <p className="font-bold text-[#17211f]">{cost?.name ?? action.name} · {action.newAmount === 0 ? de ? "beenden" : "end" : `${money(action.originalAmount)} → ${money(action.newAmount)}`} · {month(action.effectiveMonth)}</p>
        <p className="mt-1 text-[#52605b]">{changed ? de ? "Ausgabe wurde geändert. Bitte Szenario prüfen oder entfernen." : "Cost changed. Review or remove this scenario." : `${applied ? de ? "Änderung bereits in deinen Kosten erfasst" : "Change already reflected in your costs" : `${de ? "Zusätzliche Wirkung in 12 Monaten" : "Additional impact over 12 months"}: ${money(impact?.totalDifference ?? 0)}`} · ${action.status === "confirmed" ? de ? "von dir als umgesetzt bestätigt" : "marked done by you" : action.effectiveMonth <= currentMonth ? de ? "Check-in: Hat sich der Betrag wirklich geändert?" : "Check-in: Did the amount actually change?" : de ? "geplant, noch nicht umgesetzt" : "planned, not yet done"}`}{soon ? ` · ${de ? "Frist bald" : "Deadline soon"}: ${due.split("-").reverse().join(".")}` : ""}</p>
        <div className="mt-2 flex flex-wrap gap-3">{!changed && action.status === "planned" && action.effectiveMonth <= currentMonth && <button type="button" className="font-bold text-[#087a45]" onClick={() => onChange(actions.map((item) => item.costId === action.costId ? { ...item, status: "confirmed", confirmedAt: new Date().toISOString() } : item))}>{de ? "Als umgesetzt markieren" : "Mark as done"}</button>}{action.status === "confirmed" && <button type="button" className="font-bold text-[#087a45]" onClick={() => onChange(actions.map((item) => item.costId === action.costId ? { ...item, status: "planned", confirmedAt: undefined } : item))}>{de ? "Status korrigieren" : "Correct status"}</button>}<button type="button" className="font-semibold text-[#52605b]" onClick={() => onChange(actions.filter((item) => item.costId !== action.costId))}>{de ? "Entfernen" : "Remove"}</button></div>
      </div>;
    })}</div><p className="mt-3 text-[12px] text-[#52605b]">{de ? `Mögliche Wirkung aller Vorhaben in 12 Monaten: ${money(combined?.totalDifference ?? 0)}. Von dir bestätigte Änderungen, aufs Jahr gerechnet: ${money(confirmedAnnual)}. Keine Prüfung anhand von Kontobelegen.` : `Possible impact of all plans over 12 months: ${money(combined?.totalDifference ?? 0)}. Changes you marked done, annualized: ${money(confirmedAnnual)}. No bank transaction verification.`}</p></div>}
  </div>;
}
