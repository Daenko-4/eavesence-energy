"use client";
import {useId,useState} from "react";
import { usePaymentChecklist } from '@eavesence/core/usePaymentChecklist';
import { paymentKey } from '@eavesence/core/paymentChecklist';
import type { HouseholdCost } from '@eavesence/core/householdCosts';
import type { PlanningData } from '@eavesence/core/planning';

type Props = { costs:HouseholdCost[]; data?:PlanningData; onSave:(data:PlanningData)=>void|Promise<void>; locale:'de'|'en'; currency:string; onEdit:(cost:HouseholdCost)=>void; onAdd:()=>void };
export default function MonthlyPayments({costs,data,onSave,locale,currency,onEdit,onAdd}:Props) {
  const [open,setOpen]=useState(true),bodyId=useId();
  const de = locale === 'de', t=(a:string,b:string)=>de?a:b;
  const c=usePaymentChecklist(costs,data,onSave,de);
  const money=(n:number)=>new Intl.NumberFormat(de?'de-AT':'en-GB',{style:'currency',currency}).format(n);
  const monthLabel=new Intl.DateTimeFormat(de?'de-AT':'en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${c.month}-01T00:00:00Z`));
  const dateLabel=(date:string)=>new Intl.DateTimeFormat(de?'de-AT':'en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`));
  return <section aria-label={t('Monatscheckliste','Monthly checklist')} className="mt-6 overflow-hidden rounded-2xl border border-[#dfe5dd] bg-white" data-month-checklist>
    <div className="bg-[#24272c] p-4 text-white sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-[13px] font-semibold text-[#d1d7d4]">{c.month===c.current?t('Dieser Monat','This month'):t('Zahlungen im Monat','Payments this month')}</p><h2 className="mt-1 text-[20px] font-bold tracking-[-.025em]" data-checklist-month>{monthLabel}</h2></div>
        <div className="flex items-center gap-2"><button type="button" aria-label={t('Vorheriger Monat','Previous month')} onClick={c.previous} className="min-h-11 min-w-11 rounded-full border border-[#65716d] text-lg">‹</button><button type="button" aria-label={t('Nächster Monat','Next month')} onClick={c.next} className="min-h-11 min-w-11 rounded-full border border-[#65716d] text-lg">›</button>{c.month!==c.current&&<button type="button" onClick={c.reset} className="min-h-11 px-2 text-[13px] font-semibold">{t('Dieser Monat','This month')}</button>}</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 min-w-0 sm:col-span-1"><p className="text-[13px] text-[#d1d7d4]">{t('Noch offen','Still unpaid')}{c.missing.length>0?` · ${t('unvollständig','incomplete')}`:''}</p><p className="mt-1 text-[28px] font-extrabold tracking-[-.035em] text-[#72dca3]" data-checklist-open aria-live="polite">{c.payments.length?money(c.openTotal):'—'}</p><p className="mt-1 text-[12px] text-[#d1d7d4]">{`${c.open.length} ${c.open.length===1?t('Zahlung','payment'):t('Zahlungen','payments')}`}</p></div>
        <div className="min-w-0"><p className="text-[13px] text-[#d1d7d4]">{t('Bereits bezahlt','Already paid')}</p><p className="mt-1 text-[20px] font-bold" data-checklist-paid>{money(c.paidTotal)}</p><p className="mt-1 text-[12px] text-[#d1d7d4]" data-checklist-progress>{c.payments.length-c.open.length} {t('von','of')} {c.payments.length} {t('bezahlt','paid')}</p></div>
        <div className="min-w-0" data-checklist-next><p className="text-[13px] text-[#d1d7d4]">{t('Als Nächstes fällig','Next due')}</p>{c.nextDue?<><p className="mt-1 break-words text-[13px] font-semibold">{c.nextDue.cost.name} · {money(c.nextDue.cost.amount)}</p><p className="mt-1 text-[12px] text-[#d1d7d4]">{dateLabel(c.nextDue.date!)}{c.nextDue.date!<c.today?` · ${t('überfällig','overdue')}`:''}</p></>:<p className="mt-1 text-[13px]">{c.open.length||c.missing.length?t('Zahlungstermine fehlen','Payment dates missing'):t('Alles erledigt','All done')}</p>}</div>
      </div>
    </div>
    <button type="button" aria-expanded={open} aria-controls={bodyId} onClick={()=>setOpen(!open)} className="flex min-h-12 w-full items-center justify-between gap-4 border-t border-[#464c53] bg-[#24272c] px-4 text-left text-[13px] font-semibold text-white sm:px-5"><span>{t("Zahlungen abhaken","Check off payments")}</span><span aria-hidden="true" className={`text-xl text-[#72dca3] transition-transform duration-200 motion-reduce:transition-none ${open?"-rotate-45":""}`}>+</span></button>
    <div id={bodyId} hidden={!open} className="p-4 sm:p-5"><p className="mb-3 text-[13px] leading-5 text-[#65716d]">{t('Abgebucht oder bezahlt? Hake die Zahlung ab. Die nächste Zahlung bleibt offen.','Debited or paid? Check it off. The next payment stays open.')}</p>
      {c.payments.length?<ul className="divide-y divide-[#e7ebe5]">{[...c.open,...c.payments.filter(p=>c.isPaid(p))].map(p=>{const paid=c.isPaid(p);return <li key={paymentKey({costId:p.cost.id,month:p.month,date:p.date})} className="flex min-w-0 items-center gap-3 py-2">
        <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3"><input type="checkbox" checked={paid} disabled={c.busy} onChange={()=>void c.toggle(p)} aria-label={`${p.cost.name} · ${p.date?dateLabel(p.date):monthLabel} · ${t('Bezahlt','Paid')}`} className="h-5 w-5 shrink-0 accent-[#28734d]"/><span className="min-w-0 flex-1"><span className={`block break-words text-[13px] font-semibold ${paid?'text-[#65716d] line-through':'text-[#17211f]'}`}>{p.cost.name}</span><span className="block text-[13px] leading-5 text-[#65716d]">{p.date?dateLabel(p.date):t('Monatlich · Termin fehlt','Monthly · date missing')}{paid?` · ${t('Bezahlt','Paid')}`:''}</span></span><span className={`shrink-0 text-[13px] font-semibold ${paid?'text-[#65716d]':'text-[#17211f]'}`}>{money(p.cost.amount)}</span></label>
        {!p.date&&<button type="button" aria-label={`${p.cost.name} · ${t("Termin ergänzen","Add date")}`} onClick={()=>onEdit(p.cost)} className="min-h-11 px-1 text-[13px] font-semibold text-[#28734d]">{t('Termin','Date')}</button>}
      </li>})}</ul>:<p className="text-[13px] leading-5 text-[#52605b]">{costs.length?t('Keine Zahlungen für diesen Monat eingeplant.','No payments scheduled for this month.'):t('Füge deine erste regelmäßige Ausgabe hinzu.','Add your first recurring cost.')}</p>}
      {c.error&&<p role="alert" className="mt-3 text-[13px] text-red-700">{c.error}</p>}
      {c.missing.length>0&&<div className="mt-4 rounded-xl bg-[#f4f6f2] p-3"><p className="text-[13px] leading-5 text-[#52605b]">{t('Diese Kosten brauchen einen Termin, damit wir wissen, in welchem Monat sie anfallen. Sie fehlen im Betrag oben.','These costs need a date so we know which month they fall in. They are excluded from the amount above.')}</p><div className="mt-2 flex flex-wrap gap-2">{c.missing.map(cost=><button type="button" key={cost.id} onClick={()=>onEdit(cost)} className="eavesence-pill-button home-dashboard-action">{cost.name} · {t('Termin ergänzen','Add date')}</button>)}</div></div>}
      {c.payments.some(p=>!p.date)&&<p className="mt-3 text-[13px] leading-5 text-[#65716d]">{t('Monatliche Kosten ohne Termin zählen einmal pro Monat. Mit einem Datum siehst du auch, wann sie anstehen.','Monthly costs without a date count once each month. Add a date to see when they are due.')}</p>}
      <p className="mt-3 text-[13px] leading-5 text-[#65716d]">{t('Deine manuelle Checkliste, ohne Bankabgleich. Kein Kontostand.','Your manual checklist, without bank verification. Not an account balance.')}</p>
      {!costs.length&&<button type="button" onClick={onAdd} className="eavesence-pill-button home-dashboard-action mt-3">{t('Kosten hinzufügen','Add cost')}</button>}
    </div>
  </section>;
}
