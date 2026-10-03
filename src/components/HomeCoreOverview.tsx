"use client";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { paymentsNextMonth } from "@/lib/householdCosts";

type Props = {
  locale: Locale; currency: string; income: number; fixed: number; count: number;
  upcoming: ReturnType<typeof paymentsNextMonth>;
  incomeOpen: boolean; onIncome: () => void; onCost: () => void;
  upcomingOpen: boolean; onUpcoming: () => void; incomeForm: ReactNode;
};
export default function HomeCoreOverview({ locale, currency, income, fixed, count, upcoming, incomeOpen, onIncome, onCost, upcomingOpen, onUpcoming, incomeForm }: Props) {
  const de = locale === "de";
  const money = (n: number) => new Intl.NumberFormat(de ? "de-AT" : "en-GB", { style: "currency", currency }).format(n);
  const deficit = income > 0 && fixed > income;
  const cards = [
    { label: de ? "Nettoeinkommen pro Monat" : "Net income / month", value: income > 0 ? money(income) : "—" },
    { label: de ? "Fixkosten pro Monat" : "Recurring costs / month", value: money(fixed) },
    { label: de ? "Rest nach Fixkosten" : "Left after fixed costs", value: income > 0 && count > 0 ? money(income - fixed) : "—", emphasis: true },
  ];
  return <section className="mt-6" aria-label={de ? "Finanzen im Überblick" : "Your household at a glance"}>
    <h2 className="site-section-title">{de ? "Dein Monat auf einen Blick" : "Your month at a glance"}</h2>
    <div className="mt-3 grid items-start gap-3 md:grid-cols-3">
      {cards.map(card => <article key={card.label} className={`min-w-0 rounded-2xl border p-4 ${card.emphasis ? "border-[#32363b] bg-[#24272c] text-white" : "border-[#dfe5dd] bg-white text-[#17211f]"}`}>
        <p className={`text-[11px] font-semibold ${card.emphasis ? "text-[#d1d7d4]" : "text-[#65716d]"}`}>{card.label}</p>
        <p className={`mt-2 text-[24px] font-extrabold tracking-[-.035em] ${card.emphasis ? deficit ? "text-[#ffd28c]" : "text-[#72dca3]" : ""}`}>{card.value}</p>
      </article>)}
    </div>
    <p className="mt-3 max-w-3xl text-[12px] leading-5 text-[#65716d]">{de ? "Monatsdurchschnitte deiner erfassten Kosten. Lebensmittel, Freizeit und andere Alltagsausgaben gehen vom Rest noch ab. Er ist kein Kontostand und noch kein Sparbetrag." : "Monthly averages of the costs you have entered. Groceries, leisure and other everyday spending still come out of the remainder. It is not your account balance or a savings amount."}</p>
    {deficit && <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">{de ? "Deine erfassten Fixkosten übersteigen dein Einkommen. Alltagsausgaben sind dabei noch nicht berücksichtigt. Prüfe zuerst deine Beträge und Zahlungsrhythmen." : "Your entered fixed costs exceed your income, before everyday spending. Check your amounts and payment frequencies first."}</p>}
    {(!income || !count) && <div data-home-setup className="mt-4 rounded-xl border border-[#b8efcc] bg-[#eefbf3] p-4">
      <p className="text-[13px] font-bold">{income <= 0 ? de ? "1 · Einkommen eintragen" : "1 · Add your income" : de ? "2 · Erste Kosten hinzufügen" : "2 · Add your first cost"}</p>
      <p className="mt-1 text-[12px] text-[#52605b]">{income <= 0 ? de ? "Ein Betrag reicht. Danach ergänzen wir deine regelmäßigen Kosten." : "One amount is enough. Add your recurring costs next." : de ? "Beginne mit Miete, Internet oder einer Versicherung. Weitere Kosten kannst du später ergänzen." : "Start with rent, internet or insurance. Add more costs later."}</p>
      <button type="button" className="eavesence-pill-button home-dashboard-action mt-3" onClick={income <= 0 ? onIncome : onCost} aria-expanded={income <= 0 ? incomeOpen : undefined}>{income <= 0 ? de ? "Einkommen eintragen" : "Add income" : de ? "Erste Kosten hinzufügen" : "Add first cost"}</button>
    </div>}
    {incomeOpen && incomeForm}
    {count > 0 && <div className="mt-4 rounded-xl border border-[#dfe5dd] bg-white p-4">
      <button type="button" onClick={onUpcoming} aria-expanded={upcomingOpen} className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-[13px] font-semibold"><span>{de ? "Zahlungen im nächsten Monat" : "Payments next month"}</span><span className="flex items-center gap-3"><span>{upcoming.undatedCount > 0 ? de ? "Termine fehlen" : "Dates missing" : money(upcoming.total)}</span><span aria-hidden="true">{upcomingOpen ? "−" : "+"}</span></span></button>
      {upcomingOpen && <div className="border-t border-[#dfe5dd] pt-3 text-[12px] leading-5 text-[#52605b]">
        <p>{upcoming.undatedCount > 0 ? de ? `${upcoming.undatedCount} Kosten ohne Zahlungstermin fehlen in dieser Vorschau. Der Monatsdurchschnitt oben berücksichtigt sie trotzdem.` : `${upcoming.undatedCount} costs without a payment date are excluded from this forecast. The monthly average above still includes them.` : de ? "Alle erfassten Kosten haben einen Zahlungstermin." : "All recorded costs have a payment date."}</p>
        {upcoming.payments.length ? <ul className="mt-3 space-y-2">{upcoming.payments.map(({cost, date}) => <li key={`${cost.id}-${date}`} className="flex justify-between gap-3"><span>{new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", {day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(`${date}T00:00:00Z`))} · {cost.name}</span><span className="shrink-0 font-semibold">{money(cost.amount)}</span></li>)}</ul> : <p className="mt-2">{de ? "Keine terminierten Zahlungen im nächsten Monat." : "No scheduled payments next month."}</p>}
      </div>}
    </div>}
  </section>;
}
