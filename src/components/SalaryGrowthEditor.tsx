"use client";

import { useSalaryGrowth } from '@eavesence/core/useSalaryGrowth';
import type { PlanningData } from '@eavesence/core/planning';

export default function SalaryGrowthEditor({income, data, onSave, locale, currency, enabled=true}: {
  income:number; data?:PlanningData; onSave:(value:PlanningData)=>void|Promise<void>; locale:'de'|'en'; currency:string; enabled?:boolean;
}) {
  const p=useSalaryGrowth(income,data,onSave,locale,enabled),de=locale==='de',t=(a:string,b:string)=>de?a:b;
  const money=(n:number)=>new Intl.NumberFormat(de?'de-AT':'en-GB',{style:'currency',currency}).format(n);
  return <div className="mt-4 rounded-xl border border-[#dfe5dd] bg-white p-4 text-[13px] leading-5" data-salary-growth>
    {p.active&&<p className="mb-3 text-[#28734d]" data-salary-growth-active>{t('Prognose mit geschätzter jährlicher Netto-Erhöhung','Forecast includes estimated annual net salary growth')}: <span data-private-value>{p.saved!.annualPercent} %</span> · {t('erstmals','first applied')} {p.saved!.firstMonth}.</p>}
    {p.stale&&<p className="mb-3 text-amber-800" role="status">{t('Deine Gehaltsbasis hat sich geändert. Die Erhöhungsannahme pausiert. Prüfe Prozentsatz und einen zukünftigen Startmonat und speichere erneut.','Your salary basis changed. The growth assumption is paused. Review the rate and a future start month, then save again.')}</p>}
    <details className="home-disclosure"><summary className="font-semibold">{t('Zukunftsannahmen (optional)','Future assumptions (optional)')}</summary>
      <form className="mt-3 grid gap-3" onSubmit={e=>{e.preventDefault();void p.save();}}>
        <p>{t('Schätzung für zukünftige Gehälter in der 12-Monats- und 90-Tage-Prognose. Die Erhöhung wiederholt sich jährlich ab dem Startmonat. Dein bestätigtes Einkommen, Kontostand und heutiges Monatsbudget werden dadurch nicht erhöht. Sonderzahlungen mit festem Betrag werden separat geplant.','Estimate for future salaries in the 12-month and 90-day forecasts. Growth repeats annually from the start month. Your confirmed income, balance and current monthly budget are not increased. Fixed salary extras are planned separately.')}</p>
        {!enabled&&<p>{t('Trage zuerst ein reguläres Monatsnetto statt eines Jahresdurchschnitts ein.','Enter regular monthly net income instead of an annual average first.')}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 font-semibold">{t('Geschätzte jährliche Netto-Erhöhung (%)','Estimated annual net salary growth (%)')}<input className="home-planning-field min-h-11 min-w-0 rounded-xl border border-[#cddbd0] px-3" inputMode="decimal" value={p.percent} onChange={e=>p.setPercent(e.target.value)}/></label>
          <label className="grid gap-1 font-semibold">{t('Erste Erhöhung ab','First increase from')}<input className="home-planning-field min-h-11 min-w-0 rounded-xl border border-[#cddbd0] px-3" type="month" min={p.minimumMonth} value={p.firstMonth} onChange={e=>p.setFirstMonth(e.target.value)}/></label>
        </div>
        <p className="text-[#52605b]">{t('0 % deaktiviert die Annahme. Eine Bruttoerhöhung ist keine gleich hohe Nettoerhöhung.','0% disables the assumption. A gross pay rise does not mean the same net pay rise.')}</p>
        {p.example!==null&&<p data-private-value data-salary-growth-preview>{t('Geschätztes Monatsnetto nach der ersten Erhöhung','Estimated monthly net income after the first increase')}: {money(p.example)}</p>}
        {p.error&&<p role="alert" className="text-amber-800">{p.error}</p>}
        {p.notice&&<p role="status" className="text-[#28734d]">{p.notice}</p>}
        <button type="submit" disabled={p.busy} className="eavesence-pill-button home-dashboard-action justify-self-start">{t('Zukunftsannahme speichern','Save future assumption')}</button>
      </form>
    </details>
  </div>;
}
