"use client";

import { useState } from "react";
import { createSavingsPlan } from "@eavesence/core/savingsPlan";
import type { HouseholdCost } from "@/lib/householdCosts";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  currency: string;
  incomeMonthly: number;
  costs: HouseholdCost[];
  variableMonthly?: number | null;
  bufferMonthly?: number;
  goalMonthly?: number;
  onSave: (values: { variableMonthly: number | null; bufferMonthly: number; goalMonthly: number }) => void;
};

export default function SavingsPlanPanel({ locale, currency, incomeMonthly, costs, variableMonthly, bufferMonthly, goalMonthly, onSave }: Props) {
  const [variable, setVariable] = useState(variableMonthly == null ? "" : String(variableMonthly));
  const [buffer, setBuffer] = useState(String(bufferMonthly ?? 0));
  const [goal, setGoal] = useState(String(goalMonthly ?? 0));
  const [error, setError] = useState("");
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
    setError(""); onSave({ variableMonthly: nextVariable, bufferMonthly: nextBuffer, goalMonthly: nextGoal });
  }
  return <section id="savings-plan" className="mt-7 rounded-[1.45rem] border border-[#b8efcc] bg-[#eefbf3] p-5 sm:p-6">
    <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--brand-green)]">{de ? "PRO-VORSCHAU · KOSTENLOS TESTEN" : "PRO PREVIEW · FREE TO TRY"}</p>
    <h2 className="mt-2 text-xl font-extrabold">{de ? "Dein Sparplan für die nächsten 12 Monate" : "Your 12-month savings plan"}</h2>
    <p className="mt-1 text-[13px] text-[#52605b]">{de ? "Einkommen und feste Kosten übernehmen wir aus My Home. Ergänze einen groben Alltagsbetrag, Puffer und ein freiwilliges Sparziel." : "Your income and fixed costs come from My Home. Add an approximate everyday budget, buffer and optional savings goal."}</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {[[de ? "Alltagsausgaben / Monat" : "Everyday spending / month", variable, setVariable], [de ? "Puffer / Monat" : "Buffer / month", buffer, setBuffer], [de ? "Sparziel / Monat" : "Savings goal / month", goal, setGoal]].map(([label, value, setter]) => <label key={label as string} className="grid gap-1 text-[12px] font-semibold text-[#52605b]">{label as string}<input inputMode="decimal" value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="min-h-11 rounded-xl border border-[#cddbd0] bg-white px-3 text-[16px] text-[#17211f]" placeholder="0" /></label>)}
    </div>
    <button type="button" onClick={save} className="eavesence-pill-button home-primary-action mt-4">{de ? "Plan speichern" : "Save plan"}</button>
    {error && <p role="alert" className="mt-2 text-[12px] text-red-700">{error}</p>}
    {result && <>
      <div className="mt-5 rounded-xl bg-white p-4"><p className="text-[12px] text-[#52605b]">{result.complete ? de ? "Rechnerischer Spielraum / Monat" : "Estimated room / month" : de ? "Richtwert aus bisher erfassten Daten" : "Estimate from the data entered so far"}</p><p className="mt-1 text-2xl font-extrabold">{money(result.averageRoom)}</p><p className="mt-1 text-[12px] text-[#52605b]">{de ? `Feste Kosten: ${money(result.averageFixed)} / Monat. ${result.undatedCount} Kosten ohne Termin werden monatlich gemittelt. ${variableMonthly == null ? "Alltagsausgaben fehlen." : ""}` : `Fixed costs: ${money(result.averageFixed)} / month. ${result.undatedCount} undated costs use a monthly average. ${variableMonthly == null ? "Everyday spending is missing." : ""}`}</p></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">{result.months.map((item) => <div key={item.month} className={`rounded-xl border p-3 ${item.afterGoal < 0 ? "border-amber-300 bg-amber-50" : "border-[#dfe5dd] bg-white"}`}><p className="text-[12px] font-bold">{new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${item.month}-01T00:00:00Z`))}</p><p className="mt-1 text-[15px] font-extrabold">{money(item.remaining)}</p><p className="text-[11px] text-[#52605b]">{de ? "Rest vor Sparziel" : "Left before savings goal"}</p></div>)}</div>
      <p className="mt-3 text-[12px] text-[#52605b]">{de ? `${result.tightMonths.length} Monate liegen unter deinem Sparziel. Prognose auf Basis der heute erfassten Werte; keine garantierte Ersparnis.` : `${result.tightMonths.length} months fall below your savings goal. Forecast based on today's entries; savings are not guaranteed.`}</p>
      {result.actions.length > 0 && <div className="mt-4"><h3 className="text-[14px] font-bold">{de ? "Kosten prüfen" : "Costs to review"}</h3><ul className="mt-2 grid gap-2 sm:grid-cols-3">{result.actions.map((item) => <li key={item.id} className="rounded-xl bg-white p-3 text-[12px]">{item.name} · {money(item.annual)} {de ? "pro Jahr" : "per year"}<span className="mt-1 block text-[#52605b]">{de ? `10 % günstiger wären rechnerisch ${money(item.exampleAtTenPercent)} pro Jahr.` : `A 10% lower price would be ${money(item.exampleAtTenPercent)} less per year.`}</span>{item.deadline ? ` · ${de ? "Frist" : "Deadline"}: ${item.deadline}` : ""}</li>)}</ul></div>}
    </>}
  </section>;
}
