import test from 'node:test';
import assert from 'node:assert/strict';
import {readPlanningBackup} from '../packages/core/src/planning.ts';
import {createHouseholdBackup,createHouseholdProfile,readHouseholdBackup} from '../src/lib/household.ts';
import {createMobileBackup,readMobileBackup} from '../apps/mobile/src/backup.ts';
import {convertWebBackup} from '../apps/mobile/src/webBackup.ts';
import {defaultTiles} from '../apps/mobile/src/tiles.ts';
const stamp='2026-10-15T12:00:00Z';
const profile=createHouseholdProfile({name:'Home',currency:'EUR',electricityPrice:.3,savingsGoalPercent:10,roomNames:[],now:new Date(stamp)});
const web=createHouseholdBackup({profile,devices:[],history:[],costs:[],tiles:[{id:'default-costs',kind:'costs',title:null}]});
const mobile=createMobileBackup({profile:{name:'Home',electricityPrice:.3,savingsGoalPercent:10,createdAt:stamp},devices:[],history:[],costs:[],tiles:defaultTiles(),betaInterested:false});
const corrupt=[null,[], 'broken', {memos:[{id:'memo',text:'Keep this',date:'2026-02-30',done:false,updatedAt:stamp}]}, {paidPayments:[{costId:'rent'}]}, {actualPayments:[{amount:-1}]}, {monthReviews:[{month:'2026-10',paid:-1}]}, {cash:{balance:'1000'}}, {goals:'broken'}, {quickCheck:{}}, {reserves:[{costId:'annual',saved:-1}]}];
test('website and app reject a damaged planning backup without silently dropping records',()=>{
 for(const planning of corrupt){
  assert.equal(readPlanningBackup(planning),null,JSON.stringify(planning));
  const brokenWeb=JSON.stringify({...web,profile:{...profile,planning}});
  assert.equal(readHouseholdBackup(brokenWeb),null);
  assert.equal(convertWebBackup(brokenWeb),null);
  assert.equal(readMobileBackup(JSON.stringify({...mobile,profile:{...mobile.profile,planning}})),null);
 }
 const legacy=readPlanningBackup({});
 assert.deepEqual(legacy.goals,[]);assert.deepEqual(legacy.reserves,[]);
 const memo={id:'memo',text:'Keep this',date:'2026-12-31',done:false,updatedAt:stamp};
 assert.equal(readPlanningBackup({memos:[memo,memo]}),null);
 assert.deepEqual(readPlanningBackup({memos:[memo]}).memos,[memo]);
});
test('legacy website backups may omit newer collections, but malformed present collections reject replacement',()=>{
 for(const key of ['costs','tiles','costEvents']){
  const legacy={...web};delete legacy[key];
  assert.ok(readHouseholdBackup(JSON.stringify(legacy)));
  for(const value of [null,'broken',{}])assert.equal(readHouseholdBackup(JSON.stringify({...web,[key]:value})),null);
 }
 assert.equal(readHouseholdBackup(JSON.stringify({...web,exportedAt:'invalid'})),null);
});
