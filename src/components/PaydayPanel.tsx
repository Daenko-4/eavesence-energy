"use client";
import QuickCheck from "./QuickCheck";
import { useId, useRef, useState } from "react";
import { usePaymentChecklist } from "@eavesence/core/usePaymentChecklist";
import { paymentKey } from "@eavesence/core/paymentChecklist";
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
  onSavings,
  locale,
}: {
  input: SavingsPlanInput;
  data?: PlanningData;
  onSave: (data: PlanningData) => void | Promise<void>;
  onSavings?: () => void;
  onReviewCost?: (cost: SavingsPlanInput["costs"][number]) => void;
  currency: string;
  locale: "de" | "en";
}) {
  const de = locale === "de",
    t = (a: string, b: string) => (de ? a : b),
    p = useCashWindow(input, data, onSave, de),
    [open, setOpen] = useState(false);
  const checklist = usePaymentChecklist(input.costs,data,onSave,de);
  const [billsOpen,setBillsOpen] = useState(false), billsId = useId();
  const balanceInput = useRef<HTMLInputElement>(null), billsButton = useRef<HTMLButtonElement>(null);
  const reviewBalance = () => { setOpen(true); requestAnimationFrame(() => { balanceInput.current?.scrollIntoView({block:"center"}); balanceInput.current?.focus({preventScroll:true}); }); };
  const reviewPayments = () => { setBillsOpen(true); requestAnimationFrame(() => { billsButton.current?.scrollIntoView({block:"center"}); billsButton.current?.focus({preventScroll:true}); }); };
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
  const calculationRows = p.forecast ? [
    [t("Aktueller Kontostand", "Current account balance"), p.cash!.balance],
    [t("− Noch offene Rechnungen", "− Unpaid bills"), p.forecast.fixed],
    [p.forecast.estimated
      ? t("− Alltag (anteilig geschätzt)", "− Everyday spending (estimated share)")
      : t("− Alltag (deine Eingabe)", "− Everyday spending (your entry)"), p.forecast.everyday],
    [t("− Reserve", "− Money kept in reserve"), p.cash!.protected],
  ] : [];
  return (
    <section
      className="mt-5 min-w-0 overflow-hidden rounded-[1.45rem] border border-[#32363b]"
      aria-label={t("Dein verfügbarer Spielraum", "Your available budget")}
    >
      <div className="bg-[#24272c] p-5 text-white sm:p-6">
        <p className="text-[13px] font-bold uppercase tracking-widest text-[#72dca3]">
          {complete
            ? t("01 · BIS ZUM NÄCHSTEN GEHALT", "01 · UNTIL YOUR NEXT PAYDAY")
            : t("01 · BIS ZUM NÄCHSTEN GEHALT", "01 · UNTIL YOUR NEXT PAYDAY")}
        </p>
        <h2 className="mt-2 site-section-title">
          {complete
            ? t(
                `Zusätzlicher Spielraum bis ${day(p.cash!.payday)}`,
                `Extra available until ${day(p.cash!.payday)}`,
              )
            : t("Was kann ich bis zum nächsten Gehalt ausgeben?", "What can I spend until my next payday?")}
        </h2>
        <p className="mt-2 text-[28px] font-extrabold tracking-tight">
          {complete
            ? money(p.forecast!.remaining!)
            : "—"}
        </p>
        <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#d1d7d4]">
          {complete
            ? t(
                "Zusätzlich verfügbar, nachdem offene Rechnungen, eingeplante Alltagsausgaben und deine Reserve abgezogen sind.",
                "Extra money available after unpaid bills, planned everyday spending and your reserve have been deducted.",
              )
            : t(
                p.forecast ? `Dein Kontostand ist erfasst. Noch offen: ${[p.forecast.missingDates > 0 ? "Zahlungstermine" : "", p.forecast.everyday === null ? "Alltagsschätzung" : ""].filter(Boolean).join(" und ")}. Ergänze diese Angaben für einen vollständigen Spielraum.` : "Kontostand eintragen, nächsten Gehaltstag wählen und Alltag bis dahin schätzen. Offene Rechnungen aus My Home berücksichtigen wir automatisch.",
                p.forecast ? `Your balance is recorded. Still missing: ${[p.forecast.missingDates > 0 ? "payment dates" : "", p.forecast.everyday === null ? "everyday-spending estimate" : ""].filter(Boolean).join(" and ")}. Add these to see a complete available budget.` : "Enter your account balance, choose your next payday and estimate everyday spending until then. We include unpaid bills from My Home automatically.",
              )}
        </p>

        {complete && p.forecast!.remaining! < 0 && <p className="mt-2 text-[13px] text-[#ffe1a8]">{t(`Es fehlen voraussichtlich ${money(-p.forecast!.remaining!)}. Prüfe offene Zahlungen und deine Alltagsschätzung.`, `Estimated shortfall: ${money(-p.forecast!.remaining!)}. Review pending payments and your everyday estimate.`)}</p>}
        {p.forecast && p.forecast.overdue > 0 && <p className="mt-2 text-[13px] text-[#ffe1a8]">{t(`${p.forecast.overdue} frühere Zahlungen dieses Monats sind noch nicht abgehakt und deshalb enthalten. Bereits bezahlt? In der Monatscheckliste abhaken und Guthaben erneut bestätigen.`, `${p.forecast.overdue} earlier payments this month are still unchecked and included. Already paid? Check them off in the monthly checklist, then confirm your balance again.`)}</p>}
        {p.forecast && <div className="mt-3 flex flex-wrap gap-2">{input.costs.filter(c => !c.nextDueDate).map(c => <button key={c.id} type="button" className="min-h-11 rounded-full border border-[#72dca3] px-3 text-[13px] font-semibold" onClick={() => onReviewCost?.(c)}>{c.name} · {t("Termin ergänzen", "Add date")}</button>)}</div>}
        {p.forecast?.everyday === null && <p className="mt-2 text-[13px] text-[#ffe1a8]">{t("Noch offen: Alltag bis zum Gehalt. Öffne die Rechnung und ergänze den Betrag; 0 ist möglich.", "Still missing: everyday spending until payday. Open the calculation and add an amount; 0 is allowed.")}</p>}
        {p.stale && (
          <p className="mt-2 text-[13px] text-[#ffe1a8]">
            {t(
              "Bitte aktualisiere deinen Kontostand. Seit dem letzten Tag oder einer abgehakten Zahlung kann er sich geändert haben.",
              "Please update your account balance. It may have changed since the last day or a payment was checked off.",
            )}
          </p>
        )}
        <button
          type="button"
          aria-expanded={open}
          className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#72dca3] px-4 text-[13px] font-bold text-[#17211f]"
          onClick={() => setOpen(!open)}
        >
          {open
            ? t("Einklappen", "Collapse")
            : p.cash
              ? t(
                  "Kontostand aktualisieren",
                  "Update account balance",
                )
              : t("Spielraum berechnen", "Calculate available money")}
        </button>
      </div>
      {!open && complete && <div className="bg-white p-4 sm:p-5"><p className="mb-2 text-[13px] font-semibold">{t("So entsteht dein Spielraum", "How your available money is calculated")}</p><dl className="space-y-2 text-[13px]">{calculationRows.map(([label, value]) => <div key={String(label)} className="flex justify-between gap-3"><dt>{label}</dt><dd className="shrink-0 font-semibold">{value === null ? "—" : money(Number(value))}</dd></div>)}</dl>{p.forecast!.remaining!>=0&&<p className="mt-3 text-[13px] text-[#52605b]">{t(`Rechnerisch zusätzlich ${money(p.forecast!.remaining!/p.forecast!.days)} pro Tag. Alltag ist schon abgezogen.`,`Equivalent to ${money(p.forecast!.remaining!/p.forecast!.days)} extra per day. Everyday spending is already deducted.`)}</p>}</div>}
      {p.bills.length > 0 && <div className="border-t border-[#dfe5dd] bg-white p-4 sm:p-5">
        <button ref={billsButton} type="button" aria-expanded={billsOpen} aria-controls={billsId} onClick={()=>setBillsOpen(!billsOpen)} className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-[13px] font-semibold"><span>{t("Zahlungen bis zum Gehalt abhaken", "Check off payments until payday")} · {p.bills.filter(b=>!checklist.isPaid(b)).length} {t("offen", "unpaid")}</span><span aria-hidden="true" className={`text-xl text-[#28734d] transition-transform duration-200 motion-reduce:transition-none ${billsOpen?"-rotate-45":""}`}>+</span></button>
        <div id={billsId} hidden={!billsOpen}><p className="my-2 text-[13px] text-[#52605b]">{t("Bereits abgebucht oder bezahlt? Hier abhaken. Das Häkchen erscheint auch in deiner Monatscheckliste. Danach den aktuellen Kontostand bestätigen.", "Already debited or paid? Check it off here. The same checkmark appears in your monthly checklist. Then confirm your current account balance.")}</p><ul className="divide-y divide-[#e7ebe5]">{p.bills.map(b=>{const paid=checklist.isPaid(b);return <li key={paymentKey({costId:b.cost.id,month:b.month,date:b.date})}><label className="flex min-h-12 cursor-pointer items-center gap-3 py-2 text-[13px]"><input type="checkbox" checked={paid} disabled={checklist.busy} onChange={()=>void checklist.toggle(b)} aria-label={`${b.cost.name} · ${day(b.date)} · ${t("Bezahlt", "Paid")}`} className="h-5 w-5 shrink-0 accent-[#28734d]"/><span className={`min-w-0 flex-1 ${paid?"text-[#65716d] line-through":""}`}>{b.cost.name}<span className="block text-[13px] text-[#65716d]">{day(b.date)}</span></span><span className="shrink-0">{money(b.cost.amount)}</span></label></li>})}</ul>{checklist.error&&<p role="alert" className="mt-2 text-[13px] text-red-700">{checklist.error}</p>}</div>
      </div>}
      <QuickCheck locale={locale} input={input} data={data} onSave={onSave} onBalance={reviewBalance} onPayments={reviewPayments} onSavings={onSavings} onReview={onReviewCost}/>
      {open && (
        <div className="space-y-3 bg-white p-4 sm:p-5">
          <p className="text-[13px] text-[#52605b]">
            {t(
              "Kontostand → offene Rechnungen abziehen → Alltag und Reserve abziehen → zusätzlicher Spielraum. Bereits bezahlte Rechnungen in der Monatscheckliste abhaken, damit sie nicht doppelt abgezogen werden. Das nächste Gehalt zählt noch nicht dazu.",
              "Account balance → subtract unpaid bills → subtract everyday spending and reserve → extra money available. Check off bills already paid in the monthly checklist so they are not deducted twice. Your next salary is not added yet.",
            )}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await p.save();
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label className="row-span-3 grid grid-rows-subgrid gap-1 text-[13px] leading-4">
              <span>{t("Aktueller Kontostand", "Current account balance")}</span>
              <input
                ref={balanceInput}
                className={field}
                inputMode="decimal"
                aria-label={t(
                  "Aktueller Kontostand",
                  "Current account balance",
                )}
                aria-describedby="payday-balance-help"
                value={p.balance}
                onChange={(e) => p.setBalance(e.target.value)}
              />
              <span id="payday-balance-help" className="text-[#52605b]">
                {t(
                  "So wie heute in deiner Banking-App. Offene Rechnungen noch nicht abziehen – das machen wir. Bei mehreren verwendeten Konten die Kontostände addieren; ein Minus ist möglich.",
                  "Use the balance shown in your banking app today. Do not subtract unpaid bills – we do that. If you use several accounts, add their balances; negative balances are allowed.",
                )}
              </span>
            </label>
            <label className="row-span-3 grid grid-rows-subgrid gap-1 text-[13px] leading-4">
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
            <label className="row-span-3 grid grid-rows-subgrid gap-1 text-[13px] leading-4">
              <span>{t("Reserve, die übrig bleiben soll (optional)", "Money to keep in reserve (optional)")}</span>
              <input
                className={field}
                inputMode="decimal"
                aria-label={t(
                  "Reserve, die übrig bleiben soll (optional)",
                  "Money to keep in reserve (optional)",
                )}
                aria-describedby="payday-protected-help"
                value={p.protectedAmount}
                onChange={(e) => p.setProtected(e.target.value)}
              />
              <span id="payday-protected-help" className="text-[#52605b]">
                {t(
                  "Ein Teil dieses Kontostands, den du behalten möchtest, z. B. ein Sicherheitspuffer. Rechnungen und Alltagsausgaben hier nicht nochmals eintragen. 0 ist möglich.",
                  "Part of this account balance you want to keep, e.g. a safety cushion. Do not include bills or everyday spending again. 0 is allowed.",
                )}
              </span>
            </label>
            <label className="row-span-3 grid grid-rows-subgrid gap-1 text-[13px] leading-4">
              <span>{t(
                "Alltagsausgaben bis zum Gehalt",
                "Everyday spending until payday",
              )}</span>
              <input
                className={field}
                inputMode="decimal"
                aria-label={t("Alltagsausgaben bis zum Gehalt", "Everyday spending until payday")}
                aria-describedby="payday-everyday-help"
                value={p.everyday}
                onChange={(e) => p.setEveryday(e.target.value)}
                placeholder={t(
                  "Leer = aus Monatsschätzung berechnen",
                  "Blank = use monthly estimate",
                )}
              />
              <span id="payday-everyday-help" className="text-[#52605b]">{t("Für Lebensmittel, Freizeit und andere Ausgaben bis zum Gehalt. Gespeicherte Rechnungen nicht nochmals eintragen. Leer = vorhandene Monatsschätzung verwenden; ohne Schätzung ist ein Betrag nötig, auch 0.", "For groceries, leisure and other spending until payday. Do not include saved bills again. Blank = use your existing monthly estimate; without one, enter an amount, including 0.")}</span>
            </label>
            <button
              type="submit"
              disabled={p.busy}
              className="eavesence-pill-button home-primary-action sm:justify-self-start"
            >
              {t(
                "Spielraum berechnen",
                "Calculate available money",
              )}
            </button>
          </form>
          {p.error && (
            <p role="alert" className="text-[13px] text-red-700">
              {p.error}
            </p>
          )}
          {p.forecast && (
            <div
              aria-live="polite"
              className="rounded-xl bg-[#f4f6f2] p-3 text-[13px]"
            >
              <dl className="space-y-2">
                {calculationRows.map(([label, n]) => (
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
              <p className="mt-2 text-[13px] text-[#52605b]">
                {t(
                  "Vorhandene Sparziele und Rücklagen werden nicht automatisch abgezogen. Trage nur den Teil deines Guthabens ein, der unberührt bleiben soll.",
                  "Saved goals and reserves are not automatically deducted. Enter only the part of this balance you want to keep untouched.",
                )}
              </p>

            </div>
          )}
        </div>
      )}
    </section>
  );
}
