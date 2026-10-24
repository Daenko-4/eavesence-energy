"use client";
import { shiftPlanningMonth } from "@eavesence/core/planning";
import { localToday } from "@eavesence/core/homeValue";
import FormActions from "@/components/FormActions";

import { type ReactNode } from "react";
import type { HomeSection } from "./HomeSectionNavigation";
import type { Locale } from "@/i18n/config";
import type { MonthlyOutlook } from "@eavesence/core/monthlyOutlook";

type Props = {
  hasVariableCosts?: boolean;
  incomeIsAverage?: boolean;
  incomeProvided?: boolean;
  incomeDeferred?: boolean; onSkipIncome?: () => void;
  needsReview?: boolean; onFinishReview?: () => void;
  onReviewCost?: (id: string) => void;
  locale: Locale; currency: string; income: number; fixed: number; count: number;
  outlook: MonthlyOutlook; incomeInformation?: ReactNode;
  onMonthChange:(month:string)=>void; onPlan:()=>void;
  incomeOpen: boolean; onIncome: () => void; onCost: () => void;
  activeSection: HomeSection | null; incomeForm: ReactNode;
};
export default function HomeCoreOverview({ incomeProvided, incomeDeferred = false, onSkipIncome, needsReview = false, onFinishReview, onReviewCost, incomeIsAverage = false, hasVariableCosts = false, locale, currency, income, fixed, count, outlook, incomeInformation, onMonthChange, onPlan, incomeOpen, onIncome, onCost, activeSection, incomeForm }: Props) {
  const de = locale === "de";
  const money = (n: number) => new Intl.NumberFormat(de ? "de-AT" : "en-GB", { style: "currency", currency }).format(n);
  const needsIncome = !(incomeProvided ?? income > 0) && !incomeDeferred;
  const hasIncome = incomeProvided ?? income > 0;
  const deficit = hasIncome && fixed > income;
  const cards = [
    { label: incomeIsAverage ? de ? "Nettoeinkommen · Monatsdurchschnitt" : "Net income · monthly average" : de ? "Reguläres Monatsnetto" : "Regular monthly net income", value: hasIncome ? money(income) : "—" },
    { label: de ? "Fixkosten pro Monat" : "Recurring costs / month", value: `${hasVariableCosts?(de?"ca. ":"approx. "):""}${money(fixed)}` },
    { label: incomeIsAverage ? de ? "Rest nach Fixkosten · Durchschnitt" : "Left after fixed costs · average" : de ? "Rest nach Fixkosten" : "Left after fixed costs", value: hasIncome && count > 0 ? `${hasVariableCosts?(de?"ca. ":"approx. "):""}${money(income-fixed)}` : "—", emphasis: true },
  ];
  const monthDate = new Date(`${outlook.month}-01T00:00:00Z`);
  const monthLabel = new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", {month:"long",year:"numeric",timeZone:"UTC"}).format(monthDate);
  const monthName = new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", {month:"long",timeZone:"UTC"}).format(monthDate);
  const estimate = outlook.estimated ? de ? "ca. " : "approx. " : "";
  const forecastCards = [
    {label: de ? `Nettoeinkommen im ${monthName}` : `Net income in ${monthName}`, value:outlook.income === null ? "—" : `${outlook.incomeIsAverage ? estimate : ""}${money(outlook.income)}`, note:outlook.income !== null && outlook.extraIncome > 0 ? de ? `Regulär ${money(outlook.regularIncome)} + Sonderzahlungen ${money(outlook.extraIncome)}` : `Regular ${money(outlook.regularIncome)} + extra income ${money(outlook.extraIncome)}` : outlook.income !== null && outlook.incomeIsAverage ? de ? "Monatsdurchschnitt aus deinem Jahresnetto" : "Monthly average from your annual net income" : undefined},
    {label: outlook.missing.length ? de ? `Bekannte Kosten im ${monthName}` : `Known costs in ${monthName}` : de ? `Fällige Kosten im ${monthName}` : `Costs due in ${monthName}`, value:`${outlook.payments.some(payment => payment.estimated) ? de ? "ca. " : "approx. " : ""}${money(outlook.total)}`},
    {label: de ? "Rest nach Fixkosten" : "Left after fixed costs", value:outlook.remaining === null ? "—" : `${estimate}${money(outlook.remaining)}`, emphasis:true, note:outlook.remaining === null ? de ? "Angaben für diesen Monat fehlen noch" : "Entries for this month are still missing" : undefined},
  ];
  return <section aria-label={de ? "Finanzen im Überblick" : "Your household at a glance"}>
    {(needsIncome || !count) && <div data-home-setup className="mt-4 rounded-xl border border-[#b8efcc] bg-[#eefbf3] p-4">
      <p className="text-[13px] font-bold">{needsIncome ? de ? "1 · Einkommen eintragen" : "1 · Add your income" : de ? "2 · Erste Kosten hinzufügen" : "2 · Add your first cost"}</p>
      <p className="mt-1 text-[13px] text-[#52605b]">{needsIncome ? de ? "Ein Betrag reicht. Danach ergänzen wir deine regelmäßigen Kosten." : "One amount is enough. Add your recurring costs next." : de ? "Beginne mit Miete, Internet oder einer Versicherung. Weitere Kosten kannst du später ergänzen." : "Start with rent, internet or insurance. Add more costs later."}</p>
      <button type="button" className="eavesence-pill-button home-dashboard-action mt-3" onClick={needsIncome ? onIncome : onCost} aria-expanded={needsIncome ? incomeOpen : undefined}>{needsIncome ? de ? "Einkommen eintragen" : "Add income" : de ? "Erste Kosten hinzufügen" : "Add first cost"}</button>
      {needsReview && needsIncome && <button type="button" onClick={onSkipIncome} className="ml-2 min-h-11 px-2 text-[13px] font-semibold">{de ? "Einkommen später ergänzen" : "Add income later"}</button>}
    </div>}
    {incomeOpen && incomeForm}
    {count > 0 && !incomeOpen && <>
    <section id="home-detail-upcoming" className="home-detail-panel home-month-overview" aria-label={de ? "Dein Monatsergebnis" : "Your monthly result"} data-home-next-month>
      <div className="home-month-navigation" role="group" aria-label={de ? "Monat wählen" : "Choose month"}>
        <h2 className="site-card-title">{monthLabel}</h2>
        <div className="flex items-center gap-1"><button type="button" className="min-h-11 min-w-11 rounded-full border border-[#dfe5dd]" aria-label={de ? "Vorheriger Monat" : "Previous month"} onClick={()=>onMonthChange(shiftPlanningMonth(outlook.month,-1))}>‹</button><button type="button" className="min-h-11 min-w-11 rounded-full border border-[#dfe5dd]" aria-label={de ? "Nächster Monat" : "Next month"} onClick={()=>onMonthChange(shiftPlanningMonth(outlook.month,1))}>›</button><button type="button" className="min-h-11 min-w-11 rounded-full border border-[#dfe5dd] disabled:opacity-40" aria-label={de ? "Dieser Monat" : "This month"} title={de ? "Dieser Monat" : "This month"} disabled={outlook.month === localToday().slice(0,7)} onClick={()=>onMonthChange(localToday().slice(0,7))}><span aria-hidden="true">↺</span></button></div>
      </div>
      <div className="rounded-2xl bg-[#24272c] p-4 text-white sm:p-5" data-home-month-result aria-live="polite">
        <p className="text-[14px] text-[#d1d7d4]">{outlook.remaining !== null && outlook.remaining < 0 ? de ? "Nach Fixkosten fehlen voraussichtlich" : "Expected shortfall after fixed costs" : de ? "Nach Fixkosten bleiben voraussichtlich" : "Expected left after fixed costs"}</p>
        <p className={`mt-2 text-[clamp(1.75rem,4vw,2.25rem)] font-extrabold tracking-tight ${outlook.remaining !== null && outlook.remaining < 0 ? "text-[#ffd28c]" : "text-[#72dca3]"}`} data-home-remaining>{outlook.remaining === null ? "—" : `${estimate}${money(Math.abs(outlook.remaining))}`}</p>
        <p className="mt-2 text-[13px] leading-5 text-[#d1d7d4]">{outlook.remaining === null ? de ? "Ergänze die fehlenden Angaben für dein Monatsergebnis." : "Complete the missing entries to see your monthly result." : de ? "Nach deinen bisher erfassten Kosten. Lebensmittel, Freizeit und Alltag gehen davon noch ab." : "After the costs recorded so far. Groceries, leisure and everyday spending still come out of this."}</p>
      </div>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">{forecastCards.slice(0,2).map(card=><div key={card.label} className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]"><dt className="text-[#52605b]">{card.label}</dt><dd className="font-semibold">{card.value}</dd>{card.note && <dd className="w-full text-[12px] text-[#65716d]">{card.note}</dd>}</div>)}</dl>
      {!!outlook.missing.length && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-900"><p>{de ? "Für ein vollständiges Ergebnis fehlen Zahlungstermine:" : "Payment dates are missing for a complete result:"}</p>{outlook.missing.map(cost=><button type="button" key={cost.id} className="eavesence-pill-button home-dashboard-action mt-2 mr-2" onClick={()=>onReviewCost?.(cost.id)}>{cost.name} · {de ? "Termin ergänzen" : "Add date"}</button>)}</div>}
      {outlook.income === null && <button type="button" className="eavesence-pill-button home-dashboard-action mt-3" onClick={onIncome}>{de ? "Einkommen ergänzen" : "Add income"}</button>}
      <FormActions className="mt-4"><button type="button" className="eavesence-pill-button home-dashboard-action" onClick={onPlan}>{de ? "Bis zum Gehalt planen" : "Plan until payday"}</button></FormActions>
      <details className="home-disclosure mt-3 text-[13px]" data-month-calculation><summary className="min-h-11 cursor-pointer font-semibold">{de ? "Berechnung & Zahlungen ansehen" : "View calculation & payments"}</summary>
      <p className="mt-3 text-[13px] leading-5 text-[#65716d]">{de ? "Vorschau für diesen konkreten Monat, inklusive eingetragener Sonderzahlungen und der dann fälligen Rechnungen. Lebensmittel, Freizeit und andere Alltagsausgaben gehen vom Rest noch ab. Kein Kontostand und noch kein Sparbetrag." : "A forecast for this specific month, including recorded extra income and bills due then. Groceries, leisure and other everyday spending still come out of the remainder. Not your account balance or a savings amount."}</p>
      {outlook.incomeIsAverage && <p className="mt-3 rounded-xl bg-[#f4f6f2] p-3 text-[13px] leading-5 text-[#52605b]">{de ? "Dein Einkommen ist ein Jahresdurchschnitt und kann vom tatsächlichen Geldeingang in diesem Monat abweichen. Mit dem regulären Monatsnetto und separat eingetragenen Sonderzahlungen wird die Vorschau genauer." : "Your income is an annual average and may differ from what actually arrives this month. Use regular monthly net income with separate extra payments for a more accurate forecast."} <button type="button" className="eavesence-pill-button home-dashboard-action" onClick={onIncome}>{de ? "Einkommen für Vorschau prüfen" : "Review income for forecast"}</button></p>}
      {outlook.undatedMonthlyCount > 0 && <p className="mt-3 text-[13px] leading-5 text-[#65716d]">{de ? "Monatliche Kosten ohne Zahlungstermin zählen einmal in diesem Monat. Der genaue Abbuchungstag ist noch offen." : "Monthly costs without a payment date count once this month. Their exact debit date is still unknown."}</p>}
      {outlook.payments.some(payment => payment.estimated) && <p className="mt-2 text-[13px] leading-5 text-[#65716d]">{de ? "Variable Rechnungen sind geschätzt, solange noch kein Rechnungsbetrag für diesen Monat eingetragen ist." : "Variable bills are estimates until you enter an invoice amount for this month."}</p>}
      {outlook.remaining !== null && outlook.remaining < 0 && <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900">{de ? "Die erfassten Kosten übersteigen das erwartete Einkommen in diesem Monat – noch vor Alltagsausgaben." : "Recorded costs exceed expected income this month, before everyday spending."}</p>}
      <h3 className="mt-5 text-[13px] font-semibold">{de ? `Zahlungen im ${monthName}` : `Payments in ${monthName}`}</h3>
      {outlook.payments.length ? <ul className="mt-3 space-y-2 text-[13px] text-[#52605b]">{outlook.payments.map(({cost, date, estimated}) => <li key={`${cost.id}-${date}`} className="flex justify-between gap-3"><span>{date ? new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", {day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(`${date}T00:00:00Z`)) : de ? "Monatlich · Termin fehlt" : "Monthly · date missing"} · {cost.name}</span><span className="shrink-0 font-semibold">{estimated ? de ? "ca. " : "approx. " : ""}{money(cost.amount)}</span></li>)}</ul> : <p className="mt-2 text-[13px] text-[#52605b]">{de ? "Keine terminierten Zahlungen in diesem Monat." : "No scheduled payments this month."}</p>}
      </details>
    </section>
    </>}
    <details id="home-detail-budget" data-home-monthly-budget className="home-detail-panel home-disclosure" hidden={!hasIncome || incomeOpen} open={activeSection === "budget" ? true : undefined}><summary className="min-h-11 cursor-pointer text-[13px] font-semibold">{de ? "Monatsdurchschnitt & Sonderzahlungen" : "Monthly average & extra income"}</summary>
    <h2 id="home-budget-heading" className="mt-4 site-card-title">{de ? "Dein Monatsbudget" : "Your monthly budget"}</h2>
    <FinanceCards cards={cards} deficit={deficit} />
    <p className="mt-3 max-w-3xl text-[13px] leading-5 text-[#65716d]">{de ? "Monatsdurchschnitte deiner erfassten Kosten. Lebensmittel, Freizeit und andere Alltagsausgaben gehen vom Rest noch ab. Er ist kein Kontostand und noch kein Sparbetrag." : "Monthly averages of the costs you have entered. Groceries, leisure and other everyday spending still come out of the remainder. It is not your account balance or a savings amount."}</p>
    {hasVariableCosts&&<p className="mt-2 text-[12px] leading-5 text-[#65716d]">{de?"Variable Kosten sind hier mit ihrem üblichen Planbetrag enthalten. Die tatsächlichen Rechnungen stehen in der Monatscheckliste.":"Variable costs use their usual planning amounts here. Find actual invoices in the monthly checklist."}</p>}
    {deficit && <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900">{de ? "Deine erfassten Fixkosten übersteigen dein Einkommen. Alltagsausgaben sind dabei noch nicht berücksichtigt. Prüfe zuerst deine Beträge und Zahlungsrhythmen." : "Your entered fixed costs exceed your income, before everyday spending. Check your amounts and payment frequencies first."}</p>}
    {incomeInformation}
    </details>
    {needsReview && !needsIncome && count > 0 && <div data-home-review className="mt-4 rounded-xl border border-[#b8efcc] bg-[#eefbf3] p-4">
      <h3 className="site-card-title">{de ? "3 · Deinen Überblick prüfen" : "3 · Check your overview"}</h3>
      <p className="mt-2 text-[13px] leading-5 text-[#52605b]">{de ? "Sind Miete, Energie, Versicherungen und Abos schon enthalten? Ergänze zuerst deine größten regelmäßigen Kosten. Du musst nicht alles heute erfassen." : "Have you included rent, energy, insurance and subscriptions? Add your largest recurring costs first. You do not have to enter everything today."}</p>
      <FormActions className="mt-3"><button className="eavesence-pill-button home-dashboard-action" type="button" onClick={onCost}>{de ? "Weitere Kosten ergänzen" : "Add more costs"}</button><button className="eavesence-pill-button home-dashboard-action" type="button" onClick={onFinishReview}>{de ? "Übersicht geprüft" : "Overview checked"}</button></FormActions>
    </div>}

  </section>;
}


type FinanceCard = {label:string; value:string; note?:string; emphasis?:boolean};
function FinanceCards({cards, deficit}:{cards:FinanceCard[]; deficit:boolean}) {
  return <div className="mt-3 grid items-stretch gap-3 md:grid-cols-3">
    {cards.map(card => <article key={card.label} className={`min-w-0 rounded-2xl border p-4 ${card.emphasis ? "border-[#32363b] bg-[#24272c] text-white" : "border-[#dfe5dd] bg-white text-[#17211f]"}`}>
      <p className={`text-[13px] font-semibold ${card.emphasis ? "text-[#d1d7d4]" : "text-[#65716d]"}`}>{card.label}</p>
      <p className={`mt-2 text-[20px] font-extrabold tracking-[-.035em] ${card.emphasis ? deficit ? "text-[#ffd28c]" : "text-[#72dca3]" : ""}`}>{card.value}</p>
      {card.note && <p className={`mt-2 text-[12px] leading-5 ${card.emphasis ? "text-[#d1d7d4]" : "text-[#65716d]"}`}>{card.note}</p>}
    </article>)}
  </div>;
}
