import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function productionModule(path, mocks) {
  const source = readFileSync(new URL(`../apps/mobile/src/${path}.ts`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const target = { exports: {} };
  runInNewContext(compiled, { module: target, exports: target.exports, require: name => mocks[name], Date, Promise });
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
