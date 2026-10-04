"use client";
import {useId,useRef,useState} from 'react';
import {useMemos} from '@eavesence/core/useMemos';
import type {HomeMemo} from '@eavesence/core/memos';
import type {PlanningData} from '@eavesence/core/planning';

export default function HomeMemos({data,onSave,locale}:{data?:PlanningData;onSave:(data:PlanningData)=>void|Promise<void>;locale:'de'|'en'}) {
  const de=locale==='de',t=(a:string,b:string)=>de?a:b,c=useMemos(data,onSave,de);
  const [open,setOpen]=useState(false),[form,setForm]=useState(false),[text,setText]=useState(''),[date,setDate]=useState(''),[editing,setEditing]=useState<string>();
  const id=useId(),input=useRef<HTMLTextAreaElement>(null),add=useRef<HTMLButtonElement>(null);
  const dateLabel=(value:string)=>new Intl.DateTimeFormat(de?'de-AT':'en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));
  function start(memo?:HomeMemo){c.clear();setEditing(memo?.id);setText(memo?.text??'');setDate(memo?.date??'');setForm(true);requestAnimationFrame(()=>input.current?.focus());}
  function close(){setForm(false);c.clear();add.current?.focus({preventScroll:true});}
  async function submit(){if(await c.save(text,date,editing)){setForm(false);setText('');setDate('');setEditing(undefined);add.current?.focus({preventScroll:true});}}
  function rows(items:HomeMemo[]){return <ul className="divide-y divide-[#e7ebe5]">{items.map(m=><li key={m.id} className="py-3" data-memo-id={m.id}>
    <div className="flex min-w-0 items-start gap-3"><label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-start gap-3"><input type="checkbox" checked={m.done} disabled={c.busy} onChange={()=>void c.toggle(m.id)} aria-label={`${m.text} · ${t('Erledigt','Done')}`} className="mt-1 h-5 w-5 shrink-0 accent-[#28734d]"/><span className="min-w-0"><span className={`block whitespace-pre-wrap break-words text-[13px] font-semibold ${m.done?'text-[#65716d] line-through':'text-[#17211f]'}`}>{m.text}</span>{m.date&&<span className={`mt-1 block text-[11px] ${!m.done&&m.date<=c.today?'font-semibold text-[#28734d]':'text-[#65716d]'}`}>{!m.done&&m.date<=c.today?`${t('Fällig','Due')} · `:''}{dateLabel(m.date)}</span>}</span></label></div>
    <div className="ml-8 flex flex-wrap gap-2"><button type="button" disabled={c.busy} onClick={()=>start(m)} className="min-h-11 px-2 text-[11px] font-semibold text-[#52605b]" aria-label={`${m.text} · ${t('Bearbeiten','Edit')}`}>{t('Bearbeiten','Edit')}</button><button type="button" disabled={c.busy} onClick={()=>{if(window.confirm(t('Diese Notiz entfernen?','Remove this note?')))void c.remove(m.id);}} className="min-h-11 px-2 text-[11px] text-[#9a7777]" aria-label={`${m.text} · ${t('Entfernen','Remove')}`}>{t('Entfernen','Remove')}</button></div>
  </li>)}</ul>;}
  return <section aria-label={t('Merken & erinnern','Notes & reminders')} className="mt-4 rounded-2xl border border-[#dfe5dd] bg-[#f4f6f2]" data-home-memos>
    <button type="button" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"><span className="min-w-0"><span className="block text-[13px] font-semibold text-[#17211f]">{t('Merken & erinnern','Notes & reminders')}</span><span className="mt-1 block text-[11px] text-[#65716d]">{c.due.length?`${c.due.length} ${t('fällig','due')}`:c.memos.some(m=>!m.done)?`${c.memos.filter(m=>!m.done).length} ${t('offen','open')}`:t('Eine Idee für später festhalten','Keep an idea for later')}</span></span><span aria-hidden="true" className={`shrink-0 text-xl text-[#28734d] transition-transform duration-200 motion-reduce:transition-none ${open?'-rotate-45':''}`}>+</span></button>
    <div id={id} hidden={!open} className="border-t border-[#dfe5dd] px-4 pb-4 sm:px-5">
      {rows(c.current)}
      {!c.current.length&&<p className="mt-3 text-[12px] leading-5 text-[#65716d]">{t('Keine offenen Notizen für diesen Monat.','No open notes for this month.')}</p>}
      {c.later.length>0&&<details className="home-disclosure mt-2"><summary className="min-h-11 cursor-pointer text-[12px] font-semibold text-[#52605b]">{t('Später','Later')} ({c.later.length})</summary>{rows(c.later)}</details>}
      {c.done.length>0&&<details className="home-disclosure mt-2"><summary className="min-h-11 cursor-pointer text-[12px] font-semibold text-[#52605b]">{t('Erledigt','Done')} ({c.done.length})</summary>{rows(c.done)}</details>}
      <button ref={add} type="button" disabled={c.busy} onClick={()=>start()} className="eavesence-pill-button home-dashboard-action mt-3" style={{minHeight:44}}>{t('Notiz hinzufügen','Add note')}</button>
      {form&&<form onSubmit={e=>{e.preventDefault();void submit();}} className="mt-3 grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-[#dfe5dd] bg-white p-3" aria-label={t('Notiz bearbeiten','Edit note')}>
        <div className="grid min-w-0 gap-1.5"><label htmlFor={`${id}-note`} className="text-[11px] font-semibold text-[#52605b]">{t('Notiz','Note')}</label><textarea id={`${id}-note`} ref={input} value={text} onChange={e=>setText(e.target.value)} maxLength={300} rows={3} disabled={c.busy} placeholder={t('Zum Beispiel: Drei Abos auf Jahreszahlung prüfen','For example: Review annual billing for three subscriptions')} className="min-w-0 w-full resize-y rounded-xl border border-[#cbd5e1] p-3 text-[14px] font-normal leading-5 text-[#17211f] outline-none focus:border-[#28734d]"/></div>
        <label className="grid min-w-0 gap-1.5 text-[11px] font-semibold text-[#52605b]">{t('Erinnern am (optional)','Reminder date (optional)')}<input type="date" value={date} onChange={e=>setDate(e.target.value)} disabled={c.busy} className="min-h-11 min-w-0 w-full rounded-xl border border-[#cbd5e1] bg-white px-3 text-[14px] font-normal text-[#17211f]"/></label>
        <div className="flex flex-wrap gap-2">{[[c.today,t('Heute','Today')],[`${c.today.slice(0,4)}-12-31`,t('Jahresende','Year end')],['',t('Ohne Datum','No date')]].map(([value,label])=><button key={label} type="button" disabled={c.busy} onClick={()=>setDate(value)} className="min-h-11 rounded-full border border-[#dfe5dd] px-3 text-[11px] font-semibold">{label}</button>)}</div>
        <p className="text-[11px] leading-5 text-[#65716d]">{t('Fällige Notizen siehst du beim Öffnen von My Home. Die Website sendet keine Benachrichtigung.','Due notes appear when you open My Home. The website does not send notifications.')}</p>
        <div className="flex flex-wrap gap-3"><button type="submit" disabled={c.busy} className="eavesence-pill-button home-dashboard-action" style={{minHeight:44}}>{t('Notiz speichern','Save note')}</button><button type="button" disabled={c.busy} onClick={close} className="min-h-11 px-2 text-[11px] font-semibold text-[#65716d]">{t('Abbrechen','Cancel')}</button></div>
      </form>}
      {c.error&&<p role="alert" className="mt-3 text-[12px] text-red-700">{c.error}</p>}{c.notice&&<p role="status" className="mt-3 text-[12px] text-[#28734d]">{c.notice}</p>}
    </div>
  </section>;
}
