"use client";

import {useEffect, useRef, useState} from "react";
import {parseIncomeAmount} from "@eavesence/core/income";
import {createHouseholdCost, monthlyCost, type HouseholdCost, type HouseholdCostFrequency} from "@/lib/householdCosts";
import type {Locale} from "@/i18n/config";
import type {SavedDeviceCurrency} from "@/lib/savedDevices";
import FormActions from "./FormActions";

// Keep this mounted when returning to income so the first-cost draft is retained.
export default function FirstMonthSetup({active, locale, currency, income, onBack, onComplete}: {
  active: boolean;
  locale: Locale;
  currency: SavedDeviceCurrency;
  income: number;
  onBack: () => void;
  onComplete: (cost: HouseholdCost | null) => void;
}) {
  const de = locale === "de";
  const t = (german: string, english: string) => de ? german : english;
  const [step, setStep] = useState<"cost" | "result">("cost");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<HouseholdCostFrequency>("monthly");
  const [date, setDate] = useState("");
  const [cost, setCost] = useState<HouseholdCost | null>(null);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (active) heading.current?.focus();
  }, [active, step]);
  const money = (value: number) => new Intl.NumberFormat(de ? "de-DE" : "en-GB", {style: "currency", currency}).format(value);
  const fixed = cost ? monthlyCost(cost.amount, cost.frequency) : 0;
  const left = income - fixed;
  const field = "home-field min-h-11 min-w-0 w-full rounded-xl border border-slate-300 bg-white px-3 text-[#17211f] focus:ring-2 focus:ring-[#72dca3]";
  const primary = "eavesence-pill-button home-primary-action";
  function preview() {
    const next = createHouseholdCost({name, amount: parseIncomeAmount(amount, locale), frequency, category: "other", nextDueDate: date});
    if (!next) {
      setError(t("Trage eine Bezeichnung und einen Betrag größer als 0 ein. Prüfe auch den Zahlungstermin, falls angegeben.", "Enter a name and an amount greater than 0. Check the payment date if provided."));
      return;
    }
    setCost(next); setError(""); setStep("result");
  }
  return <div hidden={!active} data-first-month-setup={step}>
    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-green)]">{t("Dein erster Monatsüberblick", "Your first monthly overview")}</p>
    <h1 ref={heading} tabIndex={-1} className="mt-3 text-2xl font-extrabold tracking-tight outline-none sm:text-3xl">{step === "cost" ? t("Was zahlst du regelmäßig?", "What do you pay regularly?") : t("Das bleibt vorläufig übrig", "What is left so far")}</h1>
    <ol className="home-setup-steps" aria-label={t("Deine ersten Schritte", "Your first steps")}>
      <li>1 · {t("Einkommen", "Income")}</li><li aria-current={step === "cost" ? "step" : undefined}>2 · {t("Erste Kosten", "First costs")}</li><li aria-current={step === "result" ? "step" : undefined}>3 · {t("Überblick", "Overview")}</li>
    </ol>
    {step === "cost" ? <form className="mt-5 grid gap-4" onSubmit={event => {event.preventDefault(); preview();}}>
      <p className="text-sm leading-6 text-[#65716d]">{t("Starte mit einer Fixausgabe, zum Beispiel Miete. Weitere Kosten ergänzt du danach.", "Start with one fixed cost, such as rent. You can add more costs afterwards.")}</p>
      <label className="grid gap-2 text-sm font-semibold">{t("Bezeichnung", "Cost name")}<input className={field} value={name} onChange={event => {setName(event.target.value);setError("");}} placeholder={t("z. B. Miete", "e.g. Rent")} autoComplete="off" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">{t("Betrag", "Amount")} ({currency})<input className={field} inputMode="decimal" value={amount} onChange={event => {setAmount(event.target.value);setError("");}} placeholder={de ? "850,00" : "850.00"} /></label>
        <label className="grid gap-2 text-sm font-semibold">{t("Wie oft?", "How often?")}<select aria-label={t("Wie oft?", "How often?")} className={field} value={frequency} onChange={event => setFrequency(event.target.value as HouseholdCostFrequency)}>
          {([ ["weekly", "Wöchentlich", "Weekly"], ["monthly", "Monatlich", "Monthly"], ["quarterly", "Vierteljährlich", "Quarterly"], ["half-yearly", "Halbjährlich", "Half-yearly"], ["yearly", "Jährlich", "Yearly"] ] as const).map(([value,german,english]) => <option key={value} value={value}>{t(german,english)}</option>)}
        </select></label>
      </div>
      <details className="home-disclosure"><summary>{t("Zahlungstermin ergänzen (optional)", "Add payment date (optional)")}</summary><label className="mt-3 grid gap-2 text-sm font-semibold">{t("Nächster Zahlungstermin", "Next payment date")}<input type="date" className={field} value={date} onChange={event => setDate(event.target.value)} /></label></details>
      <FormActions><button type="submit" className={primary}>{t("Vorläufiges Ergebnis anzeigen", "Show provisional result")}</button><button type="button" className="eavesence-pill-button" onClick={() => {setError("");onBack();}}>{t("Zurück zum Einkommen", "Back to income")}</button></FormActions>
      <button type="button" className="min-h-11 justify-self-start text-sm text-[#52605b] underline underline-offset-4" onClick={() => {setCost(null);setError("");setStep("result");}}>{t("Kosten später ergänzen", "Add costs later")}</button>
    </form> : <div className="mt-5">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-setup-result>
        <div className="rounded-xl border border-[#dde2d8] bg-white p-3 sm:p-4"><dt className="text-xs text-[#52605b]">{t("Nettoeinkommen / Monat", "Net income / month")}</dt><dd className="mt-2 break-words text-base font-bold tabular-nums sm:text-xl">{money(income)}</dd></div>
        <div className="rounded-xl border border-[#dde2d8] bg-white p-3 sm:p-4"><dt className="text-xs text-[#52605b]">{t("Erfasste Kosten / Monat", "Recorded costs / month")}</dt><dd className="mt-2 break-words text-base font-bold tabular-nums sm:text-xl">{money(fixed)}</dd></div>
        <div className={`col-span-2 rounded-xl p-4 sm:col-span-1 ${left < 0 ? "bg-amber-100 text-amber-900" : "bg-[#e0f1e4] text-[#087a45]"}`}><dt className="text-xs font-semibold">{left < 0 ? t("Fehlbetrag / Monat", "Monthly shortfall") : t("Vorläufig übrig / Monat", "Left so far / month")}</dt><dd className="mt-2 text-2xl font-extrabold tabular-nums">{money(left)}</dd></div>
      </dl>
      <p className="mt-4 text-sm leading-6 text-[#52605b]">{cost ? t(`Bisher erfasst: ${cost.name}.`, `Recorded so far: ${cost.name}.`) : t("Noch keine Kosten erfasst.", "No costs recorded yet.")} {t("Weitere Fixkosten, Lebensmittel und Freizeit gehen davon noch ab. Das ist noch kein frei verfügbares Budget.", "Other fixed costs, groceries and leisure still come out of this amount. This is not yet your spending budget.")}</p>
      {cost && cost.frequency !== "monthly" && <p className="mt-2 text-xs leading-5 text-[#65716d]">{t("Für den Monatsüberblick wird diese Ausgabe auf einen Monatsdurchschnitt umgerechnet.", "This cost is converted to a monthly average for the overview.")}</p>}
      <FormActions className="mt-5"><button type="button" className={primary} onClick={() => {try {onComplete(cost);} catch {setError(t("Speichern fehlgeschlagen. Deine Eingaben bleiben erhalten. Versuche es erneut.", "Could not save. Your entries have been kept. Try again."));}}}>{t("Übersicht speichern und öffnen", "Save and open overview")}</button><button type="button" className="eavesence-pill-button" onClick={() => {setError("");setStep("cost");}}>{t("Kosten ändern", "Change cost")}</button></FormActions>
    </div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <p className="mt-4 text-xs text-[#65716d]">{t("Gespeichert wird erst mit „Übersicht speichern und öffnen“ – nur in diesem Browser.", "Saved only when you choose “Save and open overview” — in this browser only.")}</p>
  </div>;
}
