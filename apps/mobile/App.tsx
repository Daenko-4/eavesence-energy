import { ProToolsScreen } from "./src/ProToolsScreen";
import { closeSavingsHistory } from "@eavesence/core/savingsPlan";
import { TileSymbol, TileSymbolPicker } from "./src/TileSymbol";
import { iconForTile, type TileSymbol as SymbolKey } from "@eavesence/core/tileSymbols";
import { BrandMotion, DisclosureIcon } from "./src/BrandMotion";
import { parseIncomeAmount, readIncomeExtras, summarizeIncome, type IncomeExtra } from "@eavesence/core/income";
import { IncomeExtrasSummary } from "./src/IncomeExtrasSummary";
import appConfig from "./app.json";
import { HomeSetupForm } from "./src/HomeSetupForm";
import {HomeMemos} from "./src/HomeMemos";
import { MonthlyPayments } from "./src/MonthlyPayments";
import { HomeCoreOverview } from "./src/HomeCoreOverview";
import { homeRelease } from "../../src/lib/homeRelease";
import {PaydayScreen} from './src/PaydayScreen';
import {CostImportScreen} from './src/CostImportScreen';
import {SavingsCoachScreen} from './src/SavingsCoachScreen';
import {confirmSavingsChange,localToday} from '@eavesence/core/homeValue';
import { calculateEnergyCosts } from "@eavesence/core";
import { createSavingsPlan, readSavingsActions, type SavingsAction } from "@eavesence/core/savingsPlan";
import {
  forecastHouseholdCosts,
  monthlyCost,
  readHouseholdCosts,
  removeHouseholdCost,
  upsertHouseholdCost,
  type HouseholdCost,
} from "@eavesence/core/householdCosts";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { devices as libraryDevices, getDeviceCalculationDefaults } from "../../src/data/devices";

import CostsScreen from "./src/CostsScreen";
import { createMobileBackup, readMobileBackup, type MobileBackup } from "./src/backup";
import { pickBackup, shareBackup } from "./src/backupFiles";
import { FormSection, useFormAction } from "./src/FormSection";
import { getLocalizedDevice } from "../../src/i18n/devices";
import { KeyboardScrollContext, FormInput } from "./src/FormInput";
import { SavingsActionsScreen } from "./src/SavingsActionsScreen";
import { PlanningScreen } from "./src/PlanningScreen";
import type { PlanningData } from "@eavesence/core/planning";
import { SavingsBudgetSummary } from "./src/SavingsBudgetSummary";
import { LocaleContext, LocalizedText as Text, localize, showLocalizedAlert, useMobileLocale, type MobileLocale } from "./src/i18n";
import { cancelCostReview, reconcileMemoReminders, disableMemoReminders, disableAllReminders, disableCostReminders, disableMonthlyReminder, enableMonthlyReminder, monthlyReminderIsActive } from "./src/reminders";
import {
  BETA_KEY,
  COSTS_KEY,
  DEVICES_KEY,
  HISTORY_KEY,
  PROFILE_KEY,
  TILES_KEY,
  clearAll,
  readJson,
  recoverStorage,
  writeAll,
  writeJson,
  type MobileDevice,
  type MobileHistoryEntry,
  type MobileProfile,
} from "./src/storage";
import { createCostTile, defaultTiles, moveTile, readTiles, type MobileTile } from "./src/tiles";
import { convertWebBackup } from "./src/webBackup";
import {
  configureSubscriptions,
  getAvailablePackages,
  getProStatus,
  purchasePro,
  restorePro,
} from "./src/subscriptions";

type Tab = "home" | "costs" | "energy" | "add" | "history" | "pro" | "settings";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Metro resolves bundled images through a static require call.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const brandIcon = require("./assets/brand-icon-safe.png");
// Monochrome icons are tinted to match the website's mint navigation states.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tabHomeIcon = require("./assets/tab-home.png");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tabCostsIcon = require("./assets/tab-costs.png");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tabProIcon = require("./assets/tab-pro.png");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tabEnergyIcon = require("./assets/tab-history.png");

const navigationTabs: Array<{ key: Tab; label: string; icon: number }> = [
  { key: "home", label: "Übersicht", icon: tabHomeIcon },
  { key: "costs", label: "Kosten", icon: tabCostsIcon },
  { key: "pro", label: "Plan · Pro", icon: tabProIcon },
  { key: "energy", label: "Stromrechner", icon: tabEnergyIcon },
];

function parseLocalNumber(value: string) {
  return Number(value.trim().replace(",", "."));
}

function shiftMonth(month: string, change: number) {
  const [year, number] = month.split("-").map(Number);
  const next = new Date(year, number - 1 + change, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string, locale: MobileLocale = "de") {
  const [year, number] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "de" ? "de-AT" : "en-GB", { month: "long", year: "numeric" }).format(new Date(year, number - 1, 1));
}

function localMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

const initialForm = {
  name: "",
  watts: "1000",
  minutes: "30",
  uses: "3",
  kwh: "",
  type: "power" as "power" | "consumption",
  mode: "estimate" as "estimate" | "exact",
  slug: "",
};

export default function App() {
  const [locale, setLocale] = useState<MobileLocale>(() => Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith("de") ? "de" : "en");
  return <LocaleContext.Provider value={locale}><AppContent locale={locale} setLocale={setLocale} /></LocaleContext.Provider>;
}

function AppContent({ locale, setLocale }: { locale: MobileLocale; setLocale: (value: MobileLocale) => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [homeSetupOpen, setHomeSetupOpen] = useState(false);
  const [profile, setProfile] = useState<MobileProfile | null>(null);
  const [devices, setDevices] = useState<MobileDevice[]>([]);
  const [history, setHistory] = useState<MobileHistoryEntry[]>([]);
  const [costs, setCosts] = useState<HouseholdCost[]>([]);
  const [tiles, setTiles] = useState<MobileTile[]>(defaultTiles);
  const [selectedCostTileId, setSelectedCostTileId] = useState("default-costs");
  const [costReviewId,setCostReviewId]=useState<string|undefined>(undefined);
  const [costEditorOpen, setCostEditorOpen] = useState(false);
  const [costStartAction, setCostStartAction] = useState<"none" | "income" | "cost">("none");
  const [tileFormOpen, setTileFormOpen] = useState(false);
  const [tileName, setTileName] = useState("");
  const [tileIcon,setTileIcon] = useState<SymbolKey|null>(null);
  const [editingTileId, setEditingTileId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const [homeName, setHomeName] = useState(() => locale === "de" ? "Mein Zuhause" : "My home");
  const [electricityPrice, setElectricityPrice] = useState("0.30");
  const [goal, setGoal] = useState("10");
  const [currency, setCurrency] = useState<"EUR" | "CHF">("EUR");
  const [variableBudget, setVariableBudget] = useState("");
  const [bufferBudget, setBufferBudget] = useState("0");
  const [savingsGoal, setSavingsGoal] = useState("0");
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [planQuestion, setPlanQuestion] = useState<"payday" | "savings" | "progress">("payday");
  const [areasOpen, setAreasOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [reserveOptionsOpen, setReserveOptionsOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [month, setMonth] = useState(localMonth);
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [monthMode, setMonthMode] = useState<"consumption" | "cost">("consumption");
  const [chartRange, setChartRange] = useState<6 | 12>(6);
  const [monthKwh, setMonthKwh] = useState("");
  const [monthCost, setMonthCost] = useState("");
  const [betaInterested, setBetaInterested] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [reminderActive, setReminderActive] = useState(false);

  useEffect(() => {
    void recoverStorage().then(() => Promise.all([
      readJson<MobileProfile | null>(PROFILE_KEY, null),
      readJson<MobileDevice[]>(DEVICES_KEY, []),
      readJson<MobileHistoryEntry[]>(HISTORY_KEY, []),
      readJson<unknown>(COSTS_KEY, []),
      readJson<boolean>(BETA_KEY, false),
      readJson<unknown>(TILES_KEY, null),
    ])).then(([storedProfile, storedDevices, storedHistory, storedCosts, storedBeta, storedTiles]) => {
      if (storedProfile && readIncomeExtras(storedProfile.incomeExtras) === null) throw new Error("Invalid stored income extras");
      setProfile(storedProfile);
      if (storedProfile) {
        void reconcileMemoReminders(storedProfile.planning?.memos??[],storedProfile.locale??"de").catch(()=>{});
        setHomeName(storedProfile.name);
        setLocale(storedProfile.locale ?? "de");
        setElectricityPrice(String(storedProfile.electricityPrice));
        setGoal(String(storedProfile.savingsGoalPercent));
        setCurrency(storedProfile.currency ?? "EUR");
        setVariableBudget(storedProfile.variableMonthly == null ? "" : String(storedProfile.variableMonthly));
        setBufferBudget(String(storedProfile.bufferMonthly ?? 0));
        setSavingsGoal(String(storedProfile.goalMonthly ?? 0));
      }
      setDevices(storedDevices);
      setHistory(storedHistory);
      setCosts(readHouseholdCosts(JSON.stringify(storedCosts)));
      setTiles(readTiles(storedTiles));
      setBetaInterested(storedBeta);
      setReady(true);
    }).catch(() => setLoadFailed(true));

    if (configureSubscriptions()) {
      void getAvailablePackages().then(setPackages).catch(() => setPackages([]));
      void getProStatus().then(setIsPro).catch(() => setIsPro(false));
    }
    void monthlyReminderIsActive().then(setReminderActive).catch(() => setReminderActive(false));
  }, [setLocale, loadAttempt]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [tab, profile?.setupStep, homeSetupOpen]);

  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hidden = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { shown.remove(); hidden.remove(); };
  }, []);

  const totals = useMemo(
    () => ({
      yearlyCost: devices.reduce((sum, device) => sum + device.yearlyKwh * (profile?.electricityPrice ?? 0), 0),
      yearlyKwh: devices.reduce((sum, device) => sum + device.yearlyKwh, 0),
    }),
    [devices, profile?.electricityPrice],
  );
  const currentMonth = localMonth();
  const currentMonthEntry = history.find((entry) => entry.month === currentMonth) ?? null;
  const previousMonthEntry = [...history]
    .filter((entry) => entry.month < currentMonth)
    .sort((a, b) => b.month.localeCompare(a.month))[0] ?? null;
  const monthlyChange =
    currentMonthEntry && previousMonthEntry && previousMonthEntry.kwh > 0
      ? ((currentMonthEntry.kwh - previousMonthEntry.kwh) / previousMonthEntry.kwh) * 100
      : null;
  const topDevice = [...devices].sort((a, b) => b.yearlyKwh - a.yearlyKwh)[0] ?? null;
  const euro = new Intl.NumberFormat(locale === "de" ? "de-AT" : "en-GB", { style: "currency", currency: profile?.currency ?? "EUR" });
  const forecast = forecastHouseholdCosts(costs);
  const costSummary = forecast.summary;
  const upcoming = forecast.next;
  const incomeSummary = summarizeIncome(profile ?? {});
  const monthlyIncome = incomeSummary.monthly;
  const hasIncome = Boolean(profile?.incomeAmount && profile.incomeAmount > 0);
  const hasCosts = costs.length > 0;
  const savingsPlan = createSavingsPlan({
    incomeMonthly: monthlyIncome, incomeExtras: incomeSummary.extras,
    variableMonthly: profile?.variableMonthly ?? null,
    bufferMonthly: profile?.bufferMonthly ?? 0,
    goalMonthly: profile?.goalMonthly ?? 0,
    costs,
    startMonth: upcoming.month,
  });

  async function createHome() {
    const price = parseLocalNumber(electricityPrice);
    const target = parseLocalNumber(goal);
    if (!homeName.trim()) {
      showLocalizedAlert(locale, locale === "de" ? "Name fehlt" : "Name missing", locale === "de" ? "Gib deinem Zuhause einen Namen." : "Enter a name for your home.");
      return;
    }
    const nextProfile: MobileProfile = {
      name: homeName.trim() === "Mein Zuhause" && locale === "en" ? "My home" : homeName.trim(),
      locale,
      currency,
      electricityPrice: Number.isFinite(price) && price > 0 ? price : .30,
      savingsGoalPercent: Number.isFinite(target) && target >= 1 && target <= 50 ? target : 10,
      setupStep: "income",
      createdAt: new Date().toISOString(),
    };
    try {
      await writeJson(PROFILE_KEY, nextProfile);
      Keyboard.dismiss();
      setProfile(nextProfile);
    } catch { showLocalizedAlert(locale,"Start fehlgeschlagen", "Dein Zuhause konnte nicht gespeichert werden. Bitte versuche es erneut."); }
  }

  async function saveSettings() {
    if (!profile) return;
    const price = parseLocalNumber(electricityPrice);
    const target = parseLocalNumber(goal);
    if (!homeName.trim() || !Number.isFinite(price) || price <= 0 || !Number.isFinite(target) || target < 1 || target > 50) {
      showLocalizedAlert(locale,"Angaben prüfen", "Gib einen Namen, einen Strompreis über 0 und ein Sparziel zwischen 1 und 50 % ein.");
      return;
    }
    const nextProfile = { ...profile, name: homeName.trim(), locale, currency, electricityPrice: price, savingsGoalPercent: target };
    if (price !== profile.electricityPrice) {
      const nextDevices = devices.map(device => ({ ...device, yearlyCost: device.yearlyKwh * price, monthlyCost: device.yearlyKwh * price / 12 }));
      await writeAll([[PROFILE_KEY, nextProfile], [DEVICES_KEY, nextDevices]]);
      setDevices(nextDevices);
    } else await writeJson(PROFILE_KEY, nextProfile);
    setProfile(nextProfile);
    Keyboard.dismiss();
    setTab("home");
  }

  async function saveBudget() {
    if (!profile) return;
    const variable = variableBudget.trim() ? parseIncomeAmount(variableBudget, locale) : null;
    const buffer = parseIncomeAmount(bufferBudget || "0", locale);
    const target = parseIncomeAmount(savingsGoal || "0", locale);
    if ((variable !== null && (!Number.isFinite(variable) || variable < 0)) ||
      !Number.isFinite(buffer) || buffer < 0 || !Number.isFinite(target) || target < 0) {
      showLocalizedAlert(locale,"Beträge prüfen", "Gib Beträge ab 0 ein. Alltagsausgaben dürfen offen bleiben."); return;
    }
    const next = { ...profile, variableMonthly: variable, bufferMonthly: buffer, goalMonthly: target };
    try { await writeJson(PROFILE_KEY, next); setProfile(next); Keyboard.dismiss(); showLocalizedAlert(locale,"Gespeichert", "Dein Sparplan wurde aktualisiert."); }
    catch { showLocalizedAlert(locale,"Speichern fehlgeschlagen", "Bitte versuche es erneut."); }
  }

  const [homeDetailsOpen, setHomeDetailsOpen] = useState(false);
  const [memosOpen,setMemosOpen]=useState(false);
  useEffect(()=>{
    const handle=(response:Notifications.NotificationResponse|null)=>{
      if(response?.notification.request.content.data?.eavesenceMemo===true){setTab("home");setMemosOpen(true);void Notifications.clearLastNotificationResponseAsync().catch(()=>{});}
    };
    const subscription=Notifications.addNotificationResponseReceivedListener(handle);
    void Notifications.getLastNotificationResponseAsync().then(handle).catch(()=>{});
    return()=>subscription.remove();
  },[]);

  async function savePlanning(planning: PlanningData) {
    if (!profile) return;
    const next = { ...profile, planning };
    await writeJson(PROFILE_KEY, next); setProfile(next);
  }

  async function confirmSaving(action: SavingsAction) {
    if(!profile)return;
    const next=confirmSavingsChange(costs,profile.savingsActions??[],action,localToday());
    const nextProfile={...profile,savingsActions:next.actions};
    await writeAll([[PROFILE_KEY,nextProfile],[COSTS_KEY,next.costs]]);
    setCosts(next.costs);setProfile(nextProfile);
  }

  async function importCosts(nextCosts: HouseholdCost[]) {
    const next=nextCosts.map(c=>({...c,tileId:c.tileId??'default-costs'}));
    await persistCosts(next);
  }

  async function saveSavingsActions(actions: SavingsAction[]) {
    if (!profile) return;
    const next = { ...profile, savingsActions: actions };
    await writeJson(PROFILE_KEY, next);
    setProfile(next);
  }

  async function exportData() {
    if (!profile) return;
    try {
      await shareBackup(createMobileBackup({ profile, devices, history, costs, tiles, betaInterested }), locale);
    } catch {
      showLocalizedAlert(locale,"Sicherung fehlgeschlagen", "Die Datei konnte nicht geteilt werden. Bitte versuche es erneut.");
    }
  }

  async function dismissBackupHint() {
    if (!profile) return;
    const next = {...profile,backupReminderDismissed:true};
    try { await writeJson(PROFILE_KEY,next); setProfile(next); }
    catch { showLocalizedAlert(locale,"Speichern fehlgeschlagen", "Bitte versuche es erneut."); }
  }

  async function applyBackup(backup: MobileBackup) {
    try {
      await writeAll([
        [PROFILE_KEY, backup.profile], [DEVICES_KEY, backup.devices], [HISTORY_KEY, backup.history],
        [COSTS_KEY, backup.costs], [TILES_KEY, backup.tiles], [BETA_KEY, backup.betaInterested],
      ]);
      let remindersCleared = true;
      const reminderResults=await Promise.allSettled([disableCostReminders(), (async()=>{await disableMemoReminders();await reconcileMemoReminders(backup.profile.planning?.memos??[],backup.profile.locale??"de");})()]);
      remindersCleared=reminderResults.every(result=>result.status==="fulfilled");
      setProfile(backup.profile);
      setHomeName(backup.profile.name);
      setLocale(backup.profile.locale ?? "de");
      setElectricityPrice(String(backup.profile.electricityPrice));
      setGoal(String(backup.profile.savingsGoalPercent));
      setCurrency(backup.profile.currency ?? "EUR");
      setVariableBudget(backup.profile.variableMonthly == null ? "" : String(backup.profile.variableMonthly));
      setBufferBudget(String(backup.profile.bufferMonthly ?? 0));
      setSavingsGoal(String(backup.profile.goalMonthly ?? 0));
      setDevices(backup.devices);
      setHistory(backup.history);
      setCosts(backup.costs);
      setTiles(backup.tiles);
      setBetaInterested(backup.betaInterested);
      setSelectedCostTileId("default-costs");
      setTab("home");
      setLoadFailed(false); setReady(true);
      showLocalizedAlert(locale,"Sicherung importiert", remindersCleared ? "Deine App-Daten wurden ersetzt." : locale === "de" ? "Deine App-Daten wurden ersetzt. Alte Erinnerungen konnten nicht entfernt werden; bitte prüfe sie." : "Your app data was replaced. Old reminders could not be removed; please review them.");
    } catch {
      showLocalizedAlert(locale,"Import fehlgeschlagen", "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut.");
    }
  }

  async function importData() {
    try {
      const json = await pickBackup();
      if (json === null) return;
      const backup = readMobileBackup(json) ?? convertWebBackup(json, locale);
      if (!backup) {
        showLocalizedAlert(locale,"Ungültige Sicherung", "Wähle eine vollständige EAVESENCE-App- oder Website-Sicherung in EUR oder CHF.");
        return;
      }
      showLocalizedAlert(locale,"App-Daten ersetzen?", locale === "de" ? `Sicherung vom ${new Date(backup.exportedAt).toLocaleDateString("de-AT")}: ${backup.costs.length} Kosten, ${backup.devices.length} Geräte, ${backup.history.length} Monatswerte. Dein aktuelles Zuhause wird ersetzt.` : `Backup from ${new Date(backup.exportedAt).toLocaleDateString("en-GB")}: ${backup.costs.length} costs, ${backup.devices.length} devices, ${backup.history.length} monthly entries. Your current home will be replaced.`, [
        { text: "Abbrechen", style: "cancel" },
        { text: "Importieren", onPress: () => { void applyBackup(backup); } },
      ]);
    } catch {
      showLocalizedAlert(locale,"Import fehlgeschlagen", "Die Datei konnte nicht gelesen werden.");
    }
  }

  function confirmReset() {
    showLocalizedAlert(locale,"My Home zurücksetzen?", "Dein Zuhause, Geräte, Kosten und Verlauf werden auf diesem Gerät gelöscht. Exportiere vorher eine Sicherung, wenn du sie behalten möchtest.", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Zurücksetzen", style: "destructive", onPress: () => { void (async () => {
        try {
          await clearAll();
          let reminderRemovalFailed = false;
          try { await disableAllReminders(); } catch { reminderRemovalFailed = true; }
          setHomeSetupOpen(false);
          setProfile(null);
          setDevices([]); setHistory([]); setCosts([]); setTiles(defaultTiles());
          setBetaInterested(false); setHomeName(locale === "de" ? "Mein Zuhause" : "My home"); setElectricityPrice("0.30"); setGoal("10");
          setCurrency("EUR"); setVariableBudget(""); setBufferBudget("0"); setSavingsGoal("0");
          if (!reminderRemovalFailed) setReminderActive(false);
          setSelectedCostTileId("default-costs"); setTab("home");
          setMemosOpen(false); setAreasOpen(false); setUpcomingOpen(false); setBudgetOpen(false); setPlanQuestion("payday");
          if (reminderRemovalFailed) showLocalizedAlert(locale,"Daten gelöscht", "Die Erinnerung konnte nicht ausgeschaltet werden. Deaktiviere sie später in der App.");
        } catch { showLocalizedAlert(locale,"Zurücksetzen fehlgeschlagen", "Bitte versuche es erneut."); }
      })(); } },
    ]);
  }

  async function saveTile() {
    const title = tileName.trim();
    if (!title) { showLocalizedAlert(locale,"Name fehlt", "Gib der Kachel einen Namen."); return; }
    if (title.length > 40) { showLocalizedAlert(locale,"Name zu lang", "Verwende höchstens 40 Zeichen."); return; }
    if (tiles.some((tile) => tile.id !== editingTileId && tile.title.toLowerCase() === title.toLowerCase())) {
      showLocalizedAlert(locale,"Name bereits vorhanden", "Wähle einen anderen Kachelnamen."); return;
    }
    const next = editingTileId
      ? tiles.map((tile) => tile.id === editingTileId ? { ...tile, title: title === (tile.id.startsWith("default-") ? localize(locale,tile.title) : tile.title) ? tile.title : title, icon:tileIcon } : tile)
      : [...tiles, createCostTile(title,tileIcon)];
    if (next.length > 30) { showLocalizedAlert(locale,"Zu viele Kacheln", "Maximal 30 Kacheln sind möglich."); return; }
    try {
      await writeJson(TILES_KEY, next);
      setTiles(next); setTileFormOpen(false); setEditingTileId(null); setTileName(""); Keyboard.dismiss();
    } catch { showLocalizedAlert(locale,"Speichern fehlgeschlagen", "Die Kachel konnte nicht gespeichert werden."); }
  }

  async function shiftTile(id: string, direction: -1 | 1) {
    const next = moveTile(tiles, id, direction);
    if (next === tiles) return;
    try {
      await writeJson(TILES_KEY, next);
      setTiles(next);
    } catch { showLocalizedAlert(locale,"Speichern fehlgeschlagen", "Die Reihenfolge konnte nicht gespeichert werden."); }
  }

  function confirmRemoveTile(tile: MobileTile) {
    const count = costs.filter((cost) => cost.tileId === tile.id).length;
    showLocalizedAlert(locale,"Kachel entfernen?", count ? locale === "de" ? `${count} ${count === 1 ? "Kostenposten wird" : "Kostenposten werden"} zu Haushaltskosten verschoben.` : `${count} costs will be moved to Household costs.` : tile.title, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Entfernen", style: "destructive", onPress: () => { void (async () => {
        try {
          const nextTiles = tiles.filter((item) => item.id !== tile.id);
          const nextCosts = costs.map((cost) => cost.tileId === tile.id ? { ...cost, tileId: "default-costs" } : cost);
          await writeAll([[TILES_KEY, nextTiles], [COSTS_KEY, nextCosts]]);
          setTiles(nextTiles); setCosts(nextCosts); setSelectedCostTileId("default-costs");
        } catch { showLocalizedAlert(locale,"Entfernen fehlgeschlagen", "Die Kachel konnte nicht entfernt werden."); }
      })(); } },
    ]);
  }

  function openTile(tile: MobileTile) {
    if (tile.kind === "energy") {
      setTab("energy");
    } else {
      setCostReviewId(undefined);
      setCostStartAction("none");
      setSelectedCostTileId(tile.id);
      setTab("costs");
    }
  }

  function openMainCosts() {
    setCostReviewId(undefined);
    setCostStartAction("none");
    setSelectedCostTileId("default-costs");
    setTab("costs");
  }

  function reviewCost(cost: HouseholdCost) {
    setCostReviewId(cost.id);setSelectedCostTileId(cost.tileId??"default-costs");setCostStartAction("none");setTab("costs");
  }

  function startWith(action: "income" | "cost") {
    setCostReviewId(undefined);
    setCostStartAction(action);
    setSelectedCostTileId("default-costs");
    setTab("costs");
  }

  function selectTab(key: Tab) {
    Keyboard.dismiss();
    if (key === "add" && tab !== "add") startNewDevice();
    else {
      if (key === "costs") { setSelectedCostTileId("default-costs"); setCostStartAction("none"); setCostReviewId(undefined); }
      setTab(key);
    }
  }

  function openSettings() {
    if (!profile) return;
    setHomeName(profile.name === "Mein Zuhause" || profile.name === "My home" ? localize(locale, "Mein Zuhause") : profile.name);
    setElectricityPrice(String(profile.electricityPrice));
    setGoal(String(profile.savingsGoalPercent));
    setCurrency(profile.currency ?? "EUR");
    Keyboard.dismiss();
    setTab("settings");
  }

  async function changeLanguage(nextLocale: MobileLocale) {
    if (profile) {
      const name = profile.name === "Mein Zuhause" || profile.name === "My home" ? (nextLocale === "de" ? "Mein Zuhause" : "My home") : profile.name;
      const next = { ...profile, name, locale: nextLocale };
      try { await writeJson(PROFILE_KEY, next); setProfile(next); if (homeName === "Mein Zuhause" || homeName === "My home") setHomeName(name); }
      catch { showLocalizedAlert(locale, "Speichern fehlgeschlagen", "Bitte versuche es erneut."); return; }
    } else setHomeName(nextLocale === "de" ? "Mein Zuhause" : "My home");
    setLocale(nextLocale);
    if(profile)void reconcileMemoReminders(profile.planning?.memos??[],nextLocale).catch(()=>{});
  }

  async function addEnergyTile() {
    const next = tiles.some(tile => tile.kind === "energy") ? tiles : [...tiles, { id: "default-energy", kind: "energy" as const, title: "Strom & Geräte" }];
    try { await writeJson(TILES_KEY, next); setTiles(next); setTab("home"); }
    catch { showLocalizedAlert(locale, "Speichern fehlgeschlagen", "Bitte versuche es erneut."); }
  }

  function editDevice(device: MobileDevice) {
    setEditingDeviceId(device.id);
    setForm({ name: device.name, watts: String(device.watts), minutes: String(device.minutesPerUse), uses: String(device.usesPerWeek), kwh: String(device.mode === "exact" ? device.measuredKwhPerUse ?? 0 : device.estimatedKwhPerUse ?? 0), type: device.calculationType ?? "power", mode: device.mode ?? "estimate", slug: device.librarySlug ?? "" });
    setTab("add");
  }

  function startNewDevice() {
    setEditingDeviceId(null);
    setForm(initialForm);
    setTab("add");
  }

  async function saveDevice() {
    if (!profile) return;
    if (!form.name.trim()) {
      showLocalizedAlert(locale,"Gerätename fehlt", "Gib dem Gerät einen Namen, bevor du es speicherst.");
      return;
    }
    const result = calculateEnergyCosts({
      mode: form.mode,
      calculationType: form.type,
      electricityPrice: profile.electricityPrice,
      watts: parseLocalNumber(form.watts),
      minutesPerUse: parseLocalNumber(form.minutes),
      usesPerWeek: parseLocalNumber(form.uses),
      estimatedKwhPerUse: parseLocalNumber(form.kwh),
      measuredKwhPerUse: parseLocalNumber(form.kwh),
    });
    if (!result.isValid) {
      showLocalizedAlert(locale,"Angaben prüfen", "Gib einen Verbrauch oder Leistung und Dauer sowie eine Nutzung größer als null ein.");
      return;
    }
    const existing = devices.find((device) => device.id === editingDeviceId);
    const nextDevice: MobileDevice = {
      ...existing,
      id: existing?.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: form.name.trim(),
      watts: parseLocalNumber(form.watts),
      minutesPerUse: parseLocalNumber(form.minutes),
      usesPerWeek: parseLocalNumber(form.uses),
      calculationType: form.type,
      mode: form.mode,
      estimatedKwhPerUse: form.type === "consumption" ? parseLocalNumber(form.kwh) : 0,
      measuredKwhPerUse: form.mode === "exact" ? parseLocalNumber(form.kwh) : 0,
      librarySlug: form.slug,
      yearlyKwh: result.yearlyKwh,
      yearlyCost: result.yearlyCost,
      monthlyCost: result.monthlyCost,
      updatedAt: new Date().toISOString(),
    };
    const nextDevices = existing ? devices.map((device) => device.id === existing.id ? nextDevice : device) : [nextDevice, ...devices];
    await writeJson(DEVICES_KEY, nextDevices);
    Keyboard.dismiss();
    setDevices(nextDevices);
    setForm(initialForm);
    setEditingDeviceId(null);
    setTab("energy");
  }

  async function removeDevice(id: string) {
    const nextDevices = devices.filter((device) => device.id !== id);
    await writeJson(DEVICES_KEY, nextDevices);
    setDevices(nextDevices);
  }

  function confirmRemoveDevice(device: MobileDevice) {
    showLocalizedAlert(locale,"Gerät entfernen?", device.name, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Entfernen", style: "destructive", onPress: () => { void removeDevice(device.id).catch(() => showLocalizedAlert(locale, "Speichern fehlgeschlagen", "Bitte versuche es erneut.")); } },
    ]);
  }

  async function persistCosts(next: HouseholdCost[], setupProfile=profile) {
    if(setupProfile) {
      const nextProfile={...setupProfile,savingsActions:closeSavingsHistory(setupProfile.savingsActions??[],costs,next,localToday())};
      await writeAll([[COSTS_KEY,next],[PROFILE_KEY,nextProfile]]);setProfile(nextProfile);
    } else await writeJson(COSTS_KEY,next);
    setCosts(next);
  }
  async function saveCost(cost: HouseholdCost) {
    await persistCosts(upsertHouseholdCost(costs,cost), profile?.setupStep === "cost" ? {...profile,setupStep:"review" as const} : profile);
  }
  async function deleteCost(id: string) {
    await persistCosts(removeHouseholdCost(costs,id));
    try { await cancelCostReview(id); } catch { showLocalizedAlert(locale, "Erinnerung fehlgeschlagen", "Bitte versuche es erneut."); }
  }

  async function saveIncome(amount: number, frequency: "monthly" | "yearly", extras: IncomeExtra[] = profile?.incomeExtras ?? []) {
    if (!profile) return;
    const next = { ...profile, incomeAmount: amount, incomeFrequency: frequency, incomeExtras: extras, ...(profile.setupStep === "income" ? {setupStep:"cost" as const} : {}) };
    await writeJson(PROFILE_KEY, next);
    setProfile(next);
    Keyboard.dismiss();
    if (!profile.setupStep || profile.setupStep === "complete") setTab("home");
  }

  async function setSetupStep(setupStep: "income" | "cost" | "review" | "complete") {
    if (!profile) return;
    const next = {...profile,setupStep};
    await writeJson(PROFILE_KEY,next); setProfile(next); Keyboard.dismiss(); setTab("home");
  }

  async function saveMonth() {
    if (!month) return;
    if (!profile || profile.electricityPrice <= 0) {
      showLocalizedAlert(locale,"Strompreis fehlt", "Hinterlege zuerst einen gültigen Strompreis.");
      return;
    }
    const enteredKwh = monthMode === "consumption" ? parseLocalNumber(monthKwh) : 0;
    const enteredCost = monthMode === "cost" ? parseLocalNumber(monthCost) : 0;
    const hasKwh = monthMode === "consumption" && Number.isFinite(enteredKwh) && enteredKwh > 0;
    const hasCost = monthMode === "cost" && Number.isFinite(enteredCost) && enteredCost > 0;
    if (!hasKwh && !hasCost) {
      showLocalizedAlert(locale,"Wert fehlt", "Gib den Verbrauch oder den Rechnungsbetrag ein.");
      return;
    }
    const kwh = hasKwh ? enteredKwh : enteredCost / profile.electricityPrice;
    const cost = hasKwh ? enteredKwh * profile.electricityPrice : enteredCost;
    const nextEntry: MobileHistoryEntry = {
      month,
      kwh,
      cost,
      updatedAt: new Date().toISOString(),
    };
    const nextHistory = [nextEntry, ...history.filter((entry) => entry.month !== month && entry.month !== editingMonth)]
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 24);
    await writeJson(HISTORY_KEY, nextHistory);
    Keyboard.dismiss();
    setHistory(nextHistory);
    setMonthKwh("");
    setMonthCost("");
    setEditingMonth(null);
    showLocalizedAlert(locale,"Monatswert gespeichert", "Verbrauch und Kosten wurden aktualisiert.");
  }

  function editMonth(entry: MobileHistoryEntry) {
    setMonth(entry.month);
    setMonthMode("consumption");
    setMonthKwh(String(Math.round(entry.kwh * 100) / 100));
    setMonthCost("");
    setEditingMonth(entry.month);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function confirmRemoveMonth(entry: MobileHistoryEntry) {
    showLocalizedAlert(locale,"Monatswert entfernen?", monthLabel(entry.month, locale), [
      { text: "Abbrechen", style: "cancel" },
      { text: "Entfernen", style: "destructive", onPress: () => {
        void (async () => {
          const next = history.filter((item) => item.month !== entry.month);
          await writeJson(HISTORY_KEY, next);
          setHistory(next);
          if (editingMonth === entry.month) { setEditingMonth(null); setMonthKwh(""); setMonthCost(""); }
        })().catch(() => showLocalizedAlert(locale, "Speichern fehlgeschlagen", "Bitte versuche es erneut."));
      } },
    ]);
  }

  async function toggleReminder() {
    try {
      if (reminderActive) {
        await disableMonthlyReminder();
        setReminderActive(false);
        showLocalizedAlert(locale,"Erinnerung deaktiviert", "Der monatliche Monats-Check ist ausgeschaltet.");
        return;
      }
      const enabled = await enableMonthlyReminder(locale);
      if (!enabled) { showLocalizedAlert(locale,"Benachrichtigungen nicht erlaubt", "Aktiviere Mitteilungen für EAVESENCE in den iPhone-Einstellungen."); return; }
      setReminderActive(true);
      showLocalizedAlert(locale, locale === "de" ? "Monatscheck-Erinnerung aktiv" : "Monthly check reminder enabled", locale === "de" ? "Am 1. jedes Monats um 9:00 Uhr: Prüfe dein Einkommen, deine regelmäßigen Kosten und deine Alltagsschätzung." : "On the 1st of each month at 9:00 am: review income, recurring costs and your everyday-spending estimate.");
    } catch { showLocalizedAlert(locale,"Erinnerung fehlgeschlagen", "Bitte versuche es erneut."); }
  }

  async function buy(selectedPackage: PurchasesPackage) {
    try {
      setIsPro(await purchasePro(selectedPackage));
    } catch (error) {
      if (typeof error === "object" && error && "userCancelled" in error) return;
      showLocalizedAlert(locale,"Kauf nicht möglich", "Bitte versuche es später erneut.");
    }
  }

  if (!ready && loadFailed) {
    return <SafeAreaView style={styles.loading}><Text style={styles.heroSmall}>{locale === "de" ? "Daten konnten nicht geladen werden" : "Could not load your data"}</Text><Text style={styles.financeNote}>{locale === "de" ? "Deine gespeicherten Daten werden nicht ersetzt. Bitte versuche es erneut." : "Your saved data will not be replaced. Please try again."}</Text><PrimaryButton label={locale === "de" ? "Erneut versuchen" : "Try again"} onPress={() => { setLoadFailed(false); setLoadAttempt(value => value + 1); }} /><PrimaryButton label={locale === "de" ? "Sicherung importieren" : "Import backup"} onPress={importData} /></SafeAreaView>;
  }
  if (!ready) {
    return <SafeAreaView style={styles.loading}><StatusBar style="dark" /><Image source={brandIcon} alt="EAVESENCE Logo" style={styles.loadingMark} /><Text style={styles.loadingBrand}>EAVESENCE</Text></SafeAreaView>;
  }

  if (!profile && homeSetupOpen) {
    return <SafeAreaView style={styles.safe}><StatusBar style="dark" />
      <View style={styles.appHeader}><BrandMotion source={brandIcon} style={styles.headerMark} locale={locale} /><Text style={styles.headerBrand}>EAVESENCE</Text></View>
      <KeyboardScrollContext.Provider value={input => scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(input,72,true)}><ScrollView ref={scrollRef} contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets={Platform.OS === "ios"} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <HomeSetupForm name={homeName} onName={setHomeName} currency={currency} onCurrency={setCurrency} onSave={createHome} />
      </ScrollView></KeyboardScrollContext.Provider>
    </SafeAreaView>;
  }
  if (!profile) {
    return (
      <SafeAreaView style={[styles.safe, styles.onboardingSafe]}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.onboarding} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <Image source={brandIcon} alt="EAVESENCE" style={styles.onboardingMark} />
            <Text style={styles.eyebrow}>EAVESENCE</Text>
            <Text style={styles.hero}>{locale === "de" ? "Damit aus Überblick ein Plan wird." : "Turn clarity into a plan."}</Text>
            <Text style={styles.body}>Erfasse dein Nettoeinkommen und deine festen Kosten. EAVESENCE zeigt dir, welche Zahlungen anstehen und was übrig bleibt.</Text>
            <PrimaryButton label={localize(locale, "Jetzt starten")} onPress={() => setHomeSetupOpen(true)} />
            <View style={styles.languageRow}>{(["de", "en"] as const).map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: locale === item }} onPress={() => void changeLanguage(item)} style={[styles.financePill, locale === item && styles.choiceSelected]}><Text style={styles.financePillText}>{item === "de" ? "Deutsch" : "English"}</Text></Pressable>)}</View>
            <Text style={styles.privateText}>Ohne Konto · lokal gespeichert · jederzeit löschbar</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (profile.setupStep && profile.setupStep !== "complete") {
    const step = profile.setupStep;
    return <SafeAreaView style={styles.safe}><StatusBar style="dark" />
      <View style={styles.appHeader}><BrandMotion source={brandIcon} style={styles.headerMark} locale={locale} /><Text style={styles.headerBrand}>EAVESENCE</Text></View>
      <KeyboardScrollContext.Provider value={input => scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(input,72,true)}><ScrollView ref={scrollRef} contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets={Platform.OS === "ios"} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Text style={styles.eyebrow}>{locale === "de" ? `SCHRITT ${step === "income" ? 1 : step === "cost" ? 2 : 3} VON 3` : `STEP ${step === "income" ? 1 : step === "cost" ? 2 : 3} OF 3`}</Text>
        {step === "review" ? <><Text style={styles.heroSmall}>{locale === "de" ? "Dein erster Überblick ist bereit." : "Your first overview is ready."}</Text><Text style={styles.financeNote}>{locale === "de" ? "Deine Angaben sind gespeichert. Weitere Kosten, Einstellungen und den Stromrechner findest du anschließend in deiner Übersicht." : "Your entries are saved. Find more costs, settings and the electricity calculator in your overview."}</Text><View style={styles.formSurface}><Metric full label={incomeSummary.annualAverage ? locale === "de" ? "Nettoeinkommen · Monatsdurchschnitt" : "Net income · monthly average" : locale === "de" ? "Nettoeinkommen pro Monat" : "Net income per month"} value={hasIncome ? euro.format(monthlyIncome) : locale === "de" ? "Später ergänzen" : "Add later"} /><Metric full label={locale === "de" ? "Fixkosten pro Monat" : "Recurring costs per month"} value={euro.format(costSummary.monthlyTotal)} /><Metric full label={locale === "de" ? "Rest nach Fixkosten" : "Left after fixed costs"} value={hasIncome && hasCosts ? euro.format(monthlyIncome-costSummary.monthlyTotal) : "—"} /><Text style={styles.financeNote}>{locale === "de" ? "Monatsdurchschnitte. Alltagsausgaben gehen davon noch ab; fehlende Zahlungstermine kannst du später ergänzen." : "Monthly averages. Everyday spending still comes out of this amount; add missing payment dates later."}</Text></View><Text style={styles.financeNote}>{locale === "de" ? "Weitere Kosten kannst du anschließend ergänzen. Prüfe kurz diese Angaben und öffne dann deine Übersicht." : "You can add more costs afterwards. Check these entries, then open your overview."}</Text><PrimaryButton label={locale === "de" ? "Meine Übersicht öffnen" : "Open my overview"} onPress={() => setSetupStep("complete")} /></> : <CostsScreen key={`setup-${step}`} setup={step} profile={profile} costs={costs} tiles={tiles} tileId="default-costs" tileTitle="Haushaltskosten" onSaveIncome={saveIncome} onSaveCost={saveCost} onDeleteCost={deleteCost} />}
      </ScrollView></KeyboardScrollContext.Provider>
    </SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.appHeader}>
        <BrandMotion source={brandIcon} style={styles.headerMark} locale={locale} />
        <View style={styles.headerCopy}><Text style={styles.headerBrand}>EAVESENCE</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={localize(locale, "Einstellungen")} onPress={openSettings} style={[styles.headerSettings, styles.outlinedAction]}><Text style={styles.outlinedText}>⚙ {localize(locale, "Einstellungen")}</Text></Pressable>
      </View>
      <KeyboardScrollContext.Provider value={(input) => scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(input, 72, true)}><ScrollView ref={scrollRef} style={styles.scrollSurface} contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets={Platform.OS === "ios"} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {tab === "home" && <>
          <Text style={styles.eyebrow}>EAVESENCE</Text>
          <Text style={styles.homeTitle}>{profile.name === "Mein Zuhause" || profile.name === "My home" ? localize(locale, "Mein Zuhause") : profile.name}</Text>
          <Text style={styles.homeSubtitle}>{locale === "de" ? "Was steht diesen Monat noch an? Hake bezahlte Kosten ab." : "What is still due this month? Check off paid costs."}</Text>
          <View style={styles.presetRow}>
            <Pressable accessibilityRole="button" style={[styles.financePill, styles.outlinedAction]} onPress={() => startWith("cost")}><Text style={styles.outlinedText}>{locale === "de" ? "Kosten hinzufügen" : "Add cost"}</Text></Pressable>
            <Pressable accessibilityRole="button" style={[styles.financePill, styles.outlinedAction]} onPress={() => startWith("income")}><Text style={styles.outlinedText}>{hasIncome ? locale === "de" ? "Einkommen ändern" : "Edit income" : locale === "de" ? "Einkommen eintragen" : "Add income"}</Text></Pressable>
          </View>
          <MonthlyPayments costs={costs} data={profile.planning} onSave={savePlanning} locale={locale} currency={profile.currency ?? "EUR"} onEdit={reviewCost} onAdd={() => startWith("cost")} />
          <HomeMemos data={profile.planning} onSave={savePlanning} locale={locale} open={memosOpen} onToggle={()=>setMemosOpen(!memosOpen)}/>
          {costs.length > 0 && !profile.backupReminderDismissed && <View style={styles.backupHint}>
            <Text style={styles.financeNote}>{locale === "de" ? "Deine Daten bleiben auf diesem Gerät. Speichere eine Sicherung in Dateien, bevor du die App entfernst oder das Gerät wechselst." : "Your data stays on this device. Save a backup to Files before deleting the app or changing devices."}</Text>
            <View style={styles.presetRow}><Pressable accessibilityRole="button" style={[styles.financePill,styles.outlinedAction]} onPress={() => void exportData()}><Text style={styles.outlinedText}>{locale === "de" ? "Daten sichern" : "Back up data"}</Text></Pressable><Pressable accessibilityRole="button" style={styles.financePill} onPress={() => void dismissBackupHint()}><Text style={styles.financePillText}>{locale === "de" ? "Später" : "Later"}</Text></Pressable></View>
          </View>}
          <Pressable accessibilityRole="button" accessibilityState={{expanded:homeDetailsOpen}} onPress={() => setHomeDetailsOpen(!homeDetailsOpen)} style={styles.areaDisclosure}><Text style={styles.areaDisclosureText}>{locale === "de" ? "Monatsbudget & Kostenbereiche" : "Monthly budget & cost areas"}</Text><DisclosureIcon open={homeDetailsOpen}/></Pressable>
          {homeDetailsOpen && <>
          <HomeCoreOverview incomeIsAverage={incomeSummary.annualAverage} locale={locale} currency={profile.currency ?? "EUR"} income={monthlyIncome} costs={costs} forecast={forecast} upcomingOpen={upcomingOpen} onUpcoming={() => setUpcomingOpen(!upcomingOpen)} onIncome={() => startWith("income")} onCost={() => startWith("cost")} onCosts={openMainCosts} onReview={reviewCost} />
          {!incomeSummary.annualAverage && <IncomeExtrasSummary profile={profile} locale={locale} currency={profile.currency ?? "EUR"} />}
          <View style={styles.areaNavigation}>
          <View accessibilityLabel={locale === "de" ? "Kostenbereich auswählen" : "Choose cost area"} style={styles.presetRow}>{tiles.map(tile => <Pressable key={tile.id} accessibilityRole="button" onPress={() => openTile(tile)} style={styles.areaPill}><View style={styles.tileTitleRow}><TileSymbol icon={iconForTile(tile)} color="#72dca3"/><Text style={styles.areaPillText}>{tile.id.startsWith("default-") ? localize(locale,tile.title) : tile.title}</Text></View></Pressable>)}</View>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: areasOpen }} onPress={() => setAreasOpen(!areasOpen)} style={styles.areaOrganizer}><Text style={styles.areaOrganizerText}>{locale === "de" ? "Kostenbereiche organisieren" : "Organize cost areas"}</Text><View style={styles.areaOrganizerIcon}><DisclosureIcon open={areasOpen} color="#72dca3" /></View></Pressable>
          </View>
          {areasOpen && <>
          <View style={styles.tilesSection}>
            <Text style={styles.financeHeading}>{locale === "de" ? "Bereiche in deinem Zuhause" : "Sections in your home"}</Text>
            <Text style={styles.financeNote}>Öffne einen Bereich oder ändere seine Reihenfolge mit den Pfeilen.</Text>
            <View style={styles.tilesGrid}>{tiles.map((tile, index) => {
              const tileCosts = costs.filter((cost) => tile.kind === "costs" && (tile.id === "default-costs" ? !cost.tileId || cost.tileId === tile.id : cost.tileId === tile.id));
              return <View key={tile.id} style={[styles.tileCard, tiles.length === 1 && { width: "100%" }]}>
                <Pressable accessibilityRole="button" onPress={() => openTile(tile)} style={styles.tileMain}>
                  <View style={styles.tileTitleRow}><TileSymbol icon={iconForTile(tile)}/><Text style={[styles.tileName,{flexShrink:1}]}>{tile.id.startsWith("default-") ? localize(locale, tile.title) : tile.title}</Text></View>
                  <Text style={styles.tileDetail}>{tile.kind === "energy" ? `${devices.length} ${locale === "de" ? "Geräte" : "devices"}` : `${tileCosts.length} ${locale === "de" ? "Kosten" : "costs"} · ${euro.format(tileCosts.reduce((sum, cost) => sum + monthlyCost(cost.amount, cost.frequency), 0))}/${locale === "de" ? "Monat" : "month"}`}</Text>
                </Pressable>
                <View style={styles.tileControls}>
                  <Pressable accessibilityRole="button" accessibilityLabel={locale === "de" ? `${tile.title} nach vorne verschieben` : `Move ${tile.title} earlier`} disabled={index === 0} onPress={() => void shiftTile(tile.id, -1)} style={styles.tileMove}><Text style={[styles.tileMoveText, index === 0 && styles.tileMoveDisabled]}>‹</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={locale === "de" ? `${tile.title} nach hinten verschieben` : `Move ${tile.title} later`} disabled={index === tiles.length - 1} onPress={() => void shiftTile(tile.id, 1)} style={styles.tileMove}><Text style={[styles.tileMoveText, index === tiles.length - 1 && styles.tileMoveDisabled]}>›</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={locale === "de" ? `${tile.title} bearbeiten` : `Edit ${tile.title}`} onPress={() => { setTileName(tile.id.startsWith("default-") ? localize(locale,tile.title) : tile.title); setTileIcon(iconForTile(tile)); setEditingTileId(tile.id); setTileFormOpen(true); }} style={styles.tileEdit}><Text style={styles.financePillText}>Ändern</Text></Pressable>{!tile.id.startsWith("default-") && <Pressable accessibilityLabel={locale === "de" ? `${tile.title} entfernen` : `Remove ${tile.title}`} onPress={() => confirmRemoveTile(tile)} style={styles.tileEdit}><Text style={styles.dangerText}>×</Text></Pressable>}
                {tile.kind === "energy" && tile.id.startsWith("default-") && <Pressable accessibilityRole="button" accessibilityLabel={locale === "de" ? "Stromkachel entfernen" : "Remove energy tile"} onPress={() => confirmRemoveTile(tile)} style={styles.tileEdit}><Text style={styles.dangerText}>×</Text></Pressable>}
                </View>
              </View>;
            })}</View>
            {tileFormOpen ? <FormSection style={styles.tileForm} onSave={saveTile} saveLabel={editingTileId ? "Änderungen speichern" : "Kachel erstellen"}><Field label="Kachelname" value={tileName} onChangeText={setTileName} placeholder="z. B. Versicherungen" /><TileSymbolPicker key={editingTileId ?? "new"} value={tileIcon} onChange={setTileIcon} locale={locale}/><PrimaryButton label={editingTileId ? "Änderungen speichern" : "Kachel erstellen"} onPress={() => void saveTile()} /><Pressable onPress={() => { setTileFormOpen(false); setEditingTileId(null); setTileName(""); }} style={styles.financePill}><Text style={styles.financePillText}>Abbrechen</Text></Pressable></FormSection>
              : <Pressable onPress={() => { setTileName(""); setTileIcon(null); setEditingTileId(null); setTileFormOpen(true); }} style={styles.addTile}><Text style={styles.addTileText}>+ Eigene Kachel</Text></Pressable>}
          </View>
          </>}

          </>}

        </>}

          {tab === "settings" && <FormSection style={styles.formSurface} onSave={saveSettings} saveLabel="Einstellungen speichern">
            <Text style={styles.heroSmall}>Einstellungen</Text>
            <Text style={styles.financeNote}>Sprache, Währung und deine Daten an einem Ort.</Text>
            <Field label="Name" value={homeName} onChangeText={setHomeName} />
            <Text style={styles.financeLabel}>WÄHRUNG</Text><View style={styles.presetRow}>{(["EUR", "CHF"] as const).map((item) => <Pressable key={item} accessibilityState={{ selected: currency === item }} onPress={() => setCurrency(item)} style={styles.financePill}><Text style={styles.financePillText}>{currency === item ? "✓ " : ""}{item}</Text></Pressable>)}</View>
            <Text style={styles.financeLabel}>SPRACHE / LANGUAGE</Text><View style={styles.presetRow}>{(["de", "en"] as const).map((item) => <Pressable key={item} onPress={() => void changeLanguage(item)} style={styles.financePill}><Text style={styles.financePillText}>{locale === item ? "✓ " : ""}{item === "de" ? "Deutsch" : "English"}</Text></Pressable>)}</View>
            <View style={styles.dataSection}><Text style={styles.dataTitle}>Stromrechner</Text><Field label={`${locale === "de" ? "Strompreis pro kWh" : "Electricity price per kWh"} (${currency})`} value={electricityPrice} onChangeText={setElectricityPrice} keyboardType="decimal-pad" /><Field label={locale === "de" ? "Stromverbrauch reduzieren um (%)" : "Reduce electricity use by (%)"} value={goal} onChangeText={setGoal} keyboardType="number-pad" /><Text style={styles.financeNote}>{locale === "de" ? "Nur für die Stromauswertung. Dein Sparbetrag in Planen & sparen wird separat festgelegt." : "Only for electricity analysis. Set your savings amount separately in Plan & save."}</Text></View>

            <PrimaryButton label="Einstellungen speichern" onPress={() => void saveSettings()} />
            <View style={styles.dataSection}><Text style={styles.dataTitle}>{locale === "de" ? "Erinnerungen" : "Reminders"}</Text><Text style={styles.financeHeading}>{locale === "de" ? "Monatlicher Kostencheck" : "Monthly cost check"}</Text><Text style={styles.financeNote}>{locale === "de" ? "Eine Erinnerung auf deinem Handy: jeden Monat am 1. um 9:00 Uhr. Prüfe dann, ob Einkommen und regelmäßige Kosten noch stimmen, und aktualisiere bei Bedarf deine Alltagsschätzung. Sie ist optional und keine Zahlungserinnerung für einzelne Rechnungen." : "A reminder on your phone on the 1st of each month at 9:00 am. Check your income and recurring costs, and update your everyday-spending estimate if needed. It is optional and does not remind you of individual bill due dates."}</Text><Pressable accessibilityRole="switch" accessibilityLabel={locale === "de" ? "Monatlichen Kostencheck erinnern" : "Monthly cost check reminder"} accessibilityState={{checked:reminderActive}} style={styles.financePill} onPress={() => void toggleReminder()}><Text style={styles.financePillText}>{reminderActive ? locale === "de" ? "Monatscheck-Erinnerung ausschalten" : "Turn off monthly check reminder" : locale === "de" ? "Monatscheck-Erinnerung aktivieren" : "Enable monthly check reminder"}</Text></Pressable></View>
            <View style={styles.dataSection}>
              <Text style={styles.dataTitle}>Deine Daten</Text>
              <Text style={styles.financeNote}>Sicherungen enthalten auch Einkommen, Sonderzahlungen und Sparvorhaben sowie Einstellungen, Kacheln, Kosten, Geräte und Monatswerte. Du kannst auch eine Website-Sicherung importieren; vorhandene App-Daten werden erst nach deiner Bestätigung ersetzt.</Text>
              <View style={styles.dataActions}>
                <Pressable onPress={() => void exportData()} style={styles.financePill}><Text style={styles.financePillText}>Sicherung exportieren</Text></Pressable>
                <Pressable onPress={() => void importData()} style={styles.financePill}><Text style={styles.financePillText}>Sicherung importieren</Text></Pressable>
                <Pressable onPress={confirmReset} style={styles.dangerPill}><Text style={styles.dangerText}>My Home zurücksetzen</Text></Pressable>
              </View>
            </View>
            <View style={styles.dataSection}><Text style={styles.dataTitle}>{locale === "de" ? "Hilfe & Informationen" : "Help & information"}</Text><Text style={styles.financeNote}>{locale === "de" ? "Deine Angaben bleiben auf diesem Gerät. Sichere sie vor einem Gerätewechsel oder einer Neuinstallation." : "Your entries stay on this device. Back them up before changing devices or reinstalling."}</Text><View style={styles.dataActions}>{[[locale === "de" ? "Hilfe / FAQ" : "Help / FAQ", locale === "de" ? "https://eavesence.com/de/rechner#faq" : "https://eavesence.com/calculator#faq"], [locale === "de" ? "Datenschutz" : "Privacy", locale === "de" ? "https://eavesence.com/datenschutz" : "https://eavesence.com/en/privacy"]].map(([label, url]) => <Pressable key={url} style={styles.financePill} onPress={() => void Linking.openURL(url).catch(() => showLocalizedAlert(locale, "Öffnen fehlgeschlagen", "Bitte versuche es erneut."))}><Text style={styles.financePillText}>{label}</Text></Pressable>)}</View><Text style={styles.financeNote}>EAVESENCE Home · {appConfig.expo.version} Beta</Text></View>
          </FormSection>}
        {tab === "energy" && <>
          <Text style={styles.eyebrow}>STROMRECHNER</Text><Text style={styles.heroSmall}>Was kostet dein Gerät?</Text>
          <Text style={styles.financeNote}>Ein freiwilliges Extra: Geräte berechnen und bei Bedarf als eigene Kachel in My Home übernehmen. Die Schätzung wird nicht zusätzlich zu deinen Fixkosten abgezogen.</Text>
          <View style={styles.presetRow}><Pressable style={styles.financePill} onPress={startNewDevice}><Text style={styles.financePillText}>Gerät berechnen</Text></Pressable><Pressable style={styles.financePill} onPress={() => void addEnergyTile()}><Text style={styles.financePillText}>{tiles.some(tile => tile.kind === "energy") ? "Stromkachel in My Home öffnen" : "Stromkachel zu My Home hinzufügen"}</Text></Pressable></View>
          <View style={[styles.pulseCard, currentMonthEntry ? styles.pulseCardComplete : styles.pulseCardOpen]}>
            <Text style={[styles.pulseLabel, currentMonthEntry ? styles.pulseLabelComplete : styles.pulseLabelOpen]}>{currentMonthEntry ? "MONATSÜBERBLICK" : "NÄCHSTER SCHRITT"}</Text>
            <Text style={styles.pulseTitle}>{currentMonthEntry ? monthlyChange === null ? localize(locale, "Deine erste Monatsbasis steht") : Math.abs(monthlyChange) < 1 ? localize(locale, "Verbrauch nahezu unverändert") : `${Math.abs(monthlyChange).toFixed(0)} % ${locale === "de" ? monthlyChange < 0 ? "weniger als im Vormonat" : "mehr als im Vormonat" : monthlyChange < 0 ? "less than last month" : "more than last month"}` : localize(locale, "Aktueller Monatswert noch offen")}</Text>
            <Text style={styles.pulseBody}>{currentMonthEntry ? `${Math.round(currentMonthEntry.kwh * 10) / 10} kWh · ${euro.format(currentMonthEntry.cost)}` : "Erfasse einmal im Monat Verbrauch oder Rechnungsbetrag. Den zweiten Wert berechnen wir automatisch."}</Text>
            {!currentMonthEntry && <Pressable style={styles.pulseAction} onPress={() => setTab("history")}><Text style={styles.pulseActionText}>Monatswert eintragen</Text></Pressable>}
          </View>
          <Text style={styles.sectionTitle}>Strom & Geräte</Text>
          <View style={styles.metricGrid}><Metric label="Gerätekosten/Jahr" value={euro.format(totals.yearlyCost)} /><Metric label="Verbrauch" value={`${Math.round(totals.yearlyKwh)} kWh`} /><Metric label="Ziel pro Monat" value={euro.format((totals.yearlyCost / 12) * (1 - profile.savingsGoalPercent / 100))} /><Metric label="Geräte" value={`${devices.length}`} /></View>
          {topDevice && <View style={styles.insightCard}><Text style={styles.insightLabel}>GRÖSSTER HEBEL</Text><Text style={styles.insightTitle}>{topDevice.name}</Text><Text style={styles.muted}>{euro.format(topDevice.yearlyKwh * profile.electricityPrice)} pro Jahr · {totals.yearlyCost > 0 ? Math.round(topDevice.yearlyKwh * profile.electricityPrice / totals.yearlyCost * 100) : 0} % der erfassten Gerätekosten</Text></View>}
          <Text style={styles.sectionTitle}>Alle Verbraucher im Haushalt</Text>
          {devices.length === 0 ? <Empty text="Noch keine Geräte. Füge dein erstes Gerät hinzu." /> : devices.map((device) => <View key={device.id} style={styles.deviceRow}><View style={styles.flex}><Text style={styles.deviceName}>{device.name}</Text><Text style={styles.muted}>{euro.format(device.yearlyKwh * profile.electricityPrice)} pro Jahr</Text></View><View style={styles.rowActions}><Pressable accessibilityRole="button" accessibilityLabel={`${device.name} bearbeiten`} onPress={() => editDevice(device)} style={styles.financePill}><Text style={styles.financePillText}>Ändern</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`${device.name} entfernen`} onPress={() => confirmRemoveDevice(device)}><Text style={styles.delete}>×</Text></Pressable></View></View>)}
          <PrimaryButton label="Gerät hinzufügen" onPress={startNewDevice} />
        </>}
        {tab === "costs" && <><CostsScreen key={`${selectedCostTileId}-${costStartAction}-${costReviewId??""}`} profile={profile} costs={costs} tiles={tiles} tileId={selectedCostTileId} tileTitle={tiles.find((tile) => tile.id === selectedCostTileId)?.title ?? "Haushaltskosten"} initialAction={costStartAction} initialCostId={costReviewId} onEditingChange={setCostEditorOpen} onOverview={() => setTab("home")} onSaveCost={saveCost} onDeleteCost={deleteCost} onSaveIncome={saveIncome} />{!costEditorOpen && <CostImportScreen costs={costs} currency={profile.currency??"EUR"} locale={locale} onSave={importCosts}/>}</>}

        {tab === "add" && <>
          <Pressable style={styles.financePill} onPress={() => setTab("history")}><Text style={styles.financePillText}>Stromverlauf öffnen</Text></Pressable>
          <Text style={styles.eyebrow}>{editingDeviceId ? "GERÄT BEARBEITEN" : "NEUES GERÄT"}</Text><Text style={styles.heroSmall}>{editingDeviceId ? "Gerät aktualisieren" : "Was kostet dein Gerät?"}</Text>
          <FormSection style={styles.formSurface} onSave={saveDevice} saveLabel={editingDeviceId ? "Änderungen speichern" : "Berechnen und speichern"}>
            {!editingDeviceId && <><Text style={styles.dataTitle}>Gerät aus der Bibliothek</Text><Field label="Gerät suchen" value={deviceSearch} onChangeText={setDeviceSearch} placeholder="z. B. Kühlschrank" /><Text style={styles.financeNote}>Richtwerte der Website. Passe den Verbrauch an dein Modell an.</Text><View style={styles.presetRow}>{libraryDevices.filter((device) => getLocalizedDevice(device, locale).name.toLocaleLowerCase().includes(deviceSearch.trim().toLocaleLowerCase())).slice(0, deviceSearch ? 12 : 8).map((device) => <Pressable key={device.slug} onPress={() => { const defaults = getDeviceCalculationDefaults(device); setForm({ name: getLocalizedDevice(device, locale).name, watts: String(defaults.watts), minutes: String(defaults.minutesPerUse), uses: String(defaults.usesPerWeek), kwh: device.calculationType === "consumption" ? String(defaults.estimatedKwhPerUse) : "", type: device.calculationType, mode: "estimate", slug: device.slug }); Keyboard.dismiss(); }} style={styles.financePill}><Text style={styles.financePillText}>{getLocalizedDevice(device, locale).name}</Text></Pressable>)}</View></>}
            <Field label="Gerätename" value={form.name} onChangeText={(value) => setForm({ ...form, name: value })} />
            <View style={styles.presetRow}><Pressable onPress={() => setForm({ ...form, mode: "estimate" })} style={styles.financePill}><Text style={styles.financePillText}>{form.mode === "estimate" ? "✓ " : ""}Schätzen</Text></Pressable><Pressable onPress={() => setForm({ ...form, mode: "exact" })} style={styles.financePill}><Text style={styles.financePillText}>{form.mode === "exact" ? "✓ " : ""}Gemessen</Text></Pressable></View>
            {form.mode === "estimate" && <View style={styles.presetRow}><Pressable onPress={() => setForm({ ...form, type: "power" })} style={styles.financePill}><Text style={styles.financePillText}>{form.type === "power" ? "✓ " : ""}Watt & Dauer</Text></Pressable><Pressable onPress={() => setForm({ ...form, type: "consumption" })} style={styles.financePill}><Text style={styles.financePillText}>{form.type === "consumption" ? "✓ " : ""}kWh je Nutzung</Text></Pressable></View>}
            {form.mode === "estimate" && form.type === "power" ? <><Field label="Leistung in Watt" value={form.watts} onChangeText={(value) => setForm({ ...form, watts: value })} keyboardType="number-pad" /><Field label="Minuten pro Nutzung" value={form.minutes} onChangeText={(value) => setForm({ ...form, minutes: value })} keyboardType="number-pad" /></> : <Field label={form.mode === "exact" ? "Gemessene kWh je Nutzung" : "kWh je Nutzung (Energielabel: kWh/Jahr)"} value={form.kwh} onChangeText={(value) => setForm({ ...form, kwh: value })} keyboardType="decimal-pad" />}
            <Field label="Nutzungen pro Woche" value={form.uses} onChangeText={(value) => setForm({ ...form, uses: value })} keyboardType="decimal-pad" />
            {form.type === "consumption" && form.uses === String(1 / 52) && <Text style={styles.financeNote}>Beim Jahresverbrauch des Energielabels ist die Nutzung auf ein Jahr eingestellt.</Text>}
            <PrimaryButton label={editingDeviceId ? "Änderungen speichern" : "Berechnen und speichern"} onPress={() => void saveDevice()} />
            {editingDeviceId && <Pressable onPress={() => { setEditingDeviceId(null); setForm(initialForm); setTab("energy"); }} style={styles.financePill}><Text style={styles.financePillText}>Abbrechen</Text></Pressable>}
          </FormSection>
        </>}

        {tab === "history" && <>
          <Pressable style={styles.financePill} onPress={() => setTab("energy")}><Text style={styles.financePillText}>Geräte verwalten</Text></Pressable>
          <Text style={styles.eyebrow}>MONATS-CHECK</Text><Text style={styles.heroSmall}>Aus Schätzungen wird ein Verlauf.</Text>
          <Text style={styles.historyHint}>Gib Verbrauch oder Rechnungsbetrag ein. Den zweiten Wert berechnen wir automatisch mit deinem Strompreis.</Text>
          <FormSection style={styles.formSurface} onSave={saveMonth} saveLabel={editingMonth ? "Monat aktualisieren" : "Monat speichern"}>
          <View style={styles.modeSwitch}><Pressable style={[styles.modeButton, monthMode === "consumption" && styles.modeButtonActive]} onPress={() => setMonthMode("consumption")}><Text style={[styles.modeButtonText, monthMode === "consumption" && styles.modeButtonTextActive]}>Verbrauch</Text></Pressable><Pressable style={[styles.modeButton, monthMode === "cost" && styles.modeButtonActive]} onPress={() => setMonthMode("cost")}><Text style={[styles.modeButtonText, monthMode === "cost" && styles.modeButtonTextActive]}>Rechnung</Text></Pressable></View>
          <Text style={styles.label}>Monat</Text>
          <View style={styles.monthPicker}>
            <Pressable accessibilityRole="button" accessibilityLabel="Vorheriger Monat" onPress={() => { setMonth(shiftMonth(month, -1)); Keyboard.dismiss(); }} style={styles.monthButton}><Text style={styles.monthArrow}>‹</Text></Pressable>
            <Text style={styles.monthValue}>{monthLabel(month, locale)}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Nächster Monat" onPress={() => { setMonth(shiftMonth(month, 1)); Keyboard.dismiss(); }} style={styles.monthButton}><Text style={styles.monthArrow}>›</Text></Pressable>
          </View>
          {month !== currentMonth && <Pressable onPress={() => setMonth(currentMonth)} style={styles.monthToday}><Text style={styles.monthTodayText}>Aktueller Monat</Text></Pressable>}
          {monthMode === "consumption" ? <Field label="Verbrauch in kWh" value={monthKwh} onChangeText={setMonthKwh} keyboardType="decimal-pad" /> : <Field label={`${locale === "de" ? "Rechnungsbetrag in" : "Bill amount in"} ${profile.currency ?? "EUR"}`} value={monthCost} onChangeText={setMonthCost} keyboardType="decimal-pad" />}
          <PrimaryButton label={editingMonth ? "Monat aktualisieren" : "Monat speichern"} onPress={() => void saveMonth()} />
          <Pressable style={styles.secondaryButton} onPress={() => void toggleReminder()}><Text style={styles.secondaryButtonText}>{reminderActive ? "Monatliche Erinnerung ausschalten" : "Monatliche Erinnerung aktivieren"}</Text></Pressable>
          <Text style={styles.financeNote}>{reminderActive ? "Aktiv · jeden 1. um 9:00 Uhr" : "Optional · jeden 1. um 9:00 Uhr"}</Text>
          </FormSection>
          <Text style={styles.sectionTitle}>Verlauf</Text>
          {history.length > 1 && <View style={styles.formSurface}>
            <Text style={styles.financeHeading}>{locale === "de" ? "Verbrauch im Vergleich" : "Usage over time"}</Text>
            <View style={styles.presetRow}>{([6, 12] as const).map((range) => <Pressable key={range} onPress={() => setChartRange(range)} style={styles.financePill}><Text style={styles.financePillText}>{chartRange === range ? "✓ " : ""}{range} {locale === "de" ? "Monate" : "months"}</Text></Pressable>)}</View>
            {[...history].sort((a, b) => a.month.localeCompare(b.month)).slice(-chartRange).map((entry) => <View key={entry.month} style={styles.chartRow}><Text style={styles.chartMonth}>{entry.month.slice(5)}</Text><View style={styles.chartTrack}><View style={[styles.chartBar, { width: `${Math.max(2, entry.kwh / Math.max(...history.map((item) => item.kwh), 1) * 100)}%` }]} /></View><Text style={styles.chartValue}>{Math.round(entry.kwh)} kWh</Text></View>)}
          </View>}
          {history.length === 0 ? <Empty text="Noch kein Monatswert vorhanden." /> : history.map((entry) => <View key={entry.month} style={styles.historyRow}><View style={styles.historyValues}><Text style={styles.deviceName}>{monthLabel(entry.month, locale)}</Text><Text style={styles.muted}>{Math.round(entry.kwh * 10) / 10} kWh · {euro.format(entry.cost)}</Text></View><View style={styles.rowActions}><Pressable accessibilityRole="button" accessibilityLabel={`${monthLabel(entry.month, locale)} bearbeiten`} onPress={() => editMonth(entry)} style={styles.financePill}><Text style={styles.financePillText}>Ändern</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`${monthLabel(entry.month, locale)} entfernen`} onPress={() => confirmRemoveMonth(entry)}><Text style={styles.delete}>×</Text></Pressable></View></View>)}
        </>}

        {tab === "pro" && <>

          <Text style={styles.eyebrow}>{locale === "de" ? "PRO-VORSCHAU · DERZEIT KOSTENLOS" : "PRO PREVIEW · CURRENTLY FREE"}</Text>
          <Text style={styles.homeTitle}>{locale === "de" ? "Dein Plan" : "Your plan"}</Text>
          <Text style={styles.financeNote}>{locale === "de" ? "Wähle eine Frage. Deine Angaben aus My Home sind übernommen." : "Choose a question. Your My Home entries are already included."}</Text>
          <View accessibilityRole="tablist" accessibilityLabel={locale === "de" ? "Planungsfrage wählen" : "Choose planning question"} style={styles.planTabs}>
            {(["payday", "savings", "progress"] as const).map((question, index) => <Pressable key={question} accessibilityRole="tab" accessibilityState={{ selected: planQuestion === question }} accessibilityLabel={question === "payday" ? locale === "de" ? "Bis zum Gehalt ausgeben" : "Spend until payday" : question === "savings" ? locale === "de" ? "Realistisch sparen" : "Find realistic savings" : locale === "de" ? "Erreichte Ersparnis" : "Savings achieved"} onPress={() => { Keyboard.dismiss(); setPlanQuestion(question); }} style={[styles.planTab, planQuestion === question && styles.planTabSelected]}><Text style={styles.planTabText}>{index + 1} · {question === "payday" ? locale === "de" ? "Bis zum Gehalt" : "To payday" : question === "savings" ? locale === "de" ? "Sparen" : "Save" : locale === "de" ? "Erspart" : "Saved"}</Text></Pressable>)}
          </View>
          {planQuestion === "payday" && <PaydayScreen onSavings={()=>setPlanQuestion("savings")} onReviewCost={reviewCost} key={`payday-${profile.createdAt}`} input={{incomeMonthly:monthlyIncome,incomeExtras:incomeSummary.extras,variableMonthly:profile.variableMonthly??null,bufferMonthly:profile.bufferMonthly??0,goalMonthly:profile.goalMonthly??0,costs,startMonth:upcoming.month}} data={profile.planning} onSave={savePlanning} currency={profile.currency??"EUR"}/> }
          {planQuestion === "savings" && <View style={styles.formSurface}>
          <Pressable accessibilityRole="button" accessibilityState={{expanded:budgetOpen}} style={styles.financePill} onPress={() => setBudgetOpen(!budgetOpen)}><Text style={styles.financePillText}>{locale === "de" ? "Monatsbudget ergänzen (optional)" : "Add a monthly budget (optional)"}</Text></Pressable>
          {budgetOpen && <><Text style={styles.dataTitle}>{locale === "de" ? "Deine monatliche Planungsbasis" : "Your monthly planning basics"}</Text>
          <Text style={styles.financeNote}>{locale === "de" ? "Einkommen und Fixkosten sind schon übernommen. Schätze noch deine übrigen Alltagsausgaben – daraus berechnen wir, was dir im Monat bleibt." : "Income and fixed costs are already included. Estimate your other everyday spending to see what is left each month."}</Text>
          <FormSection onSave={saveBudget} saveLabel="Plan speichern" style={{ gap: 12 }}><Field label={locale === "de" ? "Alltagsausgaben pro Monat (geschätzt)" : "Everyday spending per month (estimate)"} value={variableBudget} onChangeText={setVariableBudget} keyboardType="decimal-pad" placeholder={locale === "de" ? "z. B. 500" : "e.g. 500"} />
          <Text style={styles.financeNote}>{locale === "de" ? "Zum Beispiel Lebensmittel und Freizeit. Nur Ausgaben, die noch nicht in deinen Fixkosten stehen. Du kannst die Schätzung später ändern." : "For example groceries and leisure. Only spending not already in your fixed costs. You can change the estimate later."}</Text>
          <Field label={locale === "de" ? "Gewünschter Sparbetrag pro Monat (optional)" : "Desired savings per month (optional)"} value={savingsGoal} onChangeText={setSavingsGoal} keyboardType="decimal-pad" />
          <Text style={styles.financeNote}>{locale === "de" ? "Geld, das du vom verbleibenden Budget zurücklegen möchtest – nachdem Fixkosten und Alltagsausgaben bezahlt sind." : "Money you want to set aside from what is left after fixed costs and everyday spending."}</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: reserveOptionsOpen }} onPress={() => setReserveOptionsOpen(!reserveOptionsOpen)} style={styles.financePill}><Text style={styles.financePillText}>{locale === "de" ? "Erweiterte Optionen: freiwillige Reserve" : "More options: optional reserve"}</Text></Pressable>
          {reserveOptionsOpen && <><Text style={styles.financeNote}>{locale === "de" ? "Möchtest du zusätzlich Geld unberührt lassen? Dieser selbst gewählte Betrag wird vom Spielraum abgezogen. Jahresrechnungen sind bereits in den Fixkosten enthalten." : "Want to keep an extra amount untouched? This amount is deducted from what is left. Annual bills are already included in fixed costs."}</Text><Field label={locale === "de" ? "Freiwillige Reserve pro Monat" : "Optional reserve per month"} value={bufferBudget} onChangeText={setBufferBudget} keyboardType="decimal-pad" /></>}
          <PrimaryButton label="Plan speichern" onPress={saveBudget} /></FormSection></>}
          {savingsPlan && <>
            {budgetOpen && <SavingsBudgetSummary input={{ incomeMonthly: monthlyIncome, incomeExtras: incomeSummary.extras, variableMonthly: profile.variableMonthly ?? null, bufferMonthly: profile.bufferMonthly ?? 0, goalMonthly: profile.goalMonthly ?? 0, costs, startMonth: upcoming.month }} currency={profile.currency ?? "EUR"} />}

            <SavingsCoachScreen onNavigate={question => {Keyboard.dismiss();setPlanQuestion(question);scrollRef.current?.scrollTo({y:0,animated:true});}} mode="opportunities" input={{incomeMonthly:monthlyIncome,incomeExtras:incomeSummary.extras,variableMonthly:profile.variableMonthly??null,bufferMonthly:profile.bufferMonthly??0,goalMonthly:profile.goalMonthly??0,costs,startMonth:upcoming.month}} data={profile.planning} onSave={savePlanning} actions={readSavingsActions(profile.savingsActions)} onActions={saveSavingsActions} onConfirm={confirmSaving} onReview={reviewCost} currency={profile.currency??'EUR'}/>

            <ProToolsScreen input={{incomeMonthly:monthlyIncome,variableMonthly:profile.variableMonthly??null,bufferMonthly:profile.bufferMonthly??0,goalMonthly:profile.goalMonthly??0,costs,startMonth:upcoming.month}} data={profile.planning} onSave={savePlanning} onReview={reviewCost} currency={profile.currency??'EUR'}/>

            {homeRelease.advancedPlanning && <Pressable accessibilityRole="button" accessibilityState={{ expanded: scenarioOpen }} style={styles.financePill} onPress={() => setScenarioOpen(!scenarioOpen)}><Text style={styles.financePillText}>{locale === "de" ? "Eine Kostenänderung durchspielen" : "Try a cost change"}</Text></Pressable>}
            {homeRelease.advancedPlanning && scenarioOpen && <SavingsActionsScreen input={{ incomeMonthly: monthlyIncome, incomeExtras: incomeSummary.extras, variableMonthly: profile.variableMonthly ?? null, bufferMonthly: profile.bufferMonthly ?? 0, goalMonthly: profile.goalMonthly ?? 0, costs, startMonth: upcoming.month }} actions={readSavingsActions(profile.savingsActions)} currency={profile.currency ?? "EUR"} onChange={saveSavingsActions} onConfirm={confirmSaving} />}
            {homeRelease.advancedPlanning && <><Pressable accessibilityRole="button" accessibilityState={{expanded:toolsOpen}} onPress={() => setToolsOpen(!toolsOpen)} style={styles.financePill}><Text style={styles.financePillText}>{locale === "de" ? "Weitere Planung: Ziele, Rücklagen & Monatscheck" : "More planning: goals, reserves & monthly check"}</Text></Pressable>
            {toolsOpen && <>            <PlanningScreen input={{ incomeMonthly: monthlyIncome, incomeExtras: incomeSummary.extras, variableMonthly: profile.variableMonthly ?? null, bufferMonthly: profile.bufferMonthly ?? 0, goalMonthly: profile.goalMonthly ?? 0, costs, startMonth: upcoming.month }} data={profile.planning} onSave={savePlanning} currency={profile.currency ?? "EUR"} onEditCosts={openMainCosts} onEditBudget={() => { setBudgetOpen(true); scrollRef.current?.scrollTo({ y: 0, animated: true }); }} /></>}</>}
          </>}
        </View>}
          {planQuestion === "progress" && <SavingsCoachScreen onNavigate={question => {Keyboard.dismiss();setPlanQuestion(question);scrollRef.current?.scrollTo({y:0,animated:true});}} mode="progress" input={{incomeMonthly:monthlyIncome,incomeExtras:incomeSummary.extras,variableMonthly:profile.variableMonthly??null,bufferMonthly:profile.bufferMonthly??0,goalMonthly:profile.goalMonthly??0,costs,startMonth:upcoming.month}} data={profile.planning} onSave={savePlanning} actions={readSavingsActions(profile.savingsActions)} onActions={saveSavingsActions} onConfirm={confirmSaving} onReview={reviewCost} currency={profile.currency??"EUR"}/>}
          {isPro ? <Text style={styles.proActive}>Pro aktiv</Text> : packages.length > 0 ? packages.map((item) => <Pressable key={item.identifier} style={styles.proButton} onPress={() => void buy(item)}><Text style={styles.proButtonText}>{item.product.title} · {item.product.priceString}</Text></Pressable>) : <Text style={styles.financeNote}>{locale === "de" ? "Pro-Vorschau: Diese Planungsfunktionen sind in der Beta kostenlos. Es wird kein Abo abgeschlossen." : "Pro preview: these planning tools are free in this beta. No subscription is started."}</Text>}
          {packages.length > 0 && <Pressable onPress={() => void restorePro().then(setIsPro).catch(() => showLocalizedAlert(locale,"Wiederherstellung fehlgeschlagen", "Bitte versuche es erneut."))}><Text style={styles.restore}>Käufe wiederherstellen</Text></Pressable>}
        </>}
      </ScrollView></KeyboardScrollContext.Provider>
      {!keyboardVisible && <View style={styles.tabBar} accessibilityRole="tablist" accessibilityLabel={localize(locale, "App-Navigation")}>{navigationTabs.map(({ key, label, icon }) => {
        const active = tab === key || (key === "energy" && (tab === "add" || tab === "history"));
        const primary = key === "add";
        return <Pressable key={key} accessibilityRole="tab" accessibilityLabel={localize(locale, label)} accessibilityState={{ selected: active }} onPress={() => selectTab(key)} style={styles.tab}>
          <View style={[styles.tabIconSurface, active && styles.tabIconActive, key === "pro" && !active && styles.tabProPreview, primary && styles.tabIconPrimary]}><Image source={icon} alt="" style={[styles.tabIcon, { tintColor: primary ? "#ffffff" : active ? "#087a45" : "#65716d" }]} /></View>
          <Text numberOfLines={1} style={[styles.tabText, active && styles.tabTextActive]}>{localize(locale, label)}</Text>
        </Pressable>;
      })}</View>}
    </SafeAreaView>
  );
}

const Field = FormInput;

function PrimaryButton({ label, onPress }: { label: string; onPress: () => unknown | Promise<unknown> }) {
  const form = useFormAction();
  const locale = useMobileLocale();
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  async function submit() {
    if (form) { form.submit(); return; }
    if (saving.current) return;
    saving.current = true; setBusy(true);
    try { await onPress(); } catch { showLocalizedAlert(locale, "Speichern fehlgeschlagen", "Bitte versuche es erneut."); } finally { saving.current = false; setBusy(false); }
  }
  return <Pressable accessibilityRole="button" disabled={form?.busy || busy} style={styles.primaryButton} onPress={() => void submit()}><Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

function Metric({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return <View style={[styles.metric, full && { width: "100%" }]}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function Empty({ text }: { text: string }) {
  return <View style={styles.empty}><Text style={styles.muted}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  tabProPreview: { backgroundColor: "#edf2f8", borderColor: "#b8c4d6", borderWidth: 1 },
  outlinedAction: { backgroundColor: "transparent", borderColor: "#aebbb2" },
  outlinedText: { fontSize: 12, fontWeight: "700", color: "#24272c" },
  backupHint: { marginTop: 12, gap: 8 },
  areaNavigation: { backgroundColor: "#24272c", borderRadius: 12, paddingHorizontal: 16, paddingTop: 12, marginTop: 16 },
  areaPill: { minHeight: 44, borderRadius: 24, borderWidth: 1, borderColor: "#65716d", paddingHorizontal: 16, justifyContent: "center" },
  areaPillText: { fontSize: 12, fontWeight: "600", color: "#fff", flexShrink: 1 },
  areaOrganizer: { minHeight: 48, marginTop: 4, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: "#45574f", borderRadius: 10, backgroundColor: "#2d3432", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  areaOrganizerIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#3b4a41", alignItems: "center", justifyContent: "center" },
  areaOrganizerText: { flex: 1, fontSize: 13, fontWeight: "700", color: "#b8efcc" },
  areaDisclosure: { borderWidth: 1, borderColor: "transparent", paddingHorizontal: 16, minHeight: 48, marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  areaDisclosureText: { flex: 1, fontSize: 13, fontWeight: "700", color: "#17211f" },
  disclosureIcon: { fontSize: 22, color: "#087a45" },
  planTabs: { flexDirection: "row", gap: 8, marginVertical: 16 },
  planTab: { flex: 1, minHeight: 52, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 12, backgroundColor: "#ffffff", padding: 10, justifyContent: "center" },
  planTabSelected: { backgroundColor: "#ddf8e9", borderColor: "#087a45" },
  planTabText: { fontSize: 12, fontWeight: "700", color: "#52605b" },
  headerSettings: { minHeight: 44, justifyContent: "center", paddingHorizontal: 10, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 22 },
  languageRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 12 },
  choiceSelected: { borderWidth: 1, borderColor: "#087a45" },
  chartRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  chartMonth: { width: 24, fontSize: 11, color: "#52605b" },
  chartTrack: { flex: 1, height: 12, borderRadius: 8, backgroundColor: "#e3e8e4", overflow: "hidden" },
  chartBar: { height: 12, backgroundColor: "#087a45", borderRadius: 8 },
  chartValue: { width: 62, textAlign: "right", fontSize: 11, color: "#52605b" },
  setupToggle: { alignSelf: "center", paddingVertical: 8 },
  setupToggleText: { fontSize: 13, fontWeight: "800", color: "#087a45" },
  setupNote: { textAlign: "center", fontSize: 11, lineHeight: 16, color: "#65716d" },
  startSteps: { marginTop: 5, gap: 8 },
  startStep: { minHeight: 44, borderRadius: 14, backgroundColor: "#ddf8e9", paddingHorizontal: 14, justifyContent: "center" },
  startStepText: { fontSize: 13, fontWeight: "800", color: "#087a45" },
  startLink: { alignSelf: "flex-start", minHeight: 34, marginTop: 3, justifyContent: "center" },
  startLinkText: { fontSize: 13, fontWeight: "800", color: "#72dca3" },
  dataSection: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderColor: "#dfe5dd", gap: 7 },
  dataTitle: { fontSize: 15, fontWeight: "900", color: "#17211f" },
  dataActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  dangerPill: { alignSelf: "flex-start", minHeight: 30, borderRadius: 16, backgroundColor: "#fef2f2", paddingHorizontal: 12, justifyContent: "center" },
  dangerText: { fontSize: 12, fontWeight: "800", color: "#b42318" },
  tilesSection: { marginTop: 18, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 23, backgroundColor: "#f4f6f2", padding: 15, gap: 10 },
  tilesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, padding: 10, backgroundColor: "#24272c", borderRadius: 16 },
  tileCard: { width: "48%", minHeight: 112, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 14, backgroundColor: "#fbfcf8", padding: 12, justifyContent: "space-between" },
  tileMain: { minHeight: 60 },
  tileTitleRow: {flexDirection:"row",alignItems:"center",gap:8},
  tileName: { fontSize: 14, fontWeight: "900", color: "#17211f" },
  tileDetail: { marginTop: 5, fontSize: 11, lineHeight: 16, color: "#65716d" },
  tileControls: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 3, marginTop: 7 },
  tileMove: { width: 29, height: 29, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#ddf8e9" },
  tileMoveText: { fontSize: 22, lineHeight: 27, fontWeight: "700", color: "#087a45" },
  tileMoveDisabled: { color: "#aab8b0" },
  tileEdit: { minHeight: 29, justifyContent: "center", paddingHorizontal: 4 },
  addTile: { minHeight: 45, borderWidth: 1, borderStyle: "dashed", borderColor: "#aebbb2", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  addTileText: { fontSize: 13, fontWeight: "800", color: "#087a45" },
  tileForm: { borderWidth: 1, borderColor: "#b8efcc", borderRadius: 14, backgroundColor: "#eefbf3", padding: 14, gap: 10 },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  homeHeadingRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  homeHeadingText: { flex: 1 },
  headingSettingsButton: { marginTop: 0, minHeight: 36 },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 9, padding: 14, borderWidth: 1, borderRadius: 14, borderColor: "#dfe5dd", backgroundColor: "#fbfcf8" },
  historyValues: { flex: 1 },
  onboardingMark: { width: 54, height: 54, borderRadius: 11, marginBottom: 2 },
  formSurface: { borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 22, backgroundColor: "#f6f6f0", padding: 18, gap: 13 },
  headerMark: { width: 34, height: 34, borderRadius: 7 },
  headerCopy: { flex: 1, marginLeft: 9 },
  headerBrand: { fontSize: 15, fontWeight: "900", letterSpacing: -0.4, color: "#10283a" },
  headerSubline: { marginTop: 1, fontSize: 9, fontWeight: "800", letterSpacing: 1.7, color: "#087a45" },
  homeTitle: { marginTop: 9, fontSize: 27, lineHeight: 32, fontWeight: "800", letterSpacing: -0.8, color: "#17211f" },
  homeSubtitle: { marginTop: 8, marginBottom: 20, fontSize: 14, lineHeight: 21, color: "#65716d" },
  financeSection: { borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 23, backgroundColor: "#f4f6f2", padding: 15, gap: 11 },
  financePair: { flexDirection: "row", gap: 9 },
  financeHeading: { marginBottom: 3, fontSize: 17, fontWeight: "900", letterSpacing: -0.5, color: "#17211f" },
  financeCard: { borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 14, backgroundColor: "#fbfcf8", padding: 16, alignItems: "flex-start" },
  financeCardCompact: { flex: 1, minWidth: 0, minHeight: 131, padding: 13 },
  financeCardAccent: { borderColor: "#b8efcc", backgroundColor: "#eefbf3" },
  financeLabel: { fontSize: 11, lineHeight: 16, fontWeight: "700", letterSpacing: 0.6, color: "#65716d" },
  financeValue: { marginTop: 8, fontSize: 25, fontWeight: "900", letterSpacing: -0.7, color: "#17211f" },
  financeValueCompact: { fontSize: 22, alignSelf: "stretch" },
  financeNote: { marginTop: 5, fontSize: 12, lineHeight: 18, color: "#65716d" },
  financePill: { alignSelf: "flex-start", marginTop: 12, minHeight: 44, borderRadius: 22, borderWidth: 1, borderColor: "#dfe5dd", backgroundColor: "#ffffff", paddingHorizontal: 12, justifyContent: "center" },
  financeCompactAction: { marginTop: "auto" },
  financePillText: { fontSize: 12, fontWeight: "700", color: "#087a45" },
  financeExpanded: { alignSelf: "stretch", marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderColor: "#dfe5dd" },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, paddingVertical: 5 },
  paymentName: { flex: 1, fontSize: 12, color: "#52605b" },
  paymentAmount: { fontSize: 12, fontWeight: "800", color: "#17211f" },
  loadingMark: { width: 90, height: 90, borderRadius: 18, marginBottom: 14 },
  loadingBrand: { fontSize: 18, fontWeight: "900", letterSpacing: 1.8, color: "#10283a" },
  monthPicker: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#dfe5e1", borderRadius: 14, backgroundColor: "#ffffff", marginTop: 7 },
  monthButton: { width: 52, minHeight: 52, alignItems: "center", justifyContent: "center" },
  monthArrow: { fontSize: 30, color: "#087a45" },
  monthValue: { fontSize: 16, fontWeight: "800", color: "#07111f" },
  monthToday: { alignSelf: "flex-start", paddingVertical: 9 },
  monthTodayText: { fontSize: 12, fontWeight: "800", color: "#087a45" },
  modeSwitch: { flexDirection: "row", marginBottom: 16, borderRadius: 18, backgroundColor: "#e7ece9", padding: 3 },
  modeButton: { flex: 1, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: 15 },
  modeButtonActive: { backgroundColor: "#ffffff" },
  modeButtonText: { fontSize: 12, fontWeight: "800", color: "#64748b" },
  modeButtonTextActive: { color: "#087a45" },
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#ffffff" },
  onboardingSafe: { backgroundColor: "#f6f7f2" },
  scrollSurface: { backgroundColor: "#f6f7f2" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f6f7f2" },
  onboarding: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 18 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 34 },
  appHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderColor: "#e2e8e4", backgroundColor: "#ffffff" },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.6, color: "#087a45" },
  eyebrowMint: { fontSize: 11, fontWeight: "900", letterSpacing: 1.6, color: "#72dca3" },
  hero: { fontSize: 38, lineHeight: 42, fontWeight: "900", letterSpacing: -1.4, color: "#17211f" },
  heroSmall: { marginTop: 8, marginBottom: 18, fontSize: 29, lineHeight: 34, fontWeight: "900", letterSpacing: -1, color: "#17211f" },
  body: { fontSize: 15, lineHeight: 23, color: "#65716d", marginBottom: 6 },
  label: { fontSize: 12, fontWeight: "800", color: "#52605b" },
  primaryButton: { minHeight: 50, marginTop: 14, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: "#24272c", paddingHorizontal: 20 },
  primaryButtonText: { fontSize: 14, fontWeight: "800", color: "#ffffff" },
  privateText: { textAlign: "center", fontSize: 12, fontWeight: "600", color: "#65716d" },
  pulseCard: { marginBottom: 16, borderWidth: 1, borderRadius: 18, padding: 15 }, pulseCardOpen: { borderColor: "#f4cf73", backgroundColor: "#fff9e9" }, pulseCardComplete: { borderColor: "#b8efcc", backgroundColor: "#eefbf3" }, pulseLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 1 }, pulseLabelOpen: { color: "#a85d00" }, pulseLabelComplete: { color: "#087a45" }, pulseTitle: { marginTop: 5, fontSize: 15, fontWeight: "900", color: "#07111f" }, pulseBody: { marginTop: 4, fontSize: 13, lineHeight: 19, color: "#52605b" }, pulseAction: { alignSelf: "flex-start", minHeight: 30, marginTop: 12, borderRadius: 15, justifyContent: "center", backgroundColor: "#dcf8e8", paddingHorizontal: 12 }, pulseActionText: { fontSize: 12, fontWeight: "900", color: "#087a45" }, metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, metric: { width: "48%", minHeight: 94, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 14, backgroundColor: "#fbfcf8", padding: 14 }, metricLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7, color: "#64748b" }, metricValue: { marginTop: 12, fontSize: 19, fontWeight: "900", color: "#07111f" }, insightCard: { marginTop: 16, borderRadius: 16, backgroundColor: "#e7f7ed", padding: 15 }, insightLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8, color: "#087a45" }, insightTitle: { marginTop: 5, fontSize: 15, fontWeight: "900", color: "#07111f" }, historyHint: { marginTop: -12, marginBottom: 18, fontSize: 13, lineHeight: 19, color: "#64748b" }, sectionTitle: { marginTop: 28, marginBottom: 10, fontSize: 20, fontWeight: "900", color: "#07111f" }, deviceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 9, padding: 14, borderWidth: 1, borderRadius: 14, borderColor: "#dfe5dd", backgroundColor: "#fbfcf8" }, deviceName: { fontSize: 15, fontWeight: "800", color: "#07111f" }, muted: { marginTop: 3, fontSize: 12, color: "#64748b" }, delete: { padding: 8, fontSize: 24, color: "#94a3b8" }, empty: { borderWidth: 1, borderStyle: "dashed", borderColor: "#cbd5e1", borderRadius: 16, padding: 20, backgroundColor: "#ffffff" }, secondaryButton: { minHeight: 48, marginTop: 10, borderWidth: 1, borderColor: "#b9d9c7", borderRadius: 24, alignItems: "center", justifyContent: "center" }, secondaryButtonText: { fontSize: 14, fontWeight: "800", color: "#087a45" }, proCard: { borderRadius: 26, backgroundColor: "#17211f", padding: 24 }, proTitle: { marginTop: 12, fontSize: 32, lineHeight: 35, fontWeight: "900", letterSpacing: -1.2, color: "#ffffff" }, proBody: { marginTop: 15, fontSize: 15, lineHeight: 23, color: "#cbd5d1" }, proButton: { minHeight: 52, marginTop: 24, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "#72dca3", paddingHorizontal: 16 }, proButtonDisabled: { backgroundColor: "#43514c" }, proButtonText: { fontSize: 14, fontWeight: "900", color: "#10231b" }, proActive: { marginTop: 24, fontSize: 17, fontWeight: "900", color: "#72dca3" }, restore: { marginTop: 18, textAlign: "center", fontSize: 13, fontWeight: "800", color: "#ffffff" }, proHint: { marginTop: 10, textAlign: "center", fontSize: 11, lineHeight: 17, color: "#94a3a0" }, tabBar: { flexDirection: "row", borderTopWidth: 1, borderColor: "#e2e8e4", backgroundColor: "#ffffff", paddingHorizontal: 12, paddingTop: 7, paddingBottom: 3 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 58, gap: 2 },
  tabIconSurface: { width: 37, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 13 },
  tabIconActive: { backgroundColor: "#ddf8e9" },
  tabIconPrimary: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#087a45" },
  tabIcon: { width: 21, height: 21 },
  tabText: { fontSize: 11, fontWeight: "700", color: "#65716d" },
  tabTextActive: { color: "#087a45", fontWeight: "900" },
});
