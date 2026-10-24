import { useEffect, useRef, useState } from 'react';
import { localToday, parseMoney } from './homeValue.ts';
import { readPlanningData, shiftPlanningMonth, type PlanningData } from './planning.ts';
import { monthChecklist, monthlyReview, paymentKey, saveActualPayment, paymentIsPaid, togglePayment, type MonthPayment } from './paymentChecklist.ts';
import type { HouseholdCost } from './householdCosts.ts';

export function usePaymentChecklist(costs: HouseholdCost[], data: PlanningData | undefined, onSave: (data: PlanningData) => void | Promise<void>, de: boolean, selectedMonth?: string, onMonthChange?: (month: string) => void) {
  const [current,setCurrent] = useState(() => localToday().slice(0,7));
  useEffect(() => {
    const timer = setInterval(() => setCurrent(localToday().slice(0,7)),30_000);
    return () => clearInterval(timer);
  },[]);
  // Keep following the calendar until the user deliberately chooses another month.
  const [chosenMonth,setMonth] = useState<string | null>(null);
  const month = selectedMonth ?? chosenMonth ?? current;
  const saving = useRef(false);
  const [busy,setBusy] = useState(false), [error,setError] = useState('');
  const planning = readPlanningData(data), paid = planning.paidPayments ?? [];
  const actual=planning.actualPayments??[],list = monthChecklist(costs,month,paid,actual),review=monthlyReview(list),closed=planning.monthReviews?.find(r=>r.month===month);
  const [editing,setEditing]=useState<MonthPayment|null>(null),[amount,setAmount]=useState('');
  function editAmount(payment:MonthPayment){if(planning.monthReviews?.some(r=>r.month===payment.month)||saving.current)return;setEditing(payment);setAmount(payment.estimated?'':String(payment.cost.amount));setError('');}
  async function persist(next:PlanningData){
    if(saving.current)return false;saving.current=true;setBusy(true);setError('');
    try{await onSave(next);return true;}catch{setError(de?'Speichern fehlgeschlagen. Deine Eingabe bleibt erhalten.':'Could not save. Your entry has been kept.');return false;}finally{saving.current=false;setBusy(false);}
  }
  async function saveAmount(){
    if(!editing||editing.month!==month||planning.monthReviews?.some(r=>r.month===editing.month))return false;
    const value=parseMoney(amount,de?'de':'en');
    if(!Number.isFinite(value)||value<0){setError(de?'Rechnungsbetrag ab 0 eingeben.':'Enter an invoice amount of 0 or more.');return false;}
    const wasPaid=paymentIsPaid(editing,paid),key=paymentKey({costId:editing.cost.id,month:editing.month,date:editing.date});
    const nextPaid=wasPaid?paid.map(p=>paymentKey(p)===key?{...p,amount:value}:p):paid;
    const saved=await persist({...planning,actualPayments:saveActualPayment(actual,editing,value,new Date().toISOString()),paidPayments:nextPaid,...(planning.cash?{cash:{...planning.cash,needsRefresh:true}}:{})});
    if(saved)setEditing(null);return saved;
  }
  async function closeMonth(){if(month>current||!review.complete||closed)return false;return persist({...planning,monthReviews:[...(planning.monthReviews??[]).filter(r=>r.month!==month),{month,planned:review.planned,paid:review.paid,count:review.count,closedAt:new Date().toISOString()}]});}
  async function reopenMonth(){return persist({...planning,monthReviews:(planning.monthReviews??[]).filter(r=>r.month!==month)});}
  function choose(next:string|null){setEditing(null);if(onMonthChange)onMonthChange(next??current);else setMonth(next);}
  async function toggle(payment: MonthPayment) {
    if (saving.current || planning.monthReviews?.some(r=>r.month===payment.month)) return;
    if(payment.estimated){editAmount(payment);return;}
    saving.current = true;
    setBusy(true); setError('');
    try {
      // A stored balance may be from before the debit: ask for a fresh balance before forecasting.
      const cash = planning.cash;
      const affectsCash = cash && payment.date && payment.date >= `${cash.asOf.slice(0,7)}-01` && payment.date < cash.payday;
      await onSave({...planning,paidPayments:togglePayment(paid,payment,new Date().toISOString()),...(affectsCash ? {cash:{...cash,needsRefresh:true}} : {})});
    } catch { setError(de ? 'Das Häkchen konnte nicht gespeichert werden. Bitte erneut versuchen.' : 'Could not save this checkmark. Please try again.'); }
    finally { saving.current = false; setBusy(false); }
  }
  return {...list,closed,review,editing:editing?.month===month?editing:null,amount,setAmount,editAmount,saveAmount,cancelAmount:()=>setEditing(null),closeMonth,reopenMonth,today:localToday(),month,current,busy,error,isClosed:(p:MonthPayment)=>!!planning.monthReviews?.some(r=>r.month===p.month),isPaid:(p:MonthPayment)=>paymentIsPaid(p,paid),toggle,previous:()=>choose(shiftPlanningMonth(month,-1)),next:()=>choose(shiftPlanningMonth(month,1)),reset:()=>choose(null)};
}
