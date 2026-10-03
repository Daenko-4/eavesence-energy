"use client";
import { incomeExtraLabel, incomeMonthLabel, summarizeIncome, type IncomeProfile } from "@eavesence/core/income";
export default function IncomeExtrasSummary({ profile, locale, currency }: { profile: IncomeProfile; locale: "de" | "en"; currency: string }) {
  const summary = summarizeIncome(profile);
  const de = locale === "de";
  const money = (value: number) => new Intl.NumberFormat(de ? "de-AT" : "en-GB", { style: "currency", currency }).format(value);
  if (summary.annualAverage && summary.monthly <= 0) return null;
  if (summary.annualAverage) return <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-5 text-amber-900" data-income-average-note>{de ? "Dein gespeichertes Jahresnetto wird durch 12 geteilt. Das ist ein Monatsdurchschnitt, nicht dein tatsächliches Monatsgehalt. Für verlässliche Monatsplanung trage dein reguläres Monatsnetto und Sonderzahlungen getrennt ein." : "Your saved annual net income is divided by 12. This is a monthly average, not your actual monthly salary. For monthly planning, enter your regular monthly net income and extra payments separately."}</p>;
  if (!summary.extras.length) return null;
  return <details className="home-disclosure mt-3 rounded-xl border border-[#dfe5dd] bg-white p-4" data-income-extras-summary><summary className="home-single-line-summary text-[12px] font-semibold">{de ? "Sonderzahlungen & Jahresüberblick" : "Extra income & annual overview"}</summary>
    <p className="mt-3 text-[12px] leading-5 text-[#52605b]">{de ? `Jahresnetto ${summary.year} inklusive geplanter Extras: ${money(summary.annual)}. Monatsdurchschnitt: ${money(summary.average)}.` : `Net income in ${summary.year}, including planned extras: ${money(summary.annual)}. Monthly average: ${money(summary.average)}.`}</p>
    <p className="mt-2 text-[12px] leading-5 text-[#65716d]">{de ? "Die Übersicht oben rechnet mit deinem regulären Monatsnetto. Extras sind geplante Einnahmen im angegebenen Monat, kein heute verfügbares Geld. Nach Eingang sind sie Teil deines Kontostands für „Bis zum Gehalt“." : "The overview above uses your regular monthly net income. Extras are planned income in the specified month, not money available today. Once received, they are part of the balance you enter for ‘To payday’."}</p>
    <ul className="mt-3 space-y-2 text-[12px]">{[...summary.extras].sort((a,b) => (a.year ?? summary.year)-(b.year ?? summary.year) || a.month-b.month).map(extra => <li key={extra.id} className="flex flex-wrap justify-between gap-2"><span>{incomeExtraLabel(extra.kind, locale)} · {incomeMonthLabel(extra.month, locale)} {extra.year ?? (de ? "jährlich" : "every year")}</span><span className="font-semibold">+ {money(extra.amount)}</span></li>)}</ul>
  </details>;
}
