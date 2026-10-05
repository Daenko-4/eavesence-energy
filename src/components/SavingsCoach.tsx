"use client";
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
  onNavigate?: (question: "savings" | "progress") => void;
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
  const shownActions = actions.filter(a => mode === "all" || (mode === "progress" ? a.status === "confirmed" : a.status !== "confirmed"));
  return (
    <section
      className="mt-5 rounded-xl border border-[#dfe5dd] bg-white p-4"
      aria-label={mode === "progress" ? t("03 · Was habe ich tatsächlich eingespart?", "03 · What have I actually saved?") : t("02 · Wo kann ich realistisch sparen?", "02 · Where can I realistically save?")}
    >
      <h3 className="site-card-title">
        {mode === "progress" ? t("03 · Was habe ich tatsächlich eingespart?", "03 · What have I actually saved?") : t("02 · Wo kann ich realistisch sparen?", "02 · Where can I realistically save?")}
      </h3>
      <p className="mt-1 text-[12px] text-[#52605b]">
        {mode === "progress" ? t("Nur umgesetzte und bestätigte Änderungen zählen. Der Betrag ist aus deinen Angaben berechnet, nicht über ein Bankkonto nachgewiesen.", "Only completed, confirmed changes count. The amount is calculated from your entries, not verified against a bank account.") : t(
          "Wähle einen Kostenposten, prüfe einen günstigeren Betrag und merke die Änderung vor. Erst nach der Umsetzung bestätigen.",
          "Choose one cost, check a lower amount and save the plan. Confirm it only after the change happens.",
        )}
      </p>
      {mode !== "progress" && p.plannedMonthly > 0 && <div className="mt-3 rounded-xl bg-[#eefbf3] p-3 text-[12px]"><p className="font-semibold">{t("Vorgemerktes Sparpotenzial", "Planned savings potential")}: {money(p.plannedMonthly)} {t("pro Monat", "per month")}</p><p className="mt-1">{t("Noch nicht erreicht. Bestätige jede Änderung erst nach der Umsetzung.", "Not achieved yet. Confirm each change only after it happens.")}</p></div>}
      {p.notice && <p role="status" className="mt-3 text-[12px] text-[#087a45]">{p.notice}</p>}
      {mode === "progress" && !shownActions.length && <p className="mt-3 text-[12px] text-[#52605b]">{t("Noch keine bestätigte Ersparnis. Plane eine konkrete Kostenänderung und bestätige sie erst nach der Umsetzung.", "No confirmed savings yet. Plan a specific cost change and confirm it after it happens.")}</p>}
      {p.outdated.some(a => shownActions.includes(a)) && (
        <p role="status" className="mt-3 text-[12px] text-amber-800">
          {t(
            "Die Kosten zu einer Änderung wurden erneut geändert. Prüfe die Angaben; betroffene Änderungen zählen bis dahin nicht zur Ersparnis.",
            "A cost linked to a change has changed again. Review the entries; affected changes are excluded from savings until then.",
          )}
        </p>
      )}
      {mode !== "opportunities" && actions.some((a) => a.status === "confirmed") && (
        <div className="mt-3 rounded-xl bg-[#24272c] p-3 text-white">
          <p className="text-[12px] text-[#d1d7d4]">
            {t(
              "Bis heute anhand bestätigter Änderungen und Zahlungstermine eingespart",
              "Saved to date from confirmed changes and payment dates",
            )}
          </p>
          <p className="mt-1 text-xl font-extrabold">{money(p.totals.scheduled)}</p>
          <p className="mt-1 text-[11px] text-[#d1d7d4]">
            {t(
              "Aus deinen Bestätigungen und Zahlungsterminen berechnet, nicht anhand von Kontobuchungen geprüft.",
              "Calculated from your confirmations and payment dates, not verified against bank transactions.",
            )}
          </p>
        </div>
      )}
      {mode !== "progress" && !p.tasks.length && !actions.length && (
        <p className="mt-3 text-[12px]">
          {t(
            "Noch keine passende Aufgabe. Ergänze Abos, Energie- oder Versicherungskosten; wir zeigen keine erfundenen Einsparungen.",
            "No matching task yet. Add subscriptions, energy or insurance costs; we do not invent savings.",
          )}
        </p>
      )}
      {mode !== "progress" && input.costs.length > 0 && <p className="mt-4 text-[12px] font-semibold">{t("1 · Kostenposten auswählen", "1 · Choose one cost")}</p>}
      {mode !== "progress" && input.costs.length > 0 && <label className="mt-4 grid max-w-lg gap-1 text-[12px] font-semibold">{t("Kostenänderung testen · Kosten auswählen", "Test a cost change · choose a cost")}<select className={field} value={p.selected?.id ?? ""} onChange={e => {const cost=input.costs.find(c=>c.id===e.target.value);if(cost)p.choose(cost);else p.cancel();}}><option value="">{t("Kosten auswählen", "Choose a cost")}</option>{input.costs.map(c=><option key={c.id} value={c.id}>{c.name} · {money(c.amount)}</option>)}</select></label>}
      <div className="mt-3 grid max-w-lg items-start gap-3">
        {(mode === "progress" || p.selected ? [] : p.tasks.slice(0,1)).map((c) => (
          <article
            key={c.id}
            className="min-w-0 rounded-xl bg-[#f4f6f2] p-3 text-[12px]"
          >
            <h4 className="font-bold">{c.name}</h4>
            <p className="mt-1">
              {money(monthlyCost(c.amount, c.frequency))}{" "}
              {t("im Monatsdurchschnitt", "monthly average")}
            </p>
            <p className="mt-2 text-[#52605b]">
              {c.cancellationDeadline && <span className="block">{t("Frist", "Deadline")}: {c.cancellationDeadline}</span>}
              {costReviewTip(c.category, de, c.frequency)}
            </p>
            <button type="button" className={`${button} mt-3`} disabled={p.busy} onClick={()=>p.choose(c)}>{t("Änderung planen", "Plan change")}</button>
            <details className="home-disclosure mt-3 rounded-xl border border-[#dfe5dd] p-3"><summary className="cursor-pointer text-[12px] font-semibold">{t("Weitere Optionen", "More options")}</summary><div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} onClick={()=>onReview(c)}>{t("Angaben prüfen", "Review details")}</button>{c.cancellationDeadline&&c.cancellationDeadline>=p.today&&<button type="button" className={button} onClick={()=>remind(c)}>{t("Kalender-Erinnerung", "Calendar reminder")}</button>}<button type="button" className={button} disabled={p.busy} onClick={()=>p.later(c)}>{t("In 30 Tagen erneut prüfen", "Review again in 30 days")}</button></div></details>

          </article>
        ))}
      </div>
      {mode !== "progress" && p.selected && <p className="mt-4 text-[12px] font-semibold">{t("2 · Neuen Betrag prüfen und vormerken", "2 · Check a new amount and save the plan")}</p>}
      {mode !== "progress" && p.selected && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void p.plan();
          }}
          className="mt-3 grid gap-3 rounded-xl bg-[#eefbf3] p-3 sm:grid-cols-2"
        >
          <h4 className="font-bold text-[13px] sm:col-span-2">
            {p.selected.name} · {t("Bisher", "Current")}:{" "}
            {money(p.selected.amount)}
          </h4>
          <label className="grid gap-1 text-[12px]">
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
          <label className="grid gap-1 text-[12px]">
            {t("Wirksam ab Monat", "Effective from month")}
            <input
              type="month"
              className={field}
              value={p.effective}
              onChange={(e) => p.setEffective(e.target.value)}
            />
          </label>
          <p className="text-[12px] sm:col-span-2">
            {t(
              "Das ist zuerst ein Vorhaben. Deine laufenden Kosten ändern sich erst nach deiner Bestätigung.",
              "This starts as a plan. Your recurring costs change only after you confirm it happened.",
            )}
          </p>
          {p.preview && <p role="status" className="rounded-xl bg-white p-3 text-[12px] sm:col-span-2">{t("In den nächsten 12 Planungsmonaten voraussichtlich", "Estimated over the next 12 planning months")}: <strong>{money(p.preview.totalDifference)}</strong> {t("weniger Ausgaben. Zahlungstermine und Startmonat sind berücksichtigt. Noch keine bestätigte Ersparnis.", "lower spending. Payment dates and the start month are included. This is not a confirmed saving yet.")}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={button} disabled={p.busy}>
              {t("Änderung vormerken", "Save this plan")}
            </button>
            <button type="button" className={button} onClick={p.cancel}>
              {t("Abbrechen", "Cancel")}
            </button>
          </div>
        </form>
      )}
      {mode !== "progress" && shownActions.length > 0 && <p className="mt-4 text-[12px] font-semibold">{t("3 · Erst nach der Umsetzung bestätigen", "3 · Confirm only after it happens")}</p>}
      {shownActions.length > 0 && (
        <details
          className="home-disclosure mt-3 rounded-xl border border-[#dfe5dd] p-3"
          open={mode !== "progress"}
        >
          <summary className="cursor-pointer text-[13px] font-bold">
            {mode === "progress" ? t("Bestätigte Änderungen & Schätzungen", "Confirmed changes & estimates") : t("Vorgemerkte Änderungen", "Planned changes")}{" "}
            · {shownActions.length}
          </summary>
          {shownActions.map((a) => (
            <article
              key={a.costId}
              className="mt-3 rounded-xl border border-[#dfe5dd] p-3 text-[12px]"
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
                        void p.confirm(a);
                    }}
                  >
                    {t(
                      "Umgesetzt – Kosten aktualisieren",
                      "Done — update costs",
                    )}
                  </button>
                )}
            </article>
          ))}
      {mode === "progress" && p.totals.estimated > 0 && <p className="mt-3 text-[12px] text-[#52605b]">{t("Zusätzlich ohne Zahlungstermin geschätzt", "Additional estimate without payment dates")}: {money(p.totals.estimated)}. {t("Nicht im Betrag oben enthalten.", "Not included in the amount above.")}</p>}
      {mode === "progress" && p.confirmedMonthly > 0 && <p className="mt-2 text-[12px] text-[#52605b]">{t("Deine bestätigten Änderungen senken die laufenden Kosten durchschnittlich um", "Your confirmed changes reduce recurring costs by an average of")} {money(p.confirmedMonthly)} {t("pro Monat. Das ist kein zusätzlich bereits angesparter Betrag.", "per month. This is not extra money already saved.")}</p>}
        </details>
      )}
      {onNavigate && mode !== "all" && <button type="button" className={`${button} mt-3`} onClick={() => onNavigate(mode === "progress" ? "savings" : "progress")}>{mode === "progress" ? t("Eine Sparmöglichkeit prüfen", "Review a savings opportunity") : t("Erreichte Ersparnis ansehen", "View achieved savings")}</button>}
      {p.error && (
        <p role="alert" className="mt-2 text-[12px] text-red-700">
          {p.error}
        </p>
      )}
    </section>
  );
}
