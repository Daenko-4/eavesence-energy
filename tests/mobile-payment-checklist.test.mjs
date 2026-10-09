import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { localToday } from '../packages/core/src/homeValue.ts';
import { monthChecklist,togglePayment } from '../packages/core/src/paymentChecklist.ts';
const require=createRequire(import.meta.url);
const primitive=tag=>function Native({children,accessibilityRole,accessibilityState,accessibilityLabel}){return React.createElement(tag,{role:accessibilityRole,'aria-checked':accessibilityState?.checked,'aria-expanded':accessibilityState?.expanded,'aria-label':accessibilityLabel},children);};
const native={Text:primitive('span'),View:primitive('div'),Pressable:primitive('button'),StyleSheet:{create:s=>s}};
const compiled=ts.transpileModule(readFileSync(new URL('../apps/mobile/src/MonthlyPayments.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const appModule={exports:{}};runInNewContext(compiled,{module:appModule,exports:appModule.exports,require:name=>name==='react-native'?native:name==='./BrandMotion'?{DisclosureIcon:()=>null}:require(name)});
const month=localToday().slice(0,7),costs=[{id:'rent',name:'Rent',category:'housing',frequency:'monthly',amount:900,nextDueDate:'',updatedAt:localToday()}];
for(const locale of ['de','en'])test(`native month view keeps paid entries collapsed and shows clear totals in ${locale}`,()=>{
 const paid=togglePayment([],monthChecklist(costs,month).payments[0],new Date().toISOString());
 const html=renderToStaticMarkup(React.createElement(appModule.exports.MonthlyPayments,{costs,data:{goals:[],reserves:[],checks:[],paidPayments:paid},onSave:()=>{},onEdit:()=>{},onAdd:()=>{},locale,currency:'EUR'}));
 assert.ok(!html.includes('role="checkbox"'));assert.match(html,/aria-expanded="false"/);
 assert.ok(html.includes(locale==='de'?'1 von 1 Zahlungen erledigt':'1 of 1 payments done'));

 assert.ok(html.includes(locale==='de'?'Noch offen':'Still unpaid'));
 assert.ok(html.includes(locale==='de'?'Bezahlt':'Paid'));
 assert.ok(html.includes(locale==='de'?'Alle erfassten Zahlungen':'All recorded payments'));
 assert.ok(html.includes(locale==='de'?'Nächster Monat':'Next month'));
 assert.ok(!html.includes(locale==='de'?'Still unpaid':'Noch offen'));
});

for(const locale of ['de','en'])test(`native month view exposes unpaid checkboxes once and separate edit actions in ${locale}`,()=>{
 const dated=[{...costs[0],nextDueDate:localToday()},{...costs[0],id:'net',name:'Internet',amount:40,nextDueDate:''}];
 const html=renderToStaticMarkup(React.createElement(appModule.exports.MonthlyPayments,{costs:dated,data:{},onSave:()=>{},onEdit:()=>{},onAdd:()=>{},locale,currency:'EUR'}));
 assert.equal((html.match(/role="checkbox"/g)||[]).length,2);
 assert.ok(html.includes(locale==='de'?'Nächste Zahlung':'Next payment'));
 assert.ok(html.includes(locale==='de'?'Rent · Bearbeiten':'Rent · Edit'));
 assert.ok(html.includes(locale==='de'?'Internet · Bearbeiten':'Internet · Edit'));
 assert.ok(html.includes(locale==='de'?'940,00':'940.00'));
});
