import { devices as libraryDevices } from "../../../src/data/devices.ts";
import { readHouseholdBackup } from "../../../src/lib/household.ts";

import { createMobileBackup, readMobileBackup, type MobileBackup } from "./backup.ts";
import type { MobileTile } from "./tiles.ts";

/** Keep the website file read-only; import creates a new mobile snapshot. */
export function convertWebBackup(json: string): MobileBackup | null {
  if (json.length > 2_000_000) return null;
  const source = readHouseholdBackup(json);
  if (!source || (source.profile.currency !== "EUR" && source.profile.currency !== "CHF")) return null;
  const tiles: MobileTile[] = source.tiles.map((tile) => ({
    id: tile.id,
    kind: tile.kind,
    title: tile.title ?? (tile.kind === "energy" ? "Strom & Geräte" : "Haushaltskosten"),
  }));
  if (!tiles.some((tile) => tile.id === "default-costs")) tiles.push({ id: "default-costs", kind: "costs", title: "Haushaltskosten" });
  const knownIds = new Set(tiles.filter((tile) => tile.kind === "costs").map((tile) => tile.id));
  const devices = source.devices.map((device) => ({
    id: device.id,
    name: device.customDeviceName || libraryDevices.find((item) => item.slug === device.device)?.name || device.device,
    watts: device.watts,
    minutesPerUse: device.minutesPerUse,
    usesPerWeek: device.usesPerWeek,
    calculationType: device.estimatedKwhPerUse > 0 || device.measuredKwhPerUse > 0 ? "consumption" as const : "power" as const,
    mode: device.mode,
    estimatedKwhPerUse: device.estimatedKwhPerUse,
    measuredKwhPerUse: device.measuredKwhPerUse,
    librarySlug: device.device,
    yearlyKwh: device.yearlyKwh,
    yearlyCost: device.yearlyKwh * source.profile.electricityPrice,
    monthlyCost: device.yearlyKwh * source.profile.electricityPrice / 12,
    updatedAt: device.updatedAt,
  }));
  const converted = createMobileBackup({
    profile: {
      name: source.profile.name,
      locale: "de",
      currency: source.profile.currency,
      electricityPrice: source.profile.electricityPrice,
      savingsGoalPercent: source.profile.savingsGoalPercent,
      incomeAmount: source.profile.incomeAmount,
      incomeFrequency: source.profile.incomeFrequency,
      incomeExtras: source.profile.incomeExtras,
      variableMonthly: source.profile.variableMonthly,
      bufferMonthly: source.profile.bufferMonthly,
      goalMonthly: source.profile.goalMonthly,
      savingsActions: source.profile.savingsActions,
      planning: source.profile.planning,
      createdAt: source.profile.createdAt,
    },
    devices,
    history: source.history,
    costs: source.costs.map((cost) => cost.tileId && !knownIds.has(cost.tileId) ? { ...cost, tileId: "default-costs" } : cost),
    tiles,
    betaInterested: false,
  });
  return readMobileBackup(JSON.stringify(converted));
}
