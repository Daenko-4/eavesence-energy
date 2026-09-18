"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { devices } from "@/data/devices";
import type { Locale } from "@/i18n/config";
import { getLocalizedDevice } from "@/i18n/devices";
import {
  calculateHouseholdSummary,
  createHouseholdBackup,
  createMonthlyEnergyEntry,
  createHouseholdProfile,
  createRoomId,
  DEFAULT_ROOM_NAMES,
  HOUSEHOLD_CHANGED_EVENT,
  HOUSEHOLD_HISTORY_STORAGE_KEY,
  HOUSEHOLD_PROFILE_STORAGE_KEY,
  HOUSEHOLD_VISIT_STORAGE_KEY,
  localizeDefaultHouseholdName,
  localizeDefaultRoomName,
  readHouseholdProfile,
  readHouseholdBackup,
  readMonthlyEnergyEntries,
  upsertMonthlyEnergyEntry,
  type HouseholdProfile,
  type HouseholdVisitState,
  type MonthlyEnergyEntry,
} from "@/lib/household";
import {
  readSavedDevices,
  SAVED_DEVICES_STORAGE_KEY,
  type SavedDevice,
  type SavedDeviceCurrency,
} from "@/lib/savedDevices";

const BETA_INTEREST_STORAGE_KEY = "eavesence-home-beta-interest-v1";
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

const copy = {
  de: {
    pageTitle: "Mein Zuhause",
    pageSubtitle: "Alle Geräte, Kosten und Sparziele an einem Ort.",
    onboardingEyebrow: "EAVESENCE Home",
    onboardingTitle: "Richte dein Zuhause ein",
    onboardingText:
      "In weniger als einer Minute entsteht aus einzelnen Berechnungen deine persönliche Energieübersicht. Alles bleibt zunächst lokal in diesem Browser.",
    householdName: "Name des Zuhauses",
    householdNamePlaceholder: "Mein Zuhause",
    price: "Strompreis pro kWh",
    currency: "Währung",
    goal: "Sparziel",
    goalSuffix: "% weniger Jahreskosten",
    rooms: "Räume",
    start: "Zuhause erstellen",
    private: "Ohne Konto · lokal gespeichert · jederzeit löschbar",
    overview: "Deine Übersicht",
    editGoal: "Ziel anpassen",
    monthly: "Pro Monat",
    yearly: "Pro Jahr",
    consumption: "Jahresverbrauch",
    target: "Zielkosten pro Monat",
    targetDifference: "weniger pro Monat",
    targetSavings: "Mögliche Ersparnis pro Jahr",
    devices: "Geräte",
    activation: "Dein Haushaltsprofil",
    activationReady: "Grundlage vollständig",
    activationProgress: "Geräten für eine aussagekräftige Übersicht",
    activationText: "Speichere drei Geräte, damit die Übersicht aussagekräftig wird.",
    addDevice: "Gerät berechnen und speichern",
    roomsTitle: "Kosten nach Raum",
    roomSingular: "Raum",
    roomPlural: "Räume",
    otherRooms: "Weitere Räume",
    emptyRoomsHint: "Noch ohne zugeordnete Geräte",
    unassigned: "Noch nicht zugeordnet",
    assign: "Raum zuordnen",
    noDevices: "Noch keine Geräte gespeichert.",
    deviceAssigned: "Gerät wurde dem Raum zugeordnet.",
    deviceUnassigned: "Gerätezuordnung wurde entfernt.",
    roomRenamed: "Raum wurde umbenannt.",
    topConsumer: "Größter Kostenpunkt",
    monthlyCheckIn: "Monatlicher Check-in",
    checkInText:
      "Wähle Verbrauch oder Rechnungsbetrag. Den zweiten Wert berechnen wir automatisch mit deinem Strompreis.",
    consumptionEntry: "Verbrauch erfassen",
    billEntry: "Rechnung erfassen",
    month: "Monat",
    kwh: "Verbrauch in kWh",
    cost: "Kosten",
    calculatedCost: "Automatisch berechnete Kosten",
    estimatedConsumption: "Geschätzter Verbrauch",
    saveCheckIn: "Monat speichern",
    checkInSaved: "Monatswert wurde gespeichert.",
    checkInRequired: "Bitte gib einen Wert größer als 0 ein.",
    checkInPriceRequired:
      "Bitte hinterlege zuerst einen Strompreis größer als 0 in den Einstellungen.",
    history: "Verlauf",
    noHistory: "Noch kein Monatswert vorhanden.",
    comparedWithPrevious: "gegenüber dem vorherigen Eintrag",
    chartTitle: "Monatsentwicklung",
    chartConsumption: "Verbrauch",
    chartCost: "Kosten",
    comparisonTitle: "Schätzung und tatsächlicher Verbrauch",
    calculatedEstimate: "Berechnete Geräte pro Monat",
    actualRecorded: "Tatsächlicher Monatswert",
    comparisonDifference: "Abweichung",
    noComparison:
      "Speichere Geräte und einen Monatswert, um Schätzung und tatsächlichen Verbrauch zu vergleichen.",
    proEyebrow: "EAVESENCE Pro",
    proTitle: "Mehr Klarheit für dein ganzes Zuhause",
    proText:
      "Unbegrenzte Geräte, Monatsverlauf, mehrere Haushalte, Synchronisation und später Energieetikett- sowie Rechnungsscan.",
    monthlyPlan: "Monatlich",
    yearlyPlan: "Jährlich",
    monthlyPrice: "5,99 € / Monat",
    yearlyPrice: "49,99 € / Jahr",
    yearlyHint: "ca. 30 % sparen",
    beta: "Beta-Platz vormerken",
    betaSaved: "Beta-Interesse gespeichert",
    betaDetail:
      "Noch keine Zahlung. Wir messen damit nur, ob die Pro-Version für dich interessant ist.",
    proBilling: "Abrechnung in EUR",
    proPreviewTitle: "EAVESENCE Pro später entdecken",
    proPreviewText:
      "Sobald du drei Geräte oder zwei Monatswerte gespeichert hast, zeigen wir dir die Pro-Vorschau passend zu deinem Haushalt.",
    addRoom: "Raum hinzufügen",
    newRoom: "Neuer Raum",
    roomName: "Raumname",
    editRoom: "Umbenennen",
    deleteRoom: "Löschen",
    saveRoom: "Speichern",
    cancelRoomEdit: "Abbrechen",
    deleteRoomConfirm:
      "Diesen Raum löschen? Zugeordnete Geräte bleiben erhalten und werden auf „Noch nicht zugeordnet“ gesetzt.",
    settings: "Einstellungen",
    saveSettings: "Einstellungen speichern",
    saved: "Gespeichert",
    dataTitle: "Daten verwalten",
    dataText:
      "Die Sicherung enthält Einstellungen, Räume, Zuordnungen, gespeicherte Geräte und den Monatsverlauf. Sie enthält keine Konto- oder Cloud-Daten.",
    importHome: "Sicherung importieren",
    exportHome: "Sicherung exportieren",
    resetHome: "My Home zurücksetzen",
    importedHome: "My-Home-Sicherung importiert.",
    importHomeError: "Diese Sicherungsdatei ist ungültig oder unvollständig.",
    importHomeConfirm:
      "Diese Sicherung ersetzt dein aktuelles Zuhause, deine gespeicherten Geräte und den Monatsverlauf. Fortfahren?",
    resetHomeConfirm:
      "My Home wirklich zurücksetzen? Räume, Zuordnungen und Monatsverlauf werden gelöscht. Deine gespeicherten Geräte bleiben erhalten.",
    dragRoom: "Raum verschieben",
    moveRoomEarlier: "Weiter nach vorne",
    moveRoomLater: "Weiter nach hinten",
  },
  en: {
    pageTitle: "My home",
    pageSubtitle: "All devices, costs and savings goals in one place.",
    onboardingEyebrow: "EAVESENCE Home",
    onboardingTitle: "Set up your home",
    onboardingText:
      "Turn individual calculations into a personal energy overview in less than a minute. Everything initially stays in this browser.",
    householdName: "Home name",
    householdNamePlaceholder: "My home",
    price: "Electricity price per kWh",
    currency: "Currency",
    goal: "Savings goal",
    goalSuffix: "% lower yearly costs",
    rooms: "Rooms",
    start: "Create my home",
    private: "No account · stored locally · delete at any time",
    overview: "Your overview",
    editGoal: "Adjust goal",
    monthly: "Per month",
    yearly: "Per year",
    consumption: "Yearly consumption",
    target: "Target cost per month",
    targetDifference: "less per month",
    targetSavings: "Potential yearly savings",
    devices: "Devices",
    activation: "Your home profile",
    activationReady: "Foundation complete",
    activationProgress: "devices for a meaningful overview",
    activationText: "Save three devices to make your overview meaningful.",
    addDevice: "Calculate and save a device",
    roomsTitle: "Cost by room",
    roomSingular: "room",
    roomPlural: "rooms",
    otherRooms: "Other rooms",
    emptyRoomsHint: "No assigned devices yet",
    unassigned: "Not assigned yet",
    assign: "Assign room",
    noDevices: "No devices saved yet.",
    deviceAssigned: "Device assigned to the room.",
    deviceUnassigned: "Device assignment removed.",
    roomRenamed: "Room renamed.",
    topConsumer: "Highest cost",
    monthlyCheckIn: "Monthly check-in",
    checkInText:
      "Choose consumption or bill amount. We calculate the second value automatically using your electricity price.",
    consumptionEntry: "Enter consumption",
    billEntry: "Enter bill amount",
    month: "Month",
    kwh: "Consumption in kWh",
    cost: "Cost",
    calculatedCost: "Automatically calculated cost",
    estimatedConsumption: "Estimated consumption",
    saveCheckIn: "Save month",
    checkInSaved: "Monthly value saved.",
    checkInRequired: "Enter a value greater than 0.",
    checkInPriceRequired:
      "First add an electricity price greater than 0 in Settings.",
    history: "History",
    noHistory: "No monthly value yet.",
    comparedWithPrevious: "compared with the previous entry",
    chartTitle: "Monthly trend",
    chartConsumption: "Consumption",
    chartCost: "Cost",
    comparisonTitle: "Estimate and actual consumption",
    calculatedEstimate: "Calculated devices per month",
    actualRecorded: "Actual monthly value",
    comparisonDifference: "Difference",
    noComparison:
      "Save devices and a monthly value to compare the estimate with actual consumption.",
    proEyebrow: "EAVESENCE Pro",
    proTitle: "More clarity for your whole home",
    proText:
      "Unlimited devices, monthly history, multiple homes, sync and later energy-label and bill scanning.",
    monthlyPlan: "Monthly",
    yearlyPlan: "Yearly",
    monthlyPrice: "€5.99 / month",
    yearlyPrice: "€49.99 / year",
    yearlyHint: "save about 30%",
    beta: "Reserve a beta place",
    betaSaved: "Beta interest saved",
    betaDetail:
      "No payment yet. This only tells us whether the Pro version interests you.",
    proBilling: "Billed in EUR",
    proPreviewTitle: "Discover EAVESENCE Pro later",
    proPreviewText:
      "Once you have saved three devices or two monthly values, we will show the Pro preview in the context of your home.",
    addRoom: "Add room",
    newRoom: "New room",
    roomName: "Room name",
    editRoom: "Rename",
    deleteRoom: "Delete",
    saveRoom: "Save",
    cancelRoomEdit: "Cancel",
    deleteRoomConfirm:
      "Delete this room? Assigned devices will be kept and moved to “Not assigned yet”.",
    settings: "Settings",
    saveSettings: "Save settings",
    saved: "Saved",
    dataTitle: "Manage data",
    dataText:
      "The backup contains settings, rooms, assignments, saved devices and monthly history. It contains no account or cloud data.",
    importHome: "Import backup",
    exportHome: "Export backup",
    resetHome: "Reset My home",
    importedHome: "My home backup imported.",
    importHomeError: "This backup file is invalid or incomplete.",
    importHomeConfirm:
      "This backup will replace your current home, saved devices and monthly history. Continue?",
    resetHomeConfirm:
      "Reset My home? Rooms, assignments and monthly history will be deleted. Your saved devices will be kept.",
    dragRoom: "Reorder room",
    moveRoomEarlier: "Move earlier",
    moveRoomLater: "Move later",
  },
} as const;

function formatMoney(value: number, locale: Locale, currency: SavedDeviceCurrency) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMoneyPrecise(
  value: number,
  locale: Locale,
  currency: SavedDeviceCurrency,
) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.abs(value) < 1 ? 4 : 2,
  }).format(value);
}

function formatNumber(value: number, locale: Locale, digits = 0) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    maximumFractionDigits: digits,
  }).format(value);
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function positiveNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function MonthlyHistoryChart({
  entries,
  locale,
  currency,
  labels,
}: {
  entries: MonthlyEnergyEntry[];
  locale: Locale;
  currency: SavedDeviceCurrency;
  labels: { title: string; consumption: string; cost: string };
}) {
  const chartEntries = entries.slice(0, 6).reverse();
  if (chartEntries.length === 0) return null;

  const maxKwh = Math.max(...chartEntries.map((entry) => entry.kwh), 1);
  const maxCost = Math.max(...chartEntries.map((entry) => entry.cost), 1);
  const dateFormatter = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });

  return (
    <div className="mt-6 border-t border-slate-100 pt-5" aria-label={labels.title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-slate-900">{labels.title}</h3>
        <div className="flex gap-4 text-[11px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--brand-green)]" />{labels.consumption}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />{labels.cost}</span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {chartEntries.map((entry) => (
          <div key={entry.month} className="grid grid-cols-[4.25rem_1fr] items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              {dateFormatter.format(new Date(`${entry.month}-01T00:00:00Z`))}
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--brand-green)]" style={{ width: `${Math.max(3, (entry.kwh / maxKwh) * 100)}%` }} /></div>
                <span className="w-20 text-right text-[11px] tabular-nums text-slate-500">{formatNumber(entry.kwh, locale, 1)} kWh</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.max(3, (entry.cost / maxCost) * 100)}%` }} /></div>
                <span className="w-20 text-right text-[11px] tabular-nums text-slate-500">{formatMoney(entry.cost, locale, currency)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function localizedSavedDeviceName(device: SavedDevice, locale: Locale) {
  if (device.device === "__custom_device__") {
    return device.customDeviceName || (locale === "de" ? "Eigenes Gerät" : "Custom device");
  }
  const source = devices.find((item) => item.name === device.device);
  return source ? getLocalizedDevice(source, locale).name : device.device;
}

function readVisitState(value: string | null): HouseholdVisitState | null {
  if (!value) return null;
  try {
    const candidate = JSON.parse(value) as HouseholdVisitState;
    return typeof candidate.firstVisitAt === "string" &&
      typeof candidate.lastVisitAt === "string" &&
      typeof candidate.visitCount === "number"
      ? candidate
      : null;
  } catch {
    return null;
  }
}

export default function HouseholdDashboard({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const calculatorHref = locale === "de" ? "/de#rechner" : "/#rechner";
  const languageHref = locale === "de" ? "/home" : "/de/zuhause";
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<HouseholdProfile | null>(null);
  const [savedDevices, setSavedDevices] = useState<SavedDevice[]>([]);
  const [history, setHistory] = useState<MonthlyEnergyEntry[]>([]);
  const [name, setName] = useState(locale === "de" ? "Mein Zuhause" : "My home");
  const [currency, setCurrency] = useState<SavedDeviceCurrency>("EUR");
  const [price, setPrice] = useState(0.3);
  const [goal, setGoal] = useState(10);
  const [month, setMonth] = useState(currentMonth());
  const [monthKwh, setMonthKwh] = useState("");
  const [monthCost, setMonthCost] = useState("");
  const [checkInMode, setCheckInMode] = useState<"consumption" | "bill">("consumption");
  const [checkInFeedback, setCheckInFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [betaInterested, setBetaInterested] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [emptyRoomsOpen, setEmptyRoomsOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomNameDraft, setRoomNameDraft] = useState("");
  const [draggedRoomId, setDraggedRoomId] = useState<string | null>(null);
  const [dragOverRoomId, setDragOverRoomId] = useState<string | null>(null);
  const [roomNotice, setRoomNotice] = useState("");
  const [notice, setNotice] = useState("");
  const homeImportInputRef = useRef<HTMLInputElement>(null);

  const loadLocalData = useCallback(() => {
    const storedProfile = readHouseholdProfile(
      window.localStorage.getItem(HOUSEHOLD_PROFILE_STORAGE_KEY),
    );
    setProfile(storedProfile);
    if (storedProfile) {
      setName(localizeDefaultHouseholdName(storedProfile.name, locale));
      setCurrency(storedProfile.currency);
      setPrice(storedProfile.electricityPrice);
      setGoal(storedProfile.savingsGoalPercent);
    }
    setSavedDevices(readSavedDevices(window.localStorage.getItem(SAVED_DEVICES_STORAGE_KEY)));
    setHistory(readMonthlyEnergyEntries(window.localStorage.getItem(HOUSEHOLD_HISTORY_STORAGE_KEY)));
    setBetaInterested(window.localStorage.getItem(BETA_INTEREST_STORAGE_KEY) === "true");
  }, [locale]);

  useEffect(() => {
    const initialFrame = window.requestAnimationFrame(() => {
      loadLocalData();
      setReady(true);
    });
    window.addEventListener("storage", loadLocalData);
    window.addEventListener(HOUSEHOLD_CHANGED_EVENT, loadLocalData);

    const now = new Date();
    const existing = readVisitState(window.localStorage.getItem(HOUSEHOLD_VISIT_STORAGE_KEY));
    const next: HouseholdVisitState = existing
      ? { ...existing, lastVisitAt: now.toISOString(), visitCount: existing.visitCount + 1 }
      : {
          firstVisitAt: now.toISOString(),
          lastVisitAt: now.toISOString(),
          visitCount: 1,
          trackedSevenDayReturn: false,
          trackedThirtyDayReturn: false,
          trackedThreeDeviceActivation: false,
        };
    const ageDays = (now.getTime() - new Date(next.firstVisitAt).getTime()) / 86_400_000;
    if (ageDays >= 7 && !next.trackedSevenDayReturn) {
      track("Home Returned", { window: "7_day", locale });
      next.trackedSevenDayReturn = true;
    }
    if (ageDays >= 30 && !next.trackedThirtyDayReturn) {
      track("Home Returned", { window: "30_day", locale });
      next.trackedThirtyDayReturn = true;
    }
    if (!existing) track("Home Onboarding Started", { locale });
    window.localStorage.setItem(HOUSEHOLD_VISIT_STORAGE_KEY, JSON.stringify(next));

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("storage", loadLocalData);
      window.removeEventListener(HOUSEHOLD_CHANGED_EVENT, loadLocalData);
    };
  }, [loadLocalData, locale]);

  useEffect(() => {
    if (!ready || !profile) return;
    track("Home Dashboard Viewed", {
      locale,
      device_count: savedDevices.length,
      has_history: history.length > 0,
    });
  }, [ready, profile?.onboardingCompletedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || savedDevices.length < 3) return;
    const visitState = readVisitState(window.localStorage.getItem(HOUSEHOLD_VISIT_STORAGE_KEY));
    if (!visitState || visitState.trackedThreeDeviceActivation) return;
    visitState.trackedThreeDeviceActivation = true;
    window.localStorage.setItem(HOUSEHOLD_VISIT_STORAGE_KEY, JSON.stringify(visitState));
    track("Home Device Activation Reached", { locale, device_count: savedDevices.length });
  }, [locale, ready, savedDevices.length]);

  const summary = useMemo(
    () => (profile ? calculateHouseholdSummary(savedDevices, profile) : null),
    [profile, savedDevices],
  );

  function persistProfile(nextProfile: HouseholdProfile) {
    window.localStorage.setItem(HOUSEHOLD_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    window.dispatchEvent(new Event(HOUSEHOLD_CHANGED_EVENT));
  }

  function completeOnboarding() {
    const nextProfile = createHouseholdProfile({
      name,
      currency,
      electricityPrice: price,
      savingsGoalPercent: goal,
      roomNames: DEFAULT_ROOM_NAMES[locale],
    });
    persistProfile(nextProfile);
    track("Home Onboarding Completed", {
      locale,
      currency,
      room_count: nextProfile.rooms.length,
      savings_goal: nextProfile.savingsGoalPercent,
    });
  }

  function saveSettings() {
    if (!profile) return;
    persistProfile({
      ...profile,
      name: name.trim() || profile.name,
      currency,
      electricityPrice: Math.max(0, price),
      savingsGoalPercent: Math.min(50, Math.max(1, goal)),
      updatedAt: new Date().toISOString(),
    });
    setNotice(text.saved);
    setSettingsOpen(false);
    track("Home Savings Goal Set", { locale, savings_goal: goal });
  }

  function exportHome() {
    if (!profile) return;
    const backup = createHouseholdBackup({
      profile,
      devices: savedDevices,
      history,
    });
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `eavesence-home-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importHome(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const backup = readHouseholdBackup(await file.text());
    if (!backup) {
      setNotice(text.importHomeError);
      return;
    }
    if (!window.confirm(text.importHomeConfirm)) return;

    window.localStorage.setItem(
      HOUSEHOLD_PROFILE_STORAGE_KEY,
      JSON.stringify(backup.profile),
    );
    window.localStorage.setItem(
      SAVED_DEVICES_STORAGE_KEY,
      JSON.stringify(backup.devices),
    );
    window.localStorage.setItem(
      HOUSEHOLD_HISTORY_STORAGE_KEY,
      JSON.stringify(backup.history),
    );
    setProfile(backup.profile);
    setSavedDevices(backup.devices);
    setHistory(backup.history);
    setName(localizeDefaultHouseholdName(backup.profile.name, locale));
    setCurrency(backup.profile.currency);
    setPrice(backup.profile.electricityPrice);
    setGoal(backup.profile.savingsGoalPercent);
    setSettingsOpen(false);
    setNotice(text.importedHome);
    window.dispatchEvent(new Event(HOUSEHOLD_CHANGED_EVENT));
    track("Home Backup Imported", {
      locale,
      device_count: backup.devices.length,
      room_count: backup.profile.rooms.length,
    });
  }

  function resetHome() {
    if (!window.confirm(text.resetHomeConfirm)) return;
    window.localStorage.removeItem(HOUSEHOLD_PROFILE_STORAGE_KEY);
    window.localStorage.removeItem(HOUSEHOLD_HISTORY_STORAGE_KEY);
    window.localStorage.removeItem(HOUSEHOLD_VISIT_STORAGE_KEY);
    window.localStorage.removeItem(BETA_INTEREST_STORAGE_KEY);
    setProfile(null);
    setHistory([]);
    setName(locale === "de" ? "Mein Zuhause" : "My home");
    setCurrency("EUR");
    setPrice(0.3);
    setGoal(10);
    setBetaInterested(false);
    setCheckInFeedback(null);
    setRoomNotice("");
    setSettingsOpen(false);
    setNotice("");
    window.dispatchEvent(new Event(HOUSEHOLD_CHANGED_EVENT));
    track("Home Reset", { locale, devices_preserved: savedDevices.length });
  }

  function assignRoom(deviceId: string, roomId: string) {
    if (!profile) return;
    const deviceRooms = { ...profile.deviceRooms };
    if (roomId) deviceRooms[deviceId] = roomId;
    else delete deviceRooms[deviceId];
    persistProfile({ ...profile, deviceRooms, updatedAt: new Date().toISOString() });
    setRoomNotice(roomId ? text.deviceAssigned : text.deviceUnassigned);
    track("Home Room Assigned", { locale, assigned: Boolean(roomId) });
  }

  function addRoom() {
    if (!profile) return;
    let roomNumber = profile.rooms.length + 1;
    let roomName = `${text.newRoom} ${roomNumber}`;
    while (profile.rooms.some((room) => room.name === roomName)) {
      roomNumber += 1;
      roomName = `${text.newRoom} ${roomNumber}`;
    }
    let roomIndex = profile.rooms.length;
    let roomId = createRoomId(roomName, roomIndex);
    while (profile.rooms.some((room) => room.id === roomId)) {
      roomIndex += 1;
      roomId = createRoomId(roomName, roomIndex);
    }
    persistProfile({
      ...profile,
      rooms: [
        ...profile.rooms,
        { id: roomId, name: roomName },
      ],
      updatedAt: new Date().toISOString(),
    });
    setEditingRoomId(roomId);
    setRoomNameDraft(roomName);
  }

  function startEditingRoom(roomId: string, roomName: string) {
    setEditingRoomId(roomId);
    setRoomNameDraft(roomName);
  }

  function cancelEditingRoom() {
    setEditingRoomId(null);
    setRoomNameDraft("");
  }

  function saveRoomName(roomId: string) {
    if (!profile) return;
    const roomName = roomNameDraft.trim();
    if (!roomName) return;
    persistProfile({
      ...profile,
      rooms: profile.rooms.map((room) =>
        room.id === roomId ? { ...room, name: roomName } : room,
      ),
      updatedAt: new Date().toISOString(),
    });
    cancelEditingRoom();
    setRoomNotice(text.roomRenamed);
    track("Home Room Renamed", { locale });
  }

  function deleteRoom(roomId: string) {
    if (!profile || !window.confirm(text.deleteRoomConfirm)) return;
    const deviceRooms = Object.fromEntries(
      Object.entries(profile.deviceRooms).filter(
        ([, assignedRoomId]) => assignedRoomId !== roomId,
      ),
    );
    persistProfile({
      ...profile,
      rooms: profile.rooms.filter((room) => room.id !== roomId),
      deviceRooms,
      updatedAt: new Date().toISOString(),
    });
    if (editingRoomId === roomId) cancelEditingRoom();
    track("Home Room Deleted", { locale });
  }

  function reorderRooms(sourceRoomId: string, targetRoomId: string) {
    if (!profile || sourceRoomId === targetRoomId) return;
    const sourceIndex = profile.rooms.findIndex(
      (room) => room.id === sourceRoomId,
    );
    const targetIndex = profile.rooms.findIndex(
      (room) => room.id === targetRoomId,
    );
    if (sourceIndex < 0 || targetIndex < 0) return;

    const rooms = [...profile.rooms];
    const [room] = rooms.splice(sourceIndex, 1);
    rooms.splice(targetIndex, 0, room);
    persistProfile({
      ...profile,
      rooms,
      updatedAt: new Date().toISOString(),
    });
    track("Home Rooms Reordered", { locale, method: "drag" });
  }

  function moveRoom(roomId: string, offset: -1 | 1) {
    if (!profile) return;
    const sourceIndex = profile.rooms.findIndex((room) => room.id === roomId);
    const targetIndex = sourceIndex + offset;
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= profile.rooms.length) {
      return;
    }
    const rooms = [...profile.rooms];
    [rooms[sourceIndex], rooms[targetIndex]] = [
      rooms[targetIndex],
      rooms[sourceIndex],
    ];
    persistProfile({
      ...profile,
      rooms,
      updatedAt: new Date().toISOString(),
    });
    track("Home Rooms Reordered", { locale, method: "button" });
  }

  function startRoomDrag(event: DragEvent<HTMLElement>, roomId: string) {
    setDraggedRoomId(roomId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", roomId);
  }

  function dropRoom(event: DragEvent<HTMLElement>, targetRoomId: string) {
    event.preventDefault();
    const sourceRoomId =
      draggedRoomId || event.dataTransfer.getData("text/plain");
    if (sourceRoomId) reorderRooms(sourceRoomId, targetRoomId);
    setDraggedRoomId(null);
    setDragOverRoomId(null);
  }

  function saveMonthlyCheckIn() {
    if (!profile) return;
    setCheckInFeedback(null);
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      setCheckInFeedback({ kind: "error", message: text.checkInRequired });
      return;
    }
    if (profile.electricityPrice <= 0) {
      setCheckInFeedback({ kind: "error", message: text.checkInPriceRequired });
      return;
    }

    const enteredValue = positiveNumber(
      checkInMode === "consumption" ? monthKwh : monthCost,
    );
    if (enteredValue === null) {
      setCheckInFeedback({ kind: "error", message: text.checkInRequired });
      return;
    }

    const nextEntry = createMonthlyEnergyEntry({
      month,
      mode: checkInMode,
      value: enteredValue,
      electricityPrice: profile.electricityPrice,
    });
    if (!nextEntry) {
      setCheckInFeedback({ kind: "error", message: text.checkInRequired });
      return;
    }
    const nextHistory = upsertMonthlyEnergyEntry(history, nextEntry);
    window.localStorage.setItem(HOUSEHOLD_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    setHistory(nextHistory);
    setMonthKwh("");
    setMonthCost("");
    setCheckInFeedback({ kind: "success", message: text.checkInSaved });
    track("Home Monthly Check In Saved", {
      locale,
      has_kwh: nextEntry.kwh > 0,
      has_cost: nextEntry.cost > 0,
    });
  }

  function submitBetaInterest() {
    window.localStorage.setItem(BETA_INTEREST_STORAGE_KEY, "true");
    setBetaInterested(true);
    track("Home Beta Interest Submitted", { locale, plan });
  }

  if (!ready) return <div className="min-h-screen bg-[var(--background)]" />;

  if (!profile) {
    return (
      <div lang={locale} className="min-h-screen bg-[var(--background)] text-[#07111f]">
        <Header locale={locale} languageHrefOverride={languageHref} />
        <main className="px-5 py-12 sm:px-6 sm:py-20">
          <section className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.45)] sm:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-green)]">{text.onboardingEyebrow}</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl">{text.onboardingTitle}</h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">{text.onboardingText}</p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
                {text.householdName}
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder={text.householdNamePlaceholder} className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 font-medium outline-none focus:border-[var(--brand-green)] focus:ring-2 focus:ring-green-100" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                {text.price}
                <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(Number(event.target.value))} className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 font-medium outline-none focus:border-[var(--brand-green)] focus:ring-2 focus:ring-green-100" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                {text.currency}
                <select value={currency} onChange={(event) => setCurrency(event.target.value as SavedDeviceCurrency)} className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 font-medium outline-none focus:border-[var(--brand-green)] focus:ring-2 focus:ring-green-100">
                  {currencies.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
                <span className="flex items-center justify-between"><span>{text.goal}</span><span className="text-[var(--brand-green)]">{goal}{text.goalSuffix}</span></span>
                <input type="range" min="1" max="30" value={goal} onChange={(event) => setGoal(Number(event.target.value))} className="accent-[var(--brand-green)]" />
              </label>
            </div>

            <button type="button" onClick={completeOnboarding} className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--brand-green)] px-6 text-sm font-extrabold text-white transition hover:bg-[var(--brand-green-dark)] sm:w-auto">{text.start}</button>
            <p className="mt-4 text-xs font-semibold text-slate-500">{text.private}</p>
          </section>
        </main>
        <Footer locale={locale} />
      </div>
    );
  }

  const activeProfile = profile;
  const historyDelta = history.length > 1 && history[1].cost > 0
    ? ((history[0].cost - history[1].cost) / history[1].cost) * 100
    : null;
  const monthlySavings = (summary?.targetSavings ?? 0) / 12;
  const latestActual = history[0] ?? null;
  const comparisonDifference = latestActual
    ? latestActual.kwh - (summary?.monthlyKwh ?? 0)
    : null;
  const proReady = savedDevices.length >= 3 || history.length >= 2;
  const occupiedRooms = summary?.roomTotals.filter((room) => room.deviceCount > 0) ?? [];
  const emptyRooms = summary?.roomTotals.filter((room) => room.deviceCount === 0) ?? [];
  const unassignedDevices = savedDevices.filter(
    (device) => !activeProfile.deviceRooms[device.id],
  );

  function roomCard(
    room: NonNullable<typeof summary>["roomTotals"][number],
    index: number,
    compact = false,
  ) {
    const roomName = localizeDefaultRoomName(room.name, locale);
    const isDropTarget = dragOverRoomId === room.id;
    const roomDevices = savedDevices.filter(
      (device) => activeProfile.deviceRooms[device.id] === room.id,
    );

    return (
      <article
        key={room.id}
        data-room-card
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          if (draggedRoomId !== room.id) setDragOverRoomId(room.id);
        }}
        onDragLeave={() => setDragOverRoomId(null)}
        onDrop={(event) => dropRoom(event, room.id)}
        className={`rounded-xl border transition ${compact ? "p-3" : "p-4"} ${
          isDropTarget
            ? "border-green-400 bg-green-50 ring-4 ring-green-100"
            : compact
              ? "border-slate-200 bg-white"
              : "border-slate-200 bg-slate-50"
        }`}
      >
        {editingRoomId === room.id ? (
          <form onSubmit={(event) => { event.preventDefault(); saveRoomName(room.id); }}>
            <label className="grid gap-1.5 text-xs font-bold text-slate-600">
              <span>{text.roomName}</span>
              <input autoFocus value={roomNameDraft} onChange={(event) => setRoomNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") cancelEditingRoom(); }} className="min-h-10 rounded-lg border border-green-300 bg-white px-3 text-sm text-slate-900 outline-none ring-green-100 focus:ring-4" />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="submit" disabled={!roomNameDraft.trim()} className="rounded-full bg-[var(--brand-green)] px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{text.saveRoom}</button>
              <button type="button" onClick={cancelEditingRoom} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">{text.cancelRoomEdit}</button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  draggable
                  onDragStart={(event) => startRoomDrag(event, room.id)}
                  onDragEnd={() => { setDraggedRoomId(null); setDragOverRoomId(null); }}
                  title={`${text.dragRoom}: ${roomName}`}
                  aria-hidden="true"
                  className="cursor-grab select-none rounded-md px-1.5 py-1 text-base font-bold tracking-[-0.2em] text-slate-400 transition hover:bg-white hover:text-[var(--brand-green)] active:cursor-grabbing"
                >
                  ⠿
                </span>
                <h3 className="truncate font-extrabold">{roomName}</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">{room.deviceCount}</span>
            </div>
            {!compact && (
              <>
                <p className="mt-3 text-xl font-extrabold">{formatMoney(room.annualCost, locale, activeProfile.currency)}</p>
                <p className="mt-1 text-xs text-slate-500">{text.yearly}</p>
                {roomDevices.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
                    {roomDevices.map((device) => (
                      <div key={device.id} className="rounded-lg bg-white px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{localizedSavedDeviceName(device, locale)}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{formatMoney(device.yearlyKwh * activeProfile.electricityPrice, locale, activeProfile.currency)} {text.yearly}</p>
                          </div>
                          <label className="sr-only" htmlFor={`room-${device.id}`}>{text.assign}</label>
                          <select id={`room-${device.id}`} aria-label={`${text.assign}: ${localizedSavedDeviceName(device, locale)}`} value={room.id} onChange={(event) => assignRoom(device.id, event.target.value)} className="min-h-9 max-w-32 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700">
                            <option value="">{text.unassigned}</option>
                            {activeProfile.rooms.map((option) => <option key={option.id} value={option.id}>{localizeDefaultRoomName(option.name, locale)}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <div className={`${compact ? "mt-2" : "mt-4 border-t border-slate-200 pt-3"} flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => startEditingRoom(room.id, roomName)} aria-label={`${text.editRoom}: ${roomName}`} className="text-xs font-bold text-[var(--brand-green)] hover:text-[var(--brand-green-dark)]">{text.editRoom}</button>
                <button type="button" onClick={() => deleteRoom(room.id)} aria-label={`${text.deleteRoom}: ${roomName}`} className="text-xs font-bold text-red-600 hover:text-red-700">{text.deleteRoom}</button>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveRoom(room.id, -1)} disabled={index === 0} aria-label={`${text.moveRoomEarlier}: ${roomName}`} title={text.moveRoomEarlier} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-500 transition hover:border-green-300 hover:text-[var(--brand-green)] disabled:cursor-not-allowed disabled:opacity-30">↑</button>
                <button type="button" onClick={() => moveRoom(room.id, 1)} disabled={index === activeProfile.rooms.length - 1} aria-label={`${text.moveRoomLater}: ${roomName}`} title={text.moveRoomLater} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-500 transition hover:border-green-300 hover:text-[var(--brand-green)] disabled:cursor-not-allowed disabled:opacity-30">↓</button>
              </div>
            </div>
          </>
        )}
      </article>
    );
  }

  return (
    <div lang={locale} className="min-h-screen bg-[var(--background)] text-[#07111f]">
      <Header locale={locale} languageHrefOverride={languageHref} />
      <main className="px-5 pb-20 pt-10 sm:px-6 sm:pt-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-green)]">EAVESENCE Home</p>
              <h1 className="mt-2 text-[clamp(2.25rem,4.1vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.05em]">{localizeDefaultHouseholdName(profile.name, locale)}</h1>
              <p className="mt-2 text-slate-600">{text.pageSubtitle}</p>
            </div>
            <button type="button" onClick={() => setSettingsOpen((current) => !current)} className="w-fit rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-green-300 hover:text-[var(--brand-green)]">{text.settings}</button>
          </div>

          {settingsOpen && (
            <section className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
              <label className="grid gap-1.5 text-xs font-bold text-slate-600"><span>{text.householdName}</span><input value={name} onChange={(event) => setName(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label>
              <label className="grid gap-1.5 text-xs font-bold text-slate-600"><span>{text.price}</span><input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(Number(event.target.value))} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label>
              <label className="grid gap-1.5 text-xs font-bold text-slate-600"><span>{text.currency}</span><select value={currency} onChange={(event) => setCurrency(event.target.value as SavedDeviceCurrency)} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm">{currencies.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="grid gap-1.5 text-xs font-bold text-slate-600"><span>{text.goal}: {goal}%</span><input type="range" min="1" max="30" value={goal} onChange={(event) => setGoal(Number(event.target.value))} className="mt-3 accent-[var(--brand-green)]" /></label>
              <button type="button" onClick={saveSettings} className="min-h-11 rounded-full bg-[var(--brand-green)] px-5 text-sm font-bold text-white sm:col-span-4 sm:justify-self-start">{text.saveSettings}</button>
              <div className="rounded-2xl border border-green-200 bg-[#f0faf4] p-4 sm:col-span-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">{text.dataTitle}</h2>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">{text.dataText}</p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <input
                      ref={homeImportInputRef}
                      type="file"
                      accept="application/json,.json"
                      onChange={importHome}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => homeImportInputRef.current?.click()}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-green-200 bg-white px-3.5 text-xs font-bold text-[var(--brand-green)] shadow-sm transition hover:-translate-y-0.5 hover:bg-green-50 hover:shadow-md"
                    >
                      <span aria-hidden="true">↑</span>
                      {text.importHome}
                    </button>
                    <button
                      type="button"
                      onClick={exportHome}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-green-200 bg-white px-3.5 text-xs font-bold text-[var(--brand-green)] shadow-sm transition hover:-translate-y-0.5 hover:bg-green-50 hover:shadow-md"
                    >
                      <span aria-hidden="true">↓</span>
                      {text.exportHome}
                    </button>
                    <button
                      type="button"
                      onClick={resetHome}
                      className="inline-flex min-h-10 items-center rounded-xl border border-red-200 bg-white px-3.5 text-xs font-bold text-red-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-md"
                    >
                      {text.resetHome}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
          {notice && <p role="status" className="mt-3 text-sm font-bold text-[var(--brand-green)]">{notice}</p>}

          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={text.overview}>
            {[
              [text.monthly, formatMoneyPrecise(summary?.monthlyCost ?? 0, locale, profile.currency), ""],
              [text.yearly, formatMoney(summary?.annualCost ?? 0, locale, profile.currency), ""],
              [text.consumption, `${formatNumber(summary?.annualKwh ?? 0, locale)} kWh`, ""],
              [text.target, formatMoneyPrecise(summary?.targetMonthlyCost ?? 0, locale, profile.currency), `${formatMoneyPrecise(monthlySavings, locale, profile.currency)} ${text.targetDifference}`],
            ].map(([label, value, detail], index) => (
              <article key={label} className={`rounded-2xl border p-5 ${index === 0 ? "border-green-200 bg-[#eaf8ef]" : "border-slate-200 bg-white"}`}>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
                <p className="mt-3 text-2xl font-extrabold tracking-[-0.04em]">{value}</p>
                {detail && <p className="mt-1 text-xs font-semibold text-[var(--brand-green)]">{detail}</p>}
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{text.activation}</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em]">{savedDevices.length >= 3 ? text.activationReady : `${savedDevices.length} ${locale === "de" ? "von" : "of"} 3 ${text.activationProgress}`}</h2></div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-lg font-extrabold text-[var(--brand-green)]">{Math.min(3, savedDevices.length)}</div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--brand-green)] transition-all" style={{ width: `${Math.min(100, (savedDevices.length / 3) * 100)}%` }} /></div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{text.activationText}</p>
              <Link href={calculatorHref} className="mt-5 inline-flex text-sm font-extrabold text-[var(--brand-green)] hover:text-[var(--brand-green-dark)]">{text.addDevice} →</Link>
            </div>
            <div className="rounded-2xl bg-[#17211f] p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--brand-green-mint)]">{text.targetSavings}</p>
              <p className="mt-3 text-3xl font-extrabold tracking-[-0.045em]">{formatMoney(summary?.targetSavings ?? 0, locale, profile.currency)}</p>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">{text.topConsumer}</p>
              <p className="mt-2 font-bold">{summary?.topDevice ? localizedSavedDeviceName(summary.topDevice, locale) : "—"}</p>
            </div>
          </section>

          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">{text.roomsTitle}</h2>
                <p className="mt-1 text-sm text-slate-600">{profile.rooms.length} {profile.rooms.length === 1 ? text.roomSingular : text.roomPlural}</p>
              </div>
              <button type="button" onClick={addRoom} className="w-fit text-sm font-bold text-[var(--brand-green)]">+ {text.addRoom}</button>
            </div>

            {roomNotice && <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-[var(--brand-green)]">{roomNotice}</p>}

            {occupiedRooms.length > 0 ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {occupiedRooms.map((room) => roomCard(room, profile.rooms.findIndex((item) => item.id === room.id)))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
                <p className="text-sm text-slate-600">{text.noDevices}</p>
                <Link href={calculatorHref} className="mt-2 inline-flex text-sm font-bold text-[var(--brand-green)]">{text.addDevice} →</Link>
              </div>
            )}

            {unassignedDevices.length > 0 && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <h3 className="text-sm font-extrabold text-slate-900">{text.unassigned}</h3>
                <div className="mt-2 divide-y divide-amber-100">
                  {unassignedDevices.map((device) => (
                    <div key={device.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div><p className="font-bold">{localizedSavedDeviceName(device, locale)}</p><p className="mt-1 text-xs text-slate-500">{formatMoney(device.yearlyKwh * profile.electricityPrice, locale, profile.currency)} {text.yearly}</p></div>
                      <label className="flex items-center gap-3 text-xs font-bold text-slate-500"><span>{text.assign}</span><select value="" onChange={(event) => assignRoom(device.id, event.target.value)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="">{text.unassigned}</option>{profile.rooms.map((room) => <option key={room.id} value={room.id}>{localizeDefaultRoomName(room.name, locale)}</option>)}</select></label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {emptyRooms.length > 0 && (
              <details
                open={emptyRoomsOpen || Boolean(editingRoomId && emptyRooms.some((room) => room.id === editingRoomId))}
                onToggle={(event) => setEmptyRoomsOpen(event.currentTarget.open)}
                className="group mt-6 rounded-xl border border-slate-200 bg-slate-50"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
                  <span>{text.otherRooms} ({emptyRooms.length}) <span className="ml-2 font-normal text-slate-500">{text.emptyRoomsHint}</span></span>
                  <span aria-hidden="true" className="text-[var(--brand-green)] transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <div className="grid gap-3 border-t border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {emptyRooms.map((room) => roomCard(room, profile.rooms.findIndex((item) => item.id === room.id), true))}
                </div>
              </details>
            )}
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">{text.monthlyCheckIn}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text.checkInText}</p>
              <div className="mt-5 grid grid-cols-2 rounded-full bg-slate-100 p-1">
                <button type="button" aria-pressed={checkInMode === "consumption"} onClick={() => { setCheckInMode("consumption"); setCheckInFeedback(null); }} className={`rounded-full px-3 py-2 text-xs font-bold transition ${checkInMode === "consumption" ? "bg-white text-[var(--brand-green)] shadow-sm" : "text-slate-500"}`}>{text.consumptionEntry}</button>
                <button type="button" aria-pressed={checkInMode === "bill"} onClick={() => { setCheckInMode("bill"); setCheckInFeedback(null); }} className={`rounded-full px-3 py-2 text-xs font-bold transition ${checkInMode === "bill" ? "bg-white text-[var(--brand-green)] shadow-sm" : "text-slate-500"}`}>{text.billEntry}</button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-bold text-slate-600 sm:col-span-2">{text.month}<input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setCheckInFeedback(null); }} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label>
                {checkInMode === "consumption" ? (
                  <>
                    <label className="grid gap-1.5 text-xs font-bold text-slate-600">{text.kwh}<input type="text" inputMode="decimal" value={monthKwh} onChange={(event) => { setMonthKwh(event.target.value); setCheckInFeedback(null); }} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label>
                    <div className="rounded-xl bg-slate-50 px-3 py-2"><p className="text-xs font-bold text-slate-500">{text.calculatedCost}</p><p className="mt-1 font-extrabold">{formatMoneyPrecise((positiveNumber(monthKwh) ?? 0) * profile.electricityPrice, locale, profile.currency)}</p></div>
                  </>
                ) : (
                  <>
                    <label className="grid gap-1.5 text-xs font-bold text-slate-600">{text.cost}<input type="text" inputMode="decimal" value={monthCost} onChange={(event) => { setMonthCost(event.target.value); setCheckInFeedback(null); }} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label>
                    <div className="rounded-xl bg-slate-50 px-3 py-2"><p className="text-xs font-bold text-slate-500">{text.estimatedConsumption}</p><p className="mt-1 font-extrabold">{formatNumber(profile.electricityPrice > 0 ? (positiveNumber(monthCost) ?? 0) / profile.electricityPrice : 0, locale, 1)} kWh</p></div>
                  </>
                )}
              </div>
              {checkInFeedback && <p role={checkInFeedback.kind === "error" ? "alert" : "status"} className={`mt-4 rounded-xl px-3 py-2.5 text-sm font-bold ${checkInFeedback.kind === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-[var(--brand-green)]"}`}>{checkInFeedback.message}</p>}
              <button type="button" onClick={saveMonthlyCheckIn} className="mt-5 min-h-11 rounded-full bg-[var(--brand-green)] px-5 text-sm font-bold text-white">{text.saveCheckIn}</button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">{text.history}</h2>{historyDelta !== null && <span className={`rounded-full px-3 py-1 text-xs font-bold ${historyDelta <= 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{historyDelta > 0 ? "+" : ""}{formatNumber(historyDelta, locale, 1)}%</span>}</div>
              {history.length === 0 ? <p className="mt-6 text-sm text-slate-500">{text.noHistory}</p> : <div className="mt-5 space-y-3">{history.slice(0, 6).map((entry, index) => <div key={entry.month} data-monthly-history-entry={entry.month} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl bg-slate-50 px-4 py-3"><span className="text-sm font-bold">{new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${entry.month}-01T00:00:00Z`))}</span><span className="text-sm text-slate-500">{formatNumber(entry.kwh, locale, 1)} kWh</span><span className="text-sm font-extrabold">{formatMoney(entry.cost, locale, profile.currency)}</span>{index === 0 && historyDelta !== null && <span className="col-span-3 text-xs text-slate-500">{text.comparedWithPrevious}</span>}</div>)}</div>}
              <MonthlyHistoryChart entries={history} locale={locale} currency={profile.currency} labels={{ title: text.chartTitle, consumption: text.chartConsumption, cost: text.chartCost }} />
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-extrabold tracking-[-0.025em] sm:text-2xl">{text.comparisonTitle}</h2>
            {latestActual && savedDevices.length > 0 ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">{text.calculatedEstimate}</p><p className="mt-2 text-xl font-extrabold">{formatNumber(summary?.monthlyKwh ?? 0, locale, 1)} kWh</p></div>
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">{text.actualRecorded}</p><p className="mt-2 text-xl font-extrabold">{formatNumber(latestActual.kwh, locale, 1)} kWh</p></div>
                <div className="rounded-xl bg-green-50 p-4"><p className="text-xs font-bold text-[var(--brand-green)]">{text.comparisonDifference}</p><p className="mt-2 text-xl font-extrabold text-[var(--brand-green)]">{comparisonDifference !== null && comparisonDifference > 0 ? "+" : ""}{formatNumber(comparisonDifference ?? 0, locale, 1)} kWh</p></div>
              </div>
            ) : <p className="mt-3 text-sm leading-6 text-slate-600">{text.noComparison}</p>}
          </section>

          {proReady ? (
            <section className="mt-10 overflow-hidden rounded-[2rem] bg-[#17211f] p-6 text-white sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-green-mint)]">{text.proEyebrow}</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">{text.proTitle}</h2><p className="mt-4 max-w-2xl leading-7 text-slate-300">{text.proText}</p><p className="mt-5 text-xs leading-5 text-slate-400">{text.betaDetail}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="grid grid-cols-2 rounded-full bg-black/20 p-1"><button type="button" onClick={() => { setPlan("monthly"); track("Home Pro Preview Opened", { locale, plan: "monthly" }); }} className={`rounded-full px-4 py-2 text-sm font-bold ${plan === "monthly" ? "bg-white text-[#17211f]" : "text-slate-300"}`}>{text.monthlyPlan}</button><button type="button" onClick={() => { setPlan("yearly"); track("Home Pro Preview Opened", { locale, plan: "yearly" }); }} className={`rounded-full px-4 py-2 text-sm font-bold ${plan === "yearly" ? "bg-white text-[#17211f]" : "text-slate-300"}`}>{text.yearlyPlan}</button></div><div className="mt-5 flex min-h-8 flex-wrap items-center justify-center gap-4"><p className="text-center text-2xl font-extrabold">{plan === "yearly" ? text.yearlyPrice : text.monthlyPrice}</p>{plan === "yearly" && <span className="rounded-full border border-[var(--brand-green-mint)]/30 bg-[var(--brand-green-mint)]/10 px-2.5 py-1 text-[11px] font-extrabold text-[var(--brand-green-mint)]">{text.yearlyHint}</span>}</div><p className="mt-2 text-center text-[11px] font-semibold text-slate-400">{text.proBilling}</p><button type="button" onClick={submitBetaInterest} disabled={betaInterested} className="mt-5 min-h-12 w-full rounded-full bg-[var(--brand-green-mint)] px-5 text-sm font-extrabold text-[#10231b] transition hover:bg-[#9bedc0] disabled:cursor-default disabled:bg-white/15 disabled:text-slate-300">{betaInterested ? text.betaSaved : text.beta}</button></div></div>
            </section>
          ) : (
            <section className="mt-10 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--brand-green)]">{text.proEyebrow}</p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-900">{text.proPreviewTitle}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{text.proPreviewText}</p>
            </section>
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
