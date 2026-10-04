import { readIncomeExtras } from "@eavesence/core/income";
import { readPlanningData } from "@eavesence/core/planning";
import { readHouseholdCosts, type HouseholdCost } from "@eavesence/core/householdCosts";
import { readSavingsActions } from "@eavesence/core/savingsPlan";

import type { MobileDevice, MobileHistoryEntry, MobileProfile } from "./storage.ts";
import { parseTiles, type MobileTile } from "./tiles.ts";

export type MobileBackup = {
  format: "eavesence-mobile-backup";
  version: 1;
  exportedAt: string;
  profile: MobileProfile;
  devices: MobileDevice[];
  history: MobileHistoryEntry[];
  costs: HouseholdCost[];
  tiles: MobileTile[];
  betaInterested: boolean;
};

export function createMobileBackup(data: Omit<MobileBackup, "format" | "version" | "exportedAt">, now = new Date()): MobileBackup {
  return { format: "eavesence-mobile-backup", version: 1, exportedAt: now.toISOString(), ...data };
}

function positive(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function readMobileBackup(json: string): MobileBackup | null {
  if (json.length > 2_000_000) return null;
  try {
    const raw: unknown = JSON.parse(json);
    if (!raw || typeof raw !== "object") return null;
    const data = raw as Partial<MobileBackup>;
    const profile = data.profile;
    const tiles = parseTiles(data.tiles);
    if (data.format !== "eavesence-mobile-backup" || data.version !== 1 ||
      typeof data.exportedAt !== "string" || Number.isNaN(Date.parse(data.exportedAt)) ||
      !profile || typeof profile.name !== "string" || !profile.name.trim() ||
      !positive(profile.electricityPrice) || profile.electricityPrice === 0 ||
      !positive(profile.savingsGoalPercent) || profile.savingsGoalPercent < 1 || profile.savingsGoalPercent > 50 ||
      typeof profile.createdAt !== "string" ||
      (profile.backupReminderDismissed !== undefined && typeof profile.backupReminderDismissed !== "boolean") ||
      (profile.setupStep !== undefined && !["income", "cost", "review", "complete"].includes(profile.setupStep)) ||
      (profile.incomeAmount !== undefined && !positive(profile.incomeAmount)) ||
      (profile.incomeFrequency !== undefined && profile.incomeFrequency !== "monthly" && profile.incomeFrequency !== "yearly") ||
      readIncomeExtras(profile.incomeExtras) === null ||
      (profile.savingsActions !== undefined && (!Array.isArray(profile.savingsActions) || readSavingsActions(profile.savingsActions).length !== profile.savingsActions.length)) ||
      !tiles || !Array.isArray(data.devices) || !Array.isArray(data.history) || !Array.isArray(data.costs) ||
      typeof data.betaInterested !== "boolean") return null;

    const devices = data.devices as MobileDevice[];
    const history = data.history as MobileHistoryEntry[];
    const costs = readHouseholdCosts(JSON.stringify(data.costs));
    if (costs.length !== data.costs.length || new Set(costs.map((cost) => cost.id)).size !== costs.length ||
      costs.some((cost) => cost.tileId && !tiles.some((tile) => tile.id === cost.tileId && tile.kind === "costs")) ||
      devices.some((device) => !device || typeof device.id !== "string" || !device.id || typeof device.name !== "string" || !device.name.trim() ||
        !positive(device.watts) || !positive(device.minutesPerUse) || !positive(device.usesPerWeek) ||
        !positive(device.yearlyKwh) || !positive(device.yearlyCost) || !positive(device.monthlyCost) || typeof device.updatedAt !== "string") ||
      new Set(devices.map((device) => device.id)).size !== devices.length ||
      history.some((entry) => !entry || typeof entry.month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(entry.month) ||
        !positive(entry.kwh) || !positive(entry.cost) || typeof entry.updatedAt !== "string") ||
      new Set(history.map((entry) => entry.month)).size !== history.length) return null;

    if (profile.planning !== undefined) profile.planning = readPlanningData(profile.planning);
    return { ...data, format: "eavesence-mobile-backup", version: 1, profile, devices, history, costs, tiles, betaInterested: data.betaInterested, exportedAt: data.exportedAt };
  } catch {
    return null;
  }
}
