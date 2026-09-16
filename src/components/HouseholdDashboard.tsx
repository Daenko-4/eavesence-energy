"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { devices } from "@/data/devices";
import type { Locale } from "@/i18n/config";
import { getLocalizedDevice } from "@/i18n/devices";
import {
  calculateHouseholdSummary,
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
    targetSavings: "Mögliche Ersparnis pro Jahr",
    devices: "Geräte",
    activation: "Dein Haushaltsprofil",
    activationReady: "Grundlage vollständig",
    activationText: "Speichere drei Geräte, damit die Übersicht aussagekräftig wird.",
    addDevice: "Gerät berechnen und speichern",
    roomsTitle: "Kosten nach Raum",
    unassigned: "Noch nicht zugeordnet",
    assign: "Raum zuordnen",
    noDevices: "Noch keine Geräte gespeichert.",
    topConsumer: "Größter Kostenpunkt",
    monthlyCheckIn: "Monatlicher Check-in",
    checkInText:
      "Trage den Verbrauch oder Rechnungsbetrag ein. So wird aus der Schätzung mit der Zeit ein echter Verlauf.",
    month: "Monat",
    kwh: "Verbrauch in kWh",
    cost: "Kosten",
    saveCheckIn: "Monat speichern",
    history: "Verlauf",
    noHistory: "Noch kein Monatswert vorhanden.",
    comparedWithPrevious: "gegenüber dem vorherigen Eintrag",
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
    targetSavings: "Potential yearly savings",
    devices: "Devices",
    activation: "Your home profile",
    activationReady: "Foundation complete",
    activationText: "Save three devices to make your overview meaningful.",
    addDevice: "Calculate and save a device",
    roomsTitle: "Cost by room",
    unassigned: "Not assigned yet",
    assign: "Assign room",
    noDevices: "No devices saved yet.",
    topConsumer: "Highest cost",
    monthlyCheckIn: "Monthly check-in",
    checkInText:
      "Add your consumption or bill amount. Over time, estimates become a real history.",
    month: "Month",
    kwh: "Consumption in kWh",
    cost: "Cost",
    saveCheckIn: "Save month",
    history: "History",
    noHistory: "No monthly value yet.",
    comparedWithPrevious: "compared with the previous entry",
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

function formatNumber(value: number, locale: Locale, digits = 0) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    maximumFractionDigits: digits,
  }).format(value);
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [betaInterested, setBetaInterested] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomNameDraft, setRoomNameDraft] = useState("");
  const [notice, setNotice] = useState("");

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

  function assignRoom(deviceId: string, roomId: string) {
    if (!profile) return;
    const deviceRooms = { ...profile.deviceRooms };
    if (roomId) deviceRooms[deviceId] = roomId;
    else delete deviceRooms[deviceId];
    persistProfile({ ...profile, deviceRooms, updatedAt: new Date().toISOString() });
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

  function saveMonthlyCheckIn() {
    if (!month || (monthKwh.trim() === "" && monthCost.trim() === "")) return;
    const kwh = Number(monthKwh);
    const cost = Number(monthCost);
    if (!Number.isFinite(kwh) || !Number.isFinite(cost)) return;
    const nextEntry: MonthlyEnergyEntry = {
      month,
      kwh: Number.isFinite(kwh) && kwh >= 0 ? kwh : 0,
      cost: Number.isFinite(cost) && cost >= 0 ? cost : 0,
      updatedAt: new Date().toISOString(),
    };
    const nextHistory = upsertMonthlyEnergyEntry(history, nextEntry);
    window.localStorage.setItem(HOUSEHOLD_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    setHistory(nextHistory);
    setMonthKwh("");
    setMonthCost("");
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

  const historyDelta = history.length > 1 && history[1].cost > 0
    ? ((history[0].cost - history[1].cost) / history[1].cost) * 100
    : null;

  return (
    <div lang={locale} className="min-h-screen bg-[var(--background)] text-[#07111f]">
      <Header locale={locale} languageHrefOverride={languageHref} />
      <main className="px-5 pb-20 pt-10 sm:px-6 sm:pt-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-green)]">EAVESENCE Home</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">{localizeDefaultHouseholdName(profile.name, locale)}</h1>
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
            </section>
          )}
          {notice && <p role="status" className="mt-3 text-sm font-bold text-[var(--brand-green)]">{notice}</p>}

          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={text.overview}>
            {[
              [text.monthly, formatMoney(summary?.monthlyCost ?? 0, locale, profile.currency)],
              [text.yearly, formatMoney(summary?.annualCost ?? 0, locale, profile.currency)],
              [text.consumption, `${formatNumber(summary?.annualKwh ?? 0, locale)} kWh`],
              [text.target, formatMoney(summary?.targetMonthlyCost ?? 0, locale, profile.currency)],
            ].map(([label, value], index) => (
              <article key={label} className={`rounded-2xl border p-5 ${index === 0 ? "border-green-200 bg-[#eaf8ef]" : "border-slate-200 bg-white"}`}>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
                <p className="mt-3 text-2xl font-extrabold tracking-[-0.04em]">{value}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{text.activation}</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em]">{savedDevices.length >= 3 ? text.activationReady : `${savedDevices.length} / 3 ${text.devices}`}</h2></div>
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-extrabold tracking-[-0.035em]">{text.roomsTitle}</h2><p className="mt-1 text-sm text-slate-600">{profile.rooms.length} {text.rooms.toLowerCase()}</p></div><button type="button" onClick={addRoom} className="w-fit text-sm font-bold text-[var(--brand-green)]">+ {text.addRoom}</button></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {summary?.roomTotals.map((room) => <article key={room.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">{editingRoomId === room.id ? <form onSubmit={(event) => { event.preventDefault(); saveRoomName(room.id); }}><label className="grid gap-1.5 text-xs font-bold text-slate-600"><span>{text.roomName}</span><input autoFocus value={roomNameDraft} onChange={(event) => setRoomNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") cancelEditingRoom(); }} className="min-h-10 rounded-lg border border-green-300 bg-white px-3 text-sm text-slate-900 outline-none ring-green-100 focus:ring-4" /></label><div className="mt-3 flex flex-wrap gap-2"><button type="submit" disabled={!roomNameDraft.trim()} className="rounded-full bg-[var(--brand-green)] px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{text.saveRoom}</button><button type="button" onClick={cancelEditingRoom} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">{text.cancelRoomEdit}</button></div></form> : <><div className="flex items-center justify-between gap-4"><h3 className="font-extrabold">{localizeDefaultRoomName(room.name, locale)}</h3><span className="text-xs font-bold text-slate-500">{room.deviceCount}</span></div><p className="mt-3 text-xl font-extrabold">{formatMoney(room.annualCost, locale, profile.currency)}</p><p className="mt-1 text-xs text-slate-500">{text.yearly.toLowerCase()}</p><div className="mt-4 flex items-center gap-3 border-t border-slate-200 pt-3"><button type="button" onClick={() => startEditingRoom(room.id, localizeDefaultRoomName(room.name, locale))} aria-label={`${text.editRoom}: ${localizeDefaultRoomName(room.name, locale)}`} className="text-xs font-bold text-[var(--brand-green)] hover:text-[var(--brand-green-dark)]">{text.editRoom}</button><button type="button" onClick={() => deleteRoom(room.id)} aria-label={`${text.deleteRoom}: ${localizeDefaultRoomName(room.name, locale)}`} className="text-xs font-bold text-red-600 hover:text-red-700">{text.deleteRoom}</button></div></>}</article>)}
            </div>
            <div className="mt-6 divide-y divide-slate-100 border-t border-slate-200">
              {savedDevices.length === 0 ? <p className="py-5 text-sm text-slate-500">{text.noDevices}</p> : savedDevices.map((device) => <div key={device.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{localizedSavedDeviceName(device, locale)}</p><p className="mt-1 text-xs text-slate-500">{formatMoney(device.yearlyKwh * profile.electricityPrice, locale, profile.currency)} {text.yearly.toLowerCase()}</p></div><label className="flex items-center gap-3 text-xs font-bold text-slate-500"><span>{text.assign}</span><select value={profile.deviceRooms[device.id] ?? ""} onChange={(event) => assignRoom(device.id, event.target.value)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="">{text.unassigned}</option>{profile.rooms.map((room) => <option key={room.id} value={room.id}>{localizeDefaultRoomName(room.name, locale)}</option>)}</select></label></div>)}
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-2xl font-extrabold tracking-[-0.035em]">{text.monthlyCheckIn}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text.checkInText}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-bold text-slate-600 sm:col-span-2">{text.month}<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label><label className="grid gap-1.5 text-xs font-bold text-slate-600">{text.kwh}<input type="number" min="0" value={monthKwh} onChange={(event) => setMonthKwh(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label><label className="grid gap-1.5 text-xs font-bold text-slate-600">{text.cost}<input type="number" min="0" step="0.01" value={monthCost} onChange={(event) => setMonthCost(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" /></label></div><button type="button" onClick={saveMonthlyCheckIn} className="mt-5 min-h-11 rounded-full bg-[var(--brand-green)] px-5 text-sm font-bold text-white">{text.saveCheckIn}</button></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-extrabold tracking-[-0.035em]">{text.history}</h2>{historyDelta !== null && <span className={`rounded-full px-3 py-1 text-xs font-bold ${historyDelta <= 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{historyDelta > 0 ? "+" : ""}{formatNumber(historyDelta, locale, 1)}%</span>}</div>{history.length === 0 ? <p className="mt-6 text-sm text-slate-500">{text.noHistory}</p> : <div className="mt-5 space-y-3">{history.slice(0, 6).map((entry, index) => <div key={entry.month} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl bg-slate-50 px-4 py-3"><span className="text-sm font-bold">{new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${entry.month}-01T00:00:00Z`))}</span><span className="text-sm text-slate-500">{formatNumber(entry.kwh, locale, 1)} kWh</span><span className="text-sm font-extrabold">{formatMoney(entry.cost, locale, profile.currency)}</span>{index === 0 && historyDelta !== null && <span className="col-span-3 text-xs text-slate-500">{text.comparedWithPrevious}</span>}</div>)}</div>}</div>
          </section>

          <section className="mt-10 overflow-hidden rounded-[2rem] bg-[#17211f] p-6 text-white sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-green-mint)]">{text.proEyebrow}</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">{text.proTitle}</h2><p className="mt-4 max-w-2xl leading-7 text-slate-300">{text.proText}</p><p className="mt-5 text-xs leading-5 text-slate-400">{text.betaDetail}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="grid grid-cols-2 rounded-full bg-black/20 p-1"><button type="button" onClick={() => { setPlan("monthly"); track("Home Pro Preview Opened", { locale, plan: "monthly" }); }} className={`rounded-full px-4 py-2 text-sm font-bold ${plan === "monthly" ? "bg-white text-[#17211f]" : "text-slate-300"}`}>{text.monthlyPlan}</button><button type="button" onClick={() => { setPlan("yearly"); track("Home Pro Preview Opened", { locale, plan: "yearly" }); }} className={`rounded-full px-4 py-2 text-sm font-bold ${plan === "yearly" ? "bg-white text-[#17211f]" : "text-slate-300"}`}>{text.yearlyPlan}</button></div><div className="mt-5 flex min-h-8 flex-wrap items-center justify-center gap-4"><p className="text-center text-2xl font-extrabold">{plan === "yearly" ? text.yearlyPrice : text.monthlyPrice}</p>{plan === "yearly" && <span className="rounded-full border border-[var(--brand-green-mint)]/30 bg-[var(--brand-green-mint)]/10 px-2.5 py-1 text-[11px] font-extrabold text-[var(--brand-green-mint)]">{text.yearlyHint}</span>}</div><button type="button" onClick={submitBetaInterest} disabled={betaInterested} className="mt-5 min-h-12 w-full rounded-full bg-[var(--brand-green-mint)] px-5 text-sm font-extrabold text-[#10231b] transition hover:bg-[#9bedc0] disabled:cursor-default disabled:bg-white/15 disabled:text-slate-300">{betaInterested ? text.betaSaved : text.beta}</button></div></div>
          </section>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
