import { useRef, useState } from 'react';
import { createMemoId } from './memos.ts';
import { localToday, parseMoney } from './homeValue.ts';
import { readPlanningData, type PlanningData } from './planning.ts';
import { costPriceChanges, subscriptionOutcome, compareAnnualSubscription, upcomingBillReserves } from './proValue.ts';
import type { SavingsPlanInput } from './savingsPlan.ts';

export function useProTools(input:SavingsPlanInput,value:PlanningData|undefined,onSave:(p:PlanningData)=>void|Promise<void>,de:boolean) {
  const data=readPlanningData(value),today=localToday();
  const [drafts,setDrafts]=useState<Record<string,string>>({}),[costId,setCostId]=useState(''),[annual,setAnnual]=useState(''),[start,setStart]=useState(today),[remindAt,setRemindAt]=useState(today),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const saving=useRef(false);
  const subscriptions=input.costs.filter(c=>c.frequency==='monthly'&&c.category==='subscriptions'&&!c.variableAmount);
  const selected=subscriptions.find(c=>c.id===costId);
  const comparison=compareAnnualSubscription(input,data,selected,parseMoney(annual,de?'de':'en'),start,today);
  const reserves=upcomingBillReserves(input.costs,data,today);
  async function persist(next:PlanningData) {
    if(saving.current)return false;
    saving.current=true;setBusy(true);setError('');setNotice('');
    try {await onSave(next);setNotice(de?'Gespeichert.':'Saved.');return true;}
    catch {setError(de?'Speichern fehlgeschlagen. Deine Eingaben bleiben erhalten.':'Could not save. Your entries have been kept.');return false;}
    finally {saving.current=false;setBusy(false);}
  }
  const reserveKey=(id:string)=>`${id}:${reserves.find(r=>r.cost.id===id)?.dueDate??''}`;
  const reserveValue=(id:string)=>drafts[reserveKey(id)]??String(reserves.find(r=>r.cost.id===id)?.saved??0);
  const setReserveValue=(id:string,value:string)=>setDrafts(d=>({...d,[reserveKey(id)]:value}));
  async function saveReserve(id:string) {
    const r=reserves.find(r=>r.cost.id===id);if(!r)return false;
    const saved=parseMoney(reserveValue(id),de?'de':'en');
    if(!Number.isFinite(saved)||saved<0){setError(de?'Bitte einen zurückgelegten Betrag ab 0 eingeben.':'Enter a non-negative set-aside amount.');return false;}
    return persist({...data,reserves:[...data.reserves.filter(r=>r.costId!==id),{costId:id,saved,...(r.dueDate?{dueDate:r.dueDate}:{})}]});
  }
  const priceChanges=costPriceChanges(input.costs,today);
  const decisions=(data.subscriptionPlans??[]).map(plan=>subscriptionOutcome(plan,input.costs,data.paidPayments??[]));
  async function confirmDecision(id:string){
    const decision=decisions.find(d=>d.plan.id===id);
    if(!decision?.matches){setError(de?'Zuerst den Kostenposten auf Jahreszahlung, Angebotspreis und Startdatum ändern.':'First update the cost to yearly payments, the offered price and start date.');return false;}
    return persist({...data,subscriptionPlans:(data.subscriptionPlans??[]).map(p=>p.id===id?{...p,confirmedAt:new Date().toISOString()}:p)});
  }
  async function rememberComparison(money:(n:number)=>string) {
    if(!comparison||!selected||!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(remindAt)||!Number.isFinite(Date.parse(remindAt))||new Date(remindAt).toISOString().slice(0,10)!==remindAt){setError(de?'Vergleich und Erinnerungsdatum prüfen.':'Review the comparison and reminder date.');return false;}
    if((data.memos?.length??0)>=50){setError(de?'Maximal 50 Notizen. Erledigte Notizen zuerst entfernen.':'Maximum 50 notes. Remove completed notes first.');return false;}
    const text=(de?`${selected.name}: Jahresabo prüfen. ${money(comparison.upfront)} im Voraus ab ${start}; ${money(comparison.annualSaving)} Unterschied pro Jahr. Bindung und Kündigung prüfen.`:`${selected.name}: review annual plan. ${money(comparison.upfront)} upfront from ${start}; ${money(comparison.annualSaving)} difference per year. Check commitment and cancellation.`).slice(0,300);
    const id=JSON.stringify([selected.id,start]);
    const existing=(data.subscriptionPlans??[]).find(p=>p.id===id);
    if(!existing&&(data.subscriptionPlans?.length??0)>=50){setError(de?'Maximal 50 Jahresabo-Entscheidungen.':'Maximum 50 annual-plan decisions.');return false;}
    if(existing?.confirmedAt){setError(de?'Diese Umstellung ist bereits bestätigt. Für ein neues Angebot ein anderes Startdatum wählen.':'This switch is already confirmed. Choose a different start date for a new offer.');return false;}
    const subscriptionPlans=[...(data.subscriptionPlans??[]).filter(p=>p.id!==id),{id,costId:selected.id,name:selected.name,monthly:selected.amount,annual:comparison.upfront,start,remindAt}];
    return persist({...data,subscriptionPlans,memos:[...(data.memos??[]),{id:createMemoId(),text,date:remindAt,done:false,updatedAt:new Date().toISOString()}]});
  }
  return {today,data,priceChanges,decisions,confirmDecision,reserves,reserveValue,setReserveValue,saveReserve,subscriptions,costId,setCostId,selected,annual,setAnnual,start,setStart,remindAt,setRemindAt,comparison,rememberComparison,error,notice,busy};
}
