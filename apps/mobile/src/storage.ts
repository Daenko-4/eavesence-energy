import AsyncStorage from "@react-native-async-storage/async-storage";

export const PROFILE_KEY = "eavesence-mobile-profile-v1";
export const DEVICES_KEY = "eavesence-mobile-devices-v1";
export const HISTORY_KEY = "eavesence-mobile-history-v1";
export const BETA_KEY = "eavesence-mobile-beta-v1";

export type MobileProfile = {
  name: string;
  electricityPrice: number;
  savingsGoalPercent: number;
  createdAt: string;
};

export type MobileDevice = {
  id: string;
  name: string;
  watts: number;
  minutesPerUse: number;
  usesPerWeek: number;
  yearlyKwh: number;
  yearlyCost: number;
  monthlyCost: number;
  room: string;
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
