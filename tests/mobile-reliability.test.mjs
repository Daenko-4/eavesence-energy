import * as memoCore from '../packages/core/src/memos.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function productionModule(path, mocks) {
  const source = readFileSync(new URL(`../apps/mobile/src/${path}.ts`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const target = { exports: {} };
  runInNewContext(compiled, { module: target, exports: target.exports, require: name => name === '@eavesence/core/memos' ? memoCore : mocks[name], Date, Promise });
  return target.exports;
}
function storageFixture() {
  const values = new Map();
  let fail = false;
  const api = {
    getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    multiSet: async pairs => {
      for (const [key, value] of pairs) {
        values.set(key, value);
        if (fail) { fail = false; throw new Error('Interrupted write'); }
      }
    },
    multiRemove: async keys => { keys.forEach(key => values.delete(key)); },
  };
  return { values, api, failNext: () => { fail = true; }, storage: productionModule('storage', { '@react-native-async-storage/async-storage': api }) };
}
test('Failed multi-key import rolls back existing and previously absent data', async () => {
  const f = storageFixture(), { PROFILE_KEY, COSTS_KEY, writeAll } = f.storage;
  f.values.set(PROFILE_KEY, JSON.stringify({ name: 'Original' }));
  f.failNext();
  await assert.rejects(writeAll([[PROFILE_KEY, { name: 'Replacement' }], [COSTS_KEY, [{ name: 'Rent' }]]]));
  assert.equal(JSON.parse(f.values.get(PROFILE_KEY)).name, 'Original');
  assert.equal(f.values.has(COSTS_KEY), false);
  assert.equal(f.values.has('eavesence-mobile-transaction-v1'), false);
});
test('Interrupted transaction is recovered before reading the home', async () => {
  const f = storageFixture(), { PROFILE_KEY, COSTS_KEY, recoverStorage, readJson } = f.storage;
  f.values.set(PROFILE_KEY, '{"name":"Partially replaced"}');
  f.values.set(COSTS_KEY, '[{"name":"New"}]');
  f.values.set('eavesence-mobile-transaction-v1', JSON.stringify([[PROFILE_KEY, '{"name":"Original"}'], [COSTS_KEY, null]]));
  await recoverStorage();
  assert.equal((await readJson(PROFILE_KEY, null)).name, 'Original');
  assert.equal(await readJson(COSTS_KEY, null), null);
});
test('Corrupt data fails visibly instead of silently becoming an empty home', async () => {
  const f = storageFixture(); f.values.set(f.storage.PROFILE_KEY, '{broken');
  await assert.rejects(f.storage.readJson(f.storage.PROFILE_KEY, null));
  assert.equal(f.values.get(f.storage.PROFILE_KEY), '{broken');
});
test('Transactions serialize against subsequent single-key edits', async () => {
  const f = storageFixture(), s = f.storage;
  await Promise.all([s.writeAll([[s.PROFILE_KEY, { name: 'Import' }], [s.COSTS_KEY, []]]), s.writeJson(s.PROFILE_KEY, { name: 'Later edit' })]);
  assert.equal((await s.readJson(s.PROFILE_KEY, null)).name, 'Later edit');
});
test('Reminder detection is language independent and reset removes owned reminders only', async () => {
  const scheduled = [{ identifier: 'other', content: { title: 'Other reminder' }, trigger: { type: 'date' } }];
  const api = {
    getAllScheduledNotificationsAsync: async () => [...scheduled],
    requestPermissionsAsync: async () => ({ granted: true }),
    cancelScheduledNotificationAsync: async id => { const i = scheduled.findIndex(n => n.identifier === id); if (i >= 0) scheduled.splice(i, 1); },
    scheduleNotificationAsync: async request => scheduled.push({ ...request, identifier: request.identifier ?? 'monthly' }),
    SchedulableTriggerInputTypes: { MONTHLY: 'monthly', DATE: 'date' },
  };
  const r = productionModule('reminders', { 'expo-notifications': api });
  await r.enableMonthlyReminder('en');
  assert.equal(scheduled.at(-1).content.title, 'EAVESENCE monthly check');
  assert.equal(await r.monthlyReminderIsActive(), true);
  await r.scheduleCostReview({ id: 'insurance', name: 'Insurance', cancellationDeadline: '2099-12-20' }, false);
  await r.cancelCostReview('insurance');
  assert.equal(scheduled.some(n => n.identifier === 'eavesence-review-insurance'), false);
  scheduled.push({ identifier: 'eavesence-review-legacy', content: { title: 'Legacy' } });
  await r.disableAllReminders();
  assert.deepEqual(scheduled.map(n => n.identifier), ['other']);
});

test('iPhone monthly reminder remains active after native calendar serialization', async () => {
  const request = { identifier: 'monthly', content: { title: 'EAVESENCE monthly check', data: { eavesenceMonthlyCheck: true } }, trigger: { type: 'calendar', repeats: true, dateComponents: { day: 1, hour: 9, minute: 0 } } };
  const r = productionModule('reminders', { 'expo-notifications': { getAllScheduledNotificationsAsync: async () => [request] } });
  assert.equal(await r.monthlyReminderIsActive(), true);
  request.trigger.repeats = false;
  assert.equal(await r.monthlyReminderIsActive(), false);
  request.trigger.repeats = true;
  request.trigger.dateComponents.year = 2026;
  assert.equal(await r.monthlyReminderIsActive(), false);
});

test('memo reminders update text and date, cancel completed or removed notes, and preserve unrelated reminders',async()=>{
 const scheduled=[{identifier:'other',content:{title:'Unrelated'}}];let prompts=0;let granted=true;
 const api={getAllScheduledNotificationsAsync:async()=>[...scheduled],getPermissionsAsync:async()=>({granted}),requestPermissionsAsync:async()=>{prompts++;return {granted};},cancelScheduledNotificationAsync:async id=>{const i=scheduled.findIndex(r=>r.identifier===id);if(i>=0)scheduled.splice(i,1);},scheduleNotificationAsync:async r=>{scheduled.push(r);},SchedulableTriggerInputTypes:{DATE:'date'}};
 const r=productionModule('reminders',{'expo-notifications':api});
 const memo={id:'annual',text:'Review annual billing',date:'2099-12-31',done:false,updatedAt:'2026-10-04T08:00:00Z'};
 assert.equal(await r.reconcileMemoReminders([memo],'en',true),'scheduled');assert.equal(prompts,1);
 assert.equal(scheduled[1].trigger.date.getHours(),9);assert.equal(scheduled[1].content.body,memo.text);
 await r.reconcileMemoReminders([memo],'en');assert.equal(scheduled.length,2);assert.equal(prompts,1);
 const edited={...memo,text:'Review three subscriptions',date:'2099-12-28',updatedAt:'2026-10-05T08:00:00Z'};
 await r.reconcileMemoReminders([edited],'de');assert.equal(scheduled.length,2);assert.equal(scheduled[1].content.body,edited.text);assert.equal(scheduled[1].trigger.date.getDate(),28);
 await r.reconcileMemoReminders([{...edited,done:true}],'de');assert.deepEqual(scheduled.map(r=>r.identifier),['other']);
 await r.reconcileMemoReminders([edited],'de');granted=false;assert.equal(await r.reconcileMemoReminders([edited],'de'),'denied');assert.deepEqual(scheduled.map(r=>r.identifier),['other']);
 granted=true;await r.reconcileMemoReminders([edited],'de');await r.disableAllReminders();assert.deepEqual(scheduled.map(r=>r.identifier),['other']);
 await r.reconcileMemoReminders([{...memo,date:'2000-12-31'}],'en',true);assert.equal(prompts,1);
});

test('reset queued during a memo schedule waits and then removes the pending notification',async()=>{
 const scheduled=[];let release;const waiting=new Promise(resolve=>{release=resolve;});let entered;const started=new Promise(resolve=>{entered=resolve;});
 const api={getAllScheduledNotificationsAsync:async()=>[...scheduled],getPermissionsAsync:async()=>({granted:true}),scheduleNotificationAsync:async request=>{entered();await waiting;scheduled.push(request);},cancelScheduledNotificationAsync:async id=>{const index=scheduled.findIndex(r=>r.identifier===id);if(index>=0)scheduled.splice(index,1);},SchedulableTriggerInputTypes:{DATE:'date'}};
 const r=productionModule('reminders',{'expo-notifications':api});
 const writing=r.reconcileMemoReminders([{id:'memo',text:'Remember',date:'2099-12-31',done:false,updatedAt:'2026-10-04T08:00:00Z'}],'en');
 await started;const reset=r.disableAllReminders();release();await Promise.all([writing,reset]);assert.equal(scheduled.length,0);
});
