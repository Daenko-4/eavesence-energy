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
  locale?: "de" | "en";
  currency?: "EUR" | "CHF";
  electricityPrice: number;
  savingsGoalPercent: number;
  incomeAmount?: number;
  incomeFrequency?: "monthly" | "yearly";
  variableMonthly?: number | null;
  bufferMonthly?: number;
  goalMonthly?: number;
  savingsActions?: SavingsAction[];
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
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function writeAll(entries: Array<[string, unknown]>) {
  await AsyncStorage.multiSet(entries.map(([key, value]) => [key, JSON.stringify(value)]));
}

export async function clearAll() {
  await AsyncStorage.multiRemove([PROFILE_KEY, DEVICES_KEY, HISTORY_KEY, COSTS_KEY, BETA_KEY, TILES_KEY]);
}
