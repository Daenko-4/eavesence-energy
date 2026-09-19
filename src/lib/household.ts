import type { SavedDevice, SavedDeviceCurrency } from "@/lib/savedDevices";

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

export type HouseholdBackup = {
  version: 1;
  exportedAt: string;
  profile: HouseholdProfile;
  devices: SavedDevice[];
  history: MonthlyEnergyEntry[];
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
  now = new Date(),
}: {
  profile: HouseholdProfile;
  devices: SavedDevice[];
  history: MonthlyEnergyEntry[];
  now?: Date;
}): HouseholdBackup {
  return {
    version: 1,
    exportedAt: now.toISOString(),
    profile,
    devices,
    history,
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
    if (
      !profile ||
      !devices ||
      history.length !== backup.history.length
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
