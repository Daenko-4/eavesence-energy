"use client";
import {incomeExtraLabel,incomeMonthLabel,summarizeIncome,type IncomeProfile} from "@eavesence/core/income";
export default function IncomeExtrasSummary({profile,locale,currency,compact=false,onManage}:{profile:IncomeProfile;locale:"de"|"en";currency:string;compact?:boolean;onManage?:()=>void}) {
 const summary=summarizeIncome(profile),de=locale==='de',money=(n:number)=>new Intl.NumberFormat(de?'de-AT':'en-GB',{style:'currency',currency}).format(n);
 const warning=<p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-5 text-amber-900" data-income-average-note>{de?'Dein Jahresnetto wird durch 12 geteilt. Das ist ein Monatsdurchschnitt. Für eine genaue Monatsplanung trage dein monatliches Nettoeinkommen und die Sonderzahlungen getrennt ein.':'Your annual net income is divided by 12. This is a monthly average. For accurate monthly planning, enter monthly net income and salary extras separately.'}</p>;
 if(summary.annualAverage&&!compact)return warning;
 if(summary.annualAverage&&!summary.additional.length)return null;
 if(!summary.extras.length&&!summary.additional.length)return null;
 const additional=summary.additional.filter(e=>Number(e.date.slice(0,4))===summary.year).sort((a,b)=>b.date.localeCompare(a.date));
 return <div className="mt-4 rounded-xl bg-[#f4f6f2] p-4" data-income-extras-summary>
  <h3 className="text-[13px] font-semibold">{de?'Jahresüberblick':'Annual overview'}</h3>
  <dl className="income-annual-metrics"><div><dt>{de?`Jahreseinnahmen ${summary.year}`:`Annual income · ${summary.year}`}</dt><dd>{money(summary.annual)}</dd></div><div><dt>{de?'Monatsdurchschnitt':'Monthly average'}</dt><dd>{money(summary.average)}</dd></div></dl>
  <p className="mt-2 text-[12px] leading-5 text-[#65716d]">{de?'Jahresplanung mit deinen Gehaltsangaben und zusätzlichen Einnahmen. Geplantes Geld steht erst nach Eingang zur Verfügung.':'Annual plan using your salary entries and additional income. Planned money becomes available once received.'}</p>
  {!!summary.extras.length&&<ul className="income-extra-payments mt-3 space-y-2 text-[12px]">{[...summary.extras].sort((a,b)=>a.month-b.month).map(e=><li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><span>{incomeExtraLabel(e.kind,locale)} · {incomeMonthLabel(e.month,locale)} {e.year??(de?'jährlich':'every year')} · {de?'Geplant':'Planned'}</span><span className="whitespace-nowrap font-medium tabular-nums">+ {money(e.amount)}</span></li>)}</ul>}
  {!!additional.length&&<ul className="income-extra-payments mt-3 space-y-2 text-[12px]" data-additional-income-list>{additional.slice(0,3).map(e=><li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><span>{e.name||(de?'Zusätzliche Einnahme':'Additional income')} · {new Intl.DateTimeFormat(de?'de-AT':'en-GB',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(`${e.date}T00:00:00Z`))} · {e.status==='received'?(de?'Erhalten':'Received'):(de?'Geplant':'Planned')}</span><span className="whitespace-nowrap font-medium tabular-nums">+ {money(e.amount)}</span></li>)}</ul>}
  {onManage&&summary.additional.length>0&&<button type="button" onClick={onManage} className="centre-text-action mt-3">{de?'Zusätzliche Einnahmen verwalten':'Manage additional income'} ({summary.additional.length})</button>}
  {summary.annualAverage&&!compact&&warning}
 </div>;
}
