import { useRef, useState } from 'react';
import { localToday, paydayForecast } from './homeValue.ts';
import { readPlanningData, type PlanningData } from './planning.ts';
import { quickCheckFingerprint } from './proValue.ts';
import { savingsReviewCandidates, type SavingsPlanInput } from './savingsPlan.ts';
export function useQuickCheck(input:SavingsPlanInput,value:PlanningData|undefined,onSave:(p:PlanningData)=>void|Promise<void>,de:boolean) {
  const data=readPlanningData(value),today=localToday(),fingerprint=quickCheckFingerprint(input,data);
  const [open,setOpen]=useState(false),[review,setReview]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const saving=useRef(false);
  const forecast=paydayForecast(input.costs,data.cash,input.variableMonthly,today,data.paidPayments);
  const current=!!forecast&&forecast.missingDates===0&&forecast.remaining!==null;
  const reviewed=review===fingerprint;
  const complete=data.quickCheck?.day===today&&data.quickCheck.fingerprint===fingerprint;
  const missingDate=input.costs.find(c=>!c.nextDueDate);
  const opportunity=savingsReviewCandidates(input.costs,today).find(c=>!data.reviews?.some(r=>r.costId===c.id&&r.updatedAt===c.updatedAt&&r.until>=today));
  async function finish() {
    if(!current||!reviewed||saving.current)return false;
    saving.current=true;setBusy(true);setError('');
    try {await onSave({...data,quickCheck:{day:today,checkedAt:new Date().toISOString(),fingerprint}});return true;}
    catch {setError(de?'Check konnte nicht gespeichert werden. Bitte erneut versuchen.':'Could not save the check. Please try again.');return false;}
    finally {saving.current=false;setBusy(false);}
  }
  return {open,setOpen,current,reviewed,setReviewed:(v:boolean)=>setReview(v?fingerprint:''),complete,missingDate,opportunity,error,busy,finish};
}
