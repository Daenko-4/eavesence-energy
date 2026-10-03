"use client";
import { useState } from "react";
import { useCashWindow } from "@eavesence/core/useCashWindow";
import type { PlanningData } from "@eavesence/core/planning";
import type { SavingsPlanInput } from "@eavesence/core/savingsPlan";
const field =
  "home-planning-field h-11 min-w-0 w-full rounded-xl border border-[#cddbd0] bg-white px-3 text-[#17211f]";
export default function PaydayPanel({
  input,
  data,
  onSave,
  currency,
  onReviewCost,
  locale,
}: {
  input: SavingsPlanInput;
  data?: PlanningData;
  onSave: (data: PlanningData) => void | Promise<void>;
  onReviewCost?: (cost: SavingsPlanInput["costs"][number]) => void;
  currency: string;
  locale: "de" | "en";
}) {
  const de = locale === "de",
    t = (a: string, b: string) => (de ? a : b),
    p = useCashWindow(input, data, onSave, de),
    [open, setOpen] = useState(false);
  const money = (n: number) =>
    new Intl.NumberFormat(de ? "de-AT" : "en-GB", {
      style: "currency",
      currency,
    }).format(n);
  const day = (s: string) =>
    new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(new Date(`${s}T00:00:00Z`));
  const complete =
      !!p.forecast &&
      p.forecast.missingDates === 0 &&
      p.forecast.remaining !== null;
  return (
    <section
      className="mt-5 min-w-0 overflow-hidden rounded-[1.45rem] border border-[#32363b]"
      aria-label={t("Dein verfügbarer Spielraum", "Your available budget")}
    >
      <div className="bg-[#24272c] p-5 text-white sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#72dca3]">
          {complete
            ? t("01 · BIS ZUM NÄCHSTEN GEHALT", "01 · UNTIL YOUR NEXT PAYDAY")
            : t("01 · BIS ZUM NÄCHSTEN GEHALT", "01 · UNTIL YOUR NEXT PAYDAY")}
        </p>
        <h2 className="mt-2 site-section-title">
          {complete
            ? t(
                `Was bleibt bis ${day(p.cash!.payday)}?`,
                `What is left until ${day(p.cash!.payday)}?`,
              )
            : t("Was kann ich bis zum nächsten Gehalt ausgeben?", "What can I spend until my next payday?")}
        </h2>
        <p className="mt-2 text-[28px] font-extrabold tracking-tight">
          {complete
            ? money(p.forecast!.remaining!)
            : "—"}
        </p>
        <p className="mt-2 max-w-2xl text-[12px] leading-5 text-[#d1d7d4]">
          {complete
            ? t(
                "Voraussichtlich nach anstehenden Zahlungen, Alltag und dem Geld, das unberührt bleiben soll.",
                "Estimated after upcoming payments, everyday spending and money you want to keep untouched.",
              )
            : t(
                p.forecast ? "Dein Guthaben ist erfasst. Ergänze fehlende Zahlungstermine und eine Alltagsschätzung, bevor wir einen vollständigen Spielraum anzeigen." : "Trage dein heutiges Guthaben, den nächsten Gehaltstermin und deine erwarteten Alltagsausgaben ein. Bestehende Angaben kannst du aktualisieren.",
                p.forecast ? "Your balance is recorded. Add missing payment dates and an everyday-spending estimate before we show a complete available budget." : "Enter today’s balance, your next payday and expected everyday spending. You can update existing entries.",
              )}
        </p>
        {p.forecast && <div className="mt-3 flex flex-wrap gap-2">{input.costs.filter(c => !c.nextDueDate).map(c => <button key={c.id} type="button" className="min-h-11 rounded-full border border-[#72dca3] px-3 text-[12px] font-semibold" onClick={() => onReviewCost?.(c)}>{c.name} · {t("Termin ergänzen", "Add date")}</button>)}</div>}
        {p.forecast?.everyday === null && <p className="mt-2 text-[12px] text-[#ffe1a8]">{t("Noch offen: Alltag bis zum Gehalt. Öffne die Rechnung und ergänze den Betrag; 0 ist möglich.", "Still missing: everyday spending until payday. Open the calculation and add an amount; 0 is allowed.")}</p>}
        {p.stale && (
          <p className="mt-2 text-[12px] text-[#ffe1a8]">
            {t(
              "Guthaben ist von einem früheren Tag. Bitte aktualisieren.",
              "Your balance is from an earlier day. Please update it.",
            )}
          </p>
        )}
        <button
          type="button"
          aria-expanded={open}
          className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#72dca3] px-4 text-[12px] font-bold text-[#17211f]"
          onClick={() => setOpen(!open)}
        >
          {open
            ? t("Einklappen", "Collapse")
            : p.cash
              ? t(
                  "Guthaben aktualisieren / Rechnung ansehen",
                  "Update balance / see calculation",
                )
              : t("Bis zum nächsten Gehalt planen", "Plan until next payday")}
        </button>
      </div>
      {open && (
        <div className="space-y-3 bg-white p-4 sm:p-5">
          <p className="text-[12px] text-[#52605b]">
            {t(
              "Guthaben nach bereits bezahlten Rechnungen eintragen. Zahlungen für heute zählen noch als offen; verschiebe deren nächste Fälligkeit, wenn sie schon bezahlt sind. Das nächste Gehalt wird hier noch nicht dazugezählt.",
              "Enter your balance after bills already paid. Today’s payments count as pending; move their next due date if already paid. Your next salary is not added yet.",
            )}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await p.save();
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label className="row-span-3 grid grid-rows-subgrid gap-1 text-[12px] leading-4">
              <span>{t("Heute verfügbares Guthaben", "Balance available today")}</span>
              <input
                className={field}
                inputMode="decimal"
                aria-label={t(
                  "Heute verfügbares Guthaben",
                  "Balance available today",
                )}
                aria-describedby="payday-balance-help"
                value={p.balance}
                onChange={(e) => p.setBalance(e.target.value)}
              />
              <span id="payday-balance-help" className="text-[#52605b]">
                {t(
                  "Geld auf den Konten, aus denen du die nächsten Ausgaben bezahlst.",
                  "Money in the accounts used to pay your upcoming expenses.",
                )}
              </span>
            </label>
            <label className="row-span-3 grid grid-rows-subgrid gap-1 text-[12px] leading-4">
              <span>{t("Nächstes Gehalt am", "Next payday")}</span>
              <input
                className={field}
                type="date"
                value={p.payday}
                min={p.today}
                onChange={(e) => p.setPayday(e.target.value)}
              />
              <span aria-hidden="true" />
            </label>
            <label className="row-span-3 grid grid-rows-subgrid gap-1 text-[12px] leading-4">
              <span>{t("Davon unberührt lassen", "Keep untouched from this balance")}</span>
              <input
                className={field}
                inputMode="decimal"
                aria-label={t(
                  "Davon unberührt lassen",
                  "Keep untouched from this balance",
                )}
                aria-describedby="payday-protected-help"
                value={p.protectedAmount}
                onChange={(e) => p.setProtected(e.target.value)}
              />
              <span id="payday-protected-help" className="text-[#52605b]">
                {t(
                  "Zum Beispiel Notgroschen oder Sparziele. Geld für unten aufgeführte Rechnungen hier nicht erneut eintragen.",
                  "For example emergency savings or goals. Do not include money for bills listed below again.",
                )}
              </span>
            </label>
            <label className="row-span-3 grid grid-rows-subgrid gap-1 text-[12px] leading-4">
              <span>{t(
                "Alltag bis zum Gehalt (optional)",
                "Everyday spending until payday (optional)",
              )}</span>
              <input
                className={field}
                inputMode="decimal"
                value={p.everyday}
                onChange={(e) => p.setEveryday(e.target.value)}
                placeholder={t(
                  "Leer = aus Monatsschätzung berechnen",
                  "Blank = use monthly estimate",
                )}
              />
              <span aria-hidden="true" />
            </label>
            <button
              type="submit"
              disabled={p.busy}
              className="eavesence-pill-button home-primary-action sm:justify-self-start"
            >
              {t(
                "Guthaben bestätigen & berechnen",
                "Confirm balance & calculate",
              )}
            </button>
          </form>
          {p.error && (
            <p role="alert" className="text-[12px] text-red-700">
              {p.error}
            </p>
          )}
          {p.forecast && (
            <div
              aria-live="polite"
              className="rounded-xl bg-[#f4f6f2] p-3 text-[13px]"
            >
              <dl className="space-y-2">
                {[
                  [t("Heutiges Guthaben", "Today’s balance"), p.cash!.balance],
                  [
                    t("− Zahlungen bis zum Gehalt", "− Payments until payday"),
                    p.forecast.fixed,
                  ],
                  [
                    p.forecast.estimated
                      ? t(
                          "− Alltag (anteilig geschätzt)",
                          "− Everyday spending (estimated share)",
                        )
                      : t(
                          "− Alltag (deine Eingabe)",
                          "− Everyday spending (your entry)",
                        ),
                    p.forecast.everyday,
                  ],
                  [
                    t("− Unberührt lassen", "− Keep untouched"),
                    p.cash!.protected,
                  ],
                ].map(([label, n]) => (
                  <div
                    key={String(label)}
                    className="flex justify-between gap-3"
                  >
                    <dt>{label}</dt>
                    <dd>{n === null ? "—" : money(Number(n))}</dd>
                  </div>
                ))}
              </dl>
              {p.forecast.missingDates > 0 && (
                <p className="mt-2 font-semibold text-amber-800">
                  {t(
                    `${p.forecast.missingDates} Kosten ohne Zahlungstermin fehlen. Noch kein vollständiger Spielraum.`,
                    `${p.forecast.missingDates} undated costs are missing. Available budget is incomplete.`,
                  )}
                </p>
              )}
              {p.forecast.everyday === null && (
                <p className="mt-2 font-semibold">
                  {t(
                    "Alltagsschätzung fehlt.",
                    "Everyday-spending estimate is missing.",
                  )}
                </p>
              )}
              <p className="mt-2 text-[11px] text-[#52605b]">
                {t(
                  "Vorhandene Sparziele und Rücklagen werden nicht automatisch abgezogen. Trage nur den Teil deines Guthabens ein, der unberührt bleiben soll.",
                  "Saved goals and reserves are not automatically deducted. Enter only the part of this balance you want to keep untouched.",
                )}
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer font-semibold">
                  {t("Anstehende Zahlungen", "Upcoming payments")} ·{" "}
                  {p.forecast.payments.length}
                </summary>
                {p.forecast.payments.map((pay, i) => (
                  <p key={i} className="mt-2 flex justify-between gap-3">
                    <span>
                      {day(pay.date)} · {pay.cost.name}
                    </span>
                    <span>{money(pay.cost.amount)}</span>
                  </p>
                ))}
                {!p.forecast.payments.length && (
                  <p>
                    {t(
                      "Keine datierten Zahlungen in diesem Zeitraum.",
                      "No dated payments in this period.",
                    )}
                  </p>
                )}
              </details>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
