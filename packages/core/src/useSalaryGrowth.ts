import { useRef, useState } from 'react';
import { localToday } from './homeValue.ts';
import { parseIncomeAmount } from './income.ts';
import { readPlanningData, shiftPlanningMonth, type PlanningData } from './planning.ts';
import { projectedSalary, readSalaryGrowth } from './salaryGrowth.ts';

export function useSalaryGrowth(income: number, value: PlanningData | undefined, onSave: (data: PlanningData) => void | Promise<void>, locale: 'de' | 'en', enabled = true) {
  const data = readPlanningData(value), saved = data.salaryGrowth, de = locale === 'de';
  const month = localToday().slice(0,7), nextMonth = shiftPlanningMonth(month,1);
  const key = JSON.stringify([saved,income,enabled]);
  const [storedKey,setStoredKey] = useState(key);
  const [percent,setPercent] = useState(String(saved?.annualPercent ?? 0));
  const [firstMonth,setFirstMonth] = useState(saved?.firstMonth ?? nextMonth);
  const [error,setError] = useState(''), [notice,setNotice] = useState(''), [busy,setBusy] = useState(false);
  const saving = useRef(false);
  if (key !== storedKey) { setStoredKey(key); setPercent(String(saved?.annualPercent ?? 0)); setFirstMonth(saved?.firstMonth ?? nextMonth); setError(''); }
  const annualPercent = parseIncomeAmount(percent,locale);
  const draft = readSalaryGrowth({annualPercent,firstMonth,baseIncomeMonthly:income});
  const active = enabled && !!saved && saved.annualPercent > 0 && saved.baseIncomeMonthly === income;
  const stale = !!saved && saved.annualPercent > 0 && (!enabled || saved.baseIncomeMonthly !== income);
  async function save() {
    if (saving.current) return false;
    setError(''); setNotice('');
    if (!Number.isFinite(annualPercent) || annualPercent < 0 || annualPercent > 100 || annualPercent > 0 && (!enabled || !draft || firstMonth <= month && (firstMonth !== saved?.firstMonth || income !== saved?.baseIncomeMonthly))) {
      setError(de ? 'Gib 0 bis 100 % ein. Für eine neue Annahme brauchst du ein reguläres Monatsnetto über 0 und einen zukünftigen Startmonat.' : 'Enter 0 to 100%. A new assumption needs regular monthly net income above 0 and a future start month.'); return false;
    }
    saving.current=true; setBusy(true);
    try {
      const next = {...data}; delete next.salaryGrowth;
      if (annualPercent > 0 && draft) next.salaryGrowth=draft;
      await onSave(next);
      setNotice(de ? 'Zukunftsannahme gespeichert.' : 'Future assumption saved.'); return true;
    } catch { setError(de ? 'Speichern fehlgeschlagen. Deine Eingaben bleiben erhalten.' : 'Could not save. Your entries have been kept.'); return false; }
    finally {saving.current=false;setBusy(false);}
  }
  return {percent,setPercent,firstMonth,setFirstMonth,error,notice,busy,save,active,stale,saved,nextMonth,
    minimumMonth:saved?.baseIncomeMonthly === income && saved.firstMonth < nextMonth ? saved.firstMonth : nextMonth,
    example:enabled && draft && annualPercent > 0 ? projectedSalary(income,firstMonth,draft) : null};
}
