import { useState } from 'react';
import { billReservePlan, goalProgress, planningFingerprint, planningSuggestions, purchaseImpact, readPlanningData, type NamedGoal, type PlanningData } from './planning.ts';
import { createSavingsPlan, type SavingsPlanInput } from './savingsPlan.ts';

export function usePlanning(input: SavingsPlanInput, value: PlanningData | undefined, onSave: (value: PlanningData) => void | Promise<void>, de: boolean) {
  const data=readPlanningData(value);
  const [error,setError]=useState(''); const [notice,setNotice]=useState(''); const [busy,setBusy]=useState(false);
  const [checkState,setCheckState]=useState({fingerprint:planningFingerprint(input),values:[false,false,false]});
  const [editing,setEditing]=useState<string|null>(null);
  const [name,setName]=useState(''); const [target,setTarget]=useState(''); const [saved,setSaved]=useState(''); const [targetMonth,setTargetMonth]=useState(input.startMonth);
  const [purchaseName,setPurchaseName]=useState(''); const [purchaseAmount,setPurchaseAmount]=useState(''); const [purchaseMonth,setPurchaseMonth]=useState(input.startMonth); const [available,setAvailable]=useState('');
  const [reserveDraft,setReserveDraft]=useState<Record<string,string>>({});
  const number=(v:string)=>v.trim()===''?NaN:Number(v.trim().replace(',','.'));
  const plan=createSavingsPlan(input);
  const today=new Date(); const month=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
  const fingerprint=planningFingerprint(input);
  const checks=checkState.fingerprint===fingerprint?checkState.values:[false,false,false];
  const setChecks=(values:boolean[])=>setCheckState({fingerprint,values});
  const reviewed=data.checks.some(c=>c.month===month && c.fingerprint===fingerprint);
  async function persist(next:PlanningData) {
    if(busy) return false;
    setError('');setNotice('');setBusy(true);
    try {await onSave(next);setNotice(de?'Gespeichert.':'Saved.');return true;} catch {setError(de?'Speichern fehlgeschlagen. Bitte erneut versuchen.':'Could not save. Please try again.');return false;} finally {setBusy(false);}
  }
  async function finishCheck() {
    if(!checks.every(Boolean) || input.incomeMonthly<=0 || input.variableMonthly===null || !input.costs.length || !plan) return;
    await persist({...data,checks:[{month,checkedAt:new Date().toISOString(),incomeMonthly:input.incomeMonthly,variableMonthly:input.variableMonthly,fixedMonthly:plan.averageFixed,fingerprint},...data.checks.filter(c=>c.month!==month)].slice(0,24)});
  }
  function editGoal(g?:NamedGoal) {setEditing(g?.id??null);setName(g?.name??'');setTarget(g?String(g.target):'');setSaved(g?String(g.saved):'');setTargetMonth(g?.targetMonth??input.startMonth);setError('');}
  async function saveGoal() {
    const amount=number(target),balance=saved.trim()===''?0:number(saved);
    if(!name.trim() || !Number.isFinite(amount) || amount<=0 || !Number.isFinite(balance) || balance<0 || !/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {setError(de?'Bitte Name, Zielbetrag über 0, Guthaben ab 0 und einen gültigen Zielmonat eingeben.':'Enter a name, a positive target, a non-negative saved amount and a valid target month.');return;}
    let index=1; while(data.goals.some(g=>g.id===`goal-${index}`)) index++;
    const id=editing??`goal-${index}`;
    if(await persist({...data,goals:[...data.goals.filter(g=>g.id!==id),{id,name:name.trim(),target:amount,saved:balance,targetMonth}]})) editGoal();
  }
  async function saveReserve(costId:string) {
    const n=number(reserveDraft[costId]??String(data.reserves.find(r=>r.costId===costId)?.saved??0));
    if(!Number.isFinite(n)||n<0){setError(de?'Rücklage muss ein Betrag ab 0 sein.':'Set-aside amount must be 0 or more.');return;}
    await persist({...data,reserves:[...data.reserves.filter(r=>r.costId!==costId),{costId,saved:n}]});
  }
  const amount=number(purchaseAmount),balance=available.trim()===''?null:number(available);
  const impact=balance!==null && (!Number.isFinite(balance)||balance<0)?null:purchaseImpact(input,amount,purchaseMonth,balance);
  const goals=data.goals.map(goal=>({...goal,...goalProgress(goal,input.startMonth)}));
  return {data,error,notice,busy,persist,checks,setChecks,reviewed,finishCheck,canCheck:!!plan&&input.incomeMonthly>0&&input.variableMonthly!==null&&input.costs.length>0,plan,
    editing,name,setName,target,setTarget,saved,setSaved,targetMonth,setTargetMonth,editGoal,saveGoal,goals,required:goals.reduce((sum,g)=>sum+g.monthly,0),
    reserves:billReservePlan(input,data),reserveDraft,setReserveDraft,saveReserve,
    purchaseName,setPurchaseName,purchaseAmount,setPurchaseAmount,purchaseMonth,setPurchaseMonth,available,setAvailable,impact,
    suggestions:planningSuggestions(input,`${month}-${String(today.getDate()).padStart(2,'0')}`)};
}
