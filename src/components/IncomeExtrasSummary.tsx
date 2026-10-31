"use client";
import { incomeExtraLabel, incomeMonthLabel, summarizeIncome, type IncomeProfile } from "@eavesence/core/income";
export default function IncomeExtrasSummary({ profile, locale, currency, compact = false }: { compact?: boolean; profile: IncomeProfile; locale: "de" | "en"; currency: string }) {
  const summary = summarizeIncome(profile);
  const de = locale === "de";
  const money = (value: number) => new Intl.NumberFormat(de ? "de-AT" : "en-GB", { style: "currency", currency }).format(value);
  if (summary.annualAverage && summary.monthly <= 0) return null;
  if (summary.annualAverage) return <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-5 text-amber-900" data-income-average-note>{de ? "Dein gespeichertes Jahresnetto wird durch 12 geteilt. Das ist ein Monatsdurchschnitt, nicht dein tatsächliches Monatsgehalt. Für verlässliche Monatsplanung trage dein reguläres Monatsnetto und Sonderzahlungen getrennt ein." : "Your saved annual net income is divided by 12. This is a monthly average, not your actual monthly salary. For monthly planning, enter your regular monthly net income and extra payments separately."}</p>;
  if (!summary.extras.length) return null;
  const content = <>
    <dl className="income-annual-metrics">
      <div><dt>{de ? `Jahresnetto ${summary.year}` : `Net income · ${summary.year}`}</dt><dd>{money(summary.annual)}</dd></div>
      <div><dt>{de ? "Monatsdurchschnitt" : "Monthly average"}</dt><dd>{money(summary.average)}</dd></div>
    </dl>
    <p className="mt-2 text-[12px] leading-5 text-[#65716d]">{de ? "Inklusive geplanter Sonderzahlungen." : "Including planned extra payments."}</p>
    {compact ? <p className="mt-2 text-[12px] leading-5 text-[#65716d]">{de ? "Geplante Einnahmen im jeweiligen Monat, kein heute verfügbares Geld." : "Planned income for its payment month, not money available today."}</p> : <p className="mt-2 text-[12px] leading-5 text-[#65716d]">{de ? "Die Übersicht oben rechnet mit deinem regulären Monatsnetto. Extras sind geplante Einnahmen im angegebenen Monat, kein heute verfügbares Geld. Nach Eingang sind sie Teil deines Kontostands für „Bis zum Gehalt“." : "The overview above uses your regular monthly net income. Extras are planned income in the specified month, not money available today. Once received, they are part of the balance you enter for ‘To payday’."}</p>}
    <ul className="income-extra-payments mt-3 space-y-2 text-[12px]">{[...summary.extras].sort((a,b) => (a.year ?? summary.year)-(b.year ?? summary.year) || a.month-b.month).map(extra => <li key={extra.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1"><span className="min-w-0 break-words">{incomeExtraLabel(extra.kind, locale)} · {incomeMonthLabel(extra.month, locale)} {extra.year ?? (de ? "jährlich" : "every year")}</span><span className="whitespace-nowrap font-medium tabular-nums">+ {money(extra.amount)}</span></li>)}</ul>
  </>;
  const title = de ? "Jahresüberblick" : "Annual overview";
  return <div className="mt-4 rounded-xl bg-[#f4f6f2] p-4" data-income-extras-summary><h3 className="text-[13px] font-semibold">{title}</h3>{content}</div>;
}
