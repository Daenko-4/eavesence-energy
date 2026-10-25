"use client";
import { shiftPlanningMonth } from "@eavesence/core/planning";
import { localToday } from "@eavesence/core/homeValue";
import FormActions from "@/components/FormActions";

import { type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { MonthlyOutlook } from "@eavesence/core/monthlyOutlook";

type Props = {
  hasVariableCosts?: boolean;
  incomeIsAverage?: boolean;
  incomeProvided?: boolean;
  incomeDeferred?: boolean; onSkipIncome?: () => void;
  needsReview?: boolean; onFinishReview?: () => void;
  locale: Locale; currency: string; income: number; fixed: number; count: number;
  outlook: MonthlyOutlook; incomeInformation?: ReactNode;
  onMonthChange:(month:string)=>void; onPlan:()=>void;
  incomeOpen: boolean; onIncome: () => void; onCost: () => void;
  incomeForm: ReactNode; payments: ReactNode; navigation: ReactNode;
};
export default function HomeCoreOverview({ incomeProvided, incomeDeferred = false, onSkipIncome, needsReview = false, onFinishReview, incomeIsAverage = false, hasVariableCosts = false, locale, currency, income, fixed, count, outlook, incomeInformation, onMonthChange, onPlan, incomeOpen, onIncome, onCost, incomeForm, payments, navigation }: Props) {
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
    {count > 0 && <section id="home-detail-upcoming" className="home-month-workspace" aria-label={de ? "Dein Monatsergebnis" : "Your monthly result"} data-home-next-month>
      <div className="home-month-toolbar home-month-navigation" role="group" aria-label={de ? "Monat wählen" : "Choose month"}>
        <h2 className="site-section-title">{monthLabel}</h2>
        <div className="flex items-center gap-1"><button type="button" className="min-h-11 min-w-11 rounded-full border border-[#dfe5dd]" aria-label={de ? "Vorheriger Monat" : "Previous month"} onClick={()=>onMonthChange(shiftPlanningMonth(outlook.month,-1))}>‹</button><button type="button" className="min-h-11 min-w-11 rounded-full border border-[#dfe5dd]" aria-label={de ? "Nächster Monat" : "Next month"} onClick={()=>onMonthChange(shiftPlanningMonth(outlook.month,1))}>›</button><button type="button" className="min-h-11 min-w-11 rounded-full border border-[#dfe5dd] disabled:opacity-40" aria-label={de ? "Dieser Monat" : "This month"} title={de ? "Dieser Monat" : "This month"} disabled={outlook.month === localToday().slice(0,7)} onClick={()=>onMonthChange(localToday().slice(0,7))}><span aria-hidden="true">↺</span></button></div>
      </div>
      <aside className="home-month-summary" aria-label={de ? "Dein Monatsüberblick" : "Your month at a glance"}>
        <div className="home-month-kpis" data-home-monthly-budget>
          {forecastCards.map((card,index)=><article key={index} data-home-shortfall={index === 2 && outlook.remaining !== null && outlook.remaining < 0} data-home-kpi={index === 0 ? "income" : index === 1 ? "costs" : "remaining"} data-home-month-result={index === 2 ? "" : undefined} className={index === 2 ? "home-month-kpi home-month-kpi-result" : "home-month-kpi"}>
            <p className="home-month-kpi-label">{index === 2 && outlook.remaining !== null && outlook.remaining < 0 ? de ? "Nach Fixkosten fehlen" : "Shortfall after fixed costs" : card.label}</p>
            <p className={`home-month-kpi-amount ${index === 2 && outlook.remaining !== null && outlook.remaining < 0 ? "text-[#ffd28c]" : ""}`} data-home-remaining={index === 2 ? "" : undefined}>{index === 2 && outlook.remaining !== null ? `${estimate}${money(Math.abs(outlook.remaining))}` : card.value}</p>
            {card.note && <p className="home-month-kpi-note">{card.note}</p>}
          </article>)}
        </div>
        <p className="home-month-context">{de ? "Nach erfassten Fixkosten. Lebensmittel, Freizeit und andere Alltagsausgaben gehen vom Rest noch ab. Kein Kontostand." : "After recorded fixed costs. Groceries, leisure and other everyday spending still come out of the remainder. Not your account balance."}</p>
      </aside>
      <div className="home-month-payments">{payments}</div>
      <aside className="home-month-tools" aria-label={de ? "Aktionen & Hinweise" : "Actions & information"}>
        <div className="home-month-tool-card">
          <h3 className="site-card-title">{de ? "Dein Zuhause pflegen" : "Manage your home"}</h3>
          <div role="group" aria-label={de ? "Aktionen für dein Zuhause" : "Home actions"} className="home-month-actions">
            <button type="button" className="eavesence-pill-button home-dashboard-action home-outlined-action" onClick={onCost}>{de ? "Kosten hinzufügen" : "Add cost"}</button>
            <button type="button" className="eavesence-pill-button home-dashboard-action home-outlined-action" onClick={onIncome} aria-expanded={incomeOpen} aria-controls="home-income-form">{hasIncome ? de ? "Einkommen ändern" : "Edit income" : de ? "Einkommen ergänzen" : "Add income"}</button>
          </div>
          {navigation}
        </div>
        <div className="home-month-tool-card"><h3 className="site-card-title">{de ? "Bis zum nächsten Gehalt" : "Until your next payday"}</h3><p className="mt-2 text-[12px] leading-5 text-[#65716d]">{de ? "Mit deinem aktuellen Kontostand planen. Offene Rechnungen werden übernommen." : "Plan with your current balance. Unpaid bills are included."}</p><button type="button" className="eavesence-pill-button home-dashboard-action mt-3" onClick={onPlan}>{de ? "Bis zum Gehalt planen" : "Plan until payday"}</button></div>
        <div className="home-month-tool-card home-month-explanation" data-month-calculation>
          <h3 className="site-card-title">{de ? "So wird gerechnet" : "How this is calculated"}</h3>
          <p className="mt-2 text-[12px] leading-5 text-[#65716d]">{de ? "Vorschau für diesen konkreten Monat, inklusive eingetragener Sonderzahlungen und der dann fälligen Rechnungen." : "A forecast for this specific month, including recorded extra income and bills due then."}</p>
          {outlook.incomeIsAverage && <p className="mt-2 text-[12px] leading-5 text-amber-900">{de ? "Dein Einkommen ist ein Jahresdurchschnitt und kann vom tatsächlichen Geldeingang in diesem Monat abweichen." : "Your income is an annual average and may differ from what actually arrives this month."}</p>}
          {outlook.undatedMonthlyCount > 0 && <p className="mt-2 text-[12px] leading-5 text-[#65716d]">{de ? "Monatliche Kosten ohne Zahlungstermin zählen einmal in diesem Monat." : "Monthly costs without a payment date count once this month."}</p>}
          {outlook.payments.some(payment=>payment.estimated) && <p className="mt-2 text-[12px] leading-5 text-[#65716d]">{de ? "Variable Beträge sind geschätzt, bis eine Rechnung eingetragen ist." : "Variable amounts are estimates until an invoice is entered."}</p>}
          {incomeInformation}
        </div>
      </aside>
    </section>}
    {incomeOpen && incomeForm}
    {!count && hasIncome && <div data-home-monthly-budget className="mt-4"><FinanceCards cards={cards} deficit={deficit} /></div>}
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
