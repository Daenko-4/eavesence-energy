"use client";
import { useRef } from "react";

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
  const chooser = useRef<HTMLDetailsElement>(null);
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
  const selected = choices.find(([key]) => key === value)?.[1];
  const defaultChoice = kind === "period" ? "payday" : "change";
  return <details ref={chooser} className="home-disclosure planning-options" data-planning-options={kind}>
    <summary>
      {value === defaultChoice
        ? kind === "period" ? de ? "Andere Planung wählen" : "Choose another plan" : de ? "Weitere Vergleiche" : "More comparisons"
        : `${selected} · ${de ? "ändern" : "change"}`}
    </summary>
    <p className="planning-options-hint">{kind === "period"
      ? de ? "Möchtest du länger vorausplanen? Wähle genau eine Ansicht." : "Want to plan further ahead? Choose one view."
      : de ? "Nur bei Bedarf: ein konkretes Angebot vergleichen oder eine größere Rechnung vorbereiten." : "When needed: compare a specific offer or prepare for a larger bill."}</p>
    <div role="group" aria-label={kind === "period" ? de ? "Planungszeitraum wählen" : "Choose planning period" : de ? "Sparwerkzeug wählen" : "Choose savings tool"} className="planning-detail-navigation" data-planning-navigation={kind}>
      {choices.map(([key,label]) => <button type="button" key={key} aria-pressed={value === key} data-planning-choice={key} onClick={() => { onChange(key as T); if (chooser.current) { chooser.current.open = false; chooser.current.querySelector("summary")?.focus(); } }}>{label}</button>)}
    </div>
  </details>;
}
