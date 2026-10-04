import test from 'node:test';
import assert from 'node:assert/strict';
import {memoGroups,readMemos,validMemoDate} from '../packages/core/src/memos.ts';
import {readPlanningData} from '../packages/core/src/planning.ts';
import {createHouseholdBackup,createHouseholdProfile,readHouseholdBackup} from '../src/lib/household.ts';
import {convertWebBackup} from '../apps/mobile/src/webBackup.ts';
import {createMobileBackup,readMobileBackup} from '../apps/mobile/src/backup.ts';
const note=(id,date,done=false)=>({id,text:`Note ${id}`,date,done,updatedAt:'2026-10-04T08:00:00Z'});
test('memo dates validate real calendar dates and group overdue, current, later and done separately',()=>{
 assert.equal(validMemoDate('2026-02-29'),false);assert.equal(validMemoDate('2028-02-29'),true);assert.equal(validMemoDate('2026-04-31'),false);
 const past=note('past','2026-09-30'),today=note('today','2026-10-04'),soon=note('soon','2026-10-31'),later=note('later','2026-12-31'),plain=note('plain',''),done=note('done','2026-09-01',true);
 const groups=memoGroups([plain,later,done,soon,today,past],'2026-10-04');
 assert.deepEqual(groups.due,[past,today]);assert.deepEqual(groups.current,[past,today,soon,plain]);assert.deepEqual(groups.later,[later]);assert.deepEqual(groups.done,[done]);
 assert.deepEqual(memoGroups([later],'2026-12-01').current,[later]);
});
test('memo validation discards malformed records without altering existing planning data',()=>{
 const valid=note('ok','');
 assert.deepEqual(readMemos([valid,{...valid,id:'bad',date:'2026-11-31'},{...valid,text:' '},{...valid,text:'x'.repeat(301)},{...valid,done:'true'},valid]),[valid]);
 assert.equal(Object.hasOwn(readPlanningData({goals:[]}), 'memos'),false);
 assert.deepEqual(readPlanningData({memos:[valid],paidPayments:[],goals:[],reserves:[],checks:[]}).memos,[valid]);
});
test('notes, completion and dates survive website backup, mobile import and re-export',()=>{
 const memos=[note('year-end','2026-12-31'),note('done','',true)],profile=createHouseholdProfile({name:'Home',currency:'EUR',electricityPrice:.3,savingsGoalPercent:10,roomNames:[]});
 profile.planning=readPlanningData({memos});
 const backup=createHouseholdBackup({profile,devices:[],history:[],costs:[],tiles:[{id:'default-costs',kind:'costs',title:null}]});
 assert.deepEqual(readHouseholdBackup(JSON.stringify(backup)).profile.planning.memos,memos);
 const imported=convertWebBackup(JSON.stringify(backup));assert.deepEqual(imported.profile.planning.memos,memos);
 const mobile=createMobileBackup(imported);assert.deepEqual(readMobileBackup(JSON.stringify(mobile)).profile.planning.memos,memos);
});

test('failed memo persistence never creates a device reminder; invalid input does not write',async()=>{
 const React=await import('react'),{renderToStaticMarkup}=await import('react-dom/server'),{useMemos}=await import('../packages/core/src/useMemos.ts');
 let controls,writes=0,notifications=0;
 function Probe(){controls=useMemos(undefined,async()=>{writes++;throw new Error('Storage full');},false,async()=>{notifications++;});return null;}
 renderToStaticMarkup(React.createElement(Probe));
 assert.equal(await controls.save('',''),false);assert.equal(await controls.save('Note','2026-02-29'),false);assert.equal(writes,0);
 assert.equal(await controls.save('Review annual billing','2099-12-31'),false);assert.equal(writes,1);assert.equal(notifications,0);
});
