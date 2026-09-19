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
  calculateMonthlyConsumptionComparison,
  calculateMonthlyEnergyTrend,
  calculateMonthlyHistoryStreak,
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
  removeMonthlyEnergyEntry,
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
const homeSurfaceClass =
  "rounded-[1.45rem] border border-[#dde2d8] bg-[#f6f6f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.94),0_12px_30px_-28px_rgba(35,48,44,0.32)]";
const homeFieldClass =
  "min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-medium text-[#17211f] outline-none transition placeholder:text-slate-400 hover:border-[#b8c4bf] focus:border-[var(--brand-green-mint)] focus:ring-2 focus:ring-[#72dca3]/20";
const homePrimaryActionClass =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-[#b8efcc] bg-[#dcfce8] px-4 text-[13px] font-semibold text-[var(--brand-green)] transition hover:border-[#98e9b7] hover:bg-[#c9f7d9] hover:text-[var(--brand-green-dark)] active:scale-[0.98]";
const homeCompactActionClass =
  "inline-flex min-h-7 items-center justify-center rounded-full border border-[#b8efcc] bg-[#dcfce8] px-2.5 font-semibold text-[var(--brand-green)] transition hover:border-[#98e9b7] hover:bg-[#c9f7d9] hover:text-[var(--brand-green-dark)] active:scale-[0.98]";
const homeDangerActionClass =
  "inline-flex min-h-7 items-center justify-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-100 hover:text-red-700 active:scale-[0.98]";
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
    currentMonthOpen: "{month} noch offen",
    currentMonthOpenText: "Erfasse Verbrauch oder Rechnungsbetrag, sobald dein Monatswert vorliegt.",
    currentMonthComplete: "{month} erfasst",
    currentMonthCompleteText: "{kwh} kWh und {cost} sind gespeichert. Änderungen sind jederzeit im Verlauf möglich.",
    checkInStreak: "{count} Monate in Folge",
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
    updateCheckIn: "Monatswert aktualisieren",
    cancelCheckInEdit: "Bearbeitung abbrechen",
    checkInSaved: "Monatswert wurde gespeichert.",
    checkInUpdated: "Monatswert wurde aktualisiert.",
    checkInLoaded: "Monatswert wurde zum Bearbeiten geladen.",
    checkInRequired: "Bitte gib einen Wert größer als 0 ein.",
    checkInPriceRequired:
      "Bitte hinterlege zuerst einen Strompreis größer als 0 in den Einstellungen.",
    history: "Verlauf",
    noHistory: "Noch kein Monatswert vorhanden.",
    comparedWithPrevious: "gegenüber dem vorherigen Eintrag",
    editMonth: "Bearbeiten",
    deleteMonth: "Löschen",
    monthDeleted: "Monatswert wurde gelöscht.",
    deleteMonthConfirm: "Diesen Monatswert wirklich löschen?",
    trendConsumptionShort: "kWh",
    trendCostShort: "Kosten",
    chartTitle: "Monatsentwicklung",
    chartConsumption: "Verbrauch",
    chartCost: "Kosten",
    comparisonTitle: "Schätzung und tatsächlicher Verbrauch",
    calculatedEstimate: "Berechnete Geräte pro Monat",
    actualRecorded: "Tatsächlicher Monatswert",
    comparisonDifference: "Abweichung",
    comparisonMonth: "Vergleichsmonat: {month}",
    comparisonDataBasis: "Die Schätzung berücksichtigt {devices} gespeicherte Geräte. Nicht erfasste Verbraucher erscheinen als Abweichung.",
    comparisonActualHigher: "{percent}% deines tatsächlichen Verbrauchs werden von den gespeicherten Geräten noch nicht abgedeckt.",
    comparisonEstimateHigher: "Die Schätzung deiner gespeicherten Geräte liegt {percent}% über deinem tatsächlichen Verbrauch.",
    comparisonClose: "Schätzung und tatsächlicher Verbrauch liegen nah beieinander.",
    comparisonCoverage: "Erfasste Geräte erklären {percent}% des tatsächlichen Monatsverbrauchs.",
    comparisonActualHigherTip: "Prüfe zuerst große oder dauerhaft laufende Verbraucher, die noch nicht gespeichert sind – zum Beispiel Heizung, Warmwasser, Kühlgeräte oder Homeoffice.",
    comparisonEstimateHigherTip: "Prüfe zuerst Laufzeit und Nutzung von {device}, deinem aktuell größten berechneten Verbraucher.",
    comparisonCloseTip: "Deine Übersicht bildet den Monatsverbrauch bereits gut ab. Speichere den nächsten Monatswert, um den Trend zu bestätigen.",
    comparisonAddDevice: "Fehlendes Gerät hinzufügen",
    comparisonReviewDevices: "Gespeicherte Geräte prüfen",
    comparisonNextMonth: "Nächsten Monatswert vormerken",
    savingTipEyebrow: "Nächster Spartipp",
    savingTipTitle: "{device} zuerst prüfen",
    savingTipShare: "{share}% des berechneten Geräteverbrauchs",
    savingTipCustom: "Prüfe Laufzeit, Leistungsaufnahme und Nutzungshäufigkeit. Schon eine kleine Korrektur verbessert deine Haushaltsprognose.",
    savingTipDetails: "Gerätedetails öffnen",
    savingTipReview: "Gespeichertes Gerät prüfen",
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
      "Die Sicherung enthält Einstellungen, Räume, Zuordnungen, gespeicherte Geräte und den Monatsverlauf.",
    dataPrivacy: "Sie enthält keine Konto- oder Cloud-Daten.",
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
    currentMonthOpen: "{month} still open",
    currentMonthOpenText: "Add consumption or the bill amount once your monthly value is available.",
    currentMonthComplete: "{month} recorded",
    currentMonthCompleteText: "{kwh} kWh and {cost} are saved. You can edit the entry from the history at any time.",
    checkInStreak: "{count} consecutive months",
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
    updateCheckIn: "Update monthly value",
    cancelCheckInEdit: "Cancel editing",
    checkInSaved: "Monthly value saved.",
    checkInUpdated: "Monthly value updated.",
    checkInLoaded: "Monthly value loaded for editing.",
    checkInRequired: "Enter a value greater than 0.",
    checkInPriceRequired:
      "First add an electricity price greater than 0 in Settings.",
    history: "History",
    noHistory: "No monthly value yet.",
    comparedWithPrevious: "compared with the previous entry",
    editMonth: "Edit",
    deleteMonth: "Delete",
    monthDeleted: "Monthly value deleted.",
    deleteMonthConfirm: "Delete this monthly value?",
    trendConsumptionShort: "kWh",
    trendCostShort: "cost",
    chartTitle: "Monthly trend",
    chartConsumption: "Consumption",
    chartCost: "Cost",
    comparisonTitle: "Estimate and actual consumption",
    calculatedEstimate: "Calculated devices per month",
    actualRecorded: "Actual monthly value",
    comparisonDifference: "Difference",
    comparisonMonth: "Comparison month: {month}",
    comparisonDataBasis: "The estimate includes {devices} saved devices. Consumers not yet saved appear as a difference.",
    comparisonActualHigher: "{percent}% of your actual consumption is not yet covered by your saved devices.",
    comparisonEstimateHigher: "The estimate from your saved devices is {percent}% above your actual consumption.",
    comparisonClose: "The estimate and actual consumption are close.",
    comparisonCoverage: "Saved devices explain {percent}% of your actual monthly consumption.",
    comparisonActualHigherTip: "Start with large or always-on consumers that are not saved yet, such as heating, hot water, refrigeration or home-office equipment.",
    comparisonEstimateHigherTip: "First review the runtime and usage of {device}, currently your largest calculated consumer.",
    comparisonCloseTip: "Your overview already reflects the monthly consumption well. Save the next month to confirm the trend.",
    comparisonAddDevice: "Add a missing device",
    comparisonReviewDevices: "Review saved devices",
    comparisonNextMonth: "Prepare next monthly value",
    savingTipEyebrow: "Next saving tip",
    savingTipTitle: "Review {device} first",
    savingTipShare: "{share}% of calculated device consumption",
    savingTipCustom: "Review runtime, power and usage frequency. Even a small correction improves your household forecast.",
    savingTipDetails: "Open device details",
    savingTipReview: "Review saved device",
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
      "The backup contains settings, rooms, assignments, saved devices and monthly history.",
    dataPrivacy: "It contains no account or cloud data.",
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
    <div className="mt-6 border-t border-[#dfe5dd] pt-5" aria-label={labels.title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[13px] font-bold text-[#17211f]">{labels.title}</h3>
        <div className="flex gap-4 text-[11px] font-semibold text-[#65716d]">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--brand-green)]" />{labels.consumption}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />{labels.cost}</span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {chartEntries.map((entry) => (
          <div key={entry.month} className="grid grid-cols-[4.25rem_1fr] items-center gap-3">
            <span className="text-xs font-semibold text-[#65716d]">
              {dateFormatter.format(new Date(`${entry.month}-01T00:00:00Z`))}
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e3e8e4]"><div className="h-full rounded-full bg-[var(--brand-green)]" style={{ width: `${Math.max(3, (entry.kwh / maxKwh) * 100)}%` }} /></div>
                <span className="w-20 text-right text-[11px] tabular-nums text-[#65716d]">{formatNumber(entry.kwh, locale, 1)} kWh</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e3e8e4]"><div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.max(3, (entry.cost / maxCost) * 100)}%` }} /></div>
                <span className="w-20 text-right text-[11px] tabular-nums text-[#65716d]">{formatMoney(entry.cost, locale, currency)}</span>
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

function savedDeviceSource(device: SavedDevice) {
  return devices.find((item) => item.name === device.device) ?? null;
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
  const savedDevicesHref = locale === "de" ? "/de#meine-geraete" : "/#meine-geraete";
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
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [checkInMode, setCheckInMode] = useState<"consumption" | "bill">("consumption");
  const [checkInFeedback, setCheckInFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [historyNotice, setHistoryNotice] = useState("");
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
    setCheckInFeedback({
      kind: "success",
      message: editingMonth ? text.checkInUpdated : text.checkInSaved,
    });
    setHistoryNotice("");
    setEditingMonth(null);
    track("Home Monthly Check In Saved", {
      locale,
      has_kwh: nextEntry.kwh > 0,
      has_cost: nextEntry.cost > 0,
      updated_existing: Boolean(editingMonth),
    });
  }

  function editMonthlyCheckIn(entry: MonthlyEnergyEntry) {
    setMonth(entry.month);
    setCheckInMode("consumption");
    setMonthKwh(String(entry.kwh));
    setMonthCost("");
    setEditingMonth(entry.month);
    setCheckInFeedback({ kind: "success", message: text.checkInLoaded });
    setHistoryNotice("");
    window.requestAnimationFrame(() => {
      document.getElementById("monthly-check-in")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    track("Home Monthly Check In Edit Started", { locale, month: entry.month });
  }

  function cancelMonthlyCheckInEdit() {
    setEditingMonth(null);
    setMonthKwh("");
    setMonthCost("");
    setCheckInFeedback(null);
  }

  function deleteMonthlyCheckIn(entry: MonthlyEnergyEntry) {
    if (!window.confirm(text.deleteMonthConfirm)) return;
    const nextHistory = removeMonthlyEnergyEntry(history, entry.month);
    window.localStorage.setItem(
      HOUSEHOLD_HISTORY_STORAGE_KEY,
      JSON.stringify(nextHistory),
    );
    setHistory(nextHistory);
    if (editingMonth === entry.month) cancelMonthlyCheckInEdit();
    setRoomNotice("");
    setNotice("");
    setCheckInFeedback(null);
    setHistoryNotice(text.monthDeleted);
    track("Home Monthly Check In Deleted", { locale, month: entry.month });
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
          <section className={`mx-auto max-w-3xl p-6 sm:p-8 ${homeSurfaceClass}`}>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-green)]">{text.onboardingEyebrow}</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">{text.onboardingTitle}</h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-7 text-[#65716d]">{text.onboardingText}</p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-[13px] font-semibold text-[#52605b] sm:col-span-2">
                {text.householdName}
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder={text.householdNamePlaceholder} className={homeFieldClass} />
              </label>
              <label className="grid gap-2 text-[13px] font-semibold text-[#52605b]">
                {text.price}
                <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(Number(event.target.value))} className={homeFieldClass} />
              </label>
              <label className="grid gap-2 text-[13px] font-semibold text-[#52605b]">
                {text.currency}
                <select value={currency} onChange={(event) => setCurrency(event.target.value as SavedDeviceCurrency)} className={homeFieldClass}>
                  {currencies.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-[13px] font-semibold text-[#52605b] sm:col-span-2">
                <span className="flex items-center justify-between"><span>{text.goal}</span><span className="text-[var(--brand-green)]">{goal}{text.goalSuffix}</span></span>
                <input type="range" min="1" max="30" value={goal} onChange={(event) => setGoal(Number(event.target.value))} className="accent-[var(--brand-green)]" />
              </label>
            </div>

            <button type="button" onClick={completeOnboarding} className={`mt-8 w-full sm:w-auto ${homePrimaryActionClass}`}>{text.start}</button>
            <p className="mt-4 text-xs font-medium text-[#65716d]">{text.private}</p>
          </section>
        </main>
        <Footer locale={locale} />
      </div>
    );
  }

  const activeProfile = profile;
  const monthlyTrend = calculateMonthlyEnergyTrend(history);
  const historyStreak = calculateMonthlyHistoryStreak(history);
  const thisMonth = currentMonth();
  const currentMonthEntry = history.find((entry) => entry.month === thisMonth) ?? null;
  const currentMonthLabel = new Intl.DateTimeFormat(
    locale === "de" ? "de-DE" : "en-GB",
    { month: "long", year: "numeric", timeZone: "UTC" },
  ).format(new Date(`${thisMonth}-01T00:00:00Z`));
  const monthlySavings = (summary?.targetSavings ?? 0) / 12;
  const latestActual = history[0] ?? null;
  const latestActualMonth = latestActual
    ? new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${latestActual.month}-01T00:00:00Z`))
    : "";
  const comparisonDifference = latestActual
    ? latestActual.kwh - (summary?.monthlyKwh ?? 0)
    : null;
  const monthlyComparison = latestActual
    ? calculateMonthlyConsumptionComparison({
        estimatedKwh: summary?.monthlyKwh ?? 0,
        actualKwh: latestActual.kwh,
      })
    : null;
  const comparisonContent = monthlyComparison
    ? monthlyComparison.status === "actual-higher"
      ? {
          summary: text.comparisonActualHigher.replace(
            "{percent}",
            formatNumber(monthlyComparison.differencePercent, locale, 0),
          ),
          coverage: text.comparisonCoverage.replace(
            "{percent}",
            formatNumber(monthlyComparison.explainedPercent, locale, 0),
          ),
          tip: text.comparisonActualHigherTip,
          action: text.comparisonAddDevice,
          href: calculatorHref,
          tone: "amber" as const,
        }
      : monthlyComparison.status === "estimate-higher"
        ? {
            summary: text.comparisonEstimateHigher.replace(
              "{percent}",
              formatNumber(monthlyComparison.differencePercent, locale, 0),
            ),
            coverage: text.comparisonCoverage.replace(
              "{percent}",
              formatNumber(monthlyComparison.explainedPercent, locale, 0),
            ),
            tip: text.comparisonEstimateHigherTip.replace(
              "{device}",
              summary?.topDevice
                ? localizedSavedDeviceName(summary.topDevice, locale)
                : locale === "de"
                  ? "deinem größten Gerät"
                  : "your largest device",
            ),
            action: text.comparisonReviewDevices,
            href: savedDevicesHref,
            tone: "amber" as const,
          }
        : {
            summary: text.comparisonClose,
            coverage: text.comparisonCoverage.replace(
              "{percent}",
              formatNumber(monthlyComparison.explainedPercent, locale, 0),
            ),
            tip: text.comparisonCloseTip,
            action: text.comparisonNextMonth,
            href: "#monthly-check-in",
            tone: "green" as const,
          }
    : null;
  const topDeviceSource = summary?.topDevice
    ? savedDeviceSource(summary.topDevice)
    : null;
  const topDeviceShare =
    summary?.topDevice && summary.annualKwh > 0
      ? (summary.topDevice.yearlyKwh / summary.annualKwh) * 100
      : 0;
  const topDeviceTip = summary?.topDevice
    ? topDeviceSource
      ? getLocalizedDevice(topDeviceSource, locale).tip
      : text.savingTipCustom
    : null;
  const topDeviceHref = topDeviceSource
    ? locale === "de"
      ? `/geraete/${getLocalizedDevice(topDeviceSource, locale).slug}`
      : `/en/devices/${getLocalizedDevice(topDeviceSource, locale).slug}`
    : savedDevicesHref;
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
        className={`rounded-xl border text-[#17211f] transition ${compact ? "p-3" : "p-4"} ${
          isDropTarget
            ? "border-[var(--brand-green-mint)] bg-[#e4f7ec] ring-4 ring-[#dcfce8]"
            : compact
              ? "border-[#dfe5dd] bg-[#fbfcf8]"
              : "border-[#dfe5dd] bg-white/70"
        }`}
      >
        {editingRoomId === room.id ? (
          <form onSubmit={(event) => { event.preventDefault(); saveRoomName(room.id); }}>
            <label className="grid gap-1.5 text-xs font-semibold text-[#52605b]">
              <span>{text.roomName}</span>
              <input autoFocus value={roomNameDraft} onChange={(event) => setRoomNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") cancelEditingRoom(); }} className={homeFieldClass} />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="submit" disabled={!roomNameDraft.trim()} className={`${homePrimaryActionClass} min-h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40`}>{text.saveRoom}</button>
              <button type="button" onClick={cancelEditingRoom} className={`${homeCompactActionClass} min-h-8 px-3 text-xs`}>{text.cancelRoomEdit}</button>
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
                  className="cursor-grab select-none rounded-md px-1.5 py-1 text-base font-bold tracking-[-0.2em] text-[#8b9792] transition hover:bg-white hover:text-[var(--brand-green)] active:cursor-grabbing"
                >
                  ⠿
                </span>
                <h3 className="truncate text-[14px] font-bold">{roomName}</h3>
              </div>
              <span className="text-[11px] font-semibold text-[#65716d]">{room.deviceCount}</span>
            </div>
            {!compact && (
              <>
                <p className="mt-3 text-lg font-extrabold">{formatMoney(room.annualCost, locale, activeProfile.currency)}</p>
                <p className="mt-1 text-xs text-[#65716d]">{text.yearly}</p>
                {roomDevices.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-[#dfe5dd] pt-3">
                    {roomDevices.map((device) => (
                      <div key={device.id} className="rounded-lg bg-white px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p data-room-device-name className="truncate text-[14px] font-bold">{localizedSavedDeviceName(device, locale)}</p>
                            <p className="mt-0.5 text-[11px] text-[#65716d]">{formatMoney(device.yearlyKwh * activeProfile.electricityPrice, locale, activeProfile.currency)} {text.yearly}</p>
                          </div>
                          <label className="sr-only" htmlFor={`room-${device.id}`}>{text.assign}</label>
                          <select data-room-assignment id={`room-${device.id}`} aria-label={`${text.assign}: ${localizedSavedDeviceName(device, locale)}`} value={room.id} onChange={(event) => assignRoom(device.id, event.target.value)} className="home-room-select h-7 max-w-24 rounded-md border border-[#dfe5dd] bg-white px-1.5 text-[#52605b] outline-none transition hover:border-[#b8c4bf] focus:border-[var(--brand-green-mint)] focus:ring-2 focus:ring-[#72dca3]/20">
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
            <div className={`${compact ? "mt-2" : "mt-4 border-t border-[#dfe5dd] pt-3"} flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-2.5">
                <button data-room-action type="button" onClick={() => startEditingRoom(room.id, roomName)} aria-label={`${text.editRoom}: ${roomName}`} className="saved-device-utility-action relative inline-flex h-6 items-center justify-center rounded-full border border-[#b8efcc] bg-[#dcfce8] px-2 text-[var(--brand-green)] transition hover:border-[#98e9b7] hover:bg-[#c9f7d9] hover:text-[var(--brand-green-dark)]">{text.editRoom}</button>
                <button data-room-action type="button" onClick={() => deleteRoom(room.id)} aria-label={`${text.deleteRoom}: ${roomName}`} className="saved-device-utility-action relative inline-flex h-6 items-center justify-center rounded-full border border-red-100 bg-red-50 px-2 font-medium text-red-600 transition hover:border-red-200 hover:bg-red-100 hover:text-red-700">{text.deleteRoom}</button>
              </div>
              <div className="flex items-center gap-1">
                <button data-room-action type="button" onClick={() => moveRoom(room.id, -1)} disabled={index === 0} aria-label={`${text.moveRoomEarlier}: ${roomName}`} title={text.moveRoomEarlier} className="saved-device-utility-action relative flex h-6 w-6 items-center justify-center rounded-full border border-[#b8efcc] bg-[#dcfce8] font-semibold text-[var(--brand-green)] transition hover:border-[#98e9b7] hover:bg-[#c9f7d9] disabled:cursor-not-allowed disabled:opacity-30">↑</button>
                <button data-room-action type="button" onClick={() => moveRoom(room.id, 1)} disabled={index === activeProfile.rooms.length - 1} aria-label={`${text.moveRoomLater}: ${roomName}`} title={text.moveRoomLater} className="saved-device-utility-action relative flex h-6 w-6 items-center justify-center rounded-full border border-[#b8efcc] bg-[#dcfce8] font-semibold text-[var(--brand-green)] transition hover:border-[#98e9b7] hover:bg-[#c9f7d9] disabled:cursor-not-allowed disabled:opacity-30">↓</button>
              </div>
            </div>
          </>
        )}
      </article>
    );
  }

  return (
    <div lang={locale} className="min-h-screen bg-[var(--background)] text-[#17211f]">
      <Header locale={locale} languageHrefOverride={languageHref} />
      <main className="px-5 pb-20 pt-10 sm:px-6 sm:pt-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-green)]">EAVESENCE Home</p>
              <h1 className="mt-2 text-[clamp(2rem,3.3vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.045em]">{localizeDefaultHouseholdName(profile.name, locale)}</h1>
              <p className="mt-2 text-[14px] leading-6 text-[#65716d]">{text.pageSubtitle}</p>
            </div>
            <button type="button" onClick={() => setSettingsOpen((current) => !current)} className={`${homeCompactActionClass} w-fit text-[11px] leading-4`}>{text.settings}</button>
          </div>

          {settingsOpen && (
            <section className={`mt-6 grid gap-4 p-5 sm:grid-cols-4 ${homeSurfaceClass}`}>
              <label className="grid gap-1.5 text-xs font-semibold text-[#52605b]"><span>{text.householdName}</span><input value={name} onChange={(event) => setName(event.target.value)} className={homeFieldClass} /></label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#52605b]"><span>{text.price}</span><input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(Number(event.target.value))} className={homeFieldClass} /></label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#52605b]"><span>{text.currency}</span><select value={currency} onChange={(event) => setCurrency(event.target.value as SavedDeviceCurrency)} className={homeFieldClass}>{currencies.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#52605b]"><span>{text.goal}: {goal}%</span><input type="range" min="1" max="30" value={goal} onChange={(event) => setGoal(Number(event.target.value))} className="mt-3 accent-[var(--brand-green)]" /></label>
              <button type="button" onClick={saveSettings} className={`${homeCompactActionClass} text-[11px] leading-4 sm:col-span-4 sm:justify-self-start`}>{text.saveSettings}</button>
              <div className="rounded-xl border border-[#dfe5dd] bg-[#fbfcf8] p-4 sm:col-span-4">
                <h2 className="text-[14px] font-bold text-[#17211f]">{text.dataTitle}</h2>
                <div className="mt-1 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <p data-manage-data-description className="max-w-3xl text-xs leading-5 text-[#65716d]">
                    <span className="block">{text.dataText}</span>
                    <span className="block">{text.dataPrivacy}</span>
                  </p>
                  <div className="flex flex-nowrap items-start gap-x-2 whitespace-nowrap lg:-mt-[5px]">
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
                      data-manage-data-import
                      className={`${homeCompactActionClass} saved-device-utility-action relative shrink-0 gap-1 py-1`}
                    >
                      <svg
                        viewBox="0 0 12 12"
                        fill="none"
                        className="h-2.5 w-2.5 shrink-0"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M6 10V2M3.5 4.5 6 2l2.5 2.5" />
                      </svg>
                      {text.importHome}
                    </button>
                    <button
                      type="button"
                      onClick={exportHome}
                      data-manage-data-export
                      className={`${homeCompactActionClass} saved-device-utility-action relative shrink-0 gap-1 py-1`}
                    >
                      <svg
                        viewBox="0 0 12 12"
                        fill="none"
                        className="h-2.5 w-2.5 shrink-0"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M6 2v8M3.5 7.5 6 10l2.5-2.5" />
                      </svg>
                      {text.exportHome}
                    </button>
                    <button
                      type="button"
                      onClick={resetHome}
                      data-manage-data-reset
                      className={`${homeDangerActionClass} saved-device-utility-action relative shrink-0 gap-1 py-1`}
                    >
                      <svg
                        viewBox="0 0 12 12"
                        fill="none"
                        className="h-2.5 w-2.5 shrink-0"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="m3 3 6 6M9 3 3 9" />
                      </svg>
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
              <article key={label} className={`rounded-xl border p-4 ${index === 0 ? "border-[#b8efcc] bg-[#dcfce8]" : "border-[#dfe5dd] bg-[#fbfcf8]"}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#65716d]">{label}</p>
                <p className="mt-2.5 text-xl font-extrabold tracking-[-0.035em]">{value}</p>
                {detail && <p className="mt-1 text-xs font-semibold text-[var(--brand-green)]">{detail}</p>}
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className={`${homeSurfaceClass} p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#65716d]">{text.activation}</p><h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">{savedDevices.length >= 3 ? text.activationReady : `${savedDevices.length} ${locale === "de" ? "von" : "of"} 3 ${text.activationProgress}`}</h2></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dcf5e6] text-base font-bold text-[var(--brand-green)]">{Math.min(3, savedDevices.length)}</div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e3e8e4]"><div className="h-full rounded-full bg-[var(--brand-green)] transition-all" style={{ width: `${Math.min(100, (savedDevices.length / 3) * 100)}%` }} /></div>
              <p className="mt-4 text-[13px] leading-6 text-[#65716d]">{text.activationText}</p>
              <Link href={calculatorHref} className="mt-5 inline-flex text-[13px] font-semibold text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]">{text.addDevice} {">"}</Link>
            </div>
            <div className="rounded-2xl bg-[#17211f] p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--brand-green-mint)]">{text.targetSavings}</p>
              <p className="mt-3 text-2xl font-extrabold tracking-[-0.04em]">{formatMoney(summary?.targetSavings ?? 0, locale, profile.currency)}</p>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">{text.topConsumer}</p>
              <p className="mt-2 font-bold">{summary?.topDevice ? localizedSavedDeviceName(summary.topDevice, locale) : "—"}</p>
            </div>
          </section>

          <section className={`mt-8 p-5 ${homeSurfaceClass}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em] sm:text-2xl">{text.roomsTitle}</h2>
                <p className="mt-1 text-[13px] text-[#65716d]">{profile.rooms.length} {profile.rooms.length === 1 ? text.roomSingular : text.roomPlural}</p>
              </div>
              <button type="button" onClick={addRoom} className={`${homeCompactActionClass} min-h-9 w-fit px-3 text-xs`}>+ {text.addRoom}</button>
            </div>

            {roomNotice && <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-[var(--brand-green)]">{roomNotice}</p>}

            {occupiedRooms.length > 0 ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {occupiedRooms.map((room) => roomCard(room, profile.rooms.findIndex((item) => item.id === room.id)))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-[#cbd4cf] bg-[#fbfcf8] px-4 py-5 text-center">
                <p className="text-[13px] text-[#65716d]">{text.noDevices}</p>
                <Link href={calculatorHref} className="mt-2 inline-flex text-[13px] font-semibold text-[var(--brand-green)]">{text.addDevice} {">"}</Link>
              </div>
            )}

            {unassignedDevices.length > 0 && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <h3 className="text-[13px] font-bold text-[#17211f]">{text.unassigned}</h3>
                <div className="mt-2 divide-y divide-amber-100">
                  {unassignedDevices.map((device) => (
                    <div key={device.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div><p className="text-[13px] font-semibold">{localizedSavedDeviceName(device, locale)}</p><p className="mt-1 text-xs text-[#65716d]">{formatMoney(device.yearlyKwh * profile.electricityPrice, locale, profile.currency)} {text.yearly}</p></div>
                      <label className="flex items-center gap-2 text-[11px] font-semibold text-[#65716d]"><span>{text.assign}</span><select data-room-assignment value="" onChange={(event) => assignRoom(device.id, event.target.value)} className="home-room-select h-7 max-w-24 rounded-md border border-[#dfe5dd] bg-white px-1.5 text-[#52605b] outline-none transition hover:border-[#b8c4bf] focus:border-[var(--brand-green-mint)] focus:ring-2 focus:ring-[#72dca3]/20"><option value="">{text.unassigned}</option>{profile.rooms.map((room) => <option key={room.id} value={room.id}>{localizeDefaultRoomName(room.name, locale)}</option>)}</select></label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {emptyRooms.length > 0 && (
              <details
                open={emptyRoomsOpen || Boolean(editingRoomId && emptyRooms.some((room) => room.id === editingRoomId))}
                onToggle={(event) => setEmptyRoomsOpen(event.currentTarget.open)}
                className="group mt-6 rounded-xl border border-[#dfe5dd] bg-[#fbfcf8]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-xs font-semibold text-[#52605b] transition hover:text-[var(--brand-green-dark)] [&::-webkit-details-marker]:hidden">
                  <span>{text.otherRooms} ({emptyRooms.length}) <span className="ml-2 font-normal text-[#7a8782]">{text.emptyRoomsHint}</span></span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-4 w-4 shrink-0 text-[var(--brand-green)] transition-transform duration-200 group-open:rotate-90"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m7.5 5 5 5-5 5" />
                  </svg>
                </summary>
                <div className="grid gap-3 border-t border-[#dfe5dd] p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {emptyRooms.map((room) => roomCard(room, profile.rooms.findIndex((item) => item.id === room.id), true))}
                </div>
              </details>
            )}
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div id="monthly-check-in" className={`${homeSurfaceClass} scroll-mt-24 p-5`}>
              <h2 className="text-xl font-extrabold tracking-[-0.03em] sm:text-2xl">{text.monthlyCheckIn}</h2>
              <p className="mt-2 text-[13px] leading-6 text-[#65716d]">{text.checkInText}</p>
              <div data-monthly-checkin-status className={`mt-4 rounded-xl border px-3 py-2.5 ${currentMonthEntry ? "border-[#b8efcc] bg-[#eefbf3]" : "border-amber-200 bg-amber-50"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-bold text-[#17211f]">{(currentMonthEntry ? text.currentMonthComplete : text.currentMonthOpen).replace("{month}", currentMonthLabel)}</p>
                  {historyStreak > 1 && <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-[var(--brand-green)]">{text.checkInStreak.replace("{count}", formatNumber(historyStreak, locale))}</span>}
                </div>
                <p className="mt-1 text-xs leading-5 text-[#65716d]">{currentMonthEntry ? text.currentMonthCompleteText.replace("{kwh}", formatNumber(currentMonthEntry.kwh, locale, 1)).replace("{cost}", formatMoney(currentMonthEntry.cost, locale, profile.currency)) : text.currentMonthOpenText}</p>
              </div>
              <div className="mt-5 grid grid-cols-2 rounded-full border border-[#dfe5dd] bg-[#eef1ed] p-1">
                <button type="button" aria-pressed={checkInMode === "consumption"} onClick={() => { setCheckInMode("consumption"); setCheckInFeedback(null); }} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${checkInMode === "consumption" ? "border-[#b8efcc] bg-[#dcfce8] text-[var(--brand-green)]" : "border-transparent text-[#65716d] hover:bg-white/70 hover:text-[#17211f]"}`}>{text.consumptionEntry}</button>
                <button type="button" aria-pressed={checkInMode === "bill"} onClick={() => { setCheckInMode("bill"); setCheckInFeedback(null); }} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${checkInMode === "bill" ? "border-[#b8efcc] bg-[#dcfce8] text-[var(--brand-green)]" : "border-transparent text-[#65716d] hover:bg-white/70 hover:text-[#17211f]"}`}>{text.billEntry}</button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-[#52605b] sm:col-span-2">{text.month}<input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setEditingMonth(null); setCheckInFeedback(null); }} className={homeFieldClass} /></label>
                {checkInMode === "consumption" ? (
                  <>
                    <label className="grid gap-1.5 text-xs font-semibold text-[#52605b]">{text.kwh}<input type="text" inputMode="decimal" value={monthKwh} onChange={(event) => { setMonthKwh(event.target.value); setCheckInFeedback(null); }} className={homeFieldClass} /></label>
                    <div className="rounded-xl border border-[#dfe5dd] bg-[#fbfcf8] px-3 py-2"><p className="text-[11px] font-semibold text-[#65716d]">{text.calculatedCost}</p><p className="mt-1 font-bold">{formatMoneyPrecise((positiveNumber(monthKwh) ?? 0) * profile.electricityPrice, locale, profile.currency)}</p></div>
                  </>
                ) : (
                  <>
                    <label className="grid gap-1.5 text-xs font-semibold text-[#52605b]">{text.cost}<input type="text" inputMode="decimal" value={monthCost} onChange={(event) => { setMonthCost(event.target.value); setCheckInFeedback(null); }} className={homeFieldClass} /></label>
                    <div className="rounded-xl border border-[#dfe5dd] bg-[#fbfcf8] px-3 py-2"><p className="text-[11px] font-semibold text-[#65716d]">{text.estimatedConsumption}</p><p className="mt-1 font-bold">{formatNumber(profile.electricityPrice > 0 ? (positiveNumber(monthCost) ?? 0) / profile.electricityPrice : 0, locale, 1)} kWh</p></div>
                  </>
                )}
              </div>
              {checkInFeedback && <p role={checkInFeedback.kind === "error" ? "alert" : "status"} className={`mt-4 rounded-xl px-3 py-2.5 text-sm font-bold ${checkInFeedback.kind === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-[var(--brand-green)]"}`}>{checkInFeedback.message}</p>}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button type="button" onClick={saveMonthlyCheckIn} className={homePrimaryActionClass}>{editingMonth ? text.updateCheckIn : text.saveCheckIn}</button>
                {editingMonth && <button type="button" onClick={cancelMonthlyCheckInEdit} className={`${homeCompactActionClass} text-xs`}>{text.cancelCheckInEdit}</button>}
              </div>
            </div>
            <div className={`${homeSurfaceClass} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold tracking-[-0.03em] sm:text-2xl">{text.history}</h2>
                {monthlyTrend && (
                  <div className="flex flex-wrap gap-2" aria-label={text.comparedWithPrevious}>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${monthlyTrend.consumptionChangePercent <= 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {text.trendConsumptionShort} {monthlyTrend.consumptionChangePercent > 0 ? "+" : ""}{formatNumber(monthlyTrend.consumptionChangePercent, locale, 1)}%
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${monthlyTrend.costChangePercent <= 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {text.trendCostShort} {monthlyTrend.costChangePercent > 0 ? "+" : ""}{formatNumber(monthlyTrend.costChangePercent, locale, 1)}%
                    </span>
                  </div>
                )}
              </div>
              {historyNotice && <p role="status" className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-[13px] font-bold text-[var(--brand-green)]">{historyNotice}</p>}
              {history.length === 0 ? <p className="mt-6 text-[13px] text-[#65716d]">{text.noHistory}</p> : <div className="mt-5 space-y-3">{history.slice(0, 6).map((entry, index) => <div key={entry.month} data-monthly-history-entry={entry.month} className="rounded-xl border border-[#dfe5dd] bg-[#fbfcf8] px-4 py-3"><div className="grid grid-cols-[1fr_auto_auto] items-center gap-4"><span className="text-[13px] font-semibold">{new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${entry.month}-01T00:00:00Z`))}</span><span className="text-[13px] text-[#65716d]">{formatNumber(entry.kwh, locale, 1)} kWh</span><span className="text-[13px] font-bold">{formatMoney(entry.cost, locale, profile.currency)}</span></div><div className="mt-2 flex flex-wrap items-center justify-between gap-2">{index === 0 && monthlyTrend !== null ? <span className="text-xs text-[#65716d]">{text.comparedWithPrevious}</span> : <span />}<div className="flex gap-1.5"><button type="button" onClick={() => editMonthlyCheckIn(entry)} className={`${homeCompactActionClass} min-h-7 px-2.5 text-[11px]`}>{text.editMonth}</button><button type="button" onClick={() => deleteMonthlyCheckIn(entry)} className={`${homeDangerActionClass} min-h-7 px-2.5 text-[11px]`}><span aria-hidden="true">×</span>{text.deleteMonth}</button></div></div></div>)}</div>}
              <MonthlyHistoryChart entries={history} locale={locale} currency={profile.currency} labels={{ title: text.chartTitle, consumption: text.chartConsumption, cost: text.chartCost }} />
            </div>
          </section>

          <section className={`mt-5 p-5 ${homeSurfaceClass}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-lg font-extrabold tracking-[-0.02em] sm:text-xl">{text.comparisonTitle}</h2>
              {latestActual && <span className="rounded-full bg-[#eef1ed] px-2.5 py-1 text-[11px] font-semibold text-[#65716d]">{text.comparisonMonth.replace("{month}", latestActualMonth)}</span>}
            </div>
            {latestActual && savedDevices.length > 0 ? (
              <div className="mt-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#dfe5dd] bg-[#fbfcf8] p-4"><p className="text-[11px] font-semibold text-[#65716d]">{text.calculatedEstimate}</p><p className="mt-2 text-xl font-bold">{formatNumber(summary?.monthlyKwh ?? 0, locale, 1)} kWh</p></div>
                  <div className="rounded-xl border border-[#dfe5dd] bg-[#fbfcf8] p-4"><p className="text-[11px] font-semibold text-[#65716d]">{text.actualRecorded}</p><p className="mt-2 text-xl font-bold">{formatNumber(latestActual.kwh, locale, 1)} kWh</p></div>
                  <div className="rounded-xl border border-[#b8efcc] bg-[#dcfce8] p-4"><p className="text-[11px] font-semibold text-[var(--brand-green)]">{text.comparisonDifference}</p><p className="mt-2 text-xl font-bold text-[var(--brand-green)]">{comparisonDifference !== null && comparisonDifference > 0 ? "+" : ""}{formatNumber(comparisonDifference ?? 0, locale, 1)} kWh</p></div>
                </div>
                {comparisonContent && (
                  <div data-consumption-insight className={`mt-4 rounded-xl border p-4 ${comparisonContent.tone === "green" ? "border-[#b8efcc] bg-[#eefbf3]" : "border-amber-200 bg-amber-50"}`}>
                    <p className="text-[13px] font-bold text-[#17211f]">{comparisonContent.summary}</p>
                    <p className="mt-1 text-xs font-semibold text-[#65716d]">{comparisonContent.coverage}</p>
                    <p className="mt-3 text-[13px] leading-6 text-[#52605b]">{comparisonContent.tip}</p>
                    <Link href={comparisonContent.href} onClick={() => track("Home Comparison Action Clicked", { locale, status: monthlyComparison?.status ?? "unknown" })} className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]">
                      {comparisonContent.action}<span aria-hidden="true">›</span>
                    </Link>
                  </div>
                )}
                <p className="mt-3 text-[11px] leading-5 text-[#7a8782]">{text.comparisonDataBasis.replace("{devices}", formatNumber(savedDevices.length, locale))}</p>
              </div>
            ) : <p className="mt-3 text-[13px] leading-6 text-[#65716d]">{text.noComparison}</p>}
          </section>

          {summary?.topDevice && topDeviceTip && (
            <section data-saving-tip className="mt-5 rounded-[1.45rem] border border-[#b8efcc] bg-[#eefbf3] p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-green)]">{text.savingTipEyebrow}</p>
                  <h2 className="mt-1 text-lg font-extrabold tracking-[-0.02em]">{text.savingTipTitle.replace("{device}", localizedSavedDeviceName(summary.topDevice, locale))}</h2>
                  <p className="mt-1 text-xs font-semibold text-[#65716d]">{text.savingTipShare.replace("{share}", formatNumber(topDeviceShare, locale, 0))}</p>
                  <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[#52605b]">{topDeviceTip}</p>
                </div>
                <Link href={topDeviceHref} onClick={() => track("Home Saving Tip Opened", { locale, has_device_page: Boolean(topDeviceSource) })} className={`${homeCompactActionClass} w-fit text-[11px]`}>
                  {topDeviceSource ? text.savingTipDetails : text.savingTipReview}<span aria-hidden="true">›</span>
                </Link>
              </div>
            </section>
          )}

          {proReady ? (
            <section className="mt-8 overflow-hidden rounded-[1.65rem] border border-[#34413e] bg-[linear-gradient(135deg,#1d2725_0%,#17211f_62%,#141c1a_100%)] p-6 text-white shadow-[0_28px_70px_-44px_rgba(18,35,30,0.52)] sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-green-mint)]">{text.proEyebrow}</p><h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">{text.proTitle}</h2><p className="mt-4 max-w-2xl leading-7 text-slate-300">{text.proText}</p><p className="mt-5 text-xs leading-5 text-slate-400">{text.betaDetail}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="grid grid-cols-2 rounded-full bg-black/20 p-1"><button type="button" onClick={() => { setPlan("monthly"); track("Home Pro Preview Opened", { locale, plan: "monthly" }); }} className={`rounded-full border px-4 py-2 text-sm font-bold transition ${plan === "monthly" ? "border-[#b8efcc] bg-[#dcfce8] text-[var(--brand-green)]" : "border-transparent text-slate-300 hover:bg-white/10"}`}>{text.monthlyPlan}</button><button type="button" onClick={() => { setPlan("yearly"); track("Home Pro Preview Opened", { locale, plan: "yearly" }); }} className={`rounded-full border px-4 py-2 text-sm font-bold transition ${plan === "yearly" ? "border-[#b8efcc] bg-[#dcfce8] text-[var(--brand-green)]" : "border-transparent text-slate-300 hover:bg-white/10"}`}>{text.yearlyPlan}</button></div><div className="mt-5 flex min-h-8 flex-wrap items-center justify-center gap-4"><p className="text-center text-2xl font-extrabold">{plan === "yearly" ? text.yearlyPrice : text.monthlyPrice}</p>{plan === "yearly" && <span className="rounded-full border border-[var(--brand-green-mint)]/30 bg-[var(--brand-green-mint)]/10 px-2.5 py-1 text-[11px] font-extrabold text-[var(--brand-green-mint)]">{text.yearlyHint}</span>}</div><p className="mt-2 text-center text-[11px] font-semibold text-slate-400">{text.proBilling}</p><button type="button" onClick={submitBetaInterest} disabled={betaInterested} className="mt-5 min-h-12 w-full rounded-full border border-[#b8efcc] bg-[#dcfce8] px-5 text-sm font-extrabold text-[var(--brand-green)] transition hover:border-[#98e9b7] hover:bg-[#c9f7d9] disabled:cursor-default disabled:border-white/10 disabled:bg-white/15 disabled:text-slate-300">{betaInterested ? text.betaSaved : text.beta}</button></div></div>
            </section>
          ) : (
            <section className="mt-8 rounded-xl border border-[#b8efcc] bg-[#dcfce8] px-5 py-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--brand-green)]">{text.proEyebrow}</p>
              <h2 className="mt-1 text-lg font-bold text-[#17211f]">{text.proPreviewTitle}</h2>
              <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[#52605b]">{text.proPreviewText}</p>
            </section>
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
