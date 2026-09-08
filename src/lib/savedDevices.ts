export type SavedDeviceMode = "estimate" | "exact";

export type SavedDeviceCurrency =
  | "EUR"
  | "CHF"
  | "GBP"
  | "PLN"
  | "CZK"
  | "HUF"
  | "DKK"
  | "SEK"
  | "NOK"
  | "RON";

export const SAVED_DEVICES_STORAGE_KEY =
  "eavesence-saved-devices-v1";

export type SavedDevice = {
  id: string;
  device: string;
  customDeviceName: string;
  mode: SavedDeviceMode;
  currency: SavedDeviceCurrency;
  price: number;
  watts: number;
  minutesPerUse: number;
  usesPerWeek: number;
  estimatedKwhPerUse: number;
  measuredKwhPerUse: number;
  yearlyKwh: number;
  yearlyCost: number;
  monthlyCost: number;
  updatedAt: string;
};

export function readSavedDevices(value: string | null): SavedDevice[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is SavedDevice => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as Partial<SavedDevice>;

      return (
        typeof candidate.id === "string" &&
        typeof candidate.device === "string" &&
        typeof candidate.customDeviceName === "string" &&
        (candidate.mode === "estimate" ||
          candidate.mode === "exact") &&
        [
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
        ].includes(candidate.currency ?? "") &&
        typeof candidate.price === "number" &&
        typeof candidate.watts === "number" &&
        typeof candidate.minutesPerUse === "number" &&
        typeof candidate.usesPerWeek === "number" &&
        typeof candidate.estimatedKwhPerUse === "number" &&
        typeof candidate.measuredKwhPerUse === "number" &&
        typeof candidate.yearlyKwh === "number" &&
        typeof candidate.yearlyCost === "number" &&
        typeof candidate.monthlyCost === "number" &&
        typeof candidate.updatedAt === "string"
      );
    });
  } catch {
    return [];
  }
}
