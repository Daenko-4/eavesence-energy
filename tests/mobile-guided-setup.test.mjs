import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const alerts=[];
let submit;
const primitive=tag=>function Primitive({children,accessibilityRole,accessibilityLabel,accessibilityState,value,onChangeText}) {
  return React.createElement(tag,{role:accessibilityRole==='header'?'heading':accessibilityRole, 'aria-label':accessibilityLabel,'aria-checked':accessibilityState?.checked,'aria-selected':accessibilityState?.selected,'aria-expanded':accessibilityState?.expanded,...(tag==='input'?{value:value??'',readOnly:true,onChange:onChangeText}: {})},children);
};
const native={View:primitive('div'),Text:primitive('span'),Pressable:primitive('button'),TextInput:primitive('input'),InputAccessoryView:()=>null,StyleSheet:{create:s=>s},Platform:{OS:'ios'},Keyboard:{dismiss:()=>{}},Alert:{alert:(...a)=>alerts.push(a)}};
const cache=new Map();
function production(file) {
 const path=resolve('apps/mobile/src',file);if(cache.has(path))return cache.get(path).exports;
 const appModule={exports:{}};cache.set(path,appModule);
 const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 runInNewContext(code,{module:appModule,exports:appModule.exports,require:name=>{
  if(name==='react-native')return native;
  if(name==='./BrandMotion')return {DisclosureIcon:()=>null};
  if(name==='./reminders')return {scheduleCostReview:async()=>true};
  if(name==='./deadlineFile')return {shareDeadline:async()=>{}};
  if(name.startsWith('.')) {
   const local=resolve(dirname(path),name);
   const result=production(local+(local.endsWith('.ts')||local.endsWith('.tsx')?'': (()=>{try{readFileSync(local+'.tsx');return '.tsx';}catch{return '.ts';}})()));
   if(name==='./FormSection')return {...result,FormSection:props=>{submit=props.onSave;return React.createElement(result.FormSection,props);}};
   return result;
  }
  return require(name);
 }});
 return appModule.exports;
}
const {LocaleContext}=production('i18n.tsx');
const {HomeSetupForm}=production('HomeSetupForm.tsx');
const CostsScreen=production('CostsScreen.tsx').default;
const profile={name:'Test home',currency:'EUR',electricityPrice:.3,savingsGoalPercent:10,createdAt:'2026-10-04T07:00:00Z'};
const noop=async()=>{};
function render(component,props,locale='en') {
 submit=undefined;alerts.length=0;
 return renderToStaticMarkup(React.createElement(LocaleContext.Provider,{value:locale},React.createElement(component,props)));
}
const costsProps={profile,costs:[{id:'rent',name:'Saved rent',category:'housing',amount:800,frequency:'monthly',nextDueDate:'',updatedAt:profile.createdAt}],tiles:[],tileId:'default-costs',tileTitle:'Household costs',onSaveIncome:noop,onSaveCost:noop,onDeleteCost:noop};
for(const locale of ['de','en']) {
 test(`initial home settings expose only household essentials in ${locale}`,()=>{
  const html=render(HomeSetupForm,{name:'Test home',onName:()=>{},currency:'EUR',onCurrency:()=>{},onSave:noop},locale);
  assert.match(html,locale==='de'?/Dein Zuhause einrichten/:/Set up your home/);
  assert.match(html,locale==='de'?/Name deines Zuhauses/:/Home name/);
  assert.match(html,/EUR/);assert.match(html,/CHF/);
  assert.ok(!/Strompreis|Electricity price|Sparziel|Savings goal|Erinnerung|Reminder|Plan · Pro/.test(html));
 });
 test(`income and cost setup are isolated from saved data and advanced options in ${locale}`,()=>{
  const income=render(CostsScreen,{...costsProps,setup:'income'},locale);
  assert.match(income,locale==='de'?/Nettoeinkommen eintragen/:/Add net income/);
  assert.ok(!/Jahresnetto|Annual net|13\. Gehalt|13th salary|Saved rent|Add costs later|Einkommen später ergänzen|Back to income/.test(income));
  const cost=render(CostsScreen,{...costsProps,setup:'cost'},locale);
  assert.match(cost,locale==='de'?/Erste Kosten hinzufügen/:/Add your first cost/);
  assert.ok(!/Saved rent|Add income later|Kosten später ergänzen|Back to income|Your income|Dein Einkommen/.test(cost));
 });
}
test('blank setup income does not save or advance; an entered amount saves through the production form',async()=>{
 let saved;
 render(CostsScreen,{...costsProps,setup:'income',onSaveIncome:async(...value)=>{saved=value;}});
 await submit();assert.equal(saved,undefined);assert.match(alerts[0][1],/enter 0/);
 render(CostsScreen,{...costsProps,profile:{...profile,incomeAmount:2400,incomeFrequency:'monthly'},setup:'income',onSaveIncome:async(...value)=>{saved=value;}});
 await submit();assert.equal(saved[0],2400);assert.equal(saved[1],'monthly');
});
test('failed income persistence keeps the form from reporting completion',async()=>{
 render(CostsScreen,{...costsProps,profile:{...profile,incomeAmount:2400,incomeFrequency:'monthly'},setup:'income',onSaveIncome:async()=>{throw new Error('Storage unavailable');}});
 await assert.rejects(submit(),/Storage unavailable/);
});

for (const locale of ['de','en']) test(`native payday keeps the result visible with calculation and form collapsed in ${locale}`,()=>{
 const {PaydayScreen}=production('PaydayScreen.tsx');
 const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const payday=new Date(Date.parse(today)+14*86400000).toISOString().slice(0,10);
 const html=render(PaydayScreen,{currency:'EUR',input:{incomeMonthly:2400,costs:[],variableMonthly:500,bufferMonthly:0,goalMonthly:0,startMonth:today.slice(0,7)},data:{cash:{balance:1000,asOf:today,payday,protected:200,everydayRemaining:150}},onSave:noop},locale);
 assert.match(html,locale==='de'?/So entsteht dein Spielraum/:/How your available money is calculated/);
 assert.ok(!html.includes(locale==='de'?'Aktueller Kontostand':'Current account balance'));
 assert.match(html,/aria-expanded="false"/);
 assert.match(html,locale==='de'?/650,00/:/650.00/);
 assert.ok(!html.includes('<input'));
});

for(const locale of ['de','en']) test(`native savings progress keeps secondary details closed in ${locale}`,()=>{
 const {SavingsCoachScreen}=production('SavingsCoachScreen.tsx');const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const action={costId:'hidden',name:'Hidden subscription',originalAmount:18,newAmount:0,frequency:'monthly',effectiveMonth:today.slice(0,7),nextDueDate:today,status:'confirmed',confirmedAt:now.toISOString()};
 const html=render(SavingsCoachScreen,{currency:'EUR',mode:'progress',input:{incomeMonthly:2400,costs:[],variableMonthly:500,bufferMonthly:0,goalMonthly:0,startMonth:today.slice(0,7)},actions:[action],onSave:noop,onActions:noop,onConfirm:noop,onReview:()=>{}},locale);
 assert.match(html,locale==='de'?/18,00/:/18.00/);assert.match(html,locale==='de'?/Bestätigte Änderungen &amp; Schätzungen/:/Confirmed changes &amp; estimates/);assert.ok(!html.includes('Hidden subscription'));assert.ok(!html.includes('reduce recurring costs'));
});

for(const locale of ['de','en'])test(`native payday calls a deficit a shortfall and hides stale results in ${locale}`,()=>{
 const {PaydayScreen}=production('PaydayScreen.tsx');const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const payday=new Date(Date.parse(today)+14*86400000).toISOString().slice(0,10);
 const props={currency:'EUR',input:{incomeMonthly:2400,costs:[],variableMonthly:500,bufferMonthly:0,goalMonthly:0,startMonth:today.slice(0,7)},data:{cash:{balance:100,asOf:today,payday,protected:200,everydayRemaining:150}},onSave:noop};
 const html=render(PaydayScreen,props,locale);
 assert.match(html,locale==='de'?/fehlen dir voraussichtlich/:/Estimated shortfall until/);
 assert.match(html,locale==='de'?/250,00/:/250.00/);
 assert.ok(!html.includes(locale==='de'?'kannst du zusätzlich ausgeben':'You can spend this extra'));
 const stale=render(PaydayScreen,{...props,data:{cash:{...props.data.cash,needsRefresh:true}}},locale);
 assert.ok(!stale.includes(locale==='de'?'250,00':'250.00'));assert.match(stale,locale==='de'?/aktualisiere deinen Kontostand/:/update your account balance/);
});
