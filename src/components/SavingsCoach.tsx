"use client";
import FormActions from "@/components/FormActions";

import { useRef } from "react";
import { savingsActionKey } from "@eavesence/core/savingsPlan";
import { nextSavingsPayment } from "@eavesence/core/proValue";
import { useSavingsCoach } from "@eavesence/core/useSavingsCoach";
import { costReviewTip, calendarReview } from "@eavesence/core/homeValue";
import {
  monthlyCost,
  type HouseholdCost,
} from "@eavesence/core/householdCosts";
import type { PlanningData } from "@eavesence/core/planning";
import type {
  SavingsAction,
  SavingsPlanInput,
} from "@eavesence/core/savingsPlan";
const field =
  "home-planning-field min-h-11 min-w-0 w-full rounded-xl border border-[#cddbd0] bg-white px-3 text-[#17211f]";
const button = "eavesence-pill-button home-dashboard-action";
export default function SavingsCoach({
  input,
  actions,
  data,
  onSave,
  onActions,
  onConfirm,
  onReview,
  onNavigate,
  currency,
  mode = "all",
  locale,
}: {
  input: SavingsPlanInput;
  actions: SavingsAction[];
  data?: PlanningData;
  onSave: (p: PlanningData) => void | Promise<void>;
  onActions: (a: SavingsAction[]) => void | Promise<void>;
  onConfirm: (a: SavingsAction) => void | Promise<void>;
  onReview: (c: HouseholdCost) => void;
  onNavigate?: (question: "payday" | "savings" | "progress") => void;
  currency: string;
  mode?: "all" | "opportunities" | "progress";
  locale: "de" | "en";
}) {
  const de = locale === "de",
    t = (a: string, b: string) => (de ? a : b),
    p = useSavingsCoach(input, actions, data, onSave, onActions, onConfirm, de),
    money = (n: number) =>
      new Intl.NumberFormat(de ? "de-AT" : "en-GB", {
        style: "currency",
        currency,
      }).format(n);
  function remind(c: HouseholdCost) {
    const date = c.cancellationDeadline;
    if (!date) return;
    const url = URL.createObjectURL(
      new Blob([calendarReview(c.name, date, de)], { type: "text/calendar" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "eavesence-review.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const cadence = (frequency: HouseholdCost["frequency"]) => (de ? {weekly:"pro Woche",monthly:"pro Monat",quarterly:"alle 3 Monate","half-yearly":"alle 6 Monate",yearly:"pro Jahr"} : {weekly:"per week",monthly:"per month",quarterly:"every 3 months","half-yearly":"every 6 months",yearly:"per year"})[frequency];
  const changes = useRef<HTMLElement>(null), confirmedResult = useRef<HTMLDivElement>(null);
  async function confirmAndReveal(action: SavingsAction) { if (await p.confirm(action)) requestAnimationFrame(()=>{confirmedResult.current?.scrollIntoView({block:"center",behavior:"instant"});confirmedResult.current?.querySelector("button")?.focus({preventScroll:true});}); }
  function reviewPlans() { requestAnimationFrame(() => { changes.current?.scrollIntoView({block:"center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"}); changes.current?.querySelector<HTMLElement>("h4")?.focus({preventScroll:true}); }); }
  const nextSaving = nextSavingsPayment(actions,p.today);
  const shownActions = actions.filter(a => mode === "all" || (mode === "progress" ? a.status === "confirmed" : a.status !== "confirmed"));
  return (
    <section
      data-savings-coach={mode}
      className={mode === "progress" ? "finance-workspace min-w-0" : mode === "opportunities" ? "mt-5 min-w-0" : "mt-5 rounded-xl border border-[#dfe5dd] bg-white p-4"}
      aria-label={mode === "progress" ? t("03 · Was habe ich tatsächlich eingespart?", "03 · What have I actually saved?") : t("02 · Wo kann ich realistisch sparen?", "02 · Where can I realistically save?")}
    >
      {mode === "progress" ? <div className="planning-section-intro"><h2 className="site-section-title">{t("Deine bestätigte Ersparnis", "Your confirmed savings")}</h2><p>{shownActions.length ? t("Hier zählen nur umgesetzte und bestätigte Kostenänderungen.", "Only cost changes you have made and confirmed count here.") : t("Noch keine bestätigte Ersparnis. Plane eine konkrete Kostenänderung und bestätige sie erst nach der Umsetzung.", "No confirmed savings yet. Plan a specific cost change and confirm it after it happens.")}</p></div> : mode === "all" ? <h3 className="site-card-title">{t("Welche Kosten möchtest du senken?", "Which cost would you like to lower?")}</h3> : null}
      {mode === "all" && <p className="mt-1 text-[13px] text-[#52605b]">{t("Starte mit dem Vorschlag oder wähle einen anderen Kostenposten.", "Start with the suggestion or choose another cost.")}</p>}
      {mode !== "progress" && p.planned.length > 0 && <div className="mt-3 rounded-xl border border-[#bfd3c5] bg-[#f4f6f2] p-4 text-[13px]" data-pro-next-step>
        <p className="font-semibold">{t("Dein nächster Schritt", "Your next step")}: {t("Vorhaben umsetzen", "Put your plan into action")}</p>
        <p className="mt-1">{p.planned[0].name}{p.planned.length > 1 ? ` + ${p.planned.length - 1}` : ""}{p.plannedMonthly > 0 ? ` · ${t("Vorgemerktes Sparpotenzial", "Planned savings potential")}: ${money(p.plannedMonthly)} ${t("pro Monat im Durchschnitt", "per month on average")}` : ""}</p>
        <p className="mt-1 text-[#52605b]">{t("Erst Tarif ändern oder kündigen. Bestätige danach die Umsetzung – vorher zählt nichts als eingespart.", "Change the plan or cancel the cost first. Then confirm it happened — nothing counts as saved beforehand.")}</p>
        <button type="button" className={`${button} mt-3`} onClick={reviewPlans}>{t("Vorgemerkte Änderung prüfen", "Review planned change")}</button>
      </div>}
      {p.justConfirmed && mode !== "progress" && onNavigate && <div ref={confirmedResult} className="mt-3 rounded-xl bg-[#eefbf3] p-4 text-[13px]"><p className="font-semibold">{t("Jetzt siehst du, wann die Ersparnis zählt.", "Now see when the saving counts.")}</p><button type="button" className={`${button} mt-3`} onClick={()=>onNavigate("progress")}>{t("Ergebnis ansehen", "See the result")}</button></div>}
      {p.notice && <p role="status" className="mt-3 text-[13px] text-[#087a45]">{p.notice}</p>}
      {p.outdated.some(a => shownActions.includes(a)) && (
        <p role="status" className="mt-3 text-[13px] text-amber-800">
          {t(
            "Die Kosten zu einer Änderung wurden erneut geändert. Prüfe die Angaben; betroffene Änderungen zählen bis dahin nicht zur Ersparnis.",
            "A cost linked to a change has changed again. Review the entries; affected changes are excluded from savings until then.",
          )}
        </p>
      )}
      {(mode === "progress" || mode !== "opportunities" && actions.some((a) => a.status === "confirmed")) && (
        <div className="finance-result-surface planning-task-card planning-savings-result" data-planning-tone={shownActions.some(action => action.status === "confirmed" && !p.outdated.includes(action)) ? "result" : "setup"}>
          <p className="planning-card-label">
            {t(
              "Bis heute eingespart",
              "Saved so far",
            )}
          </p>
          <p className="planning-card-amount">{money(p.totals.scheduled)}</p>
          <p className="planning-card-description">
            {t(
              "Aus bestätigten Änderungen mit erreichten Zahlungsterminen berechnet. Kein Bankabgleich.",
              "Calculated from confirmed changes with payment dates already reached. No bank verification.",
            )}
          </p>
        </div>
      )}
      {mode === "progress" && p.confirmedMonthly > 0 && <p className="mt-3 text-[13px] text-[#52605b]">{t("Bestätigt: laufende Kosten durchschnittlich", "Confirmed: recurring costs reduced by")} {money(p.confirmedMonthly)} {t("pro Monat weniger.", "per month on average.")}</p>}
      {mode === "progress" && nextSaving && <p className="mt-2 text-[13px] text-[#52605b]">{t("Nächste berechnete Ersparnis", "Next calculated saving")}: {money(nextSaving.amount)} {t("am", "on")} {new Intl.DateTimeFormat(de?"de-AT":"en-GB",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${nextSaving.date}T00:00:00Z`))}. {t("Sie zählt erst ab diesem Zahlungstermin.", "It counts from that payment date.")}</p>}
      {mode !== "progress" && !p.tasks.length && !actions.length && (
        <p className="mt-3 text-[13px]">
          {t(
            "Noch keine passende Aufgabe. Ergänze Abos, Energie- oder Versicherungskosten; wir zeigen keine erfundenen Einsparungen.",
            "No matching task yet. Add subscriptions, energy or insurance costs; we do not invent savings.",
          )}
        </p>
      )}
      <div className={mode === "opportunities" ? "finance-workspace planning-task-card savings-review-layout" : undefined} data-has-selection={!!p.selected}>
      {mode === "opportunities" && <aside className="centre-savings-summary finance-result-surface">
        <div className="centre-result-card" data-savings-centre-result>
          <p>{t("Geplantes Plus pro Monat", "Planned extra per month")}</p>
          <strong>{p.preview ? money(p.preview.totalDifference / 12) : p.plannedMonthly > 0 ? money(p.plannedMonthly) : "—"}</strong>
          <p>{t("Monatsdurchschnitt. Geplant, noch nicht eingespart.", "Monthly average. Planned, not saved yet.")}</p>
        </div>
        <dl className="centre-breakdown"><div><dt>{t("Bestätigt pro Monat", "Confirmed per month")}</dt><dd>{money(p.confirmedMonthly)}</dd></div><div><dt>{t("Bis heute eingespart", "Saved so far")}</dt><dd>{money(p.totals.scheduled)}</dd></div></dl>
      </aside>}
      <div className={mode === "opportunities" ? "savings-choice finance-dark-panel" : undefined} hidden={mode === "progress"}>
      {mode !== "progress" && p.reviewable.length > 0 && <p className="mt-4 text-[13px] font-semibold">{t("1 · Kostenposten auswählen", "1 · Choose one cost")}</p>}
      {mode !== "progress" && !p.selected && <div className="mt-3 grid max-w-lg items-start gap-3">
        {p.tasks.slice(0,1).map((c) => (
          <article
            key={c.id}
            className="finance-result-surface min-w-0 rounded-xl bg-[#f4f6f2] p-3 text-[13px]"
          >
            <h4 className="font-bold">{c.name}</h4>
            <p className="mt-1">
              {money(c.amount)} {cadence(c.frequency)}{c.frequency !== "monthly" && ` · ${money(monthlyCost(c.amount,c.frequency))} ${t("im Monatsdurchschnitt", "monthly average")}`}
            </p>
            <p className="mt-2 text-[#52605b]">
              {c.cancellationDeadline && <span className="block">{t("Frist", "Deadline")}: {c.cancellationDeadline}</span>}
              {costReviewTip(c.category, de, c.frequency)}
            </p>
            <button type="button" className={`${button} mt-3`} disabled={p.busy} onClick={()=>p.choose(c)}>{t("Änderung planen", "Plan change")}</button>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-[#dfe5dd] pt-3"><button type="button" className={button} onClick={()=>onReview(c)}>{t("Angaben prüfen", "Review details")}</button>{c.cancellationDeadline&&c.cancellationDeadline>=p.today&&<button type="button" className={button} onClick={()=>remind(c)}>{t("Kalender-Erinnerung", "Calendar reminder")}</button>}<button type="button" className={button} disabled={p.busy} onClick={()=>p.later(c)}>{t("In 30 Tagen erneut prüfen", "Review again in 30 days")}</button></div>

          </article>
        ))}
      </div>}
      {mode !== "progress" && p.reviewable.length > 0 && <label className="mt-4 grid max-w-lg gap-1 text-[13px] font-semibold">{t("Kostenänderung testen · Kosten auswählen", "Test a cost change · choose a cost")}<select className={field} value={p.selected?.id ?? ""} onChange={e => {const cost=input.costs.find(c=>c.id===e.target.value);if(cost)p.choose(cost);else p.cancel();}}><option value="">{t("Kosten auswählen", "Choose a cost")}</option>{p.reviewable.map(c=><option key={c.id} value={c.id}>{c.name} · {money(c.amount)}</option>)}</select></label>}
      {mode === "opportunities" && p.selected && <aside className="savings-selected-cost finance-result-surface">
        <p className="font-semibold">{p.selected.name}</p>
        <p className="mt-1">{money(p.selected.amount)} {cadence(p.selected.frequency)}</p>
        <p className="mt-3 text-[#52605b]">{costReviewTip(p.selected.category, de, p.selected.frequency)}</p>
      </aside>}
      </div>
      {mode === "opportunities" && !p.selected && <aside className="home-month-tool-card finance-dark-panel centre-savings-guide"><p className="centre-eyebrow">{t("So geht’s weiter", "Your next step")}</p><h3 className="centre-context-title">{t("Eine Ausgabe auswählen", "Choose one cost")}</h3><p className="centre-caption">{t("Neuen Preis testen, Änderung vormerken und erst nach der Umsetzung bestätigen.", "Try a new price, save your plan and confirm only after making the change.")}</p></aside>}
      <div className={mode === "opportunities" ? "savings-edit finance-dark-panel" : undefined} hidden={mode === "progress" || !p.selected}>
      {mode !== "progress" && p.selected && <p className="mt-4 text-[13px] font-semibold">{t("2 · Neuen Betrag prüfen und vormerken", "2 · Check a new amount and save the plan")}</p>}
      {mode !== "progress" && p.selected && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void p.plan().then(saved => { if (saved) reviewPlans(); });
          }}
          className="mt-3 grid gap-3 rounded-xl bg-[#eefbf3] p-3 sm:grid-cols-2"
        >
          <h4 hidden={mode === "opportunities"} className="font-bold text-[13px] sm:col-span-2">
            {p.selected.name} · {t("Bisher", "Current")}:{" "}
            {money(p.selected.amount)} {cadence(p.selected.frequency)}
          </h4>
          <label className="grid gap-1 text-[13px]">
            {t(
              "Neuer Betrag je Zahlung (0 = fällt weg)",
              "New amount per payment (0 = ends)",
            )}
            <input
              inputMode="decimal"
              className={field}
              value={p.amount}
              onChange={(e) => p.setAmount(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-[13px]">
            {t("Wirksam ab Monat", "Effective from month")}
            <input
              type="month"
              min={p.today.slice(0,7)}
              className={field}
              value={p.effective}
              onChange={(e) => p.setEffective(e.target.value)}
            />
          </label>
          <p className="text-[13px] sm:col-span-2">
            {t(
              "Das ist zuerst ein Vorhaben. Deine laufenden Kosten ändern sich erst nach deiner Bestätigung.",
              "This starts as a plan. Your recurring costs change only after you confirm it happened.",
            )}
          </p>
          {p.preview && <div className="finance-result-surface rounded-xl border border-[#cddbd0] bg-white p-3 text-[13px] sm:col-span-2" data-pro-payday-impact>
            <p className="font-semibold">{t("Hilft das schon bis zum nächsten Gehalt?", "Will this help before your next payday?")}</p>
            {p.cashImpact ? <><p className="mt-2">{t("Zusätzlich verfügbar", "Extra money available")}: {money(p.cashImpact.before)} → <strong>{money(p.cashImpact.after)}</strong></p><p className="mt-1 text-[#52605b]">{p.cashImpact.saving > 0 ? t(`Wenn die Änderung rechtzeitig umgesetzt wird: ${money(p.cashImpact.saving)} mehr bis zum Gehalt.`, `If the change happens in time: ${money(p.cashImpact.saving)} more until payday.`) : t("Bis zu diesem Gehalt ändert sich nichts. Bezahlte und bekannte Rechnungen bleiben gleich; spätere Termine zählen danach.", "No change before this payday. Paid and existing invoices stay the same; later payment dates count afterwards.")}</p></> : <><p className="mt-2 text-[#52605b]">{t("Für diesen Vergleich fehlen aktuelle Angaben unter „Bis zum Gehalt“. Dein Vorhaben kannst du trotzdem speichern.", "This comparison needs current entries under Until payday. You can still save your plan.")}</p></>}
            <p className="mt-2 text-[#52605b]">{t("Vorschau – dein Kontostand und deine Kosten bleiben unverändert.", "Preview — your balance and costs stay unchanged.")}</p>
          </div>}
          {p.preview && <p role="status" className="text-[12px] text-[#52605b] sm:col-span-2" data-savings-impact>{money(p.preview.totalDifference)} {t("in den nächsten 12 Planungsmonaten. Geplant, noch nicht eingespart.", "over the next 12 planning months. Planned, not saved yet.")}</p>}
          <FormActions className="sm:col-span-2">
            <button type="button" className={button} onClick={p.cancel}>
              {t("Abbrechen", "Cancel")}
            </button>
            <button type="submit" className={`${button} planning-submit-action`} disabled={p.busy}>
              {t("Änderung vormerken", "Save this plan")}
            </button>
          </FormActions>
        </form>
      )}
      </div>
      </div>
      {mode !== "progress" && shownActions.length > 0 && <p className="mt-4 text-[13px] font-semibold">{t("3 · Erst nach der Umsetzung bestätigen", "3 · Confirm only after it happens")}</p>}
      {shownActions.length > 0 && (
        <section
          ref={changes} data-savings-changes
          className={mode === "progress" ? "finance-result-surface mt-4 border-t border-[#dfe5dd] p-4" : "finance-result-surface mt-3 rounded-xl border border-[#dfe5dd] p-3"}
        >
          <h4 tabIndex={-1} className="text-[13px] font-bold outline-none">
            {mode === "progress" ? t("Bestätigte Änderungen & Schätzungen", "Confirmed changes & estimates") : t("Vorgemerkte Änderungen", "Planned changes")}{" "}
            · {shownActions.length}
          </h4>
          {shownActions.map((a) => (
            <article
              key={savingsActionKey(a)}
              className={mode === "progress" ? "mt-3 rounded-xl bg-[#f4f6f2] p-3 text-[13px]" : "mt-3 rounded-xl border border-[#dfe5dd] p-3 text-[13px]"}
            >
              <strong>{a.name}</strong>
              <p className="mt-1">
                {money(a.originalAmount)} → {money(a.newAmount)} ·{" "}
                {t("ab", "from")} {new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", {month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${a.effectiveMonth}-01T00:00:00Z`))} ·{" "}
                {p.outdated.includes(a)
                  ? t(
                      "Angaben geändert – bitte prüfen",
                      "Entries changed — review needed",
                    )
                  : a.status === "confirmed"
                    ? t(
                        "Bestätigt, Kosten aktualisiert",
                        "Confirmed, costs updated",
                      )
                    : t(
                        "Vorgemerkt, noch keine Ersparnis",
                        "Planned, no confirmed saving yet",
                      )}
              </p>
              {a.status === "planned" && a.effectiveMonth > p.today.slice(0,7) && <p className="mt-2 text-[#52605b]">{t("Bestätigen ist ab dem gewählten Monat möglich. Bis dahin bleiben deine laufenden Kosten unverändert.", "Confirmation becomes available in the chosen month. Your recurring costs stay unchanged until then.")}</p>}
              {a.endedOn && <p className="mt-2 text-[#52605b]">{t("Historie: bis", "History: until")} {a.endedOn}. {t("Spätere Kostenänderung; bisherige Ersparnis bleibt erhalten.", "Later cost change; earlier savings are preserved.")}</p>}
              {p.outdated.includes(a) && input.costs.some(c => c.id === a.costId) && (
                <button
                  type="button"
                  className={`${button} mt-2`}
                  onClick={() => {
                    const cost = input.costs.find((c) => c.id === a.costId);
                    if (cost) onReview(cost);
                  }}
                >
                  {t("Kosten prüfen", "Review cost")}
                </button>
              )}
              <FormActions className="mt-2">
              {a.status === "planned" && (
                <button
                  type="button"
                  className={`${button} mt-2 mr-2`}
                  disabled={p.busy}
                  onClick={() => void p.discard(a)}
                >
                  {t("Vorhaben verwerfen", "Discard plan")}
                </button>
              )}
              {a.status === "planned" &&
                !p.outdated.includes(a) && a.effectiveMonth <= p.today.slice(0, 7) && (
                  <button
                    type="button"
                    className={`${button} mt-2`}
                    disabled={p.busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          t(
                            `Ist die Änderung wirklich umgesetzt? ${a.name} wird in deinen Kosten ${a.newAmount === 0 ? "entfernt" : "auf " + money(a.newAmount) + " geändert"}.`,
                            `Has this change actually happened? ${a.name} will ${a.newAmount === 0 ? "be removed from your costs" : "change to " + money(a.newAmount) + " in your costs"}.`,
                          ),
                        )
                      )
                        void confirmAndReveal(a);
                    }}
                  >
                    {t(
                      "Umgesetzt – Kosten aktualisieren",
                      "Done — update costs",
                    )}
                  </button>
                )}
              </FormActions>
            </article>
          ))}
      {mode === "progress" && p.totals.estimated > 0 && <p className="mt-3 text-[13px] text-[#52605b]">{t("Zusätzlich ohne Zahlungstermin geschätzt", "Additional estimate without payment dates")}: {money(p.totals.estimated)}. {t("Nicht im Betrag oben enthalten.", "Not included in the amount above.")}</p>}
      {mode === "progress" && p.confirmedMonthly > 0 && <p className="mt-2 text-[13px] text-[#52605b]">{t("Deine bestätigten Änderungen senken die laufenden Kosten durchschnittlich um", "Your confirmed changes reduce recurring costs by an average of")} {money(p.confirmedMonthly)} {t("pro Monat. Das ist kein zusätzlich bereits angesparter Betrag.", "per month. This is not extra money already saved.")}</p>}
        </section>
      )}
      {mode === "progress" && onNavigate && <div className="planning-detail-navigation planning-progress-navigation">
        <button type="button" onClick={()=>onNavigate("payday")}>{t("Geld bis zum Gehalt neu prüfen", "Review your money until payday")}</button>
        <button type="button" onClick={()=>onNavigate("savings")}>{t("Eine Sparmöglichkeit prüfen", "Review a savings opportunity")}</button>
      </div>}
      {onNavigate && mode === "opportunities" && <button type="button" className={`${button} mt-3`} onClick={() => onNavigate("progress")}>{t("Erreichte Ersparnis ansehen", "View achieved savings")}</button>}
      {p.error && (
        <p role="alert" className="mt-2 text-[13px] text-red-700">
          {p.error}
        </p>
      )}
    </section>
  );
}
