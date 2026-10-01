"use client";
import { useSavingsCoach } from "@eavesence/core/useSavingsCoach";
import { calendarReview } from "@eavesence/core/homeValue";
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
  currency,
  locale,
}: {
  input: SavingsPlanInput;
  actions: SavingsAction[];
  data?: PlanningData;
  onSave: (p: PlanningData) => void | Promise<void>;
  onActions: (a: SavingsAction[]) => void | Promise<void>;
  onConfirm: (a: SavingsAction) => void | Promise<void>;
  onReview: (c: HouseholdCost) => void;
  currency: string;
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
  return (
    <section
      className="mt-5 rounded-xl border border-[#dfe5dd] bg-white p-4"
      aria-label={t("Dein Sparassistent", "Your savings assistant")}
    >
      <h3 className="site-card-title">
        {t("Dein Sparassistent", "Your savings assistant")}
      </h3>
      <p className="mt-1 text-[12px] text-[#52605b]">
        {t(
          "Prüfen → Änderung vormerken → Umsetzung bestätigen. Höchstens drei nächste Aufgaben. Du entscheidest, was sinnvoll ist.",
          "Review → plan a change → confirm it happened. Up to three next tasks. You decide what makes sense.",
        )}
      </p>
      {actions.some((a) => a.status === "confirmed") && (
        <div className="mt-3 rounded-xl bg-[#24272c] p-3 text-white">
          <p className="text-[12px] text-[#d1d7d4]">
            {t(
              "Seit deinen bestätigten Änderungen rechnerisch weniger ausgegeben",
              "Estimated lower spending since your confirmed changes",
            )}
          </p>
          <p className="mt-1 text-xl font-extrabold">{money(p.totals.total)}</p>
          <p className="mt-1 text-[11px] text-[#d1d7d4]">
            {t(
              "Aus deinen Bestätigungen und Zahlungsterminen berechnet, nicht anhand von Kontobuchungen geprüft. Ohne Termin wird anteilig geschätzt.",
              "Calculated from your confirmations and payment dates, not verified against bank transactions. Undated costs use a prorated estimate.",
            )}
          </p>
        </div>
      )}
      {!p.tasks.length && !actions.length && (
        <p className="mt-3 text-[12px]">
          {t(
            "Noch keine passende Aufgabe. Ergänze Abos, Energie- oder Versicherungskosten; wir zeigen keine erfundenen Einsparungen.",
            "No matching task yet. Add subscriptions, energy or insurance costs; we do not invent savings.",
          )}
        </p>
      )}
      <div className="mt-3 grid items-start gap-3 md:grid-cols-3">
        {p.tasks.map((c) => (
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
              {c.cancellationDeadline
                ? t(
                    `Frist: ${c.cancellationDeadline}. Prüfe vor einer Verlängerung, ob du die Leistung noch brauchst.`,
                    `Deadline: ${c.cancellationDeadline}. Review whether you still need it before renewal.`,
                  )
                : t(
                    "Nutzt du die Leistung noch? Prüfe einen günstigeren Tarif oder ob sie wegfallen kann.",
                    "Still using this service? Check a lower price or whether you can stop it.",
                  )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={button}
                onClick={() => onReview(c)}
              >
                {t("Angaben prüfen", "Review details")}
              </button>
              <button
                type="button"
                className={button}
                disabled={p.busy}
                onClick={() => p.choose(c)}
              >
                {t("Änderung planen", "Plan change")}
              </button>
              {c.cancellationDeadline && c.cancellationDeadline >= p.today && (
                <button
                  type="button"
                  className={button}
                  onClick={() => remind(c)}
                >
                  {t("Kalender-Erinnerung", "Calendar reminder")}
                </button>
              )}
              <button
                type="button"
                className="min-h-9 text-[12px] text-[#52605b]"
                disabled={p.busy}
                onClick={() => p.later(c)}
              >
                {t("In 30 Tagen erneut prüfen", "Review again in 30 days")}
              </button>
            </div>
          </article>
        ))}
      </div>
      {p.selected && (
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
      {actions.length > 0 && (
        <details
          className="mt-3"
          open={actions.some(
            (a) =>
              a.status === "planned" && a.effectiveMonth <= p.today.slice(0, 7),
          )}
        >
          <summary className="cursor-pointer text-[13px] font-bold">
            {t("Vorhaben & bestätigte Änderungen", "Plans & confirmed changes")}{" "}
            · {actions.length}
          </summary>
          {actions.map((a) => (
            <article
              key={a.costId}
              className="mt-3 rounded-xl border border-[#dfe5dd] p-3 text-[12px]"
            >
              <strong>{a.name}</strong>
              <p className="mt-1">
                {money(a.originalAmount)} → {money(a.newAmount)} ·{" "}
                {t("ab", "from")} {a.effectiveMonth} ·{" "}
                {a.status === "confirmed"
                  ? t(
                      "Bestätigt, Kosten aktualisiert",
                      "Confirmed, costs updated",
                    )
                  : t(
                      "Vorgemerkt, noch keine Ersparnis",
                      "Planned, no confirmed saving yet",
                    )}
              </p>
              {a.status === "planned" &&
                a.effectiveMonth <= p.today.slice(0, 7) && (
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
        </details>
      )}
      {p.error && (
        <p role="alert" className="mt-2 text-[12px] text-red-700">
          {p.error}
        </p>
      )}
    </section>
  );
}
