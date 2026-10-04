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
  return React.createElement(tag,{role:accessibilityRole==='header'?'heading':accessibilityRole, 'aria-label':accessibilityLabel,'aria-checked':accessibilityState?.checked,'aria-selected':accessibilityState?.selected,...(tag==='input'?{value:value??'',readOnly:true,onChange:onChangeText}: {})},children);
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
