import { useEffect, useState } from 'react';
import { localToday } from './homeValue.ts';
import { readPlanningData, shiftPlanningMonth, type PlanningData } from './planning.ts';
import { monthChecklist, paymentIsPaid, togglePayment, type MonthPayment } from './paymentChecklist.ts';
import type { HouseholdCost } from './householdCosts.ts';

export function usePaymentChecklist(costs: HouseholdCost[], data: PlanningData | undefined, onSave: (data: PlanningData) => void | Promise<void>, de: boolean) {
  const [current,setCurrent] = useState(() => localToday().slice(0,7));
  useEffect(() => {
    const timer = setInterval(() => setCurrent(localToday().slice(0,7)),30_000);
    return () => clearInterval(timer);
  },[]);
  // Keep following the calendar until the user deliberately chooses another month.
  const [chosenMonth,setMonth] = useState<string | null>(null);
  const month = chosenMonth ?? current;
  const [busy,setBusy] = useState(false), [error,setError] = useState('');
  const planning = readPlanningData(data), paid = planning.paidPayments ?? [];
  const list = monthChecklist(costs,month,paid);
  async function toggle(payment: MonthPayment) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      // A stored balance may be from before the debit: ask for a fresh balance before forecasting.
      const cash = planning.cash;
      const affectsCash = cash && payment.date && payment.date >= cash.asOf && payment.date < cash.payday;
      await onSave({...planning,paidPayments:togglePayment(paid,payment,new Date().toISOString()),...(affectsCash ? {cash:{...cash,needsRefresh:true}} : {})});
    } catch { setError(de ? 'Das Häkchen konnte nicht gespeichert werden. Bitte erneut versuchen.' : 'Could not save this checkmark. Please try again.'); }
    finally { setBusy(false); }
  }
  return {...list,month,current,busy,error,isPaid:(p:MonthPayment)=>paymentIsPaid(p,paid),toggle,previous:()=>setMonth(shiftPlanningMonth(month,-1)),next:()=>setMonth(shiftPlanningMonth(month,1)),reset:()=>setMonth(null)};
}
