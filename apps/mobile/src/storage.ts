import type { IncomeExtra } from "@eavesence/core/income";
import type { PlanningData } from "@eavesence/core/planning";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SavingsAction } from "@eavesence/core/savingsPlan";

export const PROFILE_KEY = "eavesence-mobile-profile-v1";
export const DEVICES_KEY = "eavesence-mobile-devices-v1";
export const HISTORY_KEY = "eavesence-mobile-history-v1";
export const COSTS_KEY = "eavesence-mobile-costs-v1";
export const BETA_KEY = "eavesence-mobile-beta-v1";
export const TILES_KEY = "eavesence-mobile-tiles-v1";

export type MobileProfile = {
  name: string;
  setupStep?: "income" | "cost" | "review" | "complete";
  locale?: "de" | "en";
  currency?: "EUR" | "CHF";
  electricityPrice: number;
  savingsGoalPercent: number;
  incomeAmount?: number;
  incomeFrequency?: "monthly" | "yearly";
  incomeExtras?: IncomeExtra[];
  variableMonthly?: number | null;
  bufferMonthly?: number;
  goalMonthly?: number;
  savingsActions?: SavingsAction[];
  planning?: PlanningData;
  createdAt: string;
};

export type MobileDevice = {
  id: string;
  name: string;
  watts: number;
  minutesPerUse: number;
  usesPerWeek: number;
  calculationType?: "power" | "consumption";
  mode?: "estimate" | "exact";
  estimatedKwhPerUse?: number;
  measuredKwhPerUse?: number;
  librarySlug?: string;
  yearlyKwh: number;
  yearlyCost: number;
  monthlyCost: number;
  room?: string;
  updatedAt: string;
};

export type MobileHistoryEntry = {
  month: string;
  kwh: number;
  cost: number;
  updatedAt: string;
};

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  const value = await AsyncStorage.getItem(key);
  if (!value) return fallback;
  // A damaged backup must not become an empty home that silently overwrites data.
  return JSON.parse(value) as T;
}

const dataKeys = [PROFILE_KEY, DEVICES_KEY, HISTORY_KEY, COSTS_KEY, BETA_KEY, TILES_KEY];
const JOURNAL_KEY = "eavesence-mobile-transaction-v1";
type StoredEntry = [string, string | null];
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(work: () => Promise<T>): Promise<T> {
  const result = queue.then(work);
  queue = result.catch(() => undefined);
  return result;
}
async function restore(entries: StoredEntry[]) {
  const values = entries.filter((entry): entry is [string, string] => entry[1] !== null);
  const absent = entries.filter(([, value]) => value === null).map(([key]) => key);
  if (values.length) await AsyncStorage.multiSet(values);
  if (absent.length) await AsyncStorage.multiRemove(absent);
}
async function recover() {
  const raw = await AsyncStorage.getItem(JOURNAL_KEY);
  if (!raw) return;
  const entries: unknown = JSON.parse(raw);
  if (!Array.isArray(entries) || !entries.every(entry => Array.isArray(entry) && entry.length === 2 && dataKeys.includes(entry[0]) && (entry[1] === null || typeof entry[1] === "string"))) throw new Error("Invalid storage transaction");
  await restore(entries as StoredEntry[]);
  await AsyncStorage.multiRemove([JOURNAL_KEY]);
}
/** Finish rollback after an interrupted import/reset before showing any data. */
export function recoverStorage() { return serialized(recover); }

export function writeJson(key: string, value: unknown) {
  return serialized(async () => { await recover(); await AsyncStorage.setItem(key, JSON.stringify(value)); });
}
async function transaction(keys: string[], work: () => Promise<void>) {
  await recover();
  const previous = await Promise.all(keys.map(async key => [key, await AsyncStorage.getItem(key)] as StoredEntry));
  await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(previous));
  try {
    await work();
    await AsyncStorage.multiRemove([JOURNAL_KEY]);
  } catch (error) {
    // Keep the journal if rollback fails; the next launch retries it.
    try { await restore(previous); await AsyncStorage.multiRemove([JOURNAL_KEY]); } catch { /* recovery remains pending */ }
    throw error;
  }
}
export function writeAll(entries: Array<[string, unknown]>) {
  return serialized(() => transaction(entries.map(([key]) => key), () => AsyncStorage.multiSet(entries.map(([key, value]) => [key, JSON.stringify(value)]))));
}
export function clearAll() {
  return serialized(() => transaction(dataKeys, () => AsyncStorage.multiRemove(dataKeys)));
}
