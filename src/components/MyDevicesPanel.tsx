"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import DeviceCategoryIcon from "@/components/DeviceCategoryIcon";
import { devices } from "@/data/devices";
import type { Locale } from "@/i18n/config";
import { getLocalizedDevice } from "@/i18n/devices";
import {
  readSavedDevices,
  SAVED_DEVICES_STORAGE_KEY,
  type SavedDevice,
  type SavedDeviceCurrency,
} from "@/lib/savedDevices";

type MyDevicesPanelProps = {
  locale: Locale;
  currentDevice: Omit<SavedDevice, "id" | "updatedAt">;
  canSave: boolean;
  activeSavedDeviceId: string | null;
  onActiveSavedDeviceChange: (id: string | null) => void;
  onOpen: (device: SavedDevice) => void;
  compact?: boolean;
};

export type MyDevicesPanelHandle = {
  saveCurrentDevice: () => void;
};

const copy = {
  de: {
    title: "Meine Geräte",
    description:
      "Speichere deine Berechnung auf diesem Gerät – ohne Konto und ohne Datenübertragung.",
    save: "Gerät speichern",
    update: "Änderungen speichern",
    saved: "Gerät wurde lokal gespeichert.",
    updated: "Änderungen wurden lokal gespeichert.",
    empty:
      "Noch keine Geräte gespeichert. Berechne ein Gerät und füge es hier hinzu.",
    monthlyTotal: "Gesamtkosten pro Monat",
    yearlyTotal: "Gesamtkosten pro Jahr",
    total: "Gesamtsumme",
    perMonth: "pro Monat",
    perYear: "pro Jahr",
    open: "Bearbeiten",
    remove: "Löschen",
    removeConfirm: "Möchtest du „{device}“ wirklich löschen?",
    removeAll: "Alle lokalen Geräte löschen",
    removeAllConfirm:
      "Möchtest du wirklich alle lokal gespeicherten Geräte löschen?",
    storedLocally:
      "Die Daten bleiben ausschließlich in diesem Browser. Wenn du Browserdaten löschst oder das Gerät wechselst, sind sie nicht mehr verfügbar.",
    usesPerWeek: "Nutzungen/Woche",
    savedDevice: "gespeichertes Gerät",
    savedDevices: "gespeicherte Geräte",
    showList: "Liste anzeigen",
    hideList: "Liste ausblenden",
    dashboard: "Deine Übersicht",
    yearlyConsumption: "Verbrauch pro Jahr",
    topConsumer: "Größter Kostenpunkt",
    sort: "Sortieren",
    newest: "Zuletzt gespeichert",
    highestCost: "Höchste Jahreskosten",
    alphabetical: "Alphabetisch",
    export: "Sicherung exportieren",
    import: "Sicherung importieren",
    imported: "Geräte wurden erfolgreich importiert.",
    importError: "Die Datei konnte nicht als EAVESENCE-Sicherung gelesen werden.",
    privateBadge: "Privat auf diesem Gerät gespeichert",
    fallbackDevice: "Gerät",
  },
  en: {
    title: "My devices",
    description:
      "Save your calculation on this device – without an account or data transfer.",
    save: "Save device",
    update: "Save changes",
    saved: "Device saved locally.",
    updated: "Changes saved locally.",
    empty:
      "No devices saved yet. Calculate a device and add it here.",
    monthlyTotal: "Total cost per month",
    yearlyTotal: "Total cost per year",
    total: "Total costs",
    perMonth: "per month",
    perYear: "per year",
    open: "Edit",
    remove: "Delete",
    removeConfirm: "Do you really want to delete “{device}”?",
    removeAll: "Delete all local devices",
    removeAllConfirm:
      "Do you really want to delete all locally saved devices?",
    storedLocally:
      "The data stays exclusively in this browser. If you clear browser data or switch devices, it will no longer be available.",
    usesPerWeek: "Uses/week",
    savedDevice: "saved device",
    savedDevices: "saved devices",
    showList: "Show list",
    hideList: "Hide list",
    dashboard: "Your overview",
    yearlyConsumption: "Consumption per year",
    topConsumer: "Highest cost",
    sort: "Sort",
    newest: "Recently saved",
    highestCost: "Highest yearly cost",
    alphabetical: "Alphabetical",
    export: "Export backup",
    import: "Import backup",
    imported: "Devices imported successfully.",
    importError: "This file could not be read as an EAVESENCE backup.",
    privateBadge: "Stored privately on this device",
    fallbackDevice: "Device",
  },
} as const;

const currencyOrder: SavedDeviceCurrency[] = [
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

function formatMoney(
  value: number,
  locale: Locale,
  currency: SavedDeviceCurrency
) {
  return new Intl.NumberFormat(
    locale === "de" ? "de-DE" : "en-GB",
    {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function formatUses(value: number, locale: Locale) {
  return value.toLocaleString(locale === "de" ? "de-DE" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}

const MyDevicesPanel = forwardRef<MyDevicesPanelHandle, MyDevicesPanelProps>(
function MyDevicesPanel(
  {
    locale,
    currentDevice,
    canSave,
    activeSavedDeviceId,
    onActiveSavedDeviceChange,
    onOpen,
    compact = false,
  },
  ref,
) {
  const text = copy[locale];
  const [savedDevices, setSavedDevices] = useState<SavedDevice[]>([]);
  const [notice, setNotice] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "cost" | "name">("newest");
  const [listOpen, setListOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedDevices = readSavedDevices(
        window.localStorage.getItem(SAVED_DEVICES_STORAGE_KEY)
      );
      setSavedDevices(storedDevices);
      setListOpen(storedDevices.length > 0);
      setStorageReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function persist(nextDevices: SavedDevice[]) {
    setSavedDevices(nextDevices);
    window.localStorage.setItem(
      SAVED_DEVICES_STORAGE_KEY,
      JSON.stringify(nextDevices)
    );
  }

  function saveCurrentDevice() {
    if (!canSave) {
      return;
    }

    const id = activeSavedDeviceId ?? createId();
    const nextDevice: SavedDevice = {
      ...currentDevice,
      id,
      updatedAt: new Date().toISOString(),
    };

    const nextDevices = activeSavedDeviceId
      ? savedDevices.map((item) =>
          item.id === activeSavedDeviceId ? nextDevice : item
        )
      : [nextDevice, ...savedDevices];

    persist(nextDevices);
    setListOpen(true);
    onActiveSavedDeviceChange(id);
    setNotice(
      activeSavedDeviceId ? text.updated : text.saved
    );
  }

  function removeDevice(id: string) {
    const device = savedDevices.find((item) => item.id === id);

    if (
      device &&
      !window.confirm(
        text.removeConfirm.replace("{device}", getDeviceName(device)),
      )
    ) {
      return;
    }

    const nextDevices = savedDevices.filter((item) => item.id !== id);
    persist(nextDevices);

    if (activeSavedDeviceId === id) {
      onActiveSavedDeviceChange(null);
    }

    setNotice("");
  }

  function removeAllDevices() {
    if (!window.confirm(text.removeAllConfirm)) {
      return;
    }

    persist([]);
    onActiveSavedDeviceChange(null);
    setNotice("");
  }

  function exportDevices() {
    const blob = new Blob(
      [JSON.stringify({ version: 1, devices: savedDevices }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `eavesence-devices-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importDevices(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed: unknown = JSON.parse(await file.text());
      const candidate =
        parsed && typeof parsed === "object" && "devices" in parsed
          ? (parsed as { devices: unknown }).devices
          : parsed;
      const imported = readSavedDevices(JSON.stringify(candidate));

      if (!Array.isArray(candidate) || (candidate.length > 0 && imported.length === 0)) {
        throw new Error("Invalid backup");
      }

      persist(imported);
      setListOpen(imported.length > 0);
      onActiveSavedDeviceChange(null);
      setNotice(text.imported);
    } catch {
      setNotice(text.importError);
    }
  }

  function getDeviceName(item: SavedDevice) {
    if (item.device === "__custom_device__") {
      return item.customDeviceName.trim() || text.fallbackDevice;
    }

    const sourceDevice = devices.find(
      (candidate) => candidate.name === item.device
    );

    return sourceDevice
      ? getLocalizedDevice(sourceDevice, locale).name
      : item.device;
  }

  function getDeviceCategory(item: SavedDevice) {
    if (item.device === "__custom_device__") {
      return "custom";
    }

    return (
      devices.find((candidate) => candidate.name === item.device)?.category ??
      "custom"
    );
  }

  useImperativeHandle(ref, () => ({ saveCurrentDevice }));

  const totals = currencyOrder
    .map((currency) => {
      const matchingDevices = savedDevices.filter(
        (item) => item.currency === currency
      );

      return {
        currency,
        count: matchingDevices.length,
        monthlyCost: matchingDevices.reduce(
          (total, item) => total + item.monthlyCost,
          0
        ),
        yearlyCost: matchingDevices.reduce(
          (total, item) => total + item.yearlyCost,
          0
        ),
        yearlyKwh: matchingDevices.reduce(
          (total, item) => total + item.yearlyKwh,
          0
        ),
        topDevice: [...matchingDevices].sort(
          (a, b) => b.yearlyCost - a.yearlyCost
        )[0],
      };
    })
    .filter((total) => total.count > 0);

  const sortedDevices = [...savedDevices].sort((a, b) => {
    if (sortBy === "cost") return b.yearlyCost - a.yearlyCost;
    if (sortBy === "name") {
      return getDeviceName(a).localeCompare(getDeviceName(b), locale);
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  if (compact) {
    return (
      <section
        id="meine-geraete"
        className="mt-8 scroll-mt-[104px] border-t border-slate-200 pt-7"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.025em] text-slate-950 sm:text-2xl">
              {text.title}
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-500">
              {text.description}
            </p>
          </div>
          {savedDevices.length > 0 && (
            <span className="w-fit rounded-full bg-[#ddf8e9] px-3 py-1 text-[11px] font-bold text-[var(--brand-green)]">
              {savedDevices.length}{" "}
              {savedDevices.length === 1
                ? text.savedDevice
                : text.savedDevices}
            </span>
          )}
        </div>
        {notice && (
          <p role="status" className="mt-3 text-xs font-semibold text-[var(--brand-green)]">
            {notice}
          </p>
        )}

        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          onChange={importDevices}
          className="hidden"
        />

        {savedDevices.length > 0 ? (
          <details
            open={listOpen}
            onToggle={(event) => setListOpen(event.currentTarget.open)}
            className="group mt-3"
          >
            <summary className="flex cursor-pointer list-none justify-end py-1 text-[11px] font-bold text-slate-500 transition hover:text-[var(--brand-green-dark)] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-1.5">
                <span className="group-open:hidden">{text.showList}</span>
                <span className="hidden group-open:inline">{text.hideList}</span>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-3 w-3 transition-transform group-open:rotate-180"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 7.5 5 5 5-5" />
                </svg>
              </span>
            </summary>

            <div className="pb-2 pt-2">
              <div className="space-y-2">
                {totals.map((total) => (
                  <div
                    key={total.currency}
                    className="flex items-center justify-between gap-5 rounded-2xl bg-[#e7f7ed] px-4 py-3.5 sm:px-5"
                  >
                    <div className="min-w-0">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--brand-green)]">
                        {text.total}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.08em] text-slate-500">
                        {total.currency}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block text-xl font-extrabold tracking-[-0.035em] tabular-nums text-[#10283a] sm:text-2xl">
                        {formatMoney(total.yearlyCost, locale, total.currency)}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {text.perYear}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 divide-y divide-slate-200/70 border-y border-slate-200/70">
                {sortedDevices.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 py-3 sm:grid-cols-[minmax(220px,1fr)_140px_165px_auto] sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-[var(--brand-green)]">
                        <DeviceCategoryIcon category={getDeviceCategory(item)} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold tracking-tight text-slate-950">
                          {getDeviceName(item)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 sm:text-right">
                      <span className="block font-bold tabular-nums text-slate-700">
                        {formatMoney(item.monthlyCost, locale, item.currency)}
                      </span>
                      {text.perMonth}
                    </p>
                    <p className="text-left text-xs text-slate-500 sm:text-right">
                      <span className="block text-lg font-extrabold tracking-[-0.025em] tabular-nums text-slate-950">
                        {formatMoney(item.yearlyCost, locale, item.currency)}
                      </span>
                      {text.perYear}
                    </p>
                    <div className="flex shrink-0 items-center gap-1 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => onOpen(item)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#ddf8e9] hover:text-[var(--brand-green)]"
                          aria-label={`${text.open}: ${getDeviceName(item)}`}
                          title={text.open}
                        >
                          <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m13.5 3.5 3 3L7 16l-4 1 1-4 9.5-9.5Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDevice(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`${text.remove}: ${getDeviceName(item)}`}
                          title={text.remove}
                        >
                          <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3.5 5.5h13M8 2.8h4M6 5.5l.7 11h6.6l.7-11M8.3 8.5v5M11.7 8.5v5" />
                          </svg>
                        </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-start gap-x-3 gap-y-2">
                <button
                  type="button"
                  onClick={exportDevices}
                  className="group relative pb-1 saved-device-utility-action text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]"
                >
                  {text.export}
                  <svg
                    viewBox="0 0 12 8"
                    fill="none"
                    className="pointer-events-none absolute left-1/2 top-full h-2 w-3 -translate-x-1/2 -translate-y-1 opacity-0 transition duration-150 group-hover:translate-y-0 group-hover:opacity-100"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m2.5 2.5 3.5 3 3.5-3" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="group relative pb-1 saved-device-utility-action text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]"
                >
                  {text.import}
                  <svg
                    viewBox="0 0 12 8"
                    fill="none"
                    className="pointer-events-none absolute left-1/2 top-full h-2 w-3 -translate-x-1/2 translate-y-1 opacity-0 transition duration-150 group-hover:translate-y-0 group-hover:opacity-100"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m2.5 5.5 3.5-3 3.5 3" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={removeAllDevices}
                  className="group relative pb-1 saved-device-utility-action text-slate-400 transition hover:text-red-700"
                >
                  {text.removeAll}
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    className="pointer-events-none absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1 opacity-0 transition duration-150 group-hover:translate-y-0 group-hover:opacity-100"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="m3 3 6 6M9 3 3 9" />
                  </svg>
                </button>
              </div>
            </div>
          </details>
        ) : (
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="group relative mt-3 pb-1 saved-device-utility-action text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]"
          >
            {text.import}
            <svg
              viewBox="0 0 12 8"
              fill="none"
              className="pointer-events-none absolute left-1/2 top-full h-2 w-3 -translate-x-1/2 translate-y-1 opacity-0 transition duration-150 group-hover:translate-y-0 group-hover:opacity-100"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m2.5 5.5 3.5-3 3.5 3" />
            </svg>
          </button>
        )}
      </section>
    );
  }

  return (
    <div
      id="meine-geraete"
      className="mt-10 scroll-mt-[120px] border-t border-slate-200 pt-8"
    >
      <div>
        <div>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-[var(--brand-green)]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="3" width="16" height="18" rx="3" />
                <path d="M8 7h8" />
                <path d="M8 11h8" />
                <path d="M8 15h5" />
              </svg>
            </span>

            <h3 className="text-xl font-bold text-slate-950">
              {text.title}
            </h3>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {text.description}
          </p>
          <span className="mt-3 inline-flex rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-[var(--brand-green)]">
            ✓ {text.privateBadge}
          </span>
        </div>

      </div>

      {notice && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-[var(--brand-green)]"
        >
          {notice}
        </p>
      )}

      {totals.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-green)]">
            {text.dashboard}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
          {totals.map((total) => (
            <div
              key={total.currency}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                {total.currency}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs leading-5 text-slate-500">
                    {text.monthlyTotal}
                  </p>
                  <p className="mt-1 font-bold text-slate-950">
                    {formatMoney(
                      total.monthlyCost,
                      locale,
                      total.currency
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs leading-5 text-slate-500">
                    {text.yearlyTotal}
                  </p>
                  <p className="mt-1 font-bold text-slate-950">
                    {formatMoney(
                      total.yearlyCost,
                      locale,
                      total.currency
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-xs text-slate-500">{text.yearlyConsumption}</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {formatUses(total.yearlyKwh, locale)} kWh
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{text.topConsumer}</p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-950">
                    {total.topDevice ? getDeviceName(total.topDevice) : "–"}
                  </p>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {storageReady && savedDevices.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-5 text-center">
          <p className="text-sm leading-6 text-slate-500">
            {text.empty}
          </p>
        </div>
      ) : savedDevices.length > 0 ? (
        <details
          open={listOpen}
          onToggle={(event) => setListOpen(event.currentTarget.open)}
          className="group mt-5"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 transition hover:border-green-300 hover:bg-green-50 [&::-webkit-details-marker]:hidden">
            <span>
              {savedDevices.length}{" "}
              {savedDevices.length === 1
                ? text.savedDevice
                : text.savedDevices}
            </span>

            <span className="flex shrink-0 items-center gap-2 text-[var(--brand-green)]">
              <span className="group-open:hidden">
                {text.showList}
              </span>
              <span className="hidden group-open:inline">
                {text.hideList}
              </span>
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="h-4 w-4 transition-transform duration-200 group-open:rotate-90"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m7.5 5 5 5-5 5" />
              </svg>
            </span>
          </summary>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              {text.sort}
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-green-400"
              >
                <option value="newest">{text.newest}</option>
                <option value="cost">{text.highestCost}</option>
                <option value="name">{text.alphabetical}</option>
              </select>
            </label>
          </div>

          <div className="mt-3 space-y-3">
          {sortedDevices.map((item) => (
            <div
              key={item.id}
              className={
                "rounded-xl border bg-white p-4 transition " +
                (activeSavedDeviceId === item.id
                  ? "border-green-300 ring-2 ring-green-100"
                  : "border-slate-200")
              }
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-[var(--brand-green)]">
                    <DeviceCategoryIcon category={getDeviceCategory(item)} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-950">
                    {getDeviceName(item)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatMoney(
                      item.monthlyCost,
                      locale,
                      item.currency
                    )}{" "}
                    {text.perMonth} ·{" "}
                    {formatMoney(
                      item.yearlyCost,
                      locale,
                      item.currency
                    )}{" "}
                    {text.perYear}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatUses(item.usesPerWeek, locale)}{" "}
                    {text.usesPerWeek}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onOpen(item);
                      setNotice("");
                    }}
                    className="min-h-7 rounded px-2 py-1 text-[11px] font-bold text-[var(--brand-green)] transition hover:bg-[#dcfce8]"
                  >
                    {text.open}
                  </button>
                  <span aria-hidden="true" className="h-3.5 w-px bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => removeDevice(item.id)}
                    className="min-h-7 rounded px-2 py-1 text-[11px] font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-700"
                  >
                    {text.remove}
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        </details>
      ) : null}

      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="max-w-2xl text-xs leading-5 text-slate-500">
          {text.storedLocally}
        </p>

        <div className="mt-4 flex flex-col items-start gap-3">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={importDevices}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="group inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-1.5 text-[11px] font-bold text-[var(--brand-green)] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#b8efcc] hover:bg-[#dcfce8] hover:text-[var(--brand-green)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dcfce8] focus-visible:ring-offset-2"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 13V3" />
                <path d="m6.5 6.5 3.5-3.5 3.5 3.5" />
                <path d="M4 11v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" />
              </svg>
              {text.import}
            </button>
            {savedDevices.length > 0 && (
              <button
                type="button"
                onClick={exportDevices}
                className="group inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-1.5 text-[11px] font-bold text-[var(--brand-green)] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#b8efcc] hover:bg-[#dcfce8] hover:text-[var(--brand-green)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dcfce8] focus-visible:ring-offset-2"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 3v10" />
                  <path d="m6.5 9.5 3.5 3.5 3.5-3.5" />
                  <path d="M4 11v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" />
                </svg>
                {text.export}
              </button>
            )}
          </div>

          {savedDevices.length > 0 && (
              <button
                type="button"
                onClick={removeAllDevices}
                className="px-1 py-1 text-[11px] font-medium text-slate-400 transition hover:text-red-600 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              >
                {text.removeAll}
              </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default MyDevicesPanel;
