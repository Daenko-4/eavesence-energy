"use client";

import type { Locale } from "@/i18n/config";
import type { MonthlyEnergyEntry } from "@/lib/household";
import { monthKey, type HouseholdCost, type HouseholdCostCategory } from "@/lib/householdCosts";
import { householdInsights, type CostEvent } from "@/lib/householdInsights";
import type { SavedDeviceCurrency } from "@/lib/savedDevices";

const copy = {
  de: {
    title: "Dein nächster Monat",
    intro: "Geplante Zahlungen aus deinen wiederkehrenden Kosten – keine bereits bezahlten Ausgaben.",
    incomplete: "{count} Kosten ohne Zahlungsdatum fehlen in der Vorschau. Ergänze ihre Termine für einen vollständigen Vergleich.",
    empty: "Ergänze bei einer Ausgabe den nächsten Zahlungstermin. Dann zeigen wir dir, wann sie wieder fällig wird.",
    above: "{amount} mehr als dein monatlicher Kostendurchschnitt",
    below: "{amount} weniger als dein monatlicher Kostendurchschnitt",
    equal: "Etwa so viel wie dein monatlicher Kostendurchschnitt",
    driver: "Größter zusätzlicher Posten: {name} ({amount} fällig statt {average} im Monatsdurchschnitt).",
    basis: "Vergleich mit {amount} monatlichem Durchschnitt; alle Kosten haben ein Zahlungsdatum.",
    addDates: "Termine ergänzen",
    quickTitle: "In drei Schritten zur ersten Übersicht",
    quickText: "{count} von 3 regelmäßigen Kosten erfasst. Starte mit Wohnen, Energie und einem Vertrag – ohne Anbieter oder Konto.",
    quickDone: "Schon jetzt siehst du deinen Monatsdurchschnitt. Mit Zahlungsterminen wird auch die Vorschau vollständig.",
    reviewTitle: "Verträge und Kosten prüfen",
    reviewIntro: "Diese größeren laufenden Posten könnten sich für einen Preisvergleich lohnen. Eine Ersparnis ist nicht vorausgesetzt.",
    annual: "{amount} pro Jahr",
    example: "10 % günstiger wären rechnerisch {amount} im Jahr.",
    nextDue: "Nächste Zahlung: {date}",
    noDue: "Zahlungstermin ergänzen",
    deadline: "Kündigungsfrist: {date}",
    check: "Preis prüfen",
    calendar: "Frist vormerken",
    reviewEmpty: "Erfasse etwa Internet, Strom oder Versicherung, um prüfbare Posten zu sehen.",
    recapTitle: "Monatsrückblick",
    recapIntro: "Geplante Zahlungen im Vergleich zum Vormonat – anhand deiner heute gespeicherten Kosten rekonstruiert.",
    recapValues: "{previous}: {before} · {current}: {after}",
    recapUp: "{amount} mehr geplant als im Vormonat.",
    recapDown: "{amount} weniger geplant als im Vormonat.",
    recapSame: "Die geplanten Zahlungen sind gleich hoch.",
    recapIncomplete: "Für diesen Vergleich fehlen {count} Zahlungstermine.",
    changesTitle: "In diesem Monat geändert",
    changesEmpty: "Noch keine Änderungen an laufenden Kosten erfasst. Künftige Änderungen erscheinen hier.",
    added: "{name} neu: {amount} pro Monat",
    changed: "{name}: {before} → {after} pro Monat",
    removed: "{name} entfernt: zuvor {amount} pro Monat",
    energy: "Tatsächlicher Stromwert: {month} {amount} und {kwh} kWh; {direction} {difference} gegenüber {previous}.",
    energyUp: "mehr um",
    energyDown: "weniger um",
    energySame: "unverändert um",
    energyEmpty: "Für einen Vergleich der tatsächlichen Stromkosten zwei Monatswerte erfassen.",
  },
  en: {
    title: "Your next month",
    intro: "Scheduled payments from your recurring costs, not expenses already paid.",
    incomplete: "{count} costs without a payment date are missing from this forecast. Add dates for a complete comparison.",
    empty: "Add the next payment date to a cost to see when it is due again.",
    above: "{amount} more than your average monthly recurring costs",
    below: "{amount} less than your average monthly recurring costs",
    equal: "About the same as your average monthly recurring costs",
    driver: "Largest extra payment: {name} ({amount} due versus {average} in the monthly average).",
    basis: "Compared with a {amount} monthly average; all costs have payment dates.",
    addDates: "Add payment dates",
    quickTitle: "Your first overview in three entries",
    quickText: "{count} of 3 recurring costs added. Start with housing, energy and a contract – no provider or account needed.",
    quickDone: "Your monthly average is already visible. Payment dates complete the forecast.",
    reviewTitle: "Costs worth reviewing",
    reviewIntro: "These larger recurring costs may be worth comparing. Savings are not guaranteed.",
    annual: "{amount} per year",
    example: "A 10% lower price would be {amount} less per year.",
    nextDue: "Next payment: {date}",
    noDue: "Add a payment date",
    deadline: "Cancellation deadline: {date}",
    check: "Check price",
    calendar: "Add deadline to calendar",
    reviewEmpty: "Add internet, electricity or insurance to see costs worth reviewing.",
    recapTitle: "Monthly review",
    recapIntro: "Scheduled payments versus last month, reconstructed from the costs saved today.",
    recapValues: "{previous}: {before} · {current}: {after}",
    recapUp: "{amount} more scheduled than last month.",
    recapDown: "{amount} less scheduled than last month.",
    recapSame: "Scheduled payments are unchanged.",
    recapIncomplete: "{count} payment dates are missing from this comparison.",
    changesTitle: "Changes recorded this month",
    changesEmpty: "No recurring cost changes recorded yet. Future changes will appear here.",
    added: "{name} added: {amount} per month",
    changed: "{name}: {before} → {after} per month",
    removed: "{name} removed: previously {amount} per month",
    energy: "Actual electricity value: {month} {amount} and {kwh} kWh; {direction} {difference} versus {previous}.",
    energyUp: "up by",
    energyDown: "down by",
    energySame: "unchanged by",
    energyEmpty: "Record two monthly electricity values to compare actual costs.",
  },
} as const;

function money(value: number, locale: Locale, currency: SavedDeviceCurrency) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", { style: "currency", currency }).format(value);
}

function monthLabel(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}-01T00:00:00Z`));
}

function dateLabel(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}

function addDeadlineToCalendar(cost: HouseholdCost, locale: Locale) {
  if (!cost.cancellationDeadline) return;
  const day = cost.cancellationDeadline.replaceAll("-", "");
  const next = new Date(`${cost.cancellationDeadline}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = next.toISOString().slice(0, 10).replaceAll("-", "");
  const title = (locale === "de" ? "Kündigungsfrist prüfen: " : "Check cancellation deadline: ") + cost.name;
  const escape = (value: string) => value.replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(";", "\\;").replaceAll("\n", "\\n");
  const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EAVESENCE//Cost Deadline//EN", "BEGIN:VEVENT", `UID:${cost.id.replace(/[^a-zA-Z0-9-]/g, "-")}-${day}@eavesence.com`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`, `DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${end}`, `SUMMARY:${escape(title)}`, "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", `DESCRIPTION:${escape(title)}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "eavesence-deadline.ics";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function HouseholdInsightsPanel({ locale, currency, costs, history, events, onAdd, onReview }: {
  locale: Locale;
  currency: SavedDeviceCurrency;
  costs: HouseholdCost[];
  history: MonthlyEnergyEntry[];
  events: CostEvent[];
  onAdd: (category?: HouseholdCostCategory) => void;
  onReview: (cost: HouseholdCost) => void;
}) {
  const text = copy[locale];
  const insight = householdInsights(costs);
  const moneyText = (value: number) => money(value, locale, currency);
  const driver = insight.drivers[0];
  const difference = Math.abs(insight.difference);
  const differenceText = insight.difference > 0.01 ? text.above : insight.difference < -0.01 ? text.below : text.equal;
  const thisMonth = monthKey(new Date());
  const energy = [...history].filter((entry) => entry.month <= thisMonth).sort((a, b) => b.month.localeCompare(a.month))[0];
  const priorEnergy = energy && history.find((entry) => entry.month === monthKey(new Date(`${energy.month}-15T12:00:00Z`), -1));
  const plannedDifference = insight.current.total - insight.previous.total;
  const recentChanges = events.filter((event) => event.month === thisMonth).slice(0, 5);

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-2" aria-label={text.title} data-household-insights>
      {costs.length < 3 && (
        <div className="rounded-[1.45rem] border border-[#b8efcc] bg-[#eefbf3] p-5 lg:col-span-2">
          <h2 className="text-lg font-extrabold">{text.quickTitle}</h2>
          <p className="mt-1 text-[13px] text-[#52605b]">{text.quickText.replace("{count}", String(costs.length))}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["housing", "energy", "subscriptions"] as const).map((category) => (
              <button key={category} type="button" onClick={() => onAdd(category)} className="eavesence-pill-button home-dashboard-action">
                {category === "housing" ? (locale === "de" ? "Wohnen anlegen" : "Add housing") : category === "energy" ? (locale === "de" ? "Energie anlegen" : "Add energy") : (locale === "de" ? "Vertrag anlegen" : "Add contract")}
              </button>
            ))}
          </div>
          {costs.length > 0 && <p className="mt-3 text-[12px] text-[#52605b]">{text.quickDone}</p>}
        </div>
      )}

      <div className="rounded-[1.45rem] border border-[#b8efcc] bg-[#eefbf3] p-5" data-monthly-forecast>
        <h2 className="text-lg font-extrabold">{text.title} · {monthLabel(insight.next.month, locale)}</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#52605b]">{text.intro}</p>
        <p className="mt-4 text-2xl font-extrabold text-[#17211f]">{moneyText(insight.next.total)}</p>
        {insight.complete ? (
          <>
            <p className="mt-2 text-[13px] font-bold text-[#17211f]">{differenceText.replace("{amount}", moneyText(difference))}</p>
            {insight.difference > 0.01 && driver && <p className="mt-2 text-[12px] text-[#52605b]">{text.driver.replace("{name}", driver.cost.name).replace("{amount}", moneyText(driver.cost.amount)).replace("{average}", moneyText(driver.cost.amount - driver.extra))}</p>}
            <p className="mt-3 text-[11px] text-[#65716d]">{text.basis.replace("{amount}", moneyText(insight.summary.monthlyTotal))}</p>
          </>
        ) : <p className="mt-2 text-[12px] leading-5 text-[#52605b]">{costs.length ? text.incomplete.replace("{count}", String(insight.next.undatedCount)) : text.empty}</p>}
        {!insight.complete && costs.length > 0 && <button type="button" onClick={() => onReview(costs.find((cost) => !cost.nextDueDate) ?? costs[0])} className="eavesence-pill-button home-dashboard-action mt-3">{text.addDates}</button>}
      </div>

      <div className="rounded-[1.45rem] border border-[#dde2d8] bg-[#f6f6f0] p-5" data-contract-review>
        <h2 className="text-lg font-extrabold">{text.reviewTitle}</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#52605b]">{text.reviewIntro}</p>
        {insight.reviewCandidates.length === 0 ? <p className="mt-4 text-[13px] text-[#65716d]">{text.reviewEmpty}</p> : (
          <ul className="mt-4 space-y-3">
            {insight.reviewCandidates.map(({ cost, yearly, nextDate }) => (
              <li key={cost.id} className="rounded-xl border border-[#dfe5dd] bg-white/80 p-3">
                <p className="text-[13px] font-bold">{cost.name} · {text.annual.replace("{amount}", moneyText(yearly))}</p>
                <p className="mt-1 text-[11px] text-[#52605b]">{text.example.replace("{amount}", moneyText(yearly * 0.1))}</p>
                <p className="mt-1 text-[11px] text-[#65716d]">{nextDate ? text.nextDue.replace("{date}", dateLabel(nextDate, locale)) : text.noDue}</p>
                {cost.cancellationDeadline && <p className="mt-1 text-[11px] text-[#65716d]">{text.deadline.replace("{date}", dateLabel(cost.cancellationDeadline, locale))}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onReview(cost)} className="eavesence-pill-button home-dashboard-action">{text.check}</button>
                  {cost.cancellationDeadline && <button type="button" onClick={() => addDeadlineToCalendar(cost, locale)} className="eavesence-pill-button home-dashboard-action">{text.calendar}</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[1.45rem] border border-[#dde2d8] bg-[#f6f6f0] p-5 lg:col-span-2" data-monthly-review>
        <h2 className="text-lg font-extrabold">{text.recapTitle}</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#52605b]">{text.recapIntro}</p>
        {costs.length > 0 && <p className="mt-3 text-[13px] font-semibold">{text.recapValues.replace("{previous}", monthLabel(insight.previous.month, locale)).replace("{before}", moneyText(insight.previous.total)).replace("{current}", monthLabel(thisMonth, locale)).replace("{after}", moneyText(insight.current.total))}</p>}
        {costs.length > 0 && <p className="mt-1 text-[12px] text-[#52605b]">{insight.current.undatedCount ? text.recapIncomplete.replace("{count}", String(insight.current.undatedCount)) : (plannedDifference > 0.01 ? text.recapUp : plannedDifference < -0.01 ? text.recapDown : text.recapSame).replace("{amount}", moneyText(Math.abs(plannedDifference)))}</p>}
        <div className="mt-3 border-t border-[#dfe5dd] pt-3">
          <h3 className="text-[12px] font-bold">{text.changesTitle}</h3>
          {recentChanges.length ? <ul className="mt-1 space-y-1 text-[12px] text-[#52605b]">{recentChanges.map((event, index) => <li key={`${event.id}-${index}`}>{(event.kind === "added" ? text.added.replace("{amount}", moneyText(event.monthly)) : event.kind === "removed" ? text.removed.replace("{amount}", moneyText(event.previousMonthly)) : text.changed.replace("{before}", moneyText(event.previousMonthly)).replace("{after}", moneyText(event.monthly))).replace("{name}", event.name)}</li>)}</ul> : <p className="mt-1 text-[12px] text-[#65716d]">{text.changesEmpty}</p>}
        </div>
        <p className="mt-3 border-t border-[#dfe5dd] pt-3 text-[12px] text-[#52605b]">{energy && priorEnergy ? text.energy.replace("{month}", monthLabel(energy.month, locale)).replace("{amount}", moneyText(energy.cost)).replace("{kwh}", new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", { maximumFractionDigits: 1 }).format(energy.kwh)).replace("{direction}", energy.cost > priorEnergy.cost ? text.energyUp : energy.cost < priorEnergy.cost ? text.energyDown : text.energySame).replace("{difference}", moneyText(Math.abs(energy.cost - priorEnergy.cost))).replace("{previous}", monthLabel(priorEnergy.month, locale)) : text.energyEmpty}</p>
      </div>
    </section>
  );
}
