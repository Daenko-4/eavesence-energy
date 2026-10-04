"use client";
import { useRef, useState } from 'react';
import { tileSymbols, tileSymbolLabel, type TileSymbol as SymbolKey } from '@eavesence/core/tileSymbols';
import TileSymbol from './TileSymbol';
export default function TileSymbolPicker({value,onChange,locale}:{value:SymbolKey|null;onChange:(icon:SymbolKey|null)=>void;locale:'de'|'en'}) {
  const [open,setOpen]=useState(false),summary=useRef<HTMLButtonElement>(null);
  const choices=[{key:null,de:'Ohne Symbol',en:'No icon'},...tileSymbols];
  return <div className="min-w-0 sm:col-span-2"><button ref={summary} type="button" onClick={()=>setOpen(!open)} aria-expanded={open} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[#dfe5dd] bg-white px-3 text-left text-[12px] font-semibold"><span className="flex min-w-0 items-center gap-2"><TileSymbol icon={value}/>{locale==='de'?'Symbol':'Icon'}: {tileSymbolLabel(value,locale)}</span><span aria-hidden="true" className={`inline-block text-lg transition-transform duration-300 motion-reduce:transition-none ${open?'-rotate-45':''}`}>+</span></button>
    {open&&<div role="group" aria-label={locale==='de'?'Symbol auswählen':'Choose icon'} className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">{choices.map(choice=><button key={choice.key??'none'} type="button" aria-pressed={choice.key===value} onClick={()=>{onChange(choice.key);setOpen(false);summary.current?.focus({preventScroll:true});}} className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center text-[11px] leading-4 ${choice.key===value?'border-[#28734d] bg-[#dcfce8] text-[#17211f]':'border-[#dfe5dd] bg-white text-[#52605b] hover:border-[#28734d]'}`}>
      {choice.key?<TileSymbol icon={choice.key} className="h-5 w-5 shrink-0"/>:<span aria-hidden="true" className="flex h-5 w-5 items-center justify-center text-base">—</span>}<span className="w-full min-w-0 [overflow-wrap:anywhere]">{choice[locale]}</span>
    </button>)}</div>}
  </div>;
}
