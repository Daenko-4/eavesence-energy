"use client";

import SavingsCoach from '@/components/SavingsCoach';
import PlanningWorkbench from "@/components/PlanningWorkbench";
import type { PlanningData } from "@eavesence/core/planning";
import { useState } from "react";
import { createSavingsPlan, type SavingsAction } from "@eavesence/core/savingsPlan";
import type { HouseholdCost } from "@/lib/householdCosts";
import type { Locale } from "@/i18n/config";
import SavingsActionsPanel from "@/components/SavingsActionsPanel";

type Props = {
  section?: "savings" | "progress";
  advanced?: boolean;
  locale: Locale;
  currency: string;
  incomeMonthly: number;
  costs: HouseholdCost[];
  variableMonthly?: number | null;
  bufferMonthly?: number;
  goalMonthly?: number;
  actions?: SavingsAction[];
  planning?: PlanningData;
  onSavePlanning: (data: PlanningData) => void;
  onEditCosts: () => void;
  onEditIncome: () => void;
  onSave: (values: { variableMonthly: number | null; bufferMonthly: number; goalMonthly: number }) => void;
  onConfirmAction: (action: SavingsAction) => void;
  onReviewCost: (cost: HouseholdCost) => void;
  onSaveActions: (actions: SavingsAction[]) => void;
};

export default function SavingsPlanPanel({ section, advanced = true, locale, currency, incomeMonthly, costs, variableMonthly, bufferMonthly, goalMonthly, actions = [], planning, onSavePlanning, onEditCosts, onEditIncome, onSave, onSaveActions, onConfirmAction, onReviewCost }: Props) {
  const [variable, setVariable] = useState(variableMonthly == null ? "" : String(variableMonthly));
  const [buffer, setBuffer] = useState(String(bufferMonthly ?? 0));
  const [goal, setGoal] = useState(String(goalMonthly ?? 0));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [budgetOpen, setBudgetOpen] = useState(false);
  const de = locale === "de";
  const money = (value: number) => new Intl.NumberFormat(de ? "de-AT" : "en-GB", { style: "currency", currency }).format(value);
  const date = new Date();
  const startMonth = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 1)).toISOString().slice(0, 7);
  const result = createSavingsPlan({ incomeMonthly, variableMonthly: variableMonthly ?? null, bufferMonthly: bufferMonthly ?? 0, goalMonthly: goalMonthly ?? 0, costs, startMonth });
  function save() {
    const parse = (value: string) => Number(value.trim().replace(",", "."));
    const nextVariable = variable.trim() === "" ? null : parse(variable);
    const nextBuffer = parse(buffer || "0");
    const nextGoal = parse(goal || "0");
    if ([nextBuffer, nextGoal, ...(nextVariable === null ? [] : [nextVariable])].some((value) => !Number.isFinite(value) || value < 0)) {
      setError(de ? "Bitte nur Beträge ab 0 eingeben." : "Enter amounts of 0 or more."); return;
    }
    setError(""); onSave({ variableMonthly: nextVariable, bufferMonthly: nextBuffer, goalMonthly: nextGoal }); setNotice(de ? "Sparplan gespeichert." : "Savings plan saved.");
  }
  if (section === "progress") return <section className="mt-5"><SavingsCoach mode="progress" locale={locale} currency={currency} input={{incomeMonthly,variableMonthly:variableMonthly??null,bufferMonthly:bufferMonthly??0,goalMonthly:goalMonthly??0,costs,startMonth}} data={planning} actions={actions} onSave={onSavePlanning} onActions={onSaveActions} onConfirm={onConfirmAction} onReview={onReviewCost}/></section>;
  return <section id="savings-plan" className="mt-7 rounded-[1.45rem] border border-[#b8efcc] bg-[#eefbf3] p-5 sm:p-6">
    {section && <><h2 className="site-section-title">{de ? "Wo lohnt sich eine Änderung?" : "Where could a change help?"}</h2><p className="mt-2 text-[13px] leading-6 text-[#52605b]">{de ? "Prüfe einen Kostenposten, plane eine konkrete Änderung und bestätige sie erst, wenn sie umgesetzt ist." : "Review one cost, plan a specific change and confirm it only after it happens."}</p><button type="button" className="eavesence-pill-button home-dashboard-action mt-3" aria-expanded={budgetOpen} onClick={() => setBudgetOpen(!budgetOpen)}>{de ? "Monatsbudget ergänzen (optional)" : "Add a monthly budget (optional)"}</button></>}
    <div hidden={!!section && !budgetOpen}>
    <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--brand-green)]">{de ? "PRO-VORSCHAU · KOSTENLOS TESTEN" : "PRO PREVIEW · FREE TO TRY"}</p>
    <h2 className="mt-2 text-xl font-extrabold">{de ? "Deine monatliche Planungsbasis" : "Your monthly planning basics"}</h2>
    <p className="mt-1 text-[13px] text-[#52605b]">{de ? "Einkommen und Fixkosten sind schon übernommen. Schätze noch deine übrigen Alltagsausgaben – daraus berechnen wir, was dir im Monat bleibt." : "Income and fixed costs are already included. Estimate your other everyday spending to see what is left each month."}</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {[[de ? "Alltagsausgaben pro Monat (geschätzt)" : "Everyday spending per month (estimate)", variable, setVariable], [de ? "Gewünschter Sparbetrag pro Monat (optional)" : "Desired savings per month (optional)", goal, setGoal]].map(([label, value, setter], index) => <label key={label as string} className="grid gap-1 text-[12px] font-semibold text-[#52605b]">{label as string}<input id={index === 0 ? "savings-budget-input" : undefined} inputMode="decimal" value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="home-planning-field min-h-11 rounded-xl border border-[#cddbd0] bg-white px-3 text-[16px] text-[#17211f]" placeholder={index === 0 ? de ? "z. B. 500" : "e.g. 500" : "0"} /><span className="font-normal">{index === 0 ? de ? "Zum Beispiel Lebensmittel und Freizeit. Nur Ausgaben, die noch nicht in deinen Fixkosten stehen." : "For example groceries and leisure. Only spending not already in your fixed costs." : de ? "Geld, das du vom verbleibenden Budget zurücklegen möchtest – nachdem Fixkosten und Alltagsausgaben bezahlt sind." : "Money you want to set aside from what is left after fixed costs and everyday spending."}</span></label>)}
    </div>
    <details open={(bufferMonthly ?? 0) > 0} className="home-disclosure mt-3 text-[12px] text-[#52605b]"><summary className="cursor-pointer font-semibold">{de ? "Erweiterte Optionen: freiwillige Reserve" : "More options: optional reserve"}</summary><p className="mt-2">{de ? "Möchtest du zusätzlich Geld unberührt lassen? Dieser selbst gewählte Betrag wird vom Spielraum abgezogen. Jahresrechnungen sind bereits in den Fixkosten enthalten." : "Want to keep an extra amount untouched? This amount is deducted from what is left. Annual bills are already included in fixed costs."}</p><label className="mt-2 grid max-w-xs gap-1 font-semibold">{de ? "Freiwillige Reserve pro Monat" : "Optional reserve per month"}<input inputMode="decimal" value={buffer} onChange={(event) => setBuffer(event.target.value)} className="home-planning-field min-h-11 rounded-xl border border-[#cddbd0] bg-white px-3 text-[16px] text-[#17211f]" placeholder="0" /></label></details>
    <button type="button" onClick={save} className="eavesence-pill-button home-primary-action mt-4">{de ? "Plan speichern" : "Save plan"}</button>
    {notice && <p role="status" className="mt-2 text-[12px] font-semibold text-[#087a45]">{notice}</p>}
    {error && <p role="alert" className="mt-2 text-[12px] text-red-700">{error}</p>}
    {result && <>
      <div className="mt-5 rounded-xl bg-white p-4">
        <h3 className="site-card-title">{de ? "So rechnen wir pro Monat" : "Your monthly calculation"}</h3>
        <dl className="mt-3 space-y-2 text-[13px] text-[#52605b]">
          <div className="flex justify-between gap-3"><dt>{de ? "Nettoeinkommen" : "Net income"}</dt><dd>{incomeMonthly > 0 ? money(incomeMonthly) : de ? "Noch nicht eingetragen" : "Not entered yet"}</dd></div>
          <div className="flex justify-between gap-3"><dt>{de ? "− Fixkosten (Monatsdurchschnitt)" : "− Fixed costs (monthly average)"}</dt><dd>{money(result.averageFixed)}</dd></div>
          <div className="flex justify-between gap-3"><dt>{de ? "− Alltag (deine Schätzung)" : "− Everyday spending (your estimate)"}</dt><dd>{variableMonthly == null ? de ? "Noch offen" : "Not estimated yet" : money(variableMonthly)}</dd></div>
          {(bufferMonthly ?? 0) > 0 && <div className="flex justify-between gap-3"><dt>{de ? "− Freiwillige Reserve" : "− Optional reserve"}</dt><dd>{money(bufferMonthly ?? 0)}</dd></div>}
        </dl>
        <div className="mt-3 border-t border-[#dfe5dd] pt-3"><p className="text-[12px] text-[#52605b]">{variableMonthly == null ? (bufferMonthly ?? 0) > 0 ? de ? "Rest nach Fixkosten und Reserve" : "Left after fixed costs and reserve" : de ? "Rest nach Fixkosten" : "Left after fixed costs" : de ? "Verbleibender Spielraum (geschätzt)" : "Estimated amount left"}</p><p className="mt-1 text-xl font-extrabold">{incomeMonthly > 0 ? money(result.averageRoom) : "—"}</p></div>
        <p className="mt-2 text-[12px] text-[#52605b]">{incomeMonthly <= 0 ? de ? "Trage dein Einkommen in My Home ein, damit wir den Spielraum berechnen können." : "Add your income in My Home to calculate what is left." : variableMonthly == null ? de ? "Davon gehen deine Alltagsausgaben noch ab. Dieser Rest ist noch kein Sparbetrag." : "Everyday spending still comes out of this amount. It is not a savings amount yet." : de ? "Deine Schätzung kann von den tatsächlichen Ausgaben abweichen." : "Your estimate may differ from actual spending."}</p>
        {incomeMonthly > 0 && variableMonthly != null && (goalMonthly ?? 0) > 0 && <p className="mt-2 text-[12px] font-semibold text-[#17211f]">{de ? `Du möchtest pro Monat ${money(goalMonthly ?? 0)} zurücklegen. Nach dem Zurücklegen bleiben ${money(result.averageRoom - (goalMonthly ?? 0))}.` : `You want to set aside ${money(goalMonthly ?? 0)} each month. After setting it aside, you have ${money(result.averageRoom - (goalMonthly ?? 0))}.`}</p>}
        <p className="mt-2 text-[11px] text-[#52605b]">{de ? "Jahres- und andere unregelmäßige Rechnungen sind im Fixkosten-Durchschnitt enthalten. Im Zahlungsmonat kann der Rest niedriger sein." : "Annual and other less frequent bills are included in the fixed-cost average. The amount left may be lower when a bill is due."}</p>
      </div>
      <details className="home-disclosure mt-4 text-[12px] text-[#52605b]"><summary className="cursor-pointer font-bold">{de ? "12 Monate ansehen" : "View 12 months"}</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">{result.months.map((item) => <div key={item.month} className={`rounded-xl border p-3 ${item.afterGoal < 0 ? "border-amber-300 bg-amber-50" : "border-[#dfe5dd] bg-white"}`}><p className="text-[12px] font-bold">{new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${item.month}-01T00:00:00Z`))}</p><p className="mt-1 text-[15px] font-extrabold">{incomeMonthly > 0 ? money(item.remaining) : "—"}</p><p className="text-[11px] text-[#52605b]">{variableMonthly == null ? de ? "Alltagsausgaben fehlen noch" : "Everyday spending still missing" : de ? "Rest vor Sparziel" : "Left before savings goal"}</p></div>)}</div>
        <p className="mt-3">{de ? `${result.undatedCount} Kosten ohne Termin werden monatlich gemittelt. Die Monatswerte sind eine Vorschau mit deinen heutigen Angaben.` : `${result.undatedCount} undated costs use a monthly average. These monthly figures are a forecast based on your current entries.`}</p>
      </details>

    </>}
    </div>
    {result && <>
      <SavingsCoach mode="opportunities" locale={locale} currency={currency} input={{incomeMonthly,variableMonthly:variableMonthly??null,bufferMonthly:bufferMonthly??0,goalMonthly:goalMonthly??0,costs,startMonth}} data={planning} actions={actions} onSave={onSavePlanning} onActions={onSaveActions} onConfirm={onConfirmAction} onReview={onReviewCost}/>
      {!section && <SavingsCoach mode="progress" locale={locale} currency={currency} input={{incomeMonthly,variableMonthly:variableMonthly??null,bufferMonthly:bufferMonthly??0,goalMonthly:goalMonthly??0,costs,startMonth}} data={planning} actions={actions} onSave={onSavePlanning} onActions={onSaveActions} onConfirm={onConfirmAction} onReview={onReviewCost}/>}
      {section === "savings" && <SavingsActionsPanel embedded locale={locale} currency={currency} input={{incomeMonthly,variableMonthly:variableMonthly??null,bufferMonthly:bufferMonthly??0,goalMonthly:goalMonthly??0,costs,startMonth}} actions={actions} onChange={onSaveActions} onConfirm={onConfirmAction} />}
      {advanced && <PlanningWorkbench input={{ incomeMonthly, variableMonthly: variableMonthly ?? null, bufferMonthly: bufferMonthly ?? 0, goalMonthly: goalMonthly ?? 0, costs, startMonth }} data={planning} onSave={onSavePlanning} locale={locale} currency={currency} onEditCosts={onEditCosts} onEditIncome={onEditIncome} onEditBudget={() => document.getElementById("savings-budget-input")?.focus()} costChange={<SavingsActionsPanel embedded locale={locale} currency={currency} input={{ incomeMonthly, variableMonthly: variableMonthly ?? null, bufferMonthly: bufferMonthly ?? 0, goalMonthly: goalMonthly ?? 0, costs, startMonth }} actions={actions} onChange={onSaveActions} onConfirm={onConfirmAction} />} />}
    </>}
  </section>;
}
