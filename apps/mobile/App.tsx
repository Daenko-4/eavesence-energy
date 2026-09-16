import { calculateEnergyCosts } from "@eavesence/core";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { PurchasesPackage } from "react-native-purchases";

import {
  BETA_KEY,
  DEVICES_KEY,
  HISTORY_KEY,
  PROFILE_KEY,
  readJson,
  writeJson,
  type MobileDevice,
  type MobileHistoryEntry,
  type MobileProfile,
} from "./src/storage";
import {
  configureSubscriptions,
  getAvailablePackages,
  purchasePro,
  restorePro,
} from "./src/subscriptions";

type Tab = "home" | "add" | "history" | "pro";

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

const initialForm = {
  name: "",
  watts: "1000",
  minutes: "30",
  uses: "3",
  room: "Küche",
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<MobileProfile | null>(null);
  const [devices, setDevices] = useState<MobileDevice[]>([]);
  const [history, setHistory] = useState<MobileHistoryEntry[]>([]);
  const [tab, setTab] = useState<Tab>("home");
  const [homeName, setHomeName] = useState("Mein Zuhause");
  const [electricityPrice, setElectricityPrice] = useState("0.30");
  const [goal, setGoal] = useState("10");
  const [form, setForm] = useState(initialForm);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
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
      readJson<boolean>(BETA_KEY, false),
    ]).then(([storedProfile, storedDevices, storedHistory, storedBeta]) => {
      setProfile(storedProfile);
      setDevices(storedDevices);
      setHistory(storedHistory);
      setBetaInterested(storedBeta);
      setReady(true);
    });

    if (configureSubscriptions()) {
      void getAvailablePackages().then(setPackages).catch(() => setPackages([]));
    }
  }, []);

  const totals = useMemo(
    () => ({
      yearlyCost: devices.reduce((sum, device) => sum + device.yearlyCost, 0),
      yearlyKwh: devices.reduce((sum, device) => sum + device.yearlyKwh, 0),
    }),
    [devices],
  );

  async function createHome() {
    const nextProfile: MobileProfile = {
      name: homeName.trim() || "Mein Zuhause",
      electricityPrice: Math.max(0, Number(electricityPrice) || 0.3),
      savingsGoalPercent: Math.min(50, Math.max(1, Number(goal) || 10)),
      createdAt: new Date().toISOString(),
    };
    await writeJson(PROFILE_KEY, nextProfile);
    setProfile(nextProfile);
  }

  async function saveDevice() {
    if (!profile || !form.name.trim()) return;
    const result = calculateEnergyCosts({
      mode: "estimate",
      calculationType: "power",
      electricityPrice: profile.electricityPrice,
      watts: Number(form.watts),
      minutesPerUse: Number(form.minutes),
      usesPerWeek: Number(form.uses),
      estimatedKwhPerUse: 0,
      measuredKwhPerUse: 0,
    });
    if (!result.isValid) {
      Alert.alert("Angaben prüfen", "Leistung, Dauer und Nutzung müssen größer als null sein.");
      return;
    }
    const nextDevice: MobileDevice = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: form.name.trim(),
      watts: Number(form.watts),
      minutesPerUse: Number(form.minutes),
      usesPerWeek: Number(form.uses),
      yearlyKwh: result.yearlyKwh,
      yearlyCost: result.yearlyCost,
      monthlyCost: result.monthlyCost,
      room: form.room.trim() || "Nicht zugeordnet",
      updatedAt: new Date().toISOString(),
    };
    const nextDevices = [nextDevice, ...devices];
    await writeJson(DEVICES_KEY, nextDevices);
    setDevices(nextDevices);
    setForm(initialForm);
    setTab("home");
  }

  async function removeDevice(id: string) {
    const nextDevices = devices.filter((device) => device.id !== id);
    await writeJson(DEVICES_KEY, nextDevices);
    setDevices(nextDevices);
  }

  async function saveMonth() {
    if (!month) return;
    const nextEntry: MobileHistoryEntry = {
      month,
      kwh: Math.max(0, Number(monthKwh) || 0),
      cost: Math.max(0, Number(monthCost) || 0),
      updatedAt: new Date().toISOString(),
    };
    const nextHistory = [nextEntry, ...history.filter((entry) => entry.month !== month)]
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 24);
    await writeJson(HISTORY_KEY, nextHistory);
    setHistory(nextHistory);
    setMonthKwh("");
    setMonthCost("");
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
    return <SafeAreaView style={styles.loading}><StatusBar style="dark" /><Text style={styles.brand}>EAVESENCE</Text></SafeAreaView>;
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.onboarding} keyboardShouldPersistTaps="handled">
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
      <View style={styles.appHeader}><View><Text style={styles.brand}>EAVESENCE</Text><Text style={styles.headerTitle}>{profile.name}</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>{devices.length}</Text></View></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {tab === "home" && <>
          <Text style={styles.eyebrow}>DEINE ÜBERSICHT</Text>
          <Text style={styles.heroSmall}>{euro.format(totals.yearlyCost / 12)} <Text style={styles.heroUnit}>pro Monat</Text></Text>
          <View style={styles.metricGrid}><Metric label="Pro Jahr" value={euro.format(totals.yearlyCost)} /><Metric label="Verbrauch" value={`${Math.round(totals.yearlyKwh)} kWh`} /><Metric label="Sparziel" value={`${profile.savingsGoalPercent}%`} /><Metric label="Geräte" value={`${devices.length} / 3`} /></View>
          <View style={styles.progressTrack}><View style={[styles.progressBar, { width: `${Math.min(100, devices.length / 3 * 100)}%` }]} /></View>
          <Text style={styles.sectionTitle}>Gespeicherte Geräte</Text>
          {devices.length === 0 ? <Empty text="Noch keine Geräte. Füge dein erstes Gerät hinzu." /> : devices.map((device) => <View key={device.id} style={styles.deviceRow}><View style={styles.flex}><Text style={styles.deviceName}>{device.name}</Text><Text style={styles.muted}>{device.room} · {euro.format(device.yearlyCost)} pro Jahr</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`${device.name} löschen`} onPress={() => void removeDevice(device.id)}><Text style={styles.delete}>×</Text></Pressable></View>)}
          <PrimaryButton label="Gerät hinzufügen" onPress={() => setTab("add")} />
        </>}

        {tab === "add" && <>
          <Text style={styles.eyebrow}>NEUES GERÄT</Text><Text style={styles.heroSmall}>Was kostet dein Gerät?</Text>
          <Field label="Gerätename" value={form.name} onChangeText={(value) => setForm({ ...form, name: value })} />
          <Field label="Leistung in Watt" value={form.watts} onChangeText={(value) => setForm({ ...form, watts: value })} keyboardType="number-pad" />
          <Field label="Minuten pro Nutzung" value={form.minutes} onChangeText={(value) => setForm({ ...form, minutes: value })} keyboardType="number-pad" />
          <Field label="Nutzungen pro Woche" value={form.uses} onChangeText={(value) => setForm({ ...form, uses: value })} keyboardType="decimal-pad" />
          <Field label="Raum" value={form.room} onChangeText={(value) => setForm({ ...form, room: value })} />
          <PrimaryButton label="Berechnen und speichern" onPress={() => void saveDevice()} />
        </>}

        {tab === "history" && <>
          <Text style={styles.eyebrow}>MONATS-CHECK</Text><Text style={styles.heroSmall}>Aus Schätzungen wird ein Verlauf.</Text>
          <Field label="Monat (JJJJ-MM)" value={month} onChangeText={setMonth} />
          <Field label="Verbrauch in kWh" value={monthKwh} onChangeText={setMonthKwh} keyboardType="decimal-pad" />
          <Field label="Kosten in Euro" value={monthCost} onChangeText={setMonthCost} keyboardType="decimal-pad" />
          <PrimaryButton label="Monat speichern" onPress={() => void saveMonth()} />
          <Pressable style={styles.secondaryButton} onPress={() => void scheduleReminder()}><Text style={styles.secondaryButtonText}>Monatliche Erinnerung aktivieren</Text></Pressable>
          <Text style={styles.sectionTitle}>Verlauf</Text>
          {history.length === 0 ? <Empty text="Noch kein Monatswert vorhanden." /> : history.map((entry) => <View key={entry.month} style={styles.deviceRow}><View><Text style={styles.deviceName}>{entry.month}</Text><Text style={styles.muted}>{entry.kwh} kWh</Text></View><Text style={styles.deviceName}>{euro.format(entry.cost)}</Text></View>)}
        </>}

        {tab === "pro" && <View style={styles.proCard}><Text style={styles.eyebrowMint}>EAVESENCE PRO</Text><Text style={styles.proTitle}>Mehr Klarheit für dein ganzes Zuhause.</Text><Text style={styles.proBody}>Unbegrenzte Geräte, Synchronisation, mehrere Haushalte und später Energieetikett- sowie Rechnungsscan.</Text>{isPro ? <Text style={styles.proActive}>Pro ist aktiv</Text> : packages.length > 0 ? packages.map((item) => <Pressable key={item.identifier} style={styles.proButton} onPress={() => void buy(item)}><Text style={styles.proButtonText}>{item.product.title} · {item.product.priceString}</Text></Pressable>) : <Pressable style={[styles.proButton, betaInterested && styles.proButtonDisabled]} disabled={betaInterested} onPress={() => void expressBetaInterest()}><Text style={styles.proButtonText}>{betaInterested ? "Beta-Interesse gespeichert" : "Beta-Platz vormerken"}</Text></Pressable>}<Pressable onPress={() => void restorePro().then(setIsPro)}><Text style={styles.restore}>Käufe wiederherstellen</Text></Pressable><Text style={styles.proHint}>Noch keine Abbuchung ohne freigeschaltete Store-Produkte.</Text></View>}
      </ScrollView>
      <View style={styles.tabBar}>{([['home', 'Zuhause'], ['add', 'Gerät'], ['history', 'Verlauf'], ['pro', 'Pro']] as const).map(([key, label]) => <Pressable key={key} onPress={() => setTab(key)} style={styles.tab}><Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text></Pressable>)}</View>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor="#8a9591" style={styles.input} /></View>;
}

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
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: "#f6f7f2" }, loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f6f7f2" }, onboarding: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 18 }, content: { padding: 20, paddingBottom: 40 }, appHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#dfe5e1", backgroundColor: "#ffffff" }, brand: { fontSize: 12, fontWeight: "900", letterSpacing: 1.8, color: "#087a45" }, headerTitle: { marginTop: 2, fontSize: 20, fontWeight: "800", color: "#07111f" }, avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#dcf5e6" }, avatarText: { fontWeight: "900", color: "#087a45" }, eyebrow: { fontSize: 12, fontWeight: "900", letterSpacing: 1.5, color: "#087a45" }, eyebrowMint: { fontSize: 12, fontWeight: "900", letterSpacing: 1.5, color: "#72dca3" }, hero: { fontSize: 42, lineHeight: 44, fontWeight: "900", letterSpacing: -2, color: "#07111f" }, heroSmall: { marginTop: 8, marginBottom: 22, fontSize: 32, lineHeight: 36, fontWeight: "900", letterSpacing: -1.4, color: "#07111f" }, heroUnit: { fontSize: 16, fontWeight: "700", color: "#64748b" }, body: { fontSize: 16, lineHeight: 24, color: "#64748b", marginBottom: 6 }, field: { gap: 7 }, label: { fontSize: 12, fontWeight: "800", color: "#52605b" }, input: { minHeight: 50, borderWidth: 1, borderColor: "#dfe5e1", borderRadius: 14, backgroundColor: "#ffffff", paddingHorizontal: 15, fontSize: 16, color: "#07111f" }, primaryButton: { minHeight: 52, marginTop: 10, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "#087a45", paddingHorizontal: 20 }, primaryButtonText: { fontSize: 15, fontWeight: "900", color: "#ffffff" }, privateText: { textAlign: "center", fontSize: 12, fontWeight: "600", color: "#8a9591" }, metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, metric: { width: "48%", minHeight: 94, borderWidth: 1, borderColor: "#dfe5e1", borderRadius: 16, backgroundColor: "#ffffff", padding: 14 }, metricLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7, color: "#64748b" }, metricValue: { marginTop: 12, fontSize: 19, fontWeight: "900", color: "#07111f" }, progressTrack: { height: 7, marginTop: 16, overflow: "hidden", borderRadius: 4, backgroundColor: "#e7ece9" }, progressBar: { height: "100%", borderRadius: 4, backgroundColor: "#087a45" }, sectionTitle: { marginTop: 28, marginBottom: 10, fontSize: 20, fontWeight: "900", color: "#07111f" }, deviceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#dfe5e1" }, deviceName: { fontSize: 15, fontWeight: "800", color: "#07111f" }, muted: { marginTop: 3, fontSize: 12, color: "#64748b" }, delete: { padding: 8, fontSize: 24, color: "#94a3b8" }, empty: { borderWidth: 1, borderStyle: "dashed", borderColor: "#cbd5e1", borderRadius: 16, padding: 20, backgroundColor: "#ffffff" }, secondaryButton: { minHeight: 48, marginTop: 10, borderWidth: 1, borderColor: "#b9d9c7", borderRadius: 24, alignItems: "center", justifyContent: "center" }, secondaryButtonText: { fontSize: 14, fontWeight: "800", color: "#087a45" }, proCard: { borderRadius: 26, backgroundColor: "#17211f", padding: 24 }, proTitle: { marginTop: 12, fontSize: 32, lineHeight: 35, fontWeight: "900", letterSpacing: -1.2, color: "#ffffff" }, proBody: { marginTop: 15, fontSize: 15, lineHeight: 23, color: "#cbd5d1" }, proButton: { minHeight: 52, marginTop: 24, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "#72dca3", paddingHorizontal: 16 }, proButtonDisabled: { backgroundColor: "#43514c" }, proButtonText: { fontSize: 14, fontWeight: "900", color: "#10231b" }, proActive: { marginTop: 24, fontSize: 17, fontWeight: "900", color: "#72dca3" }, restore: { marginTop: 18, textAlign: "center", fontSize: 13, fontWeight: "800", color: "#ffffff" }, proHint: { marginTop: 10, textAlign: "center", fontSize: 11, lineHeight: 17, color: "#94a3a0" }, tabBar: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#dfe5e1", backgroundColor: "#ffffff", paddingBottom: Platform.OS === "ios" ? 8 : 0 }, tab: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 58 }, tabText: { fontSize: 12, fontWeight: "800", color: "#8a9591" }, tabTextActive: { color: "#087a45" },
});
