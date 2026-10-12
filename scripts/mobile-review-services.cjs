/* eslint-disable @typescript-eslint/no-require-imports -- Browser-only native service doubles. */
// Only platform boundaries are replaced. App state, validation and storage
// transactions use production code. This is not an iOS keyboard simulator.
const React = require('react');
const read = key => localStorage.getItem(key);
const storage = {
  getItem: async key => read(key),
  setItem: async (key, value) => localStorage.setItem(key, value),
  multiSet: async entries => entries.forEach(([key, value]) => localStorage.setItem(key, value)),
  multiRemove: async keys => keys.forEach(key => localStorage.removeItem(key)),
};
module.exports = {
  ...storage, default: storage, StatusBar: () => null,
  WebView: () => React.createElement('p', null, 'Native document reader'),
  setNotificationHandler() {},
  addNotificationResponseReceivedListener: () => ({ remove() {} }),
  getLastNotificationResponseAsync: async () => null,
  clearLastNotificationResponseAsync: async () => {},
  monthlyReminderIsActive: async () => false,
  reconcileMemoReminders: async () => 'scheduled',
  cancelCostReview: async () => {},
  disableMemoReminders: async () => {}, disableAllReminders: async () => {},
  disableCostReminders: async () => {}, disableMonthlyReminder: async () => {},
  enableMonthlyReminder: async () => true,
  configureSubscriptions: () => false,
  getAvailablePackages: async () => [], getProStatus: async () => false,
  purchasePro: async () => false, restorePro: async () => false,
  shareBackup: async backup => { window.reviewBackup = backup; },
  pickBackup: async () => window.reviewImport ?? null,
  shareDeadline: async () => {},
};
