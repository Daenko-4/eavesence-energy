import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CostEditor} from '../apps/mobile/src/CostEditor';
import {PaydayScreen} from '../apps/mobile/src/PaydayScreen';
import {ProToolsScreen} from '../apps/mobile/src/ProToolsScreen';
import {HomeMemos} from '../apps/mobile/src/HomeMemos';
import {NavIcon} from '../apps/mobile/src/NavIcon';
import {LocaleContext} from '../apps/mobile/src/i18n';
import {ScrollTargetContext} from '../apps/mobile/src/ScrollNavigation';
import type {PlanningData} from '../packages/core/src/planning';
function Review(){
 const locale=document.documentElement.lang==='de'?'de':'en',view=document.body.dataset.view;
 const [name,setName]=useState(''),[amount,setAmount]=useState(''),[date,setDate]=useState(''),[data,setData]=useState<PlanningData>();
 const [saves,setSaves]=useState(0),[target,setTarget]=useState(''),[frequency,setFrequency]=useState<import('../packages/core/src/householdCosts').HouseholdCostFrequency>('monthly');
 const today=new Date().toISOString().slice(0,10),month=today.slice(0,7);
 async function save(p:PlanningData){setData(p);setSaves(n=>n+1);}
 return <LocaleContext.Provider value={locale}><ScrollTargetContext.Provider value={()=>setTarget('balance')}>
 <output aria-label="Saved count">{saves}</output><output aria-label="Navigation target">{target}</output>
 {view==='cost'?<CostEditor name={name} amount={amount} frequency={frequency} date={date} deadline="" category="subscriptions" editing={false} onName={setName} onAmount={setAmount} onFrequency={setFrequency} onDate={setDate} onDeadline={()=>{}} onCategory={()=>{}} onSave={async()=>{if(name&&amount)setSaves(n=>n+1);}} onClose={()=>{}}/>:view==='tools'?<ProToolsScreen input={{incomeMonthly:2400,costs:[{id:'internet',name:'Internet',category:'subscriptions',amount:18,frequency:'monthly',nextDueDate:today,updatedAt:new Date().toISOString()}],variableMonthly:500,bufferMonthly:0,goalMonthly:0,startMonth:month}} data={data} onSave={save} onReview={()=>{}} currency="EUR"/>:view==='notes'?<HomeMemos embedded initialAdd open onToggle={()=>{}} data={data} onSave={save} locale={locale}/>:<PaydayScreen input={{incomeMonthly:2400,costs:[],variableMonthly:500,bufferMonthly:0,goalMonthly:0,startMonth:month}} data={data} onSave={save} currency="EUR" onPayments={()=>setTarget('month')}/>}
 <footer style={{display:'flex',gap:30,padding:20}}>{(['month','costs','plan','calculator','settings'] as const).map(name=><NavIcon key={name} name={name} color="#65716d"/>)}</footer>
 </ScrollTargetContext.Provider></LocaleContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<Review/>);
