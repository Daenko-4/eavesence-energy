"use client";
import FormActions from "@/components/FormActions";

import {useId,useState} from "react";
import { usePaymentChecklist } from '@eavesence/core/usePaymentChecklist';
import { paymentKey, type MonthPayment } from '@eavesence/core/paymentChecklist';
import type { HouseholdCost } from '@eavesence/core/householdCosts';
import type { PlanningData } from '@eavesence/core/planning';

type Props = { selectedKey?:string|null; onSelect?:(key:string, trigger:HTMLButtonElement)=>void; primary?:boolean; month?:string; onMonthChange?:(month:string)=>void; costs:HouseholdCost[]; data?:PlanningData; onSave:(data:PlanningData)=>void|Promise<void>; locale:'de'|'en'; currency:string; onEdit:(cost:HouseholdCost)=>void; onAdd:()=>void; expanded?:boolean; onExpandedChange?:(open:boolean)=>void };
export default function MonthlyPayments({costs,data,onSave,locale,currency,onEdit,onAdd,expanded,onExpandedChange,month,onMonthChange,primary=false,selectedKey,onSelect}:Props) {
  const [localOpen,setLocalOpen]=useState(false),bodyId=useId();
  const open=expanded??localOpen,setOpen=onExpandedChange??setLocalOpen;
  const de = locale === 'de', t=(a:string,b:string)=>de?a:b;
  type Change = {payment:MonthPayment; wasPaid:boolean; undo?:boolean};
  const [lastChange,setLastChange] = useState<Change | null>(null);
  const c=usePaymentChecklist(costs,data,onSave,de,month,onMonthChange);
  const undoPayment=lastChange?.payment.month === c.month && !c.closed ? c.payments.find(p => paymentKey({costId:p.cost.id,month:p.month,date:p.date}) === paymentKey({costId:lastChange.payment.cost.id,month:lastChange.payment.month,date:lastChange.payment.date}) && c.isPaid(p) !== lastChange.wasPaid && !p.estimated) : undefined;
  const money=(n:number)=>new Intl.NumberFormat(de?'de-AT':'en-GB',{style:'currency',currency}).format(n);
  const monthLabel=new Intl.DateTimeFormat(de?'de-AT':'en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${c.month}-01T00:00:00Z`));
  const dateLabel=(date:string)=>new Intl.DateTimeFormat(de?'de-AT':'en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`));
  async function toggleRow(payment:typeof c.payments[number], origin:HTMLElement, undo=false) {
    const previousY=origin.getBoundingClientRect().top;
    const panel=origin.closest<HTMLElement>("[data-month-checklist]");
    const wasPaid=c.isPaid(payment);
    const saved=await c.toggle(payment);
    if(primary && saved)setLastChange(undo ? null : {payment,wasPaid});
    if(!primary || payment.estimated)return;
    requestAnimationFrame(()=>{
      if(!panel?.getClientRects().length || (document.activeElement!==origin && document.activeElement!==document.body))return;
      // Moving a row between groups must not drop keyboard focus or jump the page.
      const remaining=Array.from(panel.querySelectorAll<HTMLInputElement>('[data-payment-group="open"] input[type="checkbox"]'));
      const choices=remaining.length?remaining:Array.from(panel.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
      choices.sort((a,b)=>Math.abs(a.getBoundingClientRect().top-previousY)-Math.abs(b.getBoundingClientRect().top-previousY));
      choices[0]?.focus({preventScroll:true});
    });
  }
  function renderRows(payments:typeof c.payments) {
    return <ul className="divide-y divide-[#e7ebe5]">{payments.map(p=>{const paid=c.isPaid(p);return <li key={paymentKey({costId:p.cost.id,month:p.month,date:p.date})} className="home-payment-row flex min-w-0 items-center gap-3 py-2">
        {primary ? <>
          <label className="home-payment-checkbox"><input type="checkbox" checked={paid} disabled={c.busy || !!c.closed} onChange={event=>void toggleRow(p,event.currentTarget)} aria-label={`${p.cost.name} · ${p.date?dateLabel(p.date):monthLabel} · ${t('Bezahlt','Paid')}`} className="h-5 w-5 shrink-0 accent-[#28734d]"/></label>
          <button type="button" className="home-payment-detail-action" data-selected={selectedKey === paymentKey({costId:p.cost.id,month:p.month,date:p.date})} onClick={event=>onSelect?.(paymentKey({costId:p.cost.id,month:p.month,date:p.date}),event.currentTarget)} aria-label={`${p.cost.name} · ${t('Details','Details')}`}>
            <span className="home-payment-description"><span className={`home-payment-name ${paid?'text-[#65716d] line-through':''}`}>{p.cost.name}</span><span className="home-payment-date">{p.date?dateLabel(p.date):t('Monatlich · Termin fehlt','Monthly · date missing')}{paid?` · ${t('Bezahlt','Paid')}`:''}</span></span>
            <span className="home-payment-amount">{p.estimated?t("ca. ","approx. "):""}{money(p.cost.amount)}</span>
          </button>
        </> : <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3"><input type="checkbox" checked={paid} disabled={c.busy} onChange={event=>void toggleRow(p,event.currentTarget)} aria-label={`${p.cost.name} · ${p.date?dateLabel(p.date):monthLabel} · ${t('Bezahlt','Paid')}`} className="h-5 w-5 shrink-0 accent-[#28734d]"/><span className="home-payment-description min-w-0 flex-1"><span className={`block break-words text-[13px] font-semibold ${paid?'text-[#65716d] line-through':'text-[#17211f]'}`}>{p.cost.name}</span><span className="home-payment-date block text-[13px] leading-5 text-[#65716d]">{p.date?dateLabel(p.date):t('Monatlich · Termin fehlt','Monthly · date missing')}{paid?` · ${t('Bezahlt','Paid')}`:''}</span></span><span className={`shrink-0 text-[13px] font-semibold ${paid?'text-[#65716d]':'text-[#17211f]'}`}>{p.estimated?t("ca. ","approx. "):""}{money(p.cost.amount)}</span></label>}
        {p.cost.variableAmount&&<button type="button" aria-label={`${p.cost.name} · ${t("Rechnungsbetrag","Invoice amount")}`} disabled={c.busy} onClick={()=>c.editAmount(p)} className="min-h-11 px-1 text-[12px] font-semibold text-[#28734d]">{t("Betrag","Amount")}</button>}
        {!p.date&&<button type="button" aria-label={`${p.cost.name} · ${t("Termin ergänzen","Add date")}`} onClick={()=>onEdit(p.cost)} className="min-h-11 px-1 text-[13px] font-semibold text-[#28734d]">{t('Termin','Date')}</button>}
        {primary && c.editing && paymentKey({costId:c.editing.cost.id,month:c.editing.month,date:c.editing.date}) === paymentKey({costId:p.cost.id,month:p.month,date:p.date}) && <div className="home-payment-inline-editor"><PaymentAmountForm c={c} locale={locale}/></div>}
      </li>})}</ul>;
  }
  const reviewToggle=<button type="button" aria-expanded={open} aria-controls={bodyId} onClick={()=>setOpen(!open)} className="flex min-h-12 w-full items-center justify-between gap-4 border-t border-[#dfe5dd] bg-[#f4f6f2] px-4 text-left text-[13px] font-semibold text-[#17211f] sm:px-5"><span>{primary ? t("Monatsrückblick","Monthly review") : t("Zahlungen & Monatsrückblick","Payments & monthly review")}</span><span aria-hidden="true" className={`site-disclosure-icon text-xl text-[#17211f] ${open?"-rotate-45":""}`}>+</span></button>;
  return <section aria-label={t('Monatscheckliste','Monthly checklist')} className="mt-6 scroll-mt-24 overflow-hidden rounded-2xl border border-[#dfe5dd] bg-white" data-month-checklist data-primary-payments={primary}>

    <div className="bg-[#f4f6f2] p-4 text-[#17211f] sm:p-5">
      <div hidden={Boolean(onMonthChange)} className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-[13px] font-semibold text-[#52605b]">{c.month===c.current?t('Dieser Monat','This month'):t('Zahlungen im Monat','Payments this month')}</p><h2 className="mt-1 text-[20px] font-bold tracking-[-.025em]" data-checklist-month>{monthLabel}</h2></div>
        <div className="flex items-center gap-2"><button type="button" aria-label={t('Vorheriger Monat','Previous month')} onClick={c.previous} className="min-h-11 min-w-11 rounded-full border border-[#65716d] text-lg">‹</button><button type="button" aria-label={t('Nächster Monat','Next month')} onClick={c.next} className="min-h-11 min-w-11 rounded-full border border-[#65716d] text-lg">›</button>{c.month!==c.current&&<button type="button" onClick={c.reset} className="min-h-11 px-2 text-[13px] font-semibold">{t('Dieser Monat','This month')}</button>}</div>
      </div>
      <div className={primary ? "centre-payments-summary" : "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"}>
        <div className="col-span-2 min-w-0 sm:col-span-1"><p className="text-[13px] text-[#52605b]">{t('Noch offen','Still unpaid')}{c.missing.length>0?` · ${t('unvollständig','incomplete')}`:''}</p><p className="mt-1 text-[20px] font-bold tracking-[-.035em] text-[#17211f]" data-checklist-open aria-live="polite">{c.payments.length?money(c.closed?0:c.openTotal):'—'}</p><p className="mt-1 text-[12px] text-[#52605b]">{`${c.closed?0:c.open.length} ${c.open.length===1?t('Zahlung','payment'):t('Zahlungen','payments')}`}</p></div>
        <div hidden={primary && !c.closed} className="min-w-0"><p className="text-[13px] text-[#52605b]">{t('Bereits bezahlt','Already paid')}</p><p className="mt-1 text-[20px] font-bold" data-checklist-paid={!primary || c.closed ? "" : undefined}>{money(c.closed?.paid??c.paidTotal)}</p><p className="mt-1 text-[12px] text-[#52605b]" data-checklist-progress>{c.closed?.count??c.payments.length-c.open.length} {t('von','of')} {c.closed?.count??c.payments.length} {t('bezahlt','paid')}</p></div>
        <div className="min-w-0" data-checklist-next><p className="text-[13px] text-[#52605b]">{t('Als Nächstes fällig','Next due')}</p>{!c.closed&&c.nextDue?<><p className="mt-1 break-words text-[13px] font-semibold">{c.nextDue.cost.name} · {money(c.nextDue.cost.amount)}</p><p className="mt-1 text-[12px] text-[#52605b]">{dateLabel(c.nextDue.date!)}{c.nextDue.date!<c.today?` · ${t('überfällig','overdue')}`:''}</p></>:<p className="mt-1 text-[13px]">{!c.closed&&(c.open.length||c.missing.length)?t('Zahlungstermine fehlen','Payment dates missing'):t('Alles erledigt','All done')}</p>}</div>
      </div>
    </div>
    {primary && undoPayment && <div className="centre-payment-feedback" role="status"><span>{lastChange!.payment.cost.name} · {lastChange!.wasPaid ? t("wieder offen", "unpaid again") : t("abgehakt", "checked off")}</span><button type="button" disabled={c.busy} onClick={event => void toggleRow(undoPayment,event.currentTarget,true)} className="centre-text-action">{t("Rückgängig", "Undo")}</button></div>}
    {!primary && reviewToggle}
    <div id={primary ? `${bodyId}-payments` : bodyId} hidden={!primary && !open} className="home-payment-body p-4 sm:p-5"><p className="home-payment-instruction mb-3 text-[13px] leading-5 text-[#65716d]">{primary ? t('Bezahlt? Einfach abhaken.','Paid? Check it off.') : t('Abgebucht oder bezahlt? Hake die Zahlung ab. Die nächste Zahlung bleibt offen.','Debited or paid? Check it off. The next payment stays open.')}</p>
      {c.closed?<p className="text-[13px] text-[#52605b]">{t("Dieser Monat ist abgeschlossen. Der Rückblick bleibt gespeichert.","This month is closed. Its review has been saved.")}</p>:c.payments.length?(primary ? <div className="home-payment-groups">
        <section data-payment-group="open" aria-label={t("Noch offen","Still unpaid")}><h3 className="home-payment-group-title">{t("Noch offen","Still unpaid")} <span>{c.open.length}</span></h3>{c.open.length ? renderRows(c.open) : <p className="py-3 text-[13px] text-[#65716d]">{t("Keine offenen Zahlungen in diesem Monat.","No unpaid payments this month.")}</p>}</section>
        <section data-payment-group="paid" aria-label={t("Bereits bezahlt","Already paid")}><h3 className="home-payment-group-title">{t("Bereits bezahlt","Already paid")} <span>{c.payments.length-c.open.length}</span><span className="home-paid-group-total" data-checklist-paid>{money(c.paidTotal)}</span></h3>{c.payments.some(p=>c.isPaid(p)) ? renderRows(c.payments.filter(p=>c.isPaid(p))) : <p className="py-3 text-[13px] text-[#65716d]">{t("Noch keine Zahlungen abgehakt.","No payments checked off yet.")}</p>}</section>
      </div> : renderRows([...c.open,...c.payments.filter(p=>c.isPaid(p))])):<p className="text-[13px] leading-5 text-[#52605b]">{costs.length?t('Keine Zahlungen für diesen Monat eingeplant.','No payments scheduled for this month.'):t('Füge deine erste regelmäßige Ausgabe hinzu.','Add your first recurring cost.')}</p>}
      {!primary && <PaymentAmountForm c={c} locale={locale}/>}

      {!c.closed&&c.missing.length>0&&<div className="mt-4 rounded-xl bg-[#f4f6f2] p-3"><p className="text-[13px] leading-5 text-[#52605b]">{t('Diese Kosten brauchen einen Termin, damit wir wissen, in welchem Monat sie anfallen. Sie fehlen im Betrag oben.','These costs need a date so we know which month they fall in. They are excluded from the amount above.')}</p><div className="mt-2 flex flex-wrap gap-2">{c.missing.map(cost=><button type="button" key={cost.id} onClick={()=>onEdit(cost)} className="eavesence-pill-button home-dashboard-action">{cost.name} · {t('Termin ergänzen','Add date')}</button>)}</div></div>}
      {!c.closed&&c.payments.some(p=>!p.date)&&<p className="mt-3 text-[13px] leading-5 text-[#65716d]">{t('Monatliche Kosten ohne Termin zählen einmal pro Monat. Mit einem Datum siehst du auch, wann sie anstehen.','Monthly costs without a date count once each month. Add a date to see when they are due.')}</p>}
      <p className="mt-3 text-[13px] leading-5 text-[#65716d]">{t('Deine manuelle Checkliste, ohne Bankabgleich. Kein Kontostand.','Your manual checklist, without bank verification. Not an account balance.')}</p>
      {!costs.length&&<button type="button" onClick={onAdd} className="eavesence-pill-button home-dashboard-action mt-3">{t('Kosten hinzufügen','Add cost')}</button>}
    {primary && reviewToggle}
    <section id={primary ? bodyId : undefined} hidden={primary && !open} aria-label={t('Monatsrückblick','Monthly review')} className="mt-5 border-t border-[#dfe5dd] pt-4" data-month-review>
      <h3 className="text-[13px] font-semibold">{t('Monatsrückblick','Monthly review')}{c.closed?` · ${t('abgeschlossen','closed')}`:''}</h3>
      <dl className="mt-3 space-y-2 text-[13px]"><div className="flex justify-between gap-3"><dt>{t('Geplant','Planned')}</dt><dd>{money(c.closed?.planned??c.review.planned)}</dd></div><div className="flex justify-between gap-3"><dt>{t('Tatsächlich bezahlt','Actually paid')}</dt><dd>{money(c.closed?.paid??c.review.paid)}</dd></div></dl>
      {(c.closed||c.review.complete)?<p className="mt-3 text-[13px] font-semibold text-[#28734d]">{(()=>{const delta=c.closed?c.closed.planned-c.closed.paid:c.review.difference!;return delta===0?t('Wie geplant.','As planned.'):`${money(Math.abs(delta))} ${delta>0?t('weniger als geplant bezahlt.','less paid than planned.'):t('mehr als geplant bezahlt.','more paid than planned.')}`;})()}</p>:<p className="mt-3 text-[12px] leading-5 text-[#65716d]">{t('Noch kein vollständiger Vergleich: offene Zahlungen abhaken, variable Rechnungsbeträge und fehlende Termine ergänzen.','Not a complete comparison yet: check off unpaid payments and add variable invoice amounts and missing dates.')}{c.review.estimated>0?` ${c.review.estimated} ${t('Beträge noch geschätzt.','amounts still estimated.')}`:''}</p>}
      <p className="mt-2 text-[12px] leading-5 text-[#65716d]">{t('Nur erfasste wiederkehrende Zahlungen, keine Alltagsausgaben. Weniger bezahlt ist nicht automatisch eine dauerhafte Ersparnis.','Recorded recurring payments only, excluding everyday spending. Paying less does not automatically mean lasting savings.')}</p>
      <FormActions>{c.closed?<button type="button" disabled={c.busy} onClick={()=>void c.reopenMonth()} className="eavesence-pill-button home-dashboard-action mt-3">{t('Monat wieder öffnen','Reopen month')}</button>:c.month<=c.current&&c.payments.length>0&&<button type="button" disabled={c.busy||!c.review.complete} onClick={()=>void c.closeMonth()} className="eavesence-pill-button home-dashboard-action mt-3">{t('Monat abschließen','Close month')}</button>}</FormActions>
    </section>
    </div>
    {c.error&&<p role="alert" className="p-4 text-[13px] text-red-700">{c.error}</p>}
  </section>;
}

export function PaymentAmountForm({c,locale}:{c:ReturnType<typeof usePaymentChecklist>;locale:"de"|"en"}) {const t=(a:string,b:string)=>locale==="de"?a:b;return c.editing&&<form onSubmit={e=>{e.preventDefault();void c.saveAmount();}} className="mt-3 rounded-xl border border-[#dfe5dd] bg-[#f4f6f2] p-3">
        <label className="grid gap-2 text-[13px] font-semibold">{c.editing.cost.name} · {t('Rechnungsbetrag','Invoice amount')}<input autoFocus inputMode="decimal" value={c.amount} onChange={e=>c.setAmount(e.target.value)} className="min-h-11 w-full rounded-xl border border-[#cddbd0] bg-white px-3"/></label>
        <p className="mt-2 text-[12px] leading-5 text-[#65716d]">{t('Nur diese Zahlung. Der übliche Planbetrag bleibt unverändert. Auch 0 ist möglich.','Only this payment. The usual planning amount stays unchanged. Zero is allowed.')}</p>
        <FormActions className="mt-2"><button type="button" disabled={c.busy} onClick={c.cancelAmount} className="eavesence-pill-button home-dashboard-action">{t('Abbrechen','Cancel')}</button><button type="submit" disabled={c.busy} className="eavesence-pill-button home-dashboard-action">{t('Betrag speichern','Save amount')}</button></FormActions>
      </form>;}
