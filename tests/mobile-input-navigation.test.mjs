import test from 'node:test';
import assert from 'node:assert/strict';
import {createInputNavigation} from '../apps/mobile/src/inputNavigation.ts';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
test('Enter visits the next mounted input and does not wrap or submit early',()=>{
 const nav=createInputNavigation(),focused=[];
 nav.register('name',()=>({focus:()=>focused.push('name'),isFocused:()=>true}));
 const remove=nav.register('amount',()=>({focus:()=>focused.push('amount'),isFocused:()=>false}));
 nav.register('hidden',()=>null);
 nav.register('date',()=>({focus:()=>focused.push('date'),isFocused:()=>false}));
 assert.equal(nav.next('name'),true);assert.deepEqual(focused,['amount']);
 remove();assert.equal(nav.next('name'),true);assert.deepEqual(focused,['amount','date']);
 assert.equal(nav.next('date'),false);assert.equal(nav.next('unmounted'),false);
});
test('keyboard reveal leaves room for the save toolbar and section links use the scroll content coordinates',()=>{
 const exports={};const code=ts.transpileModule(readFileSync('apps/mobile/src/ScrollNavigation.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 runInNewContext(code,{exports,require:name=>name==='react'?{createContext:()=>({})}:{}});
 const input={},calls=[],scroll={scrollResponderScrollNativeHandleToKeyboard:(...args)=>calls.push(args),getInnerViewNode:()=>19,scrollTo:args=>calls.push(args)};
 exports.revealInput(scroll,input);assert.equal(calls[0][0],input);assert.equal(calls[0][1],160);assert.equal(calls[0][2],true);
 exports.revealSection(scroll,{measureLayout:(node,success)=>{assert.equal(node,19);success(0,300);}});assert.equal(calls[1].y,284);assert.equal(calls[1].animated,true);
 exports.revealSection(null,null);
});
