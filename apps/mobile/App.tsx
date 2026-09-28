import { calculateEnergyCosts } from "@eavesence/core";
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
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { devices as libraryDevices, getDeviceCalculationDefaults } from "../../src/data/devices";

import CostsScreen from "./src/CostsScreen";
import { createMobileBackup, readMobileBackup, type MobileBackup } from "./src/backup";
import { pickBackup, shareBackup } from "./src/backupFiles";
import { FormInput } from "./src/FormInput";
import {
  BETA_KEY,
  COSTS_KEY,
  DEVICES_KEY,
  HISTORY_KEY,
  PROFILE_KEY,
  TILES_KEY,
  clearAll,
  readJson,
  writeAll,
  writeJson,
  type MobileDevice,
  type MobileHistoryEntry,
  type MobileProfile,
} from "./src/storage";
import { createCostTile, defaultTiles, moveTile, readTiles, type MobileTile } from "./src/tiles";
import {
  configureSubscriptions,
  getAvailablePackages,
  purchasePro,
  restorePro,
} from "./src/subscriptions";

type Tab = "home" | "costs" | "add" | "history" | "pro";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const euro = new Intl.NumberFormat("de-AT", {
  style: "currency",
  currency: "EUR",
});

// Metro resolves bundled images through a static require call.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const brandIcon = require("./assets/brand-icon-safe.png");

function parseLocalNumber(value: string) {
  return Number(value.trim().replace(",", "."));
}

function shiftMonth(month: string, change: number) {
  const [year, number] = month.split("-").map(Number);
  const next = new Date(year, number - 1 + change, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [year, number] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("de-AT", { month: "long", year: "numeric" }).format(new Date(year, number - 1, 1));
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
};

const suggestedDevices = ["wlan-router", "wasserkocher", "kaffeemaschine", "fernseher", "staubsauger", "mikrowelle"]
  .flatMap((slug) => libraryDevices.filter((device) => device.slug === slug && device.calculationType === "power"));

export default function App() {
  const scrollRef = useRef<ScrollView>(null);
  const energySectionY = useRef(0);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<MobileProfile | null>(null);
  const [devices, setDevices] = useState<MobileDevice[]>([]);
  const [history, setHistory] = useState<MobileHistoryEntry[]>([]);
  const [costs, setCosts] = useState<HouseholdCost[]>([]);
  const [tiles, setTiles] = useState<MobileTile[]>(defaultTiles);
  const [selectedCostTileId, setSelectedCostTileId] = useState("default-costs");
  const [tileFormOpen, setTileFormOpen] = useState(false);
  const [tileName, setTileName] = useState("");
  const [editingTileId, setEditingTileId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [homeName, setHomeName] = useState("Mein Zuhause");
  const [electricityPrice, setElectricityPrice] = useState("0.30");
  const [goal, setGoal] = useState("10");
  const [form, setForm] = useState(initialForm);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [month, setMonth] = useState(localMonth);
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [monthMode, setMonthMode] = useState<"consumption" | "cost">("consumption");
  const [monthKwh, setMonthKwh] = useState("");
  const [monthCost, setMonthCost] = useState("");
  const [betaInterested, setBetaInterested] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    void Promise.all([
      readJson<MobileProfile | null>(PROFILE_KEY, null),
      readJson<MobileDevice[]>(DEVICES_KEY, []),
      readJson<MobileHistoryEntry[]>(HISTORY_KEY, []),
      readJson<unknown>(COSTS_KEY, []),
      readJson<boolean>(BETA_KEY, false),
      readJson<unknown>(TILES_KEY, null),
    ]).then(([storedProfile, storedDevices, storedHistory, storedCosts, storedBeta, storedTiles]) => {
      setProfile(storedProfile);
      if (storedProfile) {
        setHomeName(storedProfile.name);
        setElectricityPrice(String(storedProfile.electricityPrice));
        setGoal(String(storedProfile.savingsGoalPercent));
      }
      setDevices(storedDevices);
      setHistory(storedHistory);
      setCosts(readHouseholdCosts(JSON.stringify(storedCosts)));
      setTiles(readTiles(storedTiles));
      setBetaInterested(storedBeta);
      setReady(true);
    });

    if (configureSubscriptions()) {
      void getAvailablePackages().then(setPackages).catch(() => setPackages([]));
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [tab]);

  const totals = useMemo(
    () => ({
      yearlyCost: devices.reduce((sum, device) => sum + device.yearlyCost, 0),
      yearlyKwh: devices.reduce((sum, device) => sum + device.yearlyKwh, 0),
    }),
    [devices],
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
  const topDevice = [...devices].sort((a, b) => b.yearlyCost - a.yearlyCost)[0] ?? null;
  const forecast = forecastHouseholdCosts(costs);
  const costSummary = forecast.summary;
  const upcoming = forecast.next;
  const monthlyIncome = (profile?.incomeAmount ?? 0) / (profile?.incomeFrequency === "yearly" ? 12 : 1);
  const forecastComplete = forecast.complete;
  const forecastDifference = forecast.difference;
  const forecastDriver = forecast.drivers[0];
  const nextMonthLabel = new Intl.DateTimeFormat("de-AT", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${upcoming.month}-01T00:00:00Z`));

  async function createHome() {
    const price = parseLocalNumber(electricityPrice);
    const target = parseLocalNumber(goal);
    if (!homeName.trim() || !Number.isFinite(price) || price <= 0 || !Number.isFinite(target) || target < 1 || target > 50) {
      Alert.alert("Angaben prüfen", "Gib einen Namen, einen Strompreis über 0 und ein Sparziel zwischen 1 und 50 % ein.");
      return;
    }
    const nextProfile: MobileProfile = {
      name: homeName.trim(),
      electricityPrice: price,
      savingsGoalPercent: target,
      createdAt: new Date().toISOString(),
    };
    await writeJson(PROFILE_KEY, nextProfile);
    Keyboard.dismiss();
    setProfile(nextProfile);
  }

  async function saveSettings() {
    if (!profile) return;
    const price = parseLocalNumber(electricityPrice);
    const target = parseLocalNumber(goal);
    if (!homeName.trim() || !Number.isFinite(price) || price <= 0 || !Number.isFinite(target) || target < 1 || target > 50) {
      Alert.alert("Angaben prüfen", "Gib einen Namen, einen Strompreis über 0 und ein Sparziel zwischen 1 und 50 % ein.");
      return;
    }
    const nextProfile = { ...profile, name: homeName.trim(), electricityPrice: price, savingsGoalPercent: target };
    await writeJson(PROFILE_KEY, nextProfile);
    setProfile(nextProfile);
    Keyboard.dismiss();
    setSettingsOpen(false);
  }

  async function exportData() {
    if (!profile) return;
    try {
      await shareBackup(createMobileBackup({ profile, devices, history, costs, tiles, betaInterested }));
    } catch {
      Alert.alert("Sicherung fehlgeschlagen", "Die Datei konnte nicht geteilt werden. Bitte versuche es erneut.");
    }
  }

  async function applyBackup(backup: MobileBackup) {
    try {
      await writeAll([
        [PROFILE_KEY, backup.profile], [DEVICES_KEY, backup.devices], [HISTORY_KEY, backup.history],
        [COSTS_KEY, backup.costs], [TILES_KEY, backup.tiles], [BETA_KEY, backup.betaInterested],
      ]);
      setProfile(backup.profile);
      setHomeName(backup.profile.name);
      setElectricityPrice(String(backup.profile.electricityPrice));
      setGoal(String(backup.profile.savingsGoalPercent));
      setDevices(backup.devices);
      setHistory(backup.history);
      setCosts(backup.costs);
      setTiles(backup.tiles);
      setBetaInterested(backup.betaInterested);
      setSelectedCostTileId("default-costs");
      setSettingsOpen(false);
      setTab("home");
      Alert.alert("Sicherung importiert", "Deine App-Daten wurden ersetzt.");
    } catch {
      Alert.alert("Import fehlgeschlagen", "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut.");
    }
  }

  async function importData() {
    try {
      const json = await pickBackup();
      if (json === null) return;
      const backup = readMobileBackup(json);
      if (!backup) {
        Alert.alert("Ungültige Sicherung", "Wähle eine vollständige EAVESENCE-App-Sicherung als JSON-Datei.");
        return;
      }
      Alert.alert("App-Daten ersetzen?", `Die Sicherung vom ${new Date(backup.exportedAt).toLocaleDateString("de-AT")} ersetzt dein aktuelles Zuhause samt Kosten, Geräten und Verlauf.`, [
        { text: "Abbrechen", style: "cancel" },
        { text: "Importieren", onPress: () => { void applyBackup(backup); } },
      ]);
    } catch {
      Alert.alert("Import fehlgeschlagen", "Die Datei konnte nicht gelesen werden.");
    }
  }

  function confirmReset() {
    Alert.alert("My Home zurücksetzen?", "Dein Zuhause, Geräte, Kosten und Verlauf werden auf diesem Gerät gelöscht. Exportiere vorher eine Sicherung, wenn du sie behalten möchtest.", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Zurücksetzen", style: "destructive", onPress: () => { void (async () => {
        try {
          await clearAll();
          setProfile(null);
          setDevices([]); setHistory([]); setCosts([]); setTiles(defaultTiles());
          setBetaInterested(false); setHomeName("Mein Zuhause"); setElectricityPrice("0.30"); setGoal("10");
          setSettingsOpen(false); setSelectedCostTileId("default-costs"); setTab("home");
        } catch { Alert.alert("Zurücksetzen fehlgeschlagen", "Bitte versuche es erneut."); }
      })(); } },
    ]);
  }

  async function saveTile() {
    const title = tileName.trim();
    if (!title) { Alert.alert("Name fehlt", "Gib der Kachel einen Namen."); return; }
    if (title.length > 40) { Alert.alert("Name zu lang", "Verwende höchstens 40 Zeichen."); return; }
    if (tiles.some((tile) => tile.id !== editingTileId && tile.title.toLowerCase() === title.toLowerCase())) {
      Alert.alert("Name bereits vorhanden", "Wähle einen anderen Kachelnamen."); return;
    }
    const next = editingTileId
      ? tiles.map((tile) => tile.id === editingTileId ? { ...tile, title } : tile)
      : [...tiles, createCostTile(title)];
    if (next.length > 30) { Alert.alert("Zu viele Kacheln", "Maximal 30 Kacheln sind möglich."); return; }
    try {
      await writeJson(TILES_KEY, next);
      setTiles(next); setTileFormOpen(false); setEditingTileId(null); setTileName(""); Keyboard.dismiss();
    } catch { Alert.alert("Speichern fehlgeschlagen", "Die Kachel konnte nicht gespeichert werden."); }
  }

  async function shiftTile(id: string, direction: -1 | 1) {
    const next = moveTile(tiles, id, direction);
    if (next === tiles) return;
    try {
      await writeJson(TILES_KEY, next);
      setTiles(next);
    } catch { Alert.alert("Speichern fehlgeschlagen", "Die Reihenfolge konnte nicht gespeichert werden."); }
  }

  function confirmRemoveTile(tile: MobileTile) {
    const count = costs.filter((cost) => cost.tileId === tile.id).length;
    Alert.alert("Kachel entfernen?", count ? `${count} ${count === 1 ? "Kostenposten wird" : "Kostenposten werden"} zu Haushaltskosten verschoben.` : tile.title, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Entfernen", style: "destructive", onPress: () => { void (async () => {
        try {
          const nextTiles = tiles.filter((item) => item.id !== tile.id);
          const nextCosts = costs.map((cost) => cost.tileId === tile.id ? { ...cost, tileId: "default-costs" } : cost);
          await writeAll([[TILES_KEY, nextTiles], [COSTS_KEY, nextCosts]]);
          setTiles(nextTiles); setCosts(nextCosts); setSelectedCostTileId("default-costs");
        } catch { Alert.alert("Entfernen fehlgeschlagen", "Die Kachel konnte nicht entfernt werden."); }
      })(); } },
    ]);
  }

  function openTile(tile: MobileTile) {
    if (tile.kind === "energy") {
      setTab("home");
      scrollRef.current?.scrollTo({ y: energySectionY.current, animated: true });
    } else {
      setSelectedCostTileId(tile.id);
      setTab("costs");
    }
  }

  function openMainCosts() {
    setSelectedCostTileId("default-costs");
    setTab("costs");
  }

  function toggleSettings() {
    if (settingsOpen && profile) {
      setHomeName(profile.name);
      setElectricityPrice(String(profile.electricityPrice));
      setGoal(String(profile.savingsGoalPercent));
      Keyboard.dismiss();
    }
    setSettingsOpen(!settingsOpen);
  }

  function editDevice(device: MobileDevice) {
    setEditingDeviceId(device.id);
    setForm({ name: device.name, watts: String(device.watts), minutes: String(device.minutesPerUse), uses: String(device.usesPerWeek) });
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
      Alert.alert("Gerätename fehlt", "Gib dem Gerät einen Namen, bevor du es speicherst.");
      return;
    }
    const result = calculateEnergyCosts({
      mode: "estimate",
      calculationType: "power",
      electricityPrice: profile.electricityPrice,
      watts: parseLocalNumber(form.watts),
      minutesPerUse: parseLocalNumber(form.minutes),
      usesPerWeek: parseLocalNumber(form.uses),
      estimatedKwhPerUse: 0,
      measuredKwhPerUse: 0,
    });
    if (!result.isValid) {
      Alert.alert("Angaben prüfen", "Leistung, Dauer und Nutzung müssen größer als null sein.");
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
    setTab("home");
  }

  async function removeDevice(id: string) {
    const nextDevices = devices.filter((device) => device.id !== id);
    await writeJson(DEVICES_KEY, nextDevices);
    setDevices(nextDevices);
  }

  function confirmRemoveDevice(device: MobileDevice) {
    Alert.alert("Gerät entfernen?", device.name, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Entfernen", style: "destructive", onPress: () => { void removeDevice(device.id); } },
    ]);
  }

  async function saveCost(cost: HouseholdCost) {
    const next = upsertHouseholdCost(costs, cost);
    await writeJson(COSTS_KEY, next);
    setCosts(next);
  }

  async function deleteCost(id: string) {
    const next = removeHouseholdCost(costs, id);
    await writeJson(COSTS_KEY, next);
    setCosts(next);
  }

  async function saveIncome(amount: number, frequency: "monthly" | "yearly") {
    if (!profile) return;
    const next = { ...profile, incomeAmount: amount, incomeFrequency: frequency };
    await writeJson(PROFILE_KEY, next);
    setProfile(next);
  }

  async function saveMonth() {
    if (!month) return;
    if (!profile || profile.electricityPrice <= 0) {
      Alert.alert("Strompreis fehlt", "Hinterlege zuerst einen gültigen Strompreis.");
      return;
    }
    const enteredKwh = monthMode === "consumption" ? parseLocalNumber(monthKwh) : 0;
    const enteredCost = monthMode === "cost" ? parseLocalNumber(monthCost) : 0;
    const hasKwh = monthMode === "consumption" && Number.isFinite(enteredKwh) && enteredKwh > 0;
    const hasCost = monthMode === "cost" && Number.isFinite(enteredCost) && enteredCost > 0;
    if (!hasKwh && !hasCost) {
      Alert.alert("Wert fehlt", "Gib den Verbrauch oder den Rechnungsbetrag ein.");
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
    Alert.alert("Monatswert gespeichert", "Verbrauch und Kosten wurden aktualisiert.");
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
    Alert.alert("Monatswert entfernen?", monthLabel(entry.month), [
      { text: "Abbrechen", style: "cancel" },
      { text: "Entfernen", style: "destructive", onPress: () => {
        void (async () => {
          const next = history.filter((item) => item.month !== entry.month);
          await writeJson(HISTORY_KEY, next);
          setHistory(next);
          if (editingMonth === entry.month) { setEditingMonth(null); setMonthKwh(""); setMonthCost(""); }
        })();
      } },
    ]);
  }

  async function scheduleReminder() {
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return;
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1, 1);
    nextDate.setHours(9, 0, 0, 0);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "EAVESENCE Monats-Check",
        body: "Aktualisiere Verbrauch und Kosten deines Zuhauses.",
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nextDate },
    });
    Alert.alert("Erinnerung aktiv", "Wir erinnern dich am ersten Tag des nächsten Monats.");
  }

  async function expressBetaInterest() {
    await writeJson(BETA_KEY, true);
    setBetaInterested(true);
  }

  async function buy(selectedPackage: PurchasesPackage) {
    try {
      setIsPro(await purchasePro(selectedPackage));
    } catch (error) {
      if (typeof error === "object" && error && "userCancelled" in error) return;
      Alert.alert("Kauf nicht möglich", "Bitte versuche es später erneut.");
    }
  }

  if (!ready) {
    return <SafeAreaView style={styles.loading}><StatusBar style="dark" /><Image source={brandIcon} alt="EAVESENCE Logo" style={styles.loadingMark} /><Text style={styles.loadingBrand}>EAVESENCE</Text></SafeAreaView>;
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.onboarding} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <Image source={brandIcon} alt="EAVESENCE" style={styles.onboardingMark} />
            <Text style={styles.eyebrow}>EAVESENCE HOME</Text>
            <Text style={styles.hero}>Richte dein Zuhause ein.</Text>
            <Text style={styles.body}>Geräte, Energiekosten und Sparziele an einem Ort – lokal gespeichert und ohne Pflichtkonto.</Text>
            <Field label="Name" value={homeName} onChangeText={setHomeName} />
            <Field label="Strompreis pro kWh" value={electricityPrice} onChangeText={setElectricityPrice} keyboardType="decimal-pad" />
            <Field label="Sparziel in Prozent" value={goal} onChangeText={setGoal} keyboardType="number-pad" />
            <PrimaryButton label="Zuhause erstellen" onPress={() => void createHome()} />
            <Text style={styles.privateText}>Ohne Konto · lokal gespeichert · jederzeit löschbar</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.appHeader}>
        <Image source={brandIcon} alt="EAVESENCE" style={styles.headerMark} />
        <View style={styles.headerCopy}><Text style={styles.headerBrand}>EAVESENCE</Text><Text style={styles.headerSubline}>HOME</Text></View>
        <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>Mein Zuhause</Text></View>
      </View>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {tab === "home" && <>
          <Text style={styles.eyebrow}>EAVESENCE HOME</Text>
          <View style={styles.homeHeadingRow}><Text style={[styles.homeTitle, styles.homeHeadingText]}>{profile.name}</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded: settingsOpen }} onPress={toggleSettings} style={styles.financePill}><Text style={styles.financePillText}>{settingsOpen ? "Schließen" : "Einstellungen"}</Text></Pressable></View>
          <Text style={styles.homeSubtitle}>Deine laufenden Kosten, Zahlungen und Geräte an einem Ort.</Text>
          {settingsOpen && <View style={styles.formSurface}>
            <Text style={styles.financeHeading}>Dein Zuhause</Text>
            <Field label="Name" value={homeName} onChangeText={setHomeName} />
            <Field label="Strompreis pro kWh (€)" value={electricityPrice} onChangeText={setElectricityPrice} keyboardType="decimal-pad" />
            <Field label="Sparziel (%)" value={goal} onChangeText={setGoal} keyboardType="number-pad" />
            <PrimaryButton label="Einstellungen speichern" onPress={() => void saveSettings()} />
            <View style={styles.dataSection}>
              <Text style={styles.dataTitle}>Deine Daten</Text>
              <Text style={styles.financeNote}>Die App-Sicherung enthält Einstellungen, Kacheln, Kosten, Geräte und Monatswerte. Speichere sie in „Dateien“ oder teile sie über das iOS-Menü.</Text>
              <View style={styles.dataActions}>
                <Pressable onPress={() => void exportData()} style={styles.financePill}><Text style={styles.financePillText}>Sicherung exportieren</Text></Pressable>
                <Pressable onPress={() => void importData()} style={styles.financePill}><Text style={styles.financePillText}>Sicherung importieren</Text></Pressable>
                <Pressable onPress={confirmReset} style={styles.dangerPill}><Text style={styles.dangerText}>My Home zurücksetzen</Text></Pressable>
              </View>
            </View>
          </View>}
          <View style={styles.financeSection}>
            <Text style={styles.financeHeading}>Finanzen im Überblick</Text>
            <View style={styles.financeCard}>
              <Text style={styles.financeLabel}>ZAHLUNGEN IM NÄCHSTEN MONAT · {nextMonthLabel.toUpperCase()}</Text>
              <Text style={styles.financeValue}>{euro.format(upcoming.total)}</Text>
              <Text style={styles.financeNote}>{costs.length === 0 ? "Noch keine Kosten erfasst." : !forecastComplete ? `${upcoming.undatedCount} ${upcoming.undatedCount === 1 ? "Kostenposten ohne Zahlungstermin ist" : "Kostenposten ohne Zahlungstermin sind"} in der Vorschau nicht enthalten.` : "Alle erfassten Kosten haben einen Zahlungstermin."}</Text>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: upcomingOpen }} onPress={() => setUpcomingOpen(!upcomingOpen)} style={styles.financePill}><Text style={styles.financePillText}>{upcomingOpen ? "Zahlungen schließen" : "Fällige Zahlungen"}</Text></Pressable>
              {upcomingOpen && <View style={styles.financeExpanded}>
                {upcoming.payments.length === 0 ? <Text style={styles.financeNote}>Keine datierten Zahlungen vorhanden.</Text> : upcoming.payments.map(({ cost, date }) => <View key={`${cost.id}-${date}`} style={styles.paymentRow}><Text style={styles.paymentName}>{date.slice(8)}.{date.slice(5, 7)}. · {cost.name}</Text><Text style={styles.paymentAmount}>{euro.format(cost.amount)}</Text></View>)}
                <Pressable onPress={openMainCosts} style={styles.financePill}><Text style={styles.financePillText}>Kosten bearbeiten</Text></Pressable>
              </View>}
            </View>
            <View style={styles.financeCard}>
              <Text style={styles.financeLabel}>NETTOEINKOMMEN / MONAT</Text>
              {monthlyIncome > 0 && <Text style={styles.financeValue}>{euro.format(monthlyIncome)}</Text>}
              <Pressable onPress={openMainCosts} style={styles.financePill}><Text style={styles.financePillText}>{monthlyIncome > 0 ? "Einkommen ändern" : "Einkommen hinzufügen"}</Text></Pressable>
            </View>
            <View style={[styles.financeCard, styles.financeCardAccent]}>
              <Text style={styles.financeLabel}>LAUFENDE KOSTEN / MONAT</Text>
              <Text style={styles.financeValue}>{euro.format(costSummary.monthlyTotal)}</Text>
              {monthlyIncome > 0 && <Text style={styles.financeNote}>Budget nach laufenden Kosten: {euro.format(monthlyIncome - costSummary.monthlyTotal)}</Text>}
            </View>
          </View>
          <View style={styles.tilesSection}>
            <Text style={styles.financeHeading}>Deine Kacheln</Text>
            <Text style={styles.financeNote}>Öffne einen Bereich oder ändere seine Reihenfolge mit den Pfeilen.</Text>
            <View style={styles.tilesGrid}>{tiles.map((tile, index) => {
              const tileCosts = costs.filter((cost) => tile.kind === "costs" && (tile.id === "default-costs" ? !cost.tileId || cost.tileId === tile.id : cost.tileId === tile.id));
              return <View key={tile.id} style={styles.tileCard}>
                <Pressable accessibilityRole="button" onPress={() => openTile(tile)} style={styles.tileMain}>
                  <Text style={styles.tileName}>{tile.title}</Text>
                  <Text style={styles.tileDetail}>{tile.kind === "energy" ? `${devices.length} Geräte` : `${tileCosts.length} Kosten · ${euro.format(tileCosts.reduce((sum, cost) => sum + monthlyCost(cost.amount, cost.frequency), 0))}/Monat`}</Text>
                </Pressable>
                <View style={styles.tileControls}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${tile.title} nach vorne verschieben`} disabled={index === 0} onPress={() => void shiftTile(tile.id, -1)} style={styles.tileMove}><Text style={[styles.tileMoveText, index === 0 && styles.tileMoveDisabled]}>‹</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${tile.title} nach hinten verschieben`} disabled={index === tiles.length - 1} onPress={() => void shiftTile(tile.id, 1)} style={styles.tileMove}><Text style={[styles.tileMoveText, index === tiles.length - 1 && styles.tileMoveDisabled]}>›</Text></Pressable>
                  {!tile.id.startsWith("default-") && <><Pressable onPress={() => { setTileName(tile.title); setEditingTileId(tile.id); setTileFormOpen(true); }} style={styles.tileEdit}><Text style={styles.financePillText}>Ändern</Text></Pressable><Pressable accessibilityLabel={`${tile.title} entfernen`} onPress={() => confirmRemoveTile(tile)} style={styles.tileEdit}><Text style={styles.dangerText}>×</Text></Pressable></>}
                </View>
              </View>;
            })}</View>
            {tileFormOpen ? <View style={styles.tileForm}><Field label="Kachelname" value={tileName} onChangeText={setTileName} placeholder="z. B. Versicherungen" /><PrimaryButton label={editingTileId ? "Kachel umbenennen" : "Kachel erstellen"} onPress={() => void saveTile()} /><Pressable onPress={() => { setTileFormOpen(false); setEditingTileId(null); setTileName(""); }} style={styles.financePill}><Text style={styles.financePillText}>Abbrechen</Text></Pressable></View>
              : <Pressable onPress={() => { setTileName(""); setEditingTileId(null); setTileFormOpen(true); }} style={styles.addTile}><Text style={styles.addTileText}>+ Eigene Kachel</Text></Pressable>}
          </View>
          {costs.length > 0 && forecastComplete && Math.abs(forecastDifference) > 0.01 && <View style={styles.insightCard}><Text style={styles.insightLabel}>BLICK AUF DEN NÄCHSTEN MONAT</Text><Text style={styles.muted}>{euro.format(Math.abs(forecastDifference))} {forecastDifference > 0 ? "mehr" : "weniger"} als dein monatlicher Kostendurchschnitt{forecastDifference > 0.01 && forecastDriver ? ` · ${forecastDriver.cost.name} ist ein wichtiger Posten.` : "."}</Text></View>}
          <View style={[styles.pulseCard, currentMonthEntry ? styles.pulseCardComplete : styles.pulseCardOpen]}>
            <Text style={[styles.pulseLabel, currentMonthEntry ? styles.pulseLabelComplete : styles.pulseLabelOpen]}>{currentMonthEntry ? "MONATSÜBERBLICK" : "NÄCHSTER SCHRITT"}</Text>
            <Text style={styles.pulseTitle}>{currentMonthEntry ? monthlyChange === null ? "Deine erste Monatsbasis steht" : Math.abs(monthlyChange) < 1 ? "Verbrauch nahezu unverändert" : monthlyChange < 0 ? `${Math.abs(monthlyChange).toFixed(0)} % weniger als im Vormonat` : `${monthlyChange.toFixed(0)} % mehr als im Vormonat` : "Aktueller Monatswert noch offen"}</Text>
            <Text style={styles.pulseBody}>{currentMonthEntry ? `${Math.round(currentMonthEntry.kwh * 10) / 10} kWh · ${euro.format(currentMonthEntry.cost)}` : "Erfasse einmal im Monat Verbrauch oder Rechnungsbetrag. Den zweiten Wert berechnen wir automatisch."}</Text>
            {!currentMonthEntry && <Pressable style={styles.pulseAction} onPress={() => setTab("history")}><Text style={styles.pulseActionText}>Monatswert eintragen</Text></Pressable>}
          </View>
          <Text onLayout={(event) => { energySectionY.current = event.nativeEvent.layout.y; }} style={styles.sectionTitle}>Strom & Geräte</Text>
          <View style={styles.metricGrid}><Metric label="Gerätekosten/Jahr" value={euro.format(totals.yearlyCost)} /><Metric label="Verbrauch" value={`${Math.round(totals.yearlyKwh)} kWh`} /><Metric label="Ziel pro Monat" value={euro.format((totals.yearlyCost / 12) * (1 - profile.savingsGoalPercent / 100))} /><Metric label="Geräte" value={`${devices.length}`} /></View>
          {topDevice && <View style={styles.insightCard}><Text style={styles.insightLabel}>GRÖSSTER HEBEL</Text><Text style={styles.insightTitle}>{topDevice.name}</Text><Text style={styles.muted}>{euro.format(topDevice.yearlyCost)} pro Jahr · {totals.yearlyCost > 0 ? Math.round(topDevice.yearlyCost / totals.yearlyCost * 100) : 0} % der erfassten Gerätekosten</Text></View>}
          <Text style={styles.sectionTitle}>Alle Verbraucher im Haushalt</Text>
          {devices.length === 0 ? <Empty text="Noch keine Geräte. Füge dein erstes Gerät hinzu." /> : devices.map((device) => <View key={device.id} style={styles.deviceRow}><View style={styles.flex}><Text style={styles.deviceName}>{device.name}</Text><Text style={styles.muted}>{euro.format(device.yearlyCost)} pro Jahr</Text></View><View style={styles.rowActions}><Pressable accessibilityRole="button" accessibilityLabel={`${device.name} bearbeiten`} onPress={() => editDevice(device)} style={styles.financePill}><Text style={styles.financePillText}>Ändern</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`${device.name} entfernen`} onPress={() => confirmRemoveDevice(device)}><Text style={styles.delete}>×</Text></Pressable></View></View>)}
          <PrimaryButton label="Gerät hinzufügen" onPress={startNewDevice} />
        </>}

        {tab === "costs" && <CostsScreen key={selectedCostTileId} profile={profile} costs={costs} tileId={selectedCostTileId} tileTitle={tiles.find((tile) => tile.id === selectedCostTileId)?.title ?? "Haushaltskosten"} onSaveCost={saveCost} onDeleteCost={deleteCost} onSaveIncome={saveIncome} />}

        {tab === "add" && <>
          <Text style={styles.eyebrow}>{editingDeviceId ? "GERÄT BEARBEITEN" : "NEUES GERÄT"}</Text><Text style={styles.heroSmall}>{editingDeviceId ? "Gerät aktualisieren" : "Was kostet dein Gerät?"}</Text>
          <View style={styles.formSurface}>
            {!editingDeviceId && <><Text style={styles.dataTitle}>Schnell starten</Text><Text style={styles.financeNote}>Richtwerte der Website. Passe Leistung und Nutzung an dein Gerät an.</Text><View style={styles.presetRow}>{suggestedDevices.map((device) => <Pressable key={device.slug} onPress={() => { const defaults = getDeviceCalculationDefaults(device); setForm({ name: device.name, watts: String(defaults.watts), minutes: String(defaults.minutesPerUse), uses: String(defaults.usesPerWeek) }); Keyboard.dismiss(); }} style={styles.financePill}><Text style={styles.financePillText}>{device.name}</Text></Pressable>)}</View></>}
            <Field label="Gerätename" value={form.name} onChangeText={(value) => setForm({ ...form, name: value })} />
            <Field label="Leistung in Watt" value={form.watts} onChangeText={(value) => setForm({ ...form, watts: value })} keyboardType="number-pad" />
            <Field label="Minuten pro Nutzung" value={form.minutes} onChangeText={(value) => setForm({ ...form, minutes: value })} keyboardType="number-pad" />
            <Field label="Nutzungen pro Woche" value={form.uses} onChangeText={(value) => setForm({ ...form, uses: value })} keyboardType="decimal-pad" />
            <PrimaryButton label={editingDeviceId ? "Änderungen speichern" : "Berechnen und speichern"} onPress={() => void saveDevice()} />
            {editingDeviceId && <Pressable onPress={() => { setEditingDeviceId(null); setForm(initialForm); setTab("home"); }} style={styles.financePill}><Text style={styles.financePillText}>Abbrechen</Text></Pressable>}
          </View>
        </>}

        {tab === "history" && <>
          <Text style={styles.eyebrow}>MONATS-CHECK</Text><Text style={styles.heroSmall}>Aus Schätzungen wird ein Verlauf.</Text>
          <Text style={styles.historyHint}>Gib Verbrauch oder Rechnungsbetrag ein. Den zweiten Wert berechnen wir automatisch mit deinem Strompreis.</Text>
          <View style={styles.formSurface}>
          <View style={styles.modeSwitch}><Pressable style={[styles.modeButton, monthMode === "consumption" && styles.modeButtonActive]} onPress={() => setMonthMode("consumption")}><Text style={[styles.modeButtonText, monthMode === "consumption" && styles.modeButtonTextActive]}>Verbrauch</Text></Pressable><Pressable style={[styles.modeButton, monthMode === "cost" && styles.modeButtonActive]} onPress={() => setMonthMode("cost")}><Text style={[styles.modeButtonText, monthMode === "cost" && styles.modeButtonTextActive]}>Rechnung</Text></Pressable></View>
          <Text style={styles.label}>Monat</Text>
          <View style={styles.monthPicker}>
            <Pressable accessibilityRole="button" accessibilityLabel="Vorheriger Monat" onPress={() => { setMonth(shiftMonth(month, -1)); Keyboard.dismiss(); }} style={styles.monthButton}><Text style={styles.monthArrow}>‹</Text></Pressable>
            <Text style={styles.monthValue}>{monthLabel(month)}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Nächster Monat" onPress={() => { setMonth(shiftMonth(month, 1)); Keyboard.dismiss(); }} style={styles.monthButton}><Text style={styles.monthArrow}>›</Text></Pressable>
          </View>
          {month !== currentMonth && <Pressable onPress={() => setMonth(currentMonth)} style={styles.monthToday}><Text style={styles.monthTodayText}>Aktueller Monat</Text></Pressable>}
          {monthMode === "consumption" ? <Field label="Verbrauch in kWh" value={monthKwh} onChangeText={setMonthKwh} keyboardType="decimal-pad" /> : <Field label="Rechnungsbetrag in Euro" value={monthCost} onChangeText={setMonthCost} keyboardType="decimal-pad" />}
          <PrimaryButton label={editingMonth ? "Monat aktualisieren" : "Monat speichern"} onPress={() => void saveMonth()} />
          <Pressable style={styles.secondaryButton} onPress={() => void scheduleReminder()}><Text style={styles.secondaryButtonText}>Monatliche Erinnerung aktivieren</Text></Pressable>
          </View>
          <Text style={styles.sectionTitle}>Verlauf</Text>
          {history.length === 0 ? <Empty text="Noch kein Monatswert vorhanden." /> : history.map((entry) => <View key={entry.month} style={styles.historyRow}><View style={styles.historyValues}><Text style={styles.deviceName}>{monthLabel(entry.month)}</Text><Text style={styles.muted}>{Math.round(entry.kwh * 10) / 10} kWh · {euro.format(entry.cost)}</Text></View><View style={styles.rowActions}><Pressable accessibilityRole="button" accessibilityLabel={`${monthLabel(entry.month)} bearbeiten`} onPress={() => editMonth(entry)} style={styles.financePill}><Text style={styles.financePillText}>Ändern</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`${monthLabel(entry.month)} entfernen`} onPress={() => confirmRemoveMonth(entry)}><Text style={styles.delete}>×</Text></Pressable></View></View>)}
        </>}

        {tab === "pro" && <View style={styles.proCard}><Text style={styles.eyebrowMint}>EAVESENCE PRO</Text><Text style={styles.proTitle}>Weniger eintragen. Früher reagieren.</Text><Text style={styles.proBody}>Automatische Verbrauchswarnungen, längerer Verlauf, Synchronisation, mehrere Haushalte sowie später Energieetikett- und Rechnungsscan.</Text>{isPro ? <Text style={styles.proActive}>Pro ist aktiv</Text> : packages.length > 0 ? packages.map((item) => <Pressable key={item.identifier} style={styles.proButton} onPress={() => void buy(item)}><Text style={styles.proButtonText}>{item.product.title} · {item.product.priceString}</Text></Pressable>) : <Pressable style={[styles.proButton, betaInterested && styles.proButtonDisabled]} disabled={betaInterested} onPress={() => void expressBetaInterest()}><Text style={styles.proButtonText}>{betaInterested ? "Beta-Interesse gespeichert" : "Beta-Platz vormerken"}</Text></Pressable>}<Pressable onPress={() => void restorePro().then(setIsPro)}><Text style={styles.restore}>Käufe wiederherstellen</Text></Pressable><Text style={styles.proHint}>Noch keine Abbuchung ohne freigeschaltete Store-Produkte.</Text></View>}
      </ScrollView>
      <View style={styles.tabBar}>{([['home', 'Zuhause'], ['costs', 'Kosten'], ['add', 'Gerät'], ['history', 'Verlauf'], ['pro', 'Pro']] as const).map(([key, label]) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => { Keyboard.dismiss(); if (key === "add" && tab !== "add") startNewDevice(); else { if (key === "costs") setSelectedCostTileId("default-costs"); setTab(key); } }} style={[styles.tab, tab === key && styles.tabActive]}><Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text></Pressable>)}</View>
    </SafeAreaView>
  );
}

const Field = FormInput;

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable style={styles.primaryButton} onPress={onPress}><Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function Empty({ text }: { text: string }) {
  return <View style={styles.empty}><Text style={styles.muted}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  dataSection: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderColor: "#dfe5dd", gap: 7 },
  dataTitle: { fontSize: 15, fontWeight: "900", color: "#17211f" },
  dataActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  dangerPill: { alignSelf: "flex-start", minHeight: 30, borderRadius: 16, backgroundColor: "#fef2f2", paddingHorizontal: 12, justifyContent: "center" },
  dangerText: { fontSize: 12, fontWeight: "800", color: "#b42318" },
  tilesSection: { marginTop: 18, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 23, backgroundColor: "#f4f6f2", padding: 15, gap: 10 },
  tilesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  tileCard: { width: "48%", minHeight: 132, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 14, backgroundColor: "#fbfcf8", padding: 12, justifyContent: "space-between" },
  tileMain: { minHeight: 60 },
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
  rowActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 9, padding: 14, borderWidth: 1, borderRadius: 14, borderColor: "#dfe5dd", backgroundColor: "#fbfcf8" },
  historyValues: { flex: 1 },
  onboardingMark: { width: 54, height: 54, borderRadius: 11, marginBottom: 2 },
  formSurface: { borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 22, backgroundColor: "#f6f6f0", padding: 18, gap: 13 },
  headerMark: { width: 34, height: 34, borderRadius: 7 },
  headerCopy: { flex: 1, marginLeft: 9 },
  headerBrand: { fontSize: 15, fontWeight: "900", letterSpacing: -0.4, color: "#10283a" },
  headerSubline: { marginTop: 1, fontSize: 9, fontWeight: "800", letterSpacing: 1.7, color: "#087a45" },
  headerBadge: { borderRadius: 16, backgroundColor: "#ddf8e9", paddingHorizontal: 10, paddingVertical: 6 },
  headerBadgeText: { fontSize: 11, fontWeight: "700", color: "#087a45" },
  homeTitle: { marginTop: 9, fontSize: 32, lineHeight: 36, fontWeight: "900", letterSpacing: -1.3, color: "#17211f" },
  homeSubtitle: { marginTop: 8, marginBottom: 20, fontSize: 14, lineHeight: 21, color: "#65716d" },
  financeSection: { borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 23, backgroundColor: "#f4f6f2", padding: 15, gap: 11 },
  financeHeading: { marginBottom: 3, fontSize: 20, fontWeight: "900", letterSpacing: -0.5, color: "#17211f" },
  financeCard: { borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 14, backgroundColor: "#fbfcf8", padding: 16, alignItems: "flex-start" },
  financeCardAccent: { borderColor: "#b8efcc", backgroundColor: "#eefbf3" },
  financeLabel: { fontSize: 11, lineHeight: 16, fontWeight: "700", letterSpacing: 0.6, color: "#65716d" },
  financeValue: { marginTop: 8, fontSize: 25, fontWeight: "900", letterSpacing: -0.7, color: "#17211f" },
  financeNote: { marginTop: 5, fontSize: 12, lineHeight: 18, color: "#65716d" },
  financePill: { alignSelf: "flex-start", marginTop: 12, minHeight: 30, borderRadius: 16, backgroundColor: "#ddf8e9", paddingHorizontal: 12, justifyContent: "center" },
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
  safe: { flex: 1, backgroundColor: "#f6f7f2" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f6f7f2" },
  onboarding: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 18 },
  content: { paddingHorizontal: 20, paddingTop: 27, paddingBottom: 42 },
  appHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderColor: "#e2e8e4", backgroundColor: "#ffffff" },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.6, color: "#087a45" },
  eyebrowMint: { fontSize: 11, fontWeight: "900", letterSpacing: 1.6, color: "#72dca3" },
  hero: { fontSize: 38, lineHeight: 42, fontWeight: "900", letterSpacing: -1.4, color: "#17211f" },
  heroSmall: { marginTop: 8, marginBottom: 18, fontSize: 29, lineHeight: 34, fontWeight: "900", letterSpacing: -1, color: "#17211f" },
  body: { fontSize: 15, lineHeight: 23, color: "#65716d", marginBottom: 6 },
  label: { fontSize: 12, fontWeight: "800", color: "#52605b" },
  primaryButton: { minHeight: 50, marginTop: 14, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: "#087a45", paddingHorizontal: 20 },
  primaryButtonText: { fontSize: 14, fontWeight: "800", color: "#ffffff" },
  privateText: { textAlign: "center", fontSize: 12, fontWeight: "600", color: "#65716d" },
  pulseCard: { marginBottom: 16, borderWidth: 1, borderRadius: 18, padding: 15 }, pulseCardOpen: { borderColor: "#f4cf73", backgroundColor: "#fff9e9" }, pulseCardComplete: { borderColor: "#b8efcc", backgroundColor: "#eefbf3" }, pulseLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 1 }, pulseLabelOpen: { color: "#a85d00" }, pulseLabelComplete: { color: "#087a45" }, pulseTitle: { marginTop: 5, fontSize: 15, fontWeight: "900", color: "#07111f" }, pulseBody: { marginTop: 4, fontSize: 13, lineHeight: 19, color: "#52605b" }, pulseAction: { alignSelf: "flex-start", minHeight: 30, marginTop: 12, borderRadius: 15, justifyContent: "center", backgroundColor: "#dcf8e8", paddingHorizontal: 12 }, pulseActionText: { fontSize: 12, fontWeight: "900", color: "#087a45" }, metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, metric: { width: "48%", minHeight: 94, borderWidth: 1, borderColor: "#dfe5dd", borderRadius: 14, backgroundColor: "#fbfcf8", padding: 14 }, metricLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7, color: "#64748b" }, metricValue: { marginTop: 12, fontSize: 19, fontWeight: "900", color: "#07111f" }, insightCard: { marginTop: 16, borderRadius: 16, backgroundColor: "#e7f7ed", padding: 15 }, insightLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8, color: "#087a45" }, insightTitle: { marginTop: 5, fontSize: 15, fontWeight: "900", color: "#07111f" }, historyHint: { marginTop: -12, marginBottom: 18, fontSize: 13, lineHeight: 19, color: "#64748b" }, sectionTitle: { marginTop: 28, marginBottom: 10, fontSize: 20, fontWeight: "900", color: "#07111f" }, deviceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 9, padding: 14, borderWidth: 1, borderRadius: 14, borderColor: "#dfe5dd", backgroundColor: "#fbfcf8" }, deviceName: { fontSize: 15, fontWeight: "800", color: "#07111f" }, muted: { marginTop: 3, fontSize: 12, color: "#64748b" }, delete: { padding: 8, fontSize: 24, color: "#94a3b8" }, empty: { borderWidth: 1, borderStyle: "dashed", borderColor: "#cbd5e1", borderRadius: 16, padding: 20, backgroundColor: "#ffffff" }, secondaryButton: { minHeight: 48, marginTop: 10, borderWidth: 1, borderColor: "#b9d9c7", borderRadius: 24, alignItems: "center", justifyContent: "center" }, secondaryButtonText: { fontSize: 14, fontWeight: "800", color: "#087a45" }, proCard: { borderRadius: 26, backgroundColor: "#17211f", padding: 24 }, proTitle: { marginTop: 12, fontSize: 32, lineHeight: 35, fontWeight: "900", letterSpacing: -1.2, color: "#ffffff" }, proBody: { marginTop: 15, fontSize: 15, lineHeight: 23, color: "#cbd5d1" }, proButton: { minHeight: 52, marginTop: 24, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "#72dca3", paddingHorizontal: 16 }, proButtonDisabled: { backgroundColor: "#43514c" }, proButtonText: { fontSize: 14, fontWeight: "900", color: "#10231b" }, proActive: { marginTop: 24, fontSize: 17, fontWeight: "900", color: "#72dca3" }, restore: { marginTop: 18, textAlign: "center", fontSize: 13, fontWeight: "800", color: "#ffffff" }, proHint: { marginTop: 10, textAlign: "center", fontSize: 11, lineHeight: 17, color: "#94a3a0" }, tabBar: { flexDirection: "row", gap: 2, marginHorizontal: 12, marginBottom: Platform.OS === "ios" ? 8 : 6, padding: 5, borderWidth: 1, borderColor: "#cfe7d7", borderRadius: 18, backgroundColor: "#fbfdf9", shadowColor: "#10283a", shadowOpacity: 0.12, shadowRadius: 16, elevation: 5 }, tab: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 46, borderRadius: 13 }, tabActive: { backgroundColor: "#ddf8e9" }, tabText: { fontSize: 11, fontWeight: "700", color: "#65716d" }, tabTextActive: { color: "#087a45", fontWeight: "900" },
});
