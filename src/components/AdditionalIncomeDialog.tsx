"use client";
import {useRef,useState} from "react";
import {createAdditionalIncome,parseIncomeAmount,type AdditionalIncome} from "@eavesence/core/income";
import {localToday} from "@eavesence/core/homeValue";
import HomeSettingsDialog from "./HomeSettingsDialog";
import FormActions from "./FormActions";

export default function AdditionalIncomeDialog({locale,currency,entries,entry,onSave,onRemove,onClose}: {
 locale:"de"|"en";currency:string;entries:AdditionalIncome[];entry?:AdditionalIncome|null;
 onSave:(entry:AdditionalIncome)=>void|Promise<void>;onRemove:(id:string)=>void|Promise<void>;onClose:()=>void;
}) {
 const de=locale==='de',t=(a:string,b:string)=>de?a:b,today=localToday();
 const [editing,setEditing]=useState(entry ?? null),[amount,setAmount]=useState(entry?String(entry.amount):''),[name,setName]=useState(entry?.name??''),[date,setDate]=useState(entry?.date??today),[planned,setPlanned]=useState(entry?.status==='planned');
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[shown,setShown]=useState(10);const saving=useRef(false),amountInput=useRef<HTMLInputElement>(null);
 const field='home-field min-h-11 w-full min-w-0 rounded-xl border border-[#cddbd0] bg-white px-3 text-[16px]';
 const money=(n:number)=>new Intl.NumberFormat(de?'de-AT':'en-GB',{style:'currency',currency}).format(n);
 async function save(){
  if(saving.current)return;
  const next=createAdditionalIncome({...(editing?{id:editing.id}:{}),name,amount:parseIncomeAmount(amount,locale),date,status:planned?'planned':'received'},today);
  if(!next){setError(t('Prüfe Betrag und Datum. Ein erhaltener Betrag braucht ein Datum bis heute.','Check the amount and date. Received money needs a date no later than today.'));return;}
  if(!editing&&entries.length>=500){setError(t('Du kannst bis zu 500 zusätzliche Einnahmen speichern.','You can save up to 500 additional income entries.'));return;}
  saving.current=true;setBusy(true);setError('');
  try{await onSave(next);onClose();}catch{setError(t('Speichern fehlgeschlagen. Deine Eingaben bleiben erhalten. Versuche es erneut.','Could not save. Your entries have been kept. Try again.'));}finally{saving.current=false;setBusy(false);}
 }
 async function change(work:()=>void|Promise<void>){if(saving.current)return;saving.current=true;setBusy(true);setError('');try{await work();}catch{setError(t('Die Einnahme konnte nicht gespeichert werden. Versuche es erneut.','Could not save the income entry. Try again.'));}finally{saving.current=false;setBusy(false);}}
 function edit(item:AdditionalIncome){setEditing(item);setAmount(String(item.amount));setName(item.name);setDate(item.date);setPlanned(item.status==='planned');setError('');amountInput.current?.focus();}
 const month=date&&!Number.isNaN(Date.parse(date))&&/^\d{4}-\d{2}-\d{2}$/.test(date)?new Intl.DateTimeFormat(de?'de-AT':'en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`)):'';
 return <HomeSettingsDialog locale={locale} title={editing?t('Einnahme bearbeiten','Edit income entry'):t('Zusätzliche Einnahme erfassen','Record additional income')} onClose={onClose}>
  <p className="mt-3 text-sm leading-6 text-[#52605b]">{t('Ein Verkauf, eine Erstattung oder ein Geschenk: Trage den Betrag ein, der bei dir angekommen ist.','A sale, refund or gift: enter the amount you received.')}</p>
  <form className="mt-4 grid gap-4" onSubmit={event=>{event.preventDefault();void save();}}>
   <label className="grid gap-2 text-sm font-semibold">{t('Betrag','Amount')} ({currency})<input ref={amountInput} className={field} inputMode="decimal" value={amount} onChange={event=>{setAmount(event.target.value);setError('');}} placeholder={de?'z. B. 500,00':'e.g. 500.00'}/></label>
   <label className="grid gap-2 text-sm font-semibold">{t('Bezeichnung (optional)','Description (optional)')}<input className={field} maxLength={100} value={name} onChange={event=>setName(event.target.value)} placeholder={t('z. B. Verkauf auf eBay','e.g. eBay sale')}/></label>
   <label className="grid gap-2 text-sm font-semibold">{t('Datum','Date')}<input className={field} type="date" min="1900-01-01" max="2200-12-31" value={date} onChange={event=>{setDate(event.target.value);if(event.target.value>today)setPlanned(true);}}/></label>
   {month&&<p className="text-xs text-[#65716d]">{t('Zählt einmalig für','Counted once in')} {month}.</p>}
   <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={planned} onChange={event=>setPlanned(event.target.checked)}/>{t('Noch nicht erhalten – als geplant vormerken','Not received yet — mark as planned')}</label>
   {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
   <FormActions><button type="button" disabled={busy} onClick={onClose} className="eavesence-pill-button">{t('Abbrechen','Cancel')}</button><button type="submit" disabled={busy} className="eavesence-pill-button home-primary-action">{t('Einnahme speichern','Save income entry')}</button></FormActions>
  </form>
  <p className="mt-3 text-xs leading-5 text-[#65716d]">{t('Dein reguläres Nettoeinkommen bleibt unverändert. Bei „Bis zum nächsten Gehalt“ zählen erhaltene Einnahmen über deinen aktuellen Kontostand.','Your regular net income stays unchanged. Until next payday uses received income through your current account balance.')}</p>
  {!!entries.length&&<section className="mt-5 border-t border-[#dde2d8] pt-4" aria-label={t('Gespeicherte zusätzliche Einnahmen','Saved additional income')}>
   <h3 className="text-sm font-semibold">{t('Deine zusätzlichen Einnahmen','Your additional income')}</h3>
   <ul className="mt-3 divide-y divide-[#dde2d8]">{[...entries].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)).slice(0,shown).map(item=><li key={item.id} className="py-3">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm"><span className="break-words font-semibold">{item.name||t('Zusätzliche Einnahme','Additional income')}</span><strong className="tabular-nums">+ {money(item.amount)}</strong></div>
    <p className="mt-1 text-xs text-[#65716d]">{new Intl.DateTimeFormat(de?'de-AT':'en-GB',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(`${item.date}T00:00:00Z`))} · {item.status==='received'?t('Erhalten','Received'):t('Geplant','Planned')}</p>
    <div className="mt-1 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={()=>edit(item)} className="centre-text-action">{t('Bearbeiten','Edit')}</button>{item.status==='planned'&&<button type="button" disabled={busy} onClick={()=>void change(()=>onSave({...item,date:today,status:'received'}))} className="centre-text-action">{t('Heute erhalten','Received today')}</button>}<button type="button" disabled={busy} onClick={()=>{if(window.confirm(t('Diese Einnahme entfernen?','Remove this income entry?')))void change(()=>onRemove(item.id));}} className="centre-text-action">{t('Entfernen','Remove')}</button></div>
   </li>)}</ul>
   {entries.length>shown&&<button type="button" onClick={()=>setShown(shown+10)} className="eavesence-pill-button mt-3">{t('Weitere Einnahmen anzeigen','Show more income entries')}</button>}
  </section>}
 </HomeSettingsDialog>;
}
