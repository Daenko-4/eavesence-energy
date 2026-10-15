type HomeStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Entry = [string, string | null];
export const HOME_TRANSACTION_KEY = "eavesence-home-transaction-v1";
const keys = new Set([
  "eavesence-home-profile-v1", "eavesence-saved-devices-v1", "eavesence-home-history-v1",
  "eavesence-home-costs-v1", "eavesence-home-cost-events-v1", "eavesence-home-tiles-v1",
  "eavesence-home-visits-v1", "eavesence-home-beta-interest-v1",
]);
function restore(storage: HomeStorage, entries: Entry[]) {
  for (const [key, value] of entries) {
    if (storage.getItem(key) === value) continue;
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  }
}
export function recoverHomeStorage(storage: HomeStorage) {
  const raw = storage.getItem(HOME_TRANSACTION_KEY);
  if (!raw) return;
  const entries: unknown = JSON.parse(raw);
  if (!Array.isArray(entries) || !entries.every(entry => Array.isArray(entry) && entry.length === 2 && keys.has(entry[0]) && (entry[1] === null || typeof entry[1] === "string"))) throw new Error("Invalid home transaction");
  restore(storage, entries as Entry[]);
  storage.removeItem(HOME_TRANSACTION_KEY);
}
/** Preserve the original household until every part of import/reset is written. */
export function writeHomeStorage(storage: HomeStorage, entries: Entry[]) {
  if (entries.some(([key]) => !keys.has(key)) || new Set(entries.map(([key]) => key)).size !== entries.length) throw new Error("Invalid home keys");
  recoverHomeStorage(storage);
  const previous: Entry[] = entries.map(([key]) => [key, storage.getItem(key)]);
  storage.setItem(HOME_TRANSACTION_KEY, JSON.stringify(previous));
  try {
    restore(storage, entries);
    storage.removeItem(HOME_TRANSACTION_KEY);
  } catch (error) {
    try { restore(storage, previous); storage.removeItem(HOME_TRANSACTION_KEY); }
    catch { /* Retain the journal; startup recovery retries before displaying data. */ }
    throw error;
  }
}
