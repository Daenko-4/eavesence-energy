"use client";

export type PlanningPeriod = "payday" | "forecast" | "budget";
export type SavingsTool = "change" | "switch" | "annual" | "reserves" | "invoices";

type Props<T extends string> = {
  locale: "de" | "en";
  kind: "period" | "tool";
  value: T;
  onChange: (value: T) => void;
};

export default function PlanningNavigation<T extends PlanningPeriod | SavingsTool>({ locale, kind, value, onChange }: Props<T>) {
  const de = locale === "de";
  const choices: [PlanningPeriod | SavingsTool, string][] = kind === "period" ? [
    ["payday", de ? "Bis zum Gehalt" : "Until payday"],
    ["forecast", de ? "90-Tage-Vorschau" : "90-day outlook"],
    ["budget", de ? "Monatsbudget" : "Monthly budget"],
  ] : [
    ["change", de ? "Kosten prüfen" : "Review costs"],
    ["switch", de ? "Tarifwechsel" : "Switch plans"],
    ["annual", de ? "Jahresabo" : "Annual plans"],
    ["reserves", de ? "Rücklagen" : "Bill reserves"],
    ["invoices", de ? "Planbeträge" : "Invoice amounts"],
  ];
  return <div role="group" aria-label={kind === "period" ? de ? "Planungszeitraum wählen" : "Choose planning period" : de ? "Sparwerkzeug wählen" : "Choose savings tool"} className="planning-detail-navigation" data-planning-navigation={kind}>
    {choices.map(([key, label]) => <button type="button" key={key} aria-pressed={value === key} data-planning-choice={key} onClick={() => onChange(key as T)}>{label}</button>)}
  </div>;
}
