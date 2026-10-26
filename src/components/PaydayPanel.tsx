"use client";
import { validDay } from "@eavesence/core/homeValue";
import FormActions from "@/components/FormActions";

import {PaymentAmountForm} from "./MonthlyPayments";
import QuickCheck from "./QuickCheck";
import { useEffect, useId, useRef, useState } from "react";
import { usePaymentChecklist } from "@eavesence/core/usePaymentChecklist";
import { paymentKey } from "@eavesence/core/paymentChecklist";
import { type CashInputField, useCashWindow } from "@eavesence/core/useCashWindow";
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
  onDateSave,
  locale,
}: {
  input: SavingsPlanInput;
  data?: PlanningData;
  onSave: (data: PlanningData) => void | Promise<void>;
  onSavings?: () => void;
  onDateSave?: (id:string,date:string)=>void|Promise<void>;
  onReviewCost?: (cost: SavingsPlanInput["costs"][number]) => void;
  currency: string;
  locale: "de" | "en";
}) {
  const de = locale === "de",
    t = (a: string, b: string) => (de ? a : b),
    p = useCashWindow(input, data, onSave, de),
    [open, setOpen] = useState(!data?.cash);
  const [step,setStep]=useState(0);
  const checklist = usePaymentChecklist(input.costs,data,onSave,de);
  const bills = open ? p.previewBills : p.bills;
  const balanceInput = useRef<HTMLInputElement>(null), billsHeading = useRef<HTMLHeadingElement>(null), resultHeading = useRef<HTMLHeadingElement>(null);
  const [reserveOpen, setReserveOpen] = useState(false);
  const paydayInput = useRef<HTMLInputElement>(null), everydayInput = useRef<HTMLInputElement>(null), protectedInput = useRef<HTMLInputElement>(null);
  function focusField(target: HTMLElement | null) {
    if (!target?.getClientRects().length) return;
    const rect = target.getBoundingClientRect();
    const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 96;
    const viewportBottom = window.visualViewport ? window.visualViewport.offsetTop + window.visualViewport.height : window.innerHeight;
    if (rect.top < headerBottom + 16 || rect.bottom > viewportBottom - 24) {
      target.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
    target.focus({ preventScroll: true });
  }
  useEffect(()=>{
    const focus=()=>requestAnimationFrame(()=>{const target=step===0?balanceInput.current:step===1?paydayInput.current:everydayInput.current;if(open&&target?.getClientRects().length)target.focus({preventScroll:true});});
    focus();window.addEventListener("eavesence:home-view",focus);return()=>window.removeEventListener("eavesence:home-view",focus);
  },[open,step]);
  function focusInvalid(field: CashInputField) {
    setStep(field === "balance" ? 0 : field === "payday" ? 1 : 2);
    if (field === "protected") setReserveOpen(true);
    requestAnimationFrame(() => {
      const element = ({balance: balanceInput, payday: paydayInput, everyday: everydayInput, protected: protectedInput})[field].current;
      focusField(element);
    });
  }
  const reviewBalance = () => { setStep(0);setOpen(true); requestAnimationFrame(() => { focusField(balanceInput.current); }); };
  const reviewPayments = () => { requestAnimationFrame(() => { focusField(billsHeading.current); }); };
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
  const shortfall = complete && p.forecast!.remaining! < 0;
  const calculationRows = p.forecast ? [
    [t("Aktueller Kontostand", "Current account balance"), p.cash!.balance],
    [t(p.forecast.estimatedBills ? "− Offene Rechnungen (mit Schätzungen)" : "− Noch offene Rechnungen", p.forecast.estimatedBills ? "− Unpaid bills (includes estimates)" : "− Unpaid bills"), p.forecast.fixed],
    [p.forecast.estimated
      ? t("− Alltag (anteilig geschätzt)", "− Everyday spending (estimated share)")
      : t("− Alltag (deine Eingabe)", "− Everyday spending (your entry)"), p.forecast.everyday],
    [t("− Reserve", "− Money kept in reserve"), p.cash!.protected],
  ] : [];
  const expired = !!p.cash && p.cash.payday <= p.today;
  const missingDates = p.forecast?.missingDates ?? 0;
  const missingEveryday = p.forecast?.everyday === null;
  const state = !p.cash ? "empty" : expired ? "expired" : p.stale ? "stale" : missingDates > 0 ? "dates" : missingEveryday ? "everyday" : complete ? "ready" : "incomplete";
  const currentResult = complete && state === "ready";
  const statusText = state === "empty"
    ? t("Was bleibt nach Rechnungen und Alltag? Mit drei Angaben siehst du es.", "What is left after bills and everyday spending? Find out with three entries.")
    : state === "expired"
      ? t("Wähle den nächsten Gehaltstag und bestätige deinen Kontostand.", "Choose your next payday and confirm your account balance.")
      : state === "stale"
        ? p.cash?.needsRefresh
          ? t("Zahlungen wurden geändert. Bestätige den Kontostand aus deiner Banking-App erneut.", "Payments changed. Confirm the balance from your banking app again.")
          : t(`Kontostand vom ${day(p.cash!.asOf)}. Für heute bitte erneut bestätigen.`, `Balance from ${day(p.cash!.asOf)}. Please confirm it for today.`)
        : missingDates > 0
          ? t(`${missingDates} Kosten ohne Zahlungstermin. Ergänze sie für eine vollständige Rechnung.`, `${missingDates === 1 ? "1 cost has" : `${missingDates} costs have`} no payment date. Add ${missingDates === 1 ? "it" : "them"} for a complete calculation.`)
          : missingEveryday
            ? t("Wie viel brauchst du bis zum Gehalt noch für den Alltag? Auch 0 ist möglich.", "How much do you still need for everyday spending until payday? 0 is allowed.")
            : currentResult
              ? shortfall
                ? t("Prüfe offene Rechnungen und deine Alltagsschätzung.", "Review unpaid bills and your everyday estimate.")
                : t("Rechnungen, Alltag und Reserve sind bereits abgezogen.", "Bills, everyday spending and reserve are already deducted.")
              : t("Ergänze deine Angaben für eine vollständige Rechnung.", "Complete your entries to calculate available money.");
  const quickBalance = step === 0 && !!p.cash && p.cash.payday > p.today && p.cash.everydayRemaining !== null;
  const editorId = useId();
  const editTarget = state === "expired" ? "payday" : state === "everyday" ? "everyday" : "balance";
  function editPlan() { setOpen(true); focusInvalid(editTarget); }
  return (
    <section
      className="finance-workspace mt-5 min-w-0 overflow-hidden rounded-[1.45rem] border border-[#dfe5dd] bg-white"
      aria-label={t("Dein verfügbarer Spielraum", "Your available budget")}
      data-payday-state={state}
      data-payday-shortfall={shortfall}
      data-pro-centre="payday"
      data-editor-open={open}
      data-payday-step={step}
    >
      <aside className="centre-cash-summary">      <div className="finance-result-surface planning-task-card bg-[#24272c] p-5 text-center text-white sm:p-6" data-payday-hero data-payday-tone={currentResult && !open ? "result" : "setup"}>
        <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#b8efcc]">
          {!open && p.forecast ? t(`Bis ${day(p.cash!.payday)} · ${p.forecast.days} ${p.forecast.days === 1 ? "Tag" : "Tage"}`, `Until ${day(p.cash!.payday)} · ${p.forecast.days} ${p.forecast.days === 1 ? "day" : "days"}`) : t("Dein Geld bis zum Gehalt", "Your money until payday")}
        </p>
        <h2 ref={resultHeading} tabIndex={-1} className="mt-2 site-section-title outline-none">
          {open ? quickBalance ? t("Kontostand", "Balance") : t("Dein Plan", "Your plan") : currentResult
            ? shortfall ? t("Voraussichtlich fehlen", "Estimated shortfall") : t("Zusätzlich verfügbar", "Extra money available")
            : state === "stale" ? t("Kontostand bestätigen", "Confirm account balance")
            : state === "expired" ? t("Neuen Zeitraum planen", "Plan your next pay period")
            : state === "dates" ? t("Zahlungstermine ergänzen", "Add payment dates")
            : state === "everyday" ? t("Alltag noch einplanen", "Add everyday spending")
            : t("Was bleibt bis zum Gehalt?", "What is left until payday?")}
        </h2>
        {currentResult && !open && <p className={`mt-2 text-[clamp(2rem,4vw,2.6rem)] font-extrabold leading-tight tracking-tight ${shortfall ? "text-[#ffd28c]" : "text-[#72dca3]"}`} data-payday-result aria-live="polite">{money(Math.abs(p.forecast!.remaining!))}</p>}
        <p hidden={open} className={`mx-auto mt-2 max-w-2xl text-[13px] leading-5 ${state === "stale" || state === "expired" || state === "dates" ? "text-[#ffe1a8]" : "text-[#d1d7d4]"}`} data-payday-status role="status">{statusText}</p>
        {state === "empty" && !open && <ol className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] text-[#d1d7d4]" aria-label={t("Drei Angaben", "Three entries")}>{[t("Kontostand", "Account balance"),t("Gehaltstag", "Payday"),t("Alltag", "Everyday spending")].map((label,index)=><li key={label} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#65716d] text-[11px]" aria-hidden="true">{index+1}</span>{label}</li>)}</ol>}
        {currentResult && !open && <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-white/15 pt-3 text-[12px]" data-payday-summary>{[[t("Rechnungen", "Bills"),p.forecast!.fixed],[t("Alltag", "Everyday"),p.forecast!.everyday!],[t("Reserve", "Reserve"),p.cash!.protected]].map(([label,value])=><div key={label}><dt className="text-[#b8c4bf]">{label}</dt><dd className="mt-1 break-words text-[13px] font-semibold">{money(Number(value))}</dd></div>)}</dl>}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <button type="button" aria-expanded={open} aria-controls={editorId} data-payday-edit-action className="inline-flex min-h-11 items-center gap-3 rounded-full bg-[#72dca3] px-4 text-[13px] font-semibold text-[#17211f]" onClick={() => open ? setOpen(false) : editPlan()}>
            {open ? t("Einklappen", "Collapse") : p.cash ? t("Kontostand aktualisieren", "Update account balance") : t("Verfügbares Geld berechnen", "Calculate available money")}
            <span aria-hidden="true" className={`site-disclosure-icon text-lg ${open ? "-rotate-45" : ""}`}>+</span>
          </button>
          {currentResult && !open && (p.forecast!.overdue > 0 || p.forecast!.estimatedBills > 0) && <button type="button" className="min-h-11 text-left text-[12px] text-[#ffe1a8] underline decoration-white/30 underline-offset-4" onClick={reviewPayments}>{[p.forecast!.overdue > 0 ? t(`${p.forecast!.overdue} frühere Zahlungen offen`, `${p.forecast!.overdue} earlier payments unchecked`) : "",p.forecast!.estimatedBills > 0 ? t(`${p.forecast!.estimatedBills} Beträge geschätzt`, `${p.forecast!.estimatedBills} estimated amounts`) : ""].filter(Boolean).join(" · ")}</button>}
        </div>
      </div>
</aside>
      <div className="centre-cash-main">      {open && (
        <div id={editorId} data-payday-editor className="finance-dark-panel space-y-3 bg-white p-4 sm:p-5">
          <form noValidate onSubmit={async (e) => {
            e.preventDefault();
            if(step < 2 && !quickBalance){const invalid=p.validateStep(step);if(invalid){focusInvalid(invalid);return;}setStep(step+1);requestAnimationFrame(()=>focusField(step===0?paydayInput.current:everydayInput.current));return;}
            if (await p.save(focusInvalid)) { setOpen(false); requestAnimationFrame(() => { focusField(resultHeading.current); }); }
          }} className="payday-editor" data-payday-form>
            <p className="text-[13px] font-semibold text-[#52605b]" aria-live="polite">{quickBalance ? t("Deine bisherige Planung bleibt übernommen.", "Your existing plan is carried over.") : t(`Schritt ${step+1} von 3`, `Step ${step+1} of 3`)}</p>
            <fieldset hidden={step !== 0} className="min-w-0">
              <legend className="mb-3 text-[14px] font-semibold">{t("Wie viel ist heute auf deinem Konto?", "How much is in your account today?")}</legend>
              <label className="grid max-w-sm gap-2 text-[13px]"><span>{t("Aktueller Kontostand", "Current account balance")}</span><input ref={balanceInput} aria-invalid={p.errorField === "balance"} className={field} inputMode="decimal" aria-describedby="payday-balance-help" value={p.balance} onChange={e=>p.setBalance(e.target.value)} placeholder={t("z. B. 1.200,00", "e.g. 1,200.00")}/></label>
              <p id="payday-balance-help" className="mt-2 text-[13px] leading-5 text-[#52605b]">{t("Wie in deiner Banking-App – noch nichts abziehen. Das nächste Gehalt zählt erst danach.", "Use today's balance from your banking app, before deductions. Your next salary is not included.")}</p>
            </fieldset>
            <fieldset hidden={step !== 1} className="payday-date-fields min-w-0">
              <legend className="mb-3 text-[14px] font-semibold">{t("Wann kommt dein nächstes Gehalt?", "When does your next salary arrive?")}</legend>
              <label className="grid max-w-sm gap-2 text-[13px]"><span>{t("Nächstes Gehalt am", "Next payday")}</span><input ref={paydayInput} aria-invalid={p.errorField === "payday"} className={field} type="date" min={new Date(Date.parse(p.today)+86400000).toISOString().slice(0,10)} max={new Date(Date.parse(p.today)+90*86400000).toISOString().slice(0,10)} value={p.payday} onChange={e=>p.setPayday(e.target.value)}/></label>
              <div className="payday-date-shortcuts" role="group" aria-label={t("Gehaltstag schnell wählen", "Choose payday quickly")}>{[7,14,28].map(days=><button key={days} type="button" onClick={()=>p.setPayday(new Date(Date.parse(p.today)+days*86400000).toISOString().slice(0,10))}>{t(`In ${days} Tagen`, `In ${days} days`)}</button>)}</div>
            </fieldset>
            <fieldset hidden={step !== 1} className="finance-result-surface payday-bill-fields min-w-0 rounded-xl border border-[#dfe5dd] bg-[#f4f6f2] p-4">
              <legend className="px-1 text-[14px] font-semibold">{t("Offene Rechnungen", "Unpaid bills")}</legend>
              {p.preview ? <>
                <div className="flex items-baseline justify-between gap-3 text-[13px]"><span>{t(`${p.preview.payments.length} ${p.preview.payments.length === 1 ? "Zahlung" : "Zahlungen"} bis ${day(p.payday)}`, `${p.preview.payments.length} ${p.preview.payments.length === 1 ? "payment" : "payments"} before ${day(p.payday)}`)}</span><strong className="shrink-0" data-payday-preview-bills>{money(p.preview.fixed)}</strong></div>
                <p className="mt-2 text-[13px] leading-5 text-[#52605b]">{t("Aus My Home übernommen. Bezahlte Rechnungen abhaken, damit wir sie nicht doppelt abziehen.", "Included from My Home. Check off paid bills so we do not deduct them twice.")}</p>
                {p.preview.overdue > 0 && <p className="mt-2 text-[13px] text-amber-800">{t(`${p.preview.overdue} frühere Zahlungen dieses Monats sind noch offen und enthalten.`, `${p.preview.overdue} earlier payments this month are still unchecked and included.`)}</p>}
                {p.preview.estimatedBills > 0 && <p className="mt-2 text-[13px] text-[#52605b]">{t(`${p.preview.estimatedBills} Beträge noch geschätzt.`, `${p.preview.estimatedBills} amounts are still estimates.`)}</p>}
                {bills.length > 0 && <button type="button" className="eavesence-pill-button home-dashboard-action mt-3" onClick={reviewPayments}>{t("Zahlungen prüfen", "Review payments")}</button>}
                {p.preview.missingDates > 0 && <div className="mt-3"><p className="text-[13px] font-semibold text-amber-800">{t("Bei diesen Kosten fehlt noch ein Zahlungstermin:", "These costs still need a payment date:")}</p>{input.costs.filter(c => !c.nextDueDate).map(c => <PaymentDateEntry key={c.id} cost={c} locale={locale} onSave={onDateSave} onReview={()=>onReviewCost?.(c)}/>)}</div>}
              </> : <p className="text-[13px] leading-5 text-[#52605b]">{t("Wähle oben deinen nächsten Gehaltstag. Dann zeigen wir, welche gespeicherten Rechnungen bis dahin noch anstehen.", "Choose your next payday above to see which saved bills are still due before then.")}</p>}
            </fieldset>
            <fieldset hidden={step !== 2} className="min-w-0">
              <legend className="mb-3 text-[14px] font-semibold">{t("Dein Alltag bis dahin", "Everyday spending until then")}</legend>
              <label className="grid max-w-sm gap-2 text-[13px]">
                <span>{t("Alltagsausgaben bis zum Gehalt", "Everyday spending until payday")}</span>
                <input ref={everydayInput} aria-invalid={p.errorField === "everyday"} className={field} inputMode="decimal" aria-describedby="payday-everyday-help" value={p.everyday} onChange={e => p.setEveryday(e.target.value)} placeholder={t("z. B. 200,00", "e.g. 200.00")}/>
              </label>
              <p id="payday-everyday-help" className="mt-2 text-[13px] leading-5 text-[#52605b]">{t("Lebensmittel, Freizeit & Co. bis zum Gehalt – ohne die gespeicherten Rechnungen. 0 ist möglich.", "Groceries, leisure and other everyday spending until payday, excluding saved bills. 0 is allowed.")}</p>
              {p.suggestedEveryday !== null && <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[#52605b]"><span>{t(`Vorschlag für ${p.preview!.days} Tage: ${money(p.suggestedEveryday)} – aus deiner Monatsschätzung von ${money(input.variableMonthly!)}.`, `Suggestion for ${p.preview!.days} days: ${money(p.suggestedEveryday)} – based on your monthly estimate of ${money(input.variableMonthly!)}.`)}</span><button type="button" className="eavesence-pill-button home-dashboard-action" onClick={() => p.setEveryday(de ? String(p.suggestedEveryday).replace(".", ",") : String(p.suggestedEveryday))}>{t("Vorschlag übernehmen", "Use suggestion")}</button></div>}
            </fieldset>
            <details hidden={step !== 2} className="home-disclosure rounded-xl border border-[#dfe5dd] p-3" open={reserveOpen} onToggle={e => setReserveOpen(e.currentTarget.open)}>
              <summary className="min-h-10 cursor-pointer text-[13px] font-semibold">{t("Geld als Reserve behalten (optional)", "Keep some money in reserve (optional)")}{p.reserved > 0 ? ` · ${money(p.reserved)}` : ""}</summary>
              <label className="grid max-w-sm gap-2 text-[13px]">
                <span>{t("Reserve, die übrig bleiben soll (optional)", "Money to keep in reserve (optional)")}</span>
                <input ref={protectedInput} aria-invalid={p.errorField === "protected"} className={field} inputMode="decimal" value={p.protectedAmount} onChange={e => p.setProtected(e.target.value)}/>
              </label>
              <p className="mt-2 text-[13px] leading-5 text-[#52605b]">{t("Dieser Betrag bleibt unangetastet. Sparziele werden hier nicht automatisch abgezogen.", "This amount stays untouched. Savings goals are not deducted automatically here.")}</p>
            </details>
            {p.error && <p role="alert" className="text-[13px] text-red-700">{p.error}</p>}
            <FormActions>{quickBalance && <button type="button" className="eavesence-pill-button home-dashboard-action" onClick={()=>{setStep(1);requestAnimationFrame(()=>focusField(paydayInput.current));}}>{t("Zeitraum oder Alltag ändern", "Change dates or everyday spending")}</button>}{step > 0 && <button type="button" disabled={p.busy} className="eavesence-pill-button home-dashboard-action" onClick={()=>{setStep(step-1);requestAnimationFrame(()=>focusField(step===1?balanceInput.current:paydayInput.current));}}>{t("Zurück", "Back")}</button>}<button type="submit" disabled={p.busy || (step === 1 && (p.preview?.missingDates??0)>0)} className="eavesence-pill-button home-primary-action">{step < 2 && !quickBalance ? t("Weiter", "Continue") : t("Verfügbares Geld anzeigen", "Show available money")}</button></FormActions>
          </form>
        </div>
      )}
      {!open && missingDates > 0 && <div className="finance-result-surface border-b border-[#dfe5dd] p-4 sm:p-5"><div className="flex flex-wrap gap-2">{input.costs.filter(c=>!c.nextDueDate).map(c=><PaymentDateEntry key={c.id} cost={c} locale={locale} onSave={onDateSave} onReview={()=>onReviewCost?.(c)}/>)}</div></div>}
      {(!open || step === 1) && bills.length > 0 && <div className="finance-result-surface border-t border-[#dfe5dd] bg-white p-4 sm:p-5">
        <h3 ref={billsHeading} tabIndex={-1} data-payday-payments-heading className="finance-section-heading outline-none">{t("Zahlungen bis zum Gehalt abhaken", "Check off payments until payday")} · {bills.filter(b=>!checklist.isPaid(b)).length} {t("offen", "unpaid")}</h3>
        <div><p className="my-2 text-[13px] text-[#52605b]">{t("Schon bezahlt? Hier abhaken und danach den aktuellen Kontostand bestätigen.", "Check off paid bills here, then confirm your current account balance.")}</p><ul className="divide-y divide-[#e7ebe5]">{bills.map(b=>{const paid=checklist.isPaid(b);return <li key={paymentKey({costId:b.cost.id,month:b.month,date:b.date})}><label className="flex min-h-12 cursor-pointer items-center gap-3 py-2 text-[13px]"><input type="checkbox" checked={paid} disabled={checklist.busy||checklist.isClosed(b)} onChange={()=>void checklist.toggle(b)} aria-label={`${b.cost.name} · ${day(b.date)} · ${t("Bezahlt", "Paid")}`} className="h-5 w-5 shrink-0 accent-[#28734d]"/><span className={`min-w-0 flex-1 ${paid?"text-[#65716d] line-through":""}`}>{b.cost.name}<span className="block text-[13px] text-[#65716d]">{day(b.date)}</span></span><span className="shrink-0">{b.estimated?t("ca. ","approx. "):""}{money(b.cost.amount)}</span></label>{b.cost.variableAmount&&<button type="button" className="eavesence-pill-button home-dashboard-action" disabled={checklist.busy||checklist.isClosed(b)} onClick={()=>checklist.editAmount(b)}>{b.cost.name} · {t("Rechnungsbetrag","Invoice amount")}</button>}</li>})}</ul><PaymentAmountForm c={checklist} locale={locale}/>{checklist.error&&<p role="alert" className="mt-2 text-[13px] text-red-700">{checklist.error}</p>}</div>
      </div>}
      <div className="centre-quick-check" hidden={open}><QuickCheck hasPayments={bills.length > 0} locale={locale} input={input} data={data} onSave={onSave} onBalance={reviewBalance} onPayments={reviewPayments} onSavings={onSavings} onReview={onReviewCost}/></div>
</div>
      <aside className="centre-cash-tools">
        {open && <section className="home-month-tool-card finance-dark-panel" data-payday-guide>
          <p className="centre-eyebrow">{t("Dein nächster Schritt", "Your next step")}</p>
          <h3 className="centre-context-title">{[t("Kontostand eintragen", "Enter your balance"), t("Gehaltstag & Rechnungen", "Payday & bills"), t("Alltag einplanen", "Plan everyday spending")][step]}</h3>
          <p className="centre-caption">{[t("Übernimm den Betrag aus deiner Banking-App. Noch nichts abziehen.", "Use the balance from your banking app, before deductions."), t("Nur offene Zahlungen bis zu diesem Tag werden abgezogen.", "Only unpaid bills before that date are deducted."), t("Plane Lebensmittel, Freizeit und auf Wunsch eine Reserve ein.", "Allow for groceries, leisure and an optional reserve.")][step]}</p>
          <ol className="centre-step-list" aria-label={t("Deine Planung", "Your plan")}>{[t("Kontostand", "Balance"), t("Gehaltstag", "Payday"), t("Alltag", "Everyday spending")].map((label,index)=><li key={label} aria-current={step === index ? "step" : undefined}><span>{index < step ? "✓" : index + 1}</span>{label}</li>)}</ol>
        </section>}
      {!open && p.forecast && !p.stale && <section aria-label={t("So entsteht dein Spielraum", "How your available money is calculated")} data-payday-calculation className="finance-result-surface home-disclosure bg-white p-4 sm:p-5"><h3 className="finance-section-heading">{t("So entsteht dein Spielraum", "How your available money is calculated")}</h3><dl className="space-y-2 text-[13px]">{calculationRows.map(([label, value]) => <div key={String(label)} className="flex justify-between gap-3"><dt>{label}</dt><dd className="shrink-0 font-semibold">{value === null ? "—" : money(Number(value))}</dd></div>)}<div className="flex justify-between gap-3 border-t border-[#dfe5dd] pt-2 font-semibold"><dt>{complete ? t("= Zusätzlicher Spielraum", "= Extra available") : t("= Angaben fehlen noch", "= Entries still missing")}</dt><dd className="shrink-0">{complete ? money(p.forecast!.remaining!) : "—"}</dd></div></dl>{complete&&p.forecast!.remaining!>=0&&<p className="mt-3 text-[13px] text-[#52605b]">{t(`Rechnerisch zusätzlich ${money(p.forecast!.remaining!/p.forecast!.days)} pro Tag. Alltag ist schon abgezogen.`,`Equivalent to ${money(p.forecast!.remaining!/p.forecast!.days)} extra per day. Everyday spending is already deducted.`)}</p>}</section>}
      {currentResult && !open && onSavings && <div className="finance-result-surface border-t border-[#dfe5dd] bg-[#f4f6f2] p-4 text-[13px] sm:p-5"><p className="font-semibold">{t("Mehr übrig behalten? Prüfe eine konkrete Ausgabe.", "Want more left over? Review one specific cost.")}</p><button type="button" className="eavesence-pill-button home-dashboard-action mt-3" onClick={onSavings}>{t("Nächster Schritt: Kosten senken", "Next step: lower a cost")}</button></div>}
      </aside>
    </section>
  );
}

function PaymentDateEntry({cost,locale,onSave,onReview}:{cost:SavingsPlanInput["costs"][number];locale:"de"|"en";onSave?: (id:string,date:string)=>void|Promise<void>;onReview:()=>void}) {
  const [date,setDate]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const de=locale==="de";
  if(!onSave)return <button type="button" onClick={onReview} className="eavesence-pill-button home-dashboard-action">{cost.name} · {de?"Termin ergänzen":"Add date"}</button>;
  async function save(){
    if(!validDay(date)){setError(de?"Bitte einen gültigen Termin wählen.":"Choose a valid date.");return;}
    setBusy(true);setError("");try{await onSave!(cost.id,date);}catch{setError(de?"Speichern fehlgeschlagen. Bitte erneut versuchen.":"Could not save. Please try again.");}finally{setBusy(false);}
  }
  return <div className="mt-3" data-payment-date-entry><label className="grid max-w-sm gap-2 text-[13px]">{cost.name} · {de?"Zahlungstermin":"Payment date"}<input type="date" value={date} onChange={e=>setDate(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void save();}}} className={field}/></label><FormActions className="mt-2"><button type="button" disabled={busy} onClick={()=>void save()} className="eavesence-pill-button home-dashboard-action">{de?"Termin speichern":"Save date"}</button></FormActions>{error&&<p role="alert" className="mt-2 text-[13px] text-red-700">{error}</p>}</div>;
}
