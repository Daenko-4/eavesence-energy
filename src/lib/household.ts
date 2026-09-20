import type { SavedDevice, SavedDeviceCurrency } from "@/lib/savedDevices";
import type { HouseholdCost } from "@/lib/householdCosts";

export const HOUSEHOLD_PROFILE_STORAGE_KEY = "eavesence-home-profile-v1";
export const HOUSEHOLD_HISTORY_STORAGE_KEY = "eavesence-home-history-v1";
export const HOUSEHOLD_VISIT_STORAGE_KEY = "eavesence-home-visits-v1";
export const HOUSEHOLD_CHANGED_EVENT = "eavesence:household-changed";

export type HouseholdRoom = {
  id: string;
  name: string;
};

export type HouseholdProfile = {
  version: 1;
  name: string;
  currency: SavedDeviceCurrency;
  electricityPrice: number;
  electricityInputMode?: "price" | "annual-bill" | "monthly-payment";
  annualElectricityBill?: number;
  annualElectricityKwh?: number;
  monthlyElectricityPayment?: number;
  electricityBillIncludesBonus?: boolean;
  savingsGoalPercent: number;
  rooms: HouseholdRoom[];
  deviceRooms: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  onboardingCompletedAt: string;
};

export type MonthlyEnergyEntry = {
  month: string;
  kwh: number;
  cost: number;
  updatedAt: string;
};

export type MonthlyEntryMode = "consumption" | "bill";

export type MonthlyConsumptionComparison = {
  status: "actual-higher" | "estimate-higher" | "close";
  differenceKwh: number;
  absoluteDifferenceKwh: number;
  differencePercent: number;
  explainedPercent: number;
};

export type MonthlyEnergyTrend = {
  currentMonth: string;
  previousMonth: string;
  consumptionDifferenceKwh: number;
  consumptionChangePercent: number;
  costDifference: number;
  costChangePercent: number;
};

export type MonthlySavingsGoalProgress = {
  baselineCost: number;
  currentCost: number;
  targetCost: number;
  savedAmount: number;
  remainingAmount: number;
  progressPercent: number;
  reached: boolean;
};

export type HouseholdBackup = {
  version: 1;
  exportedAt: string;
  profile: HouseholdProfile;
  devices: SavedDevice[];
  history: MonthlyEnergyEntry[];
  costs: HouseholdCost[];
};

export type HouseholdVisitState = {
  firstVisitAt: string;
  lastVisitAt: string;
  visitCount: number;
  trackedSevenDayReturn: boolean;
  trackedThirtyDayReturn: boolean;
  trackedThreeDeviceActivation: boolean;
};

export const DEFAULT_ROOM_NAMES = {
  de: ["Küche", "Wohnzimmer", "Schlafzimmer", "Bad", "Büro"],
  en: ["Kitchen", "Living room", "Bedroom", "Bathroom", "Office"],
} as const;

export const DEFAULT_HOUSEHOLD_NAMES = {
  de: "Mein Zuhause",
  en: "My home",
} as const;

type HouseholdLocale = keyof typeof DEFAULT_ROOM_NAMES;

export function localizeDefaultHouseholdName(
  name: string,
  locale: HouseholdLocale,
) {
  return name === DEFAULT_HOUSEHOLD_NAMES.de ||
    name === DEFAULT_HOUSEHOLD_NAMES.en
    ? DEFAULT_HOUSEHOLD_NAMES[locale]
    : name;
}

export function localizeDefaultRoomName(
  name: string,
  locale: HouseholdLocale,
) {
  for (let index = 0; index < DEFAULT_ROOM_NAMES.de.length; index += 1) {
    if (
      name === DEFAULT_ROOM_NAMES.de[index] ||
      name === DEFAULT_ROOM_NAMES.en[index]
    ) {
      return DEFAULT_ROOM_NAMES[locale][index];
    }
  }

  const generatedRoom = /^(?:Neuer Raum|New room) (\d+)$/.exec(name);
  if (generatedRoom) {
    return `${locale === "de" ? "Neuer Raum" : "New room"} ${generatedRoom[1]}`;
  }

  return name;
}

export function createRoomId(name: string, index = 0) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${normalized || "room"}-${index + 1}`;
}

export function createHouseholdProfile({
  name,
  currency,
  electricityPrice,
  savingsGoalPercent,
  roomNames,
  now = new Date(),
}: {
  name: string;
  currency: SavedDeviceCurrency;
  electricityPrice: number;
  savingsGoalPercent: number;
  roomNames: readonly string[];
  now?: Date;
}): HouseholdProfile {
  const timestamp = now.toISOString();

  return {
    version: 1,
    name: name.trim() || "Home",
    currency,
    electricityPrice: Math.max(0, electricityPrice),
    electricityInputMode: "price",
    annualElectricityBill: 0,
    annualElectricityKwh: 0,
    monthlyElectricityPayment: 0,
    electricityBillIncludesBonus: false,
    savingsGoalPercent: Math.min(50, Math.max(1, savingsGoalPercent)),
    rooms: roomNames.map((roomName, index) => ({
      id: createRoomId(roomName, index),
      name: roomName,
    })),
    deviceRooms: {},
    createdAt: timestamp,
    updatedAt: timestamp,
    onboardingCompletedAt: timestamp,
  };
}

export function readHouseholdProfile(value: string | null) {
  if (!value) return null;

  try {
    const candidate = JSON.parse(value) as Partial<HouseholdProfile>;
    const validRooms =
      Array.isArray(candidate.rooms) &&
      candidate.rooms.every(
        (room) =>
          room &&
          typeof room === "object" &&
          typeof room.id === "string" &&
          typeof room.name === "string",
      );

    if (
      candidate.version !== 1 ||
      typeof candidate.name !== "string" ||
      typeof candidate.currency !== "string" ||
      typeof candidate.electricityPrice !== "number" ||
      typeof candidate.savingsGoalPercent !== "number" ||
      !validRooms ||
      !candidate.deviceRooms ||
      typeof candidate.deviceRooms !== "object" ||
      typeof candidate.createdAt !== "string" ||
      typeof candidate.updatedAt !== "string" ||
      typeof candidate.onboardingCompletedAt !== "string"
    ) {
      return null;
    }

    if (
      candidate.electricityInputMode !== undefined &&
      candidate.electricityInputMode !== "price" &&
      candidate.electricityInputMode !== "annual-bill" &&
      candidate.electricityInputMode !== "monthly-payment"
    ) {
      return null;
    }
    for (const value of [
      candidate.annualElectricityBill,
      candidate.annualElectricityKwh,
      candidate.monthlyElectricityPayment,
    ]) {
      if (value !== undefined && (typeof value !== "number" || value < 0)) {
        return null;
      }
    }
    if (
      candidate.electricityBillIncludesBonus !== undefined &&
      typeof candidate.electricityBillIncludesBonus !== "boolean"
    ) {
      return null;
    }

    return candidate as HouseholdProfile;
  } catch {
    return null;
  }
}

export function readMonthlyEnergyEntries(value: string | null) {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry): entry is MonthlyEnergyEntry => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Partial<MonthlyEnergyEntry>;
      return (
        typeof candidate.month === "string" &&
        /^\d{4}-\d{2}$/.test(candidate.month) &&
        typeof candidate.kwh === "number" &&
        candidate.kwh >= 0 &&
        typeof candidate.cost === "number" &&
        candidate.cost >= 0 &&
        typeof candidate.updatedAt === "string"
      );
    });
  } catch {
    return [];
  }
}

export function createMonthlyEnergyEntry({
  month,
  mode,
  value,
  electricityPrice,
  now = new Date(),
}: {
  month: string;
  mode: MonthlyEntryMode;
  value: number;
  electricityPrice: number;
  now?: Date;
}): MonthlyEnergyEntry | null {
  if (
    !/^\d{4}-\d{2}$/.test(month) ||
    !Number.isFinite(value) ||
    value <= 0 ||
    !Number.isFinite(electricityPrice) ||
    electricityPrice <= 0
  ) {
    return null;
  }

  return {
    month,
    kwh: mode === "consumption" ? value : value / electricityPrice,
    cost: mode === "bill" ? value : value * electricityPrice,
    updatedAt: now.toISOString(),
  };
}

export function createHouseholdBackup({
  profile,
  devices,
  history,
  costs = [],
  now = new Date(),
}: {
  profile: HouseholdProfile;
  devices: SavedDevice[];
  history: MonthlyEnergyEntry[];
  costs?: HouseholdCost[];
  now?: Date;
}): HouseholdBackup {
  return {
    version: 1,
    exportedAt: now.toISOString(),
    profile,
    devices,
    history,
    costs,
  };
}

function readBackupDevices(value: unknown): SavedDevice[] | null {
  if (!Array.isArray(value)) return null;
  const currencies: SavedDeviceCurrency[] = [
    "EUR",
    "CHF",
    "GBP",
    "PLN",
    "CZK",
    "HUF",
    "DKK",
    "SEK",
    "NOK",
    "RON",
  ];
  const devices = value.filter((item): item is SavedDevice => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Partial<SavedDevice>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.device === "string" &&
      typeof candidate.customDeviceName === "string" &&
      (candidate.mode === "estimate" || candidate.mode === "exact") &&
      currencies.includes(candidate.currency as SavedDeviceCurrency) &&
      typeof candidate.price === "number" &&
      typeof candidate.watts === "number" &&
      typeof candidate.minutesPerUse === "number" &&
      typeof candidate.usesPerWeek === "number" &&
      (candidate.usagePeriod === undefined ||
        candidate.usagePeriod === "week" ||
        candidate.usagePeriod === "month") &&
      (candidate.usageAmount === undefined ||
        typeof candidate.usageAmount === "number") &&
      typeof candidate.estimatedKwhPerUse === "number" &&
      typeof candidate.measuredKwhPerUse === "number" &&
      typeof candidate.yearlyKwh === "number" &&
      typeof candidate.yearlyCost === "number" &&
      typeof candidate.monthlyCost === "number" &&
      typeof candidate.updatedAt === "string"
    );
  });
  return devices.length === value.length ? devices : null;
}

function readBackupCosts(value: unknown): HouseholdCost[] | null {
  if (!Array.isArray(value)) return null;
  const categories = [
    "housing",
    "energy",
    "insurance",
    "mobility",
    "subscriptions",
    "financing",
    "leisure",
    "other",
  ];
  const frequencies = ["weekly", "monthly", "quarterly", "yearly"];
  const costs = value.filter((item): item is HouseholdCost => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Partial<HouseholdCost>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      categories.includes(candidate.category ?? "") &&
      typeof candidate.amount === "number" &&
      candidate.amount > 0 &&
      frequencies.includes(candidate.frequency ?? "") &&
      typeof candidate.nextDueDate === "string" &&
      (candidate.nextDueDate === "" ||
        /^\d{4}-\d{2}-\d{2}$/.test(candidate.nextDueDate)) &&
      typeof candidate.updatedAt === "string"
    );
  });
  return costs.length === value.length ? costs : null;
}

export function readHouseholdBackup(value: string): HouseholdBackup | null {
  try {
    const candidate: unknown = JSON.parse(value);
    if (!candidate || typeof candidate !== "object") return null;

    const backup = candidate as Partial<HouseholdBackup>;
    if (
      backup.version !== 1 ||
      typeof backup.exportedAt !== "string" ||
      !Array.isArray(backup.devices) ||
      !Array.isArray(backup.history)
    ) {
      return null;
    }

    const profile = readHouseholdProfile(JSON.stringify(backup.profile));
    const devices = readBackupDevices(backup.devices);
    const history = readMonthlyEnergyEntries(JSON.stringify(backup.history));
    const costs = readBackupCosts(
      Array.isArray(backup.costs) ? backup.costs : [],
    );
    if (
      !profile ||
      !devices ||
      !costs ||
      history.length !== backup.history.length ||
      (Array.isArray(backup.costs) && costs.length !== backup.costs.length)
    ) {
      return null;
    }

    const roomIds = new Set(profile.rooms.map((room) => room.id));
    const deviceIds = new Set(devices.map((device) => device.id));
    const deviceRooms = Object.fromEntries(
      Object.entries(profile.deviceRooms).filter(
        ([deviceId, roomId]) =>
          deviceIds.has(deviceId) && roomIds.has(roomId),
      ),
    );

    return {
      version: 1,
      exportedAt: backup.exportedAt,
      profile: { ...profile, deviceRooms },
      devices,
      history,
      costs,
    };
  } catch {
    return null;
  }
}

export function upsertMonthlyEnergyEntry(
  entries: MonthlyEnergyEntry[],
  nextEntry: MonthlyEnergyEntry,
) {
  return [nextEntry, ...entries.filter((entry) => entry.month !== nextEntry.month)]
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 24);
}

export function removeMonthlyEnergyEntry(
  entries: MonthlyEnergyEntry[],
  month: string,
) {
  return entries.filter((entry) => entry.month !== month);
}

export function calculateMonthlyConsumptionComparison({
  estimatedKwh,
  actualKwh,
  closeThresholdPercent = 10,
}: {
  estimatedKwh: number;
  actualKwh: number;
  closeThresholdPercent?: number;
}): MonthlyConsumptionComparison | null {
  if (
    !Number.isFinite(estimatedKwh) ||
    estimatedKwh <= 0 ||
    !Number.isFinite(actualKwh) ||
    actualKwh <= 0
  ) {
    return null;
  }

  const differenceKwh = actualKwh - estimatedKwh;
  const absoluteDifferenceKwh = Math.abs(differenceKwh);
  const differencePercent = (absoluteDifferenceKwh / actualKwh) * 100;
  const explainedPercent = (estimatedKwh / actualKwh) * 100;

  return {
    status:
      differencePercent <= closeThresholdPercent
        ? "close"
        : differenceKwh > 0
          ? "actual-higher"
          : "estimate-higher",
    differenceKwh,
    absoluteDifferenceKwh,
    differencePercent,
    explainedPercent,
  };
}

export function calculateMonthlyEnergyTrend(
  entries: MonthlyEnergyEntry[],
): MonthlyEnergyTrend | null {
  if (entries.length < 2) return null;

  const [current, previous] = [...entries].sort((a, b) =>
    b.month.localeCompare(a.month),
  );
  if (previous.kwh <= 0 || previous.cost <= 0) return null;

  const consumptionDifferenceKwh = current.kwh - previous.kwh;
  const costDifference = current.cost - previous.cost;

  return {
    currentMonth: current.month,
    previousMonth: previous.month,
    consumptionDifferenceKwh,
    consumptionChangePercent:
      (consumptionDifferenceKwh / previous.kwh) * 100,
    costDifference,
    costChangePercent: (costDifference / previous.cost) * 100,
  };
}

export function calculateMonthlyHistoryStreak(entries: MonthlyEnergyEntry[]) {
  const months = [...new Set(entries.map((entry) => entry.month))]
    .filter((month) => /^\d{4}-\d{2}$/.test(month))
    .sort((a, b) => b.localeCompare(a));
  if (months.length === 0) return 0;

  let streak = 1;
  let [year, month] = months[0].split("-").map(Number);
  for (let index = 1; index < months.length; index += 1) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    const expected = `${year}-${String(month).padStart(2, "0")}`;
    if (months[index] !== expected) break;
    streak += 1;
  }

  return streak;
}

export function calculateMonthlySavingsGoalProgress({
  entries,
  savingsGoalPercent,
}: {
  entries: MonthlyEnergyEntry[];
  savingsGoalPercent: number;
}): MonthlySavingsGoalProgress | null {
  if (entries.length < 2 || savingsGoalPercent <= 0) return null;

  const [current, previous] = [...entries].sort((a, b) =>
    b.month.localeCompare(a.month),
  );
  if (current.cost < 0 || previous.cost <= 0) return null;

  const targetReduction = previous.cost * (savingsGoalPercent / 100);
  const targetCost = previous.cost - targetReduction;
  const savedAmount = Math.max(0, previous.cost - current.cost);
  const remainingAmount = Math.max(0, current.cost - targetCost);
  const progressPercent = Math.min(
    100,
    Math.max(0, (savedAmount / targetReduction) * 100),
  );

  return {
    baselineCost: previous.cost,
    currentCost: current.cost,
    targetCost,
    savedAmount,
    remainingAmount,
    progressPercent,
    reached: current.cost <= targetCost,
  };
}

export function calculateHouseholdSummary(
  savedDevices: SavedDevice[],
  profile: HouseholdProfile,
) {
  const annualKwh = savedDevices.reduce(
    (total, device) => total + device.yearlyKwh,
    0,
  );
  const annualCost = annualKwh * profile.electricityPrice;
  const targetAnnualCost = annualCost * (1 - profile.savingsGoalPercent / 100);
  const targetSavings = annualCost - targetAnnualCost;
  const topDevice = [...savedDevices].sort(
    (a, b) => b.yearlyKwh - a.yearlyKwh,
  )[0] ?? null;
  const roomTotals = profile.rooms.map((room) => {
    const devices = savedDevices.filter(
      (device) => profile.deviceRooms[device.id] === room.id,
    );
    const annualKwh = devices.reduce(
      (total, device) => total + device.yearlyKwh,
      0,
    );
    return {
      ...room,
      deviceCount: devices.length,
      annualCost: annualKwh * profile.electricityPrice,
      annualKwh,
    };
  });
  const assignedDeviceIds = new Set(Object.keys(profile.deviceRooms));

  return {
    deviceCount: savedDevices.length,
    annualCost,
    monthlyCost: annualCost / 12,
    annualKwh,
    monthlyKwh: annualKwh / 12,
    targetAnnualCost,
    targetMonthlyCost: targetAnnualCost / 12,
    targetSavings,
    topDevice,
    roomTotals,
    unassignedDeviceCount: savedDevices.filter(
      (device) => !assignedDeviceIds.has(device.id),
    ).length,
  };
}
