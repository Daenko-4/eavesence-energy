import { useRef, useState } from 'react';
import { localToday, parseMoney } from './homeValue.ts';
import { readPlanningData, type PlanningData } from './planning.ts';
import { compareSwitch, forecast90Days, variablePlanSuggestions, type ForecastInput, type SwitchPlan, type VariablePlanSuggestion } from './proInsights.ts';

export type ProInsightsActions = {
  onSave:(data:PlanningData)=>void|Promise<void>;
  onApply:(proposal:VariablePlanSuggestion)=>void|Promise<void>;
  onEveryday:(amount:number)=>void|Promise<void>;
};
export function useProInsights(input:ForecastInput,value:PlanningData|undefined,actions:ProInsightsActions,de:boolean) {
  const today=localToday(),data=readPlanningData(value),parse=(value:string)=>parseMoney(value,de?'de':'en');
  const [costId,setCostId]=useState(''),[amount,setAmount]=useState(''),[start,setStart]=useState(today),[fee,setFee]=useState(''),[overlap,setOverlap]=useState(''),[everyday,setEveryday]=useState(input.variableMonthly===null?'':String(input.variableMonthly));
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const [storedEveryday,setStoredEveryday]=useState(input.variableMonthly);
  if(storedEveryday!==input.variableMonthly){setStoredEveryday(input.variableMonthly);setEveryday(input.variableMonthly===null?'':String(input.variableMonthly));}
  const saving=useRef(false);
  const choices=input.costs.filter(c=>!c.variableAmount&&c.frequency==='monthly');
  const selected=choices.find(c=>c.id===costId);
  const draft={costId,newAmount:parse(amount),start,fee:fee.trim()?parse(fee):0,overlapMonths:overlap.trim()&&/^\d+$/.test(overlap)?Number(overlap):overlap.trim()?NaN:0};
  const comparison=compareSwitch(input,data,draft,today);
  const suggestions=variablePlanSuggestions(input.costs,data,today);
  const forecast=forecast90Days(input,data,today);
  const saved=data.switchPlans??[];
  async function run(work:()=>void|Promise<void>,message:string){
    if(saving.current)return false;
    saving.current=true;setBusy(true);setError('');setNotice('');
    try{await work();setNotice(message);return true;}
    catch(e){setError(e instanceof Error && e.message==='SUGGESTION_STALE' ? de?'Die Rechnungen oder Kosten wurden geändert. Bitte den neuen Vorschlag prüfen.':'The invoices or cost changed. Please review the updated suggestion.' : de?'Speichern fehlgeschlagen. Deine Eingaben bleiben erhalten.':'Could not save. Your entries have been kept.');return false;}
    finally{saving.current=false;setBusy(false);}
  }
  function choose(id:string){setCostId(id);setAmount('');setFee('');setOverlap('');setStart(today);setError('');setNotice('');}
  function load(plan:SwitchPlan){
    setNotice('');
    const current=choices.find(c=>c.id===plan.costId);
    if(!current || current.amount!==plan.originalAmount || current.nextDueDate!==plan.anchor){setError(de?'Die Kostenbasis hat sich geändert. Wähle die Ausgabe für einen neuen Vergleich aus.':'The original cost changed. Select the cost to start a new comparison.');return false;}
    setCostId(plan.costId);setAmount(String(plan.newAmount));setFee(String(plan.fee));setOverlap(String(plan.overlapMonths));setStart(plan.start);setError('');setNotice('');return true;
  }
  async function saveComparison(){
    if(!comparison||!selected){setError(de?'Bitte einen niedrigeren Betrag ab 0, einen Start ab heute und höchstens 12 doppelte Monate eingeben.':'Enter a lower non-negative amount, a start from today and at most 12 overlapping months.');return false;}
    const id=JSON.stringify([costId,start]);
    if(!saved.some(p=>p.id===id)&&saved.length>=25){setError(de?'Maximal 25 Vergleiche. Entferne zuerst einen alten Vergleich.':'Maximum 25 comparisons. Remove an older comparison first.');return false;}
    const plan:SwitchPlan={...draft,id,name:selected.name,originalAmount:selected.amount,anchor:selected.nextDueDate,updatedAt:new Date().toISOString()};
    return run(()=>actions.onSave({...data,switchPlans:[...saved.filter(p=>p.id!==id),plan]}),de?'Vergleich gemerkt. Deine laufenden Kosten bleiben unverändert.':'Comparison saved. Your recurring costs stay unchanged.');
  }
  async function saveEveryday(){
    const amount=parse(everyday);if(!Number.isFinite(amount)||amount<0){setError(de?'Bitte Alltagsausgaben ab 0 eingeben.':'Enter everyday spending of 0 or more.');return false;}
    return run(()=>actions.onEveryday(amount),de?'Alltagsschätzung gespeichert.':'Everyday estimate saved.');
  }
  return {today,forecast,suggestions,choices,selected,comparison,saved,costId,choose,amount,setAmount,start,setStart,fee,setFee,overlap,setOverlap,everyday,setEveryday,error,notice,busy,load,saveComparison,saveEveryday,
    apply:(proposal:VariablePlanSuggestion)=>run(()=>actions.onApply(proposal),de?'Planbetrag angepasst. Erfasste Rechnungen bleiben unverändert. Bitte den Kontostand vor der nächsten Vorschau bestätigen.':'Planning amount updated. Recorded invoices stay unchanged. Confirm your balance before the next forecast.'),
    remove:(id:string)=>run(()=>actions.onSave({...data,switchPlans:saved.filter(p=>p.id!==id)}),de?'Vergleich entfernt.':'Comparison removed.')};
}

export type ProInsightsProps = ProInsightsActions & {
  input:ForecastInput;data?:PlanningData;currency:string;mode:'forecast'|'costs';
  onReview:(cost:ForecastInput['costs'][number])=>void;
  onNavigate:(question:'payday'|'savings'|'progress')=>void;
  onEditIncome:()=>void;onPayments:()=>void;
};
