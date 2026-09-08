"use client";

import { useEffect, useState } from "react";

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
    perMonth: "pro Monat",
    perYear: "pro Jahr",
    open: "Öffnen",
    remove: "Löschen",
    removeAll: "Alle lokalen Geräte löschen",
    removeAllConfirm:
      "Möchtest du wirklich alle lokal gespeicherten Geräte löschen?",
    storedLocally:
      "Die Daten bleiben ausschließlich in diesem Browser. Wenn du Browserdaten löschst oder das Gerät wechselst, sind sie nicht mehr verfügbar.",
    usesPerWeek: "Nutzungen/Woche",
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
    perMonth: "per month",
    perYear: "per year",
    open: "Open",
    remove: "Delete",
    removeAll: "Delete all local devices",
    removeAllConfirm:
      "Do you really want to delete all locally saved devices?",
    storedLocally:
      "The data stays exclusively in this browser. If you clear browser data or switch devices, it will no longer be available.",
    usesPerWeek: "Uses/week",
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

export default function MyDevicesPanel({
  locale,
  currentDevice,
  canSave,
  activeSavedDeviceId,
  onActiveSavedDeviceChange,
  onOpen,
}: MyDevicesPanelProps) {
  const text = copy[locale];
  const [savedDevices, setSavedDevices] = useState<SavedDevice[]>([]);
  const [notice, setNotice] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSavedDevices(
        readSavedDevices(
          window.localStorage.getItem(SAVED_DEVICES_STORAGE_KEY)
        )
      );
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
    onActiveSavedDeviceChange(id);
    setNotice(
      activeSavedDeviceId ? text.updated : text.saved
    );
  }

  function removeDevice(id: string) {
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
      };
    })
    .filter((total) => total.count > 0);

  return (
    <div
      id="meine-geraete"
      className="mt-6 rounded-2xl border border-green-100 bg-[#f5f9f5] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800"
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
        </div>

        <button
          type="button"
          onClick={saveCurrentDevice}
          disabled={!canSave}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-800 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none active:scale-[0.98]"
        >
          {activeSavedDeviceId ? text.update : text.save}
        </button>
      </div>

      {notice && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-green-800"
        >
          {notice}
        </p>
      )}

      {totals.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {totals.map((total) => (
            <div
              key={total.currency}
              className="rounded-xl border border-green-100 bg-white p-4"
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
            </div>
          ))}
        </div>
      )}

      {storageReady && savedDevices.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-5 text-center">
          <p className="text-sm leading-6 text-slate-500">
            {text.empty}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {savedDevices.map((item) => (
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

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onOpen(item);
                      setNotice("");
                    }}
                    className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-100"
                  >
                    {text.open}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDevice(item.id)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    {text.remove}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-green-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-xs leading-5 text-slate-500">
          {text.storedLocally}
        </p>

        {savedDevices.length > 0 && (
          <button
            type="button"
            onClick={removeAllDevices}
            className="shrink-0 self-start text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-red-700 sm:self-auto"
          >
            {text.removeAll}
          </button>
        )}
      </div>
    </div>
  );
}
