"use client";

import { localToday } from "@eavesence/core/homeValue";
import { monthChecklist, paymentKey, paymentIsPaid } from "@eavesence/core/paymentChecklist";
import { readPlanningData, type PlanningData } from "@eavesence/core/planning";
import type { HouseholdCost } from "@eavesence/core/householdCosts";

type Props = {
  costs: HouseholdCost[];
  month: string;
  planning?: PlanningData;
  selectedKey: string | null;
  locale: "de" | "en";
  currency: string;
  onEdit: (cost: HouseholdCost, trigger: HTMLButtonElement) => void;
  onPlan: () => void;
  onClose: () => void;
};

export default function HomePaymentContext({ costs, month, planning, selectedKey, locale, currency, onEdit, onPlan, onClose }: Props) {
  const de = locale === "de";
  const t = (a: string, b: string) => de ? a : b;
  const data = readPlanningData(planning);
  const list = monthChecklist(costs, month, data.paidPayments, data.actualPayments);
  const selected = list.payments.find(p => paymentKey({costId:p.cost.id, month:p.month, date:p.date}) === selectedKey);
  const closed = data.monthReviews?.some(review => review.month === month);
  const payment = selected ?? (closed ? undefined : list.nextDue ?? list.open[0]);
  const money = (value: number) => new Intl.NumberFormat(de ? "de-AT" : "en-GB", {style:"currency",currency}).format(value);
  const frequencies = {
    monthly: t("Jeden Monat", "Every month"), yearly: t("Jedes Jahr", "Every year"),
    quarterly: t("Alle 3 Monate", "Every 3 months"), "half-yearly": t("Alle 6 Monate", "Every 6 months"),
    weekly: t("Jede Woche", "Every week"), daily: t("Jeden Tag", "Every day"),
  };
  return <div className="home-month-tool-card" data-home-payment-context>
    <div className="centre-editor-heading"><p className="centre-eyebrow">{selected ? t("Zahlungsdetails", "Payment details") : t("Als Nächstes", "Up next")}</p>{selected && <button type="button" className="centre-close-action" aria-label={t("Details schließen", "Close details")} onClick={onClose}>×</button>}</div>
    {payment ? <>
      <h3 tabIndex={-1} data-home-context-heading className="centre-context-title outline-none">{payment.cost.name}</h3>
      <p className="centre-context-amount">{payment.estimated ? t("ca. ", "approx. ") : ""}{money(payment.cost.amount)}</p>
      <p className="centre-caption">{payment.date ? new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", {day:"numeric",month:"long",timeZone:"UTC"}).format(new Date(`${payment.date}T00:00:00Z`)) : t("Zahlungstermin fehlt", "Payment date missing")}{" · "}{paymentIsPaid(payment, data.paidPayments ?? []) ? t("Bezahlt", "Paid") : closed ? t("Monat abgeschlossen", "Month closed") : t("Noch offen", "Still unpaid")}{!closed && payment.date && payment.date < localToday() && !paymentIsPaid(payment, data.paidPayments ?? []) ? ` · ${t("überfällig", "overdue")}` : ""}</p>
      <dl className="centre-detail"><dt>{t("Wiederholung", "Repeats")}</dt><dd>{frequencies[payment.cost.frequency]}</dd></dl>
      <button type="button" onClick={event => onEdit(costs.find(cost => cost.id === payment.cost.id) ?? payment.cost,event.currentTarget)} className="eavesence-pill-button home-dashboard-action home-outlined-action">{t("Kosten bearbeiten", "Edit cost")}</button>
      {payment.cost.variableAmount && <p className="centre-caption mt-2">{t("Den tatsächlichen Rechnungsbetrag änderst du direkt in der Zahlungsliste.", "Edit the actual invoice amount directly in the payment list.")}</p>}
    </> : <><h3 className="centre-context-title">{closed ? t("Monat abgeschlossen", "Month closed") : list.payments.length ? t("Alles abgehakt", "All checked off") : t("Keine Zahlungen geplant", "No payments scheduled")}</h3><p className="centre-caption">{t("Wähle einen Eintrag für Details oder ergänze weitere Kosten.", "Select an entry for details or add another cost.")}</p></>}
    <div className="centre-context-link"><button type="button" className="centre-text-action" onClick={onPlan}>{t("Bis zum Gehalt planen", "Plan until payday")} <span aria-hidden="true">→</span></button><p className="centre-caption">{t("Mit deinem aktuellen Kontostand.", "Using your current account balance.")}</p></div>
  </div>;
}
