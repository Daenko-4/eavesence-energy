"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { devices } from "@/data/devices";
import { getDevicesHref, type Locale } from "@/i18n/config";
import {
  getLocalizedCategory,
  getLocalizedDevice,
} from "@/i18n/devices";
import type {
  SavedDevice,
  SavedDeviceCurrency,
} from "@/lib/savedDevices";

import MyDevicesPanel from "./MyDevicesPanel";

const CUSTOM_DEVICE = "__custom_device__";

/*
  Hier bitte wieder dieselbe Feedback-E-Mail einsetzen,
  die aktuell bereits in deiner Datei verwendet wird.
*/
const FEEDBACK_EMAIL = "parkwaydrive@gmx.at";

type Mode = "estimate" | "exact";
type NumericInput = number | "";
type CurrencyCode = SavedDeviceCurrency;

const CURRENCY_STORAGE_KEY = "eavesence-currency";
const RECENT_DEVICES_STORAGE_KEY = "eavesence-recent-devices";

const currencies: Array<{
  code: CurrencyCode;
  symbol: string;
}> = [
  { code: "EUR", symbol: "€" },
  { code: "CHF", symbol: "CHF" },
  { code: "GBP", symbol: "£" },
  { code: "PLN", symbol: "PLN" },
  { code: "CZK", symbol: "CZK" },
  { code: "HUF", symbol: "HUF" },
  { code: "DKK", symbol: "DKK" },
  { code: "SEK", symbol: "SEK" },
  { code: "NOK", symbol: "NOK" },
  { code: "RON", symbol: "RON" },
];

const highPriceThresholds: Record<CurrencyCode, number> = {
  EUR: 1,
  CHF: 1,
  GBP: 1,
  PLN: 5,
  CZK: 25,
  HUF: 400,
  DKK: 8,
  SEK: 12,
  NOK: 12,
  RON: 5,
};

function isCurrencyCode(value: string): value is CurrencyCode {
  return currencies.some((currency) => currency.code === value);
}

type EnergyCalculatorProps = {
  initialDevice?: string;
  controlledMode?: Mode;
  onModeChange?: (mode: Mode) => void;
  locale?: Locale;
  detailPage?: boolean;
};

const calculatorText = {
  de: {
    modes: {
      estimate: "Typische Verbrauchswerte",
      exact: "Eigene Verbrauchswerte",
      estimateDescription:
        "EAVESENCE verwendet Orientierungswerte, die du an deine Nutzung anpassen kannst.",
      exactDescription:
        "Nutze einen gemessenen oder anderweitig bekannten Verbrauch in kWh pro Nutzung.",
    },

    device: {
      label: "Gerät",
      search: "Gerät suchen",
      searchPlaceholder: "z. B. Waschmaschine",
      recent: "Zuletzt verwendet",
      noResults: "Kein passendes Gerät gefunden.",
      otherCategory: "Andere",
      custom: "Eigenes Gerät",
      customName: "Name des Geräts",
      customPlaceholder: "z. B. Ventilator",
      customHint:
        "Optional – der Name erscheint später in deinem Ergebnis.",
      change: "Anderes Gerät wählen",
    },

    fields: {
      power: "Leistung",
      minutesPerUse: "Minuten pro Nutzung",
      consumptionPerUse: "Verbrauch pro Nutzung",
      actualConsumptionPerUse:
        "Tatsächlicher Verbrauch pro Nutzung",
      electricityPrice: "Strompreis",
      currency: "Währung",
      usesPerWeek: "Nutzungen pro Woche",
    },

    hints: {
      customPower:
        "Die Wattzahl findest du häufig auf dem Typenschild.",
      devicePower:
        "Orientierungswert – prüfe wenn möglich die Angabe auf deinem Gerät.",
      customMinutes:
        "Trage die ungefähre Laufzeit pro Nutzung ein.",
      deviceMinutes:
        "Vorgeschlagener Startwert – bitte an deine Nutzung anpassen.",
      estimatedConsumption:
        "Orientierungswert – passe ihn an, wenn du einen besseren Wert für dein Gerät oder Programm kennst.",
      measuredConsumption:
        "Zum Beispiel ein Wert aus einem Strommessgerät oder einer Herstellerangabe.",
      electricityPrice:
        "Deinen Arbeitspreis findest du auf deiner Stromrechnung.",
      usesPerWeek:
        "Auch Dezimalwerte sind möglich, zum Beispiel 0,5 für etwa jede zweite Woche.",
    },

    missing: {
      title: "Noch fehlen Angaben",
      text:
        "Gib für alle benötigten Felder einen Wert größer als 0 ein, damit EAVESENCE deine Stromkosten berechnen kann.",
    },

    warnings: {
      title: "🔎 Bitte kurz prüfen",
      highPrice:
        "Der Strompreis ist ungewöhnlich hoch. Prüfe bitte deine Eingabe.",
      manyUses:
        "Mehr als 168 Nutzungen pro Woche wirken ungewöhnlich. Prüfe bitte deine Eingabe.",
      highPower:
        "Eine Leistung über 10.000 W ist für ein typisches Haushaltsgerät ungewöhnlich.",
      longDuration:
        "Die angegebene Nutzungsdauer liegt über 24 Stunden pro Nutzung.",
      highConsumption:
        "Mehr als 50 kWh pro Nutzung ist für ein typisches Haushaltsgerät ungewöhnlich.",
    },

    result: {
      costsYou: "kostet dich",
      estimate: "Schätzung",
      ownValue: "Eigener Verbrauchswert",
      perYear: "pro Jahr",
      perUse: "Pro Nutzung",
      perWeek: "Pro Woche",
      perMonth: "Pro Monat",
      consumptionPerYear: "Verbrauch/Jahr",
      title: "Dein Ergebnis",
      waiting:
        "Bereit, sobald deine Angaben vollständig sind.",
      waitingText:
        "EAVESENCE zeigt dir dann Kosten pro Nutzung, Woche, Monat und Jahr.",
      details: "So wurde das berechnet",
      formula: "Berechnungsgrundlage",
      scenario: "Was wäre, wenn?",
      scenarioText: "Alternative Nutzung",
      currentUses: "Aktuell",
      newYearlyCost: "Neue Jahreskosten",
      savings: "Du sparst pro Jahr",
      viewResult: "Ergebnis ansehen",
    },

    comparison: {
      open: "Mit einem anderen Gerät vergleichen",
      close: "Vergleich schließen",
      title: "Geräte vergleichen",
      description:
        "Vergleiche deine aktuelle Berechnung mit den typischen Werten eines zweiten Geräts.",
      current: "Aktuelle Berechnung",
      alternative: "Vergleichsgerät",
      select: "Zweites Gerät",
      uses: "Nutzungen pro Woche",
      yearlyCost: "Kosten pro Jahr",
      yearlyConsumption: "Verbrauch pro Jahr",
      perUse: "Kosten pro Nutzung",
      lowerBy: "Günstiger pro Jahr",
      same: "Beide Varianten kosten ungefähr gleich viel.",
      typicalNote:
        "Das Vergleichsgerät verwendet die hinterlegten typischen Verbrauchswerte.",
    },

    savingTip: {
      title: "💡 Spartipp",
      custom:
        "Prüfe die Leistungs- oder Verbrauchsangabe auf dem Typenschild, in der Bedienungsanleitung oder mit einem Strommessgerät.",
      fallback:
        "Vergleiche deinen tatsächlichen Verbrauch mit dem geschätzten Wert.",
    },

    accuracy: {
      title: "Hinweis zur Genauigkeit",
      consumptionEstimate:
        "Die Berechnung nutzt einen anpassbaren Orientierungswert für den Verbrauch pro Nutzung. Der tatsächliche Verbrauch kann je nach Gerät, Programm und Nutzung abweichen.",
      powerEstimate:
        "Die Berechnung nutzt Leistung × Nutzungsdauer als Näherung. Bei Geräten, deren Leistungsaufnahme während des Betriebs schwankt, kann der tatsächliche Verbrauch abweichen.",
      exact:
        "Die Berechnung verwendet den von dir angegebenen Verbrauch pro Nutzung. Die Genauigkeit hängt davon ab, wie zuverlässig dieser Wert ermittelt wurde.",
    },

    feedback: {
      title: "💬 Hat dir EAVESENCE geholfen?",
      text:
        "Fehlt dir ein Gerät, war etwas unklar oder hast du eine Idee, wie EAVESENCE besser werden kann? Kurzes Feedback hilft uns sehr.",
      button: "Feedback senden",
      note:
        "Der Button öffnet dein E-Mail-Programm. EAVESENCE speichert dabei keine Daten und verwendet weiterhin kein Tracking.",
      subject: "Feedback zu EAVESENCE Energy",
    },

    reset: "Werte zurücksetzen",
    fallbackDevice: "Gerät",
  },

  en: {
    modes: {
      estimate: "Typical consumption",
      exact: "Your consumption",
      estimateDescription:
        "EAVESENCE uses typical values that you can adjust to match your usage.",
      exactDescription:
        "Use a measured or otherwise known electricity consumption in kWh per use.",
    },

    device: {
      label: "Device",
      search: "Search devices",
      searchPlaceholder: "e.g. Washing machine",
      recent: "Recently used",
      noResults: "No matching device found.",
      otherCategory: "Other",
      custom: "Custom device",
      customName: "Device name",
      customPlaceholder: "e.g. Fan",
      customHint:
        "Optional – the name will appear in your result.",
      change: "Choose another device",
    },

    fields: {
      power: "Power",
      minutesPerUse: "Minutes per use",
      consumptionPerUse: "Consumption per use",
      actualConsumptionPerUse:
        "Actual consumption per use",
      electricityPrice: "Electricity price",
      currency: "Currency",
      usesPerWeek: "Uses per week",
    },

    hints: {
      customPower:
        "You can often find the wattage on the device label.",
      devicePower:
        "Typical value – check the rating on your device if possible.",
      customMinutes:
        "Enter the approximate running time per use.",
      deviceMinutes:
        "Suggested starting value – adjust it to match your usage.",
      estimatedConsumption:
        "Typical value – adjust it if you know a more accurate figure for your device or program.",
      measuredConsumption:
        "For example, a value from an electricity meter or manufacturer specification.",
      electricityPrice:
        "You can find your electricity price on your electricity bill.",
      usesPerWeek:
        "Decimal values are also possible, for example 0.5 for roughly every second week.",
    },

    missing: {
      title: "Some details are still missing",
      text:
        "Enter a value greater than 0 in all required fields so EAVESENCE can calculate your electricity costs.",
    },

    warnings: {
      title: "🔎 Please check",
      highPrice:
        "The electricity price looks unusually high. Please check your entry.",
      manyUses:
        "More than 168 uses per week looks unusual. Please check your entry.",
      highPower:
        "A power rating above 10,000 W is unusual for a typical household device.",
      longDuration:
        "The entered usage duration is longer than 24 hours per use.",
      highConsumption:
        "More than 50 kWh per use is unusual for a typical household device.",
    },

    result: {
      costsYou: "costs you",
      estimate: "Estimate",
      ownValue: "Your consumption value",
      perYear: "per year",
      perUse: "Per use",
      perWeek: "Per week",
      perMonth: "Per month",
      consumptionPerYear: "Consumption/year",
      title: "Your result",
      waiting:
        "Ready as soon as your details are complete.",
      waitingText:
        "EAVESENCE will show your costs per use, week, month and year.",
      details: "How this was calculated",
      formula: "Calculation basis",
      scenario: "What if?",
      scenarioText: "Alternative use",
      currentUses: "Current use",
      newYearlyCost: "New yearly cost",
      savings: "You save per year",
      viewResult: "View result",
    },

    comparison: {
      open: "Compare with another device",
      close: "Close comparison",
      title: "Compare devices",
      description:
        "Compare your current calculation with the typical values of a second device.",
      current: "Current calculation",
      alternative: "Comparison device",
      select: "Second device",
      uses: "Uses per week",
      yearlyCost: "Cost per year",
      yearlyConsumption: "Consumption per year",
      perUse: "Cost per use",
      lowerBy: "Lower per year",
      same: "Both options cost approximately the same.",
      typicalNote:
        "The comparison device uses the stored typical consumption values.",
    },

    savingTip: {
      title: "💡 Energy-saving tip",
      custom:
        "Check the power or consumption rating on the device label, in the instruction manual or with an electricity meter.",
      fallback:
        "Compare your actual electricity consumption with the estimated value.",
    },

    accuracy: {
      title: "Accuracy note",
      consumptionEstimate:
        "The calculation uses an adjustable typical value for electricity consumption per use. Actual consumption may vary depending on the device, program and usage.",
      powerEstimate:
        "The calculation uses power × usage duration as an estimate. For devices whose power consumption varies during operation, actual electricity consumption may differ.",
      exact:
        "The calculation uses the electricity consumption per use that you entered. Accuracy depends on how reliably this value was measured or determined.",
    },

    feedback: {
      title: "💬 Did EAVESENCE help you?",
      text:
        "Is a device missing, was something unclear or do you have an idea for improving EAVESENCE? A short message helps us a lot.",
      button: "Send feedback",
      note:
        "The button opens your email application. EAVESENCE does not store any data and continues to use no tracking.",
      subject: "Feedback about EAVESENCE Energy",
    },

    reset: "Reset values",
    fallbackDevice: "Device",
  },
} as const;

function nonNegative(value: number) {
  return Math.max(0, value);
}

function parseNumericInput(value: string): NumericInput {
  if (value === "") {
    return "";
  }

  return nonNegative(Number(value));
}

function numericValue(value: NumericInput) {
  return value === "" ? 0 : value;
}

function formatNumber(
  value: number,
  locale: Locale,
  minimumFractionDigits: number,
  maximumFractionDigits: number
) {
  return value.toLocaleString(
    locale === "de" ? "de-DE" : "en-US",
    {
      minimumFractionDigits,
      maximumFractionDigits,
    }
  );
}

function formatMoney(
  value: number,
  locale: Locale,
  currency: CurrencyCode
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

function formatKwh(value: number, locale: Locale) {
  return formatNumber(value, locale, 1, 1);
}

function LeafIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 4C12 4 6 8 5 16c4.5.6 8.2-.7 11-3.5C18.2 10.3 19.4 7.4 20 4Z" />
      <path d="M5 20c2.3-5.2 5.8-9 11-11.5" />
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 11h2" />
      <path d="M12 11h2" />
      <path d="M16 11h1" />
      <path d="M8 15h2" />
      <path d="M12 15h2" />
      <path d="M16 15h1" />
      <path d="M8 18h2" />
      <path d="M12 18h5" />
    </svg>
  );
}

export default function EnergyCalculator({
  initialDevice = "Wasserkocher",
  controlledMode,
  onModeChange,
  locale,
  detailPage = false,
}: EnergyCalculatorProps) {
  const pathname = usePathname();

  /*
    Falls locale später explizit übergeben wird, verwenden wir den Prop.
    Auf der jetzigen /en-Seite funktioniert der Rechner aber bereits
    automatisch anhand des Pfads.
  */
  const activeLocale: Locale =
    locale ??
    (pathname === "/en" || pathname.startsWith("/en/")
      ? "en"
      : "de");

  const text = calculatorText[activeLocale];

  const mobileModeLabels =
    activeLocale === "de"
      ? {
          estimateFirst: "Typische",
          estimateSecond: "Verbrauchswerte",
          exactFirst: "Eigene",
          exactSecond: "Verbrauchswerte",
        }
      : {
          estimateFirst: "Typical",
          estimateSecond: "consumption",
          exactFirst: "Your",
          exactSecond: "consumption",
        };

  const initialDeviceData =
    devices.find((item) => item.name === initialDevice) ??
    devices[0];

  const initialWatts = initialDeviceData.watts ?? 0;
  const initialMinutes =
    initialDeviceData.typicalMinutes ?? 0;
  const initialUses =
    initialDeviceData.typicalUsesPerWeek ?? 1;
  const initialEstimatedKwh =
    initialDeviceData.kwhPerUse ?? 0;

  const initialMeasuredKwh =
    initialDeviceData.calculationType === "consumption"
      ? initialDeviceData.kwhPerUse ?? 0
      : (initialWatts / 1000) *
        (initialMinutes / 60);

  const [internalMode, setInternalMode] =
    useState<Mode>("estimate");

  const mode = controlledMode ?? internalMode;

  function changeMode(newMode: Mode) {
    setInternalMode(newMode);
    onModeChange?.(newMode);
  }

  /*
    Intern verwenden wir weiterhin die deutschen Gerätenamen als stabile
    IDs. Sichtbar wird aber je nach Sprache der lokalisierte Name.
  */
  const [device, setDevice] = useState(
    initialDeviceData.name
  );
  const [deviceSearch, setDeviceSearch] = useState("");
  const [recentDevices, setRecentDevices] = useState<string[]>([]);
  const [scenarioUsesPerWeek, setScenarioUsesPerWeek] =
    useState<NumericInput>(Math.max(0, initialUses - 1));
  const [resultVisible, setResultVisible] = useState(false);
  const initialComparisonDevice =
    devices.find((item) => item.name !== initialDeviceData.name) ?? devices[0];
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonDeviceName, setComparisonDeviceName] = useState(
    initialComparisonDevice.name
  );
  const [comparisonUsesPerWeek, setComparisonUsesPerWeek] =
    useState<NumericInput>(initialComparisonDevice.typicalUsesPerWeek ?? 1);

  const [
    activeSavedDeviceId,
    setActiveSavedDeviceId,
  ] = useState<string | null>(null);

  const [customDeviceName, setCustomDeviceName] =
    useState("");

  const [price, setPrice] =
    useState<NumericInput>(0.35);

  const [currency, setCurrency] =
    useState<CurrencyCode>("EUR");

  const currencySymbol =
    currencies.find((item) => item.code === currency)?.symbol ?? currency;

  useEffect(() => {
    const storedCurrency = window.localStorage.getItem(
      CURRENCY_STORAGE_KEY
    );

    if (!storedCurrency || !isCurrencyCode(storedCurrency)) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setCurrency(storedCurrency);
      setPrice(storedCurrency === "EUR" ? 0.35 : "");
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(
      RECENT_DEVICES_STORAGE_KEY
    );

    if (!stored) return;

    try {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const recent = parsed.filter(
          (item): item is string =>
            typeof item === "string" &&
            devices.some((candidate) => candidate.name === item)
        ).slice(0, 3);
        const frame = window.requestAnimationFrame(() => {
          setRecentDevices(recent);
        });
        return () => window.cancelAnimationFrame(frame);
      }
    } catch {
      window.localStorage.removeItem(RECENT_DEVICES_STORAGE_KEY);
    }
  }, []);

  function changeCurrency(value: string) {
    if (!isCurrencyCode(value)) {
      return;
    }

    setCurrency(value);
    setPrice(value === "EUR" ? 0.35 : "");
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, value);
  }

  const [watts, setWatts] =
    useState<NumericInput>(initialWatts);

  const [minutesPerUse, setMinutesPerUse] =
    useState<NumericInput>(initialMinutes);

  const [usesPerWeek, setUsesPerWeek] =
    useState<NumericInput>(initialUses);

  const [
    estimatedKwhPerUse,
    setEstimatedKwhPerUse,
  ] = useState<NumericInput>(initialEstimatedKwh);

  const [
    measuredKwhPerUse,
    setMeasuredKwhPerUse,
  ] = useState<NumericInput>(
    Number(initialMeasuredKwh.toFixed(3))
  );

  const selectedDevice = devices.find(
    (item) => item.name === device
  );

  const isCustomDevice =
    device === CUSTOM_DEVICE;

  const isPowerDevice =
    isCustomDevice ||
    selectedDevice?.calculationType === "power";

  const isConsumptionDevice =
    !isCustomDevice &&
    selectedDevice?.calculationType ===
      "consumption";

  const localizedSelectedDevice = selectedDevice
    ? getLocalizedDevice(
        selectedDevice,
        activeLocale
      )
    : undefined;

  const displayDeviceName =
    isCustomDevice && customDeviceName.trim()
      ? customDeviceName.trim()
      : localizedSelectedDevice?.name ??
        text.fallbackDevice;

  /*
    Kategorien bleiben intern ebenfalls deutsch.
    Nur die sichtbare Beschriftung wird lokalisiert.
  */
  const categories = Array.from(
    new Set(
      devices.map((item) => item.category)
    )
  );

  const normalizedDeviceSearch = deviceSearch.trim().toLocaleLowerCase(
    activeLocale === "de" ? "de-DE" : "en-GB"
  );
  const visibleDevices = devices.filter((item) => {
    if (!normalizedDeviceSearch) return true;

    const localized = getLocalizedDevice(item, activeLocale);
    const category = getLocalizedCategory(item.category, activeLocale);

    return `${localized.name} ${category}`
      .toLocaleLowerCase(activeLocale === "de" ? "de-DE" : "en-GB")
      .includes(normalizedDeviceSearch);
  });

  function loadDeviceDefaults(name: string) {
    if (name === CUSTOM_DEVICE) {
      setCustomDeviceName("");
      setWatts(0);
      setMinutesPerUse(0);
      setUsesPerWeek(1);
      setScenarioUsesPerWeek(0);
      setEstimatedKwhPerUse(0);
      setMeasuredKwhPerUse(0);
      return;
    }

    const selected = devices.find(
      (item) => item.name === name
    );

    if (!selected) {
      return;
    }

    setWatts(selected.watts ?? 0);

    setMinutesPerUse(
      selected.typicalMinutes ?? 0
    );

    const selectedUses = selected.typicalUsesPerWeek ?? 1;
    setUsesPerWeek(selectedUses);
    setScenarioUsesPerWeek(Math.max(0, selectedUses - 1));

    setEstimatedKwhPerUse(
      selected.kwhPerUse ?? 0
    );

    if (
      selected.calculationType ===
      "consumption"
    ) {
      setMeasuredKwhPerUse(
        selected.kwhPerUse ?? 0
      );
    } else {
      const estimatedConsumption =
        ((selected.watts ?? 0) / 1000) *
        ((selected.typicalMinutes ?? 0) /
          60);

      setMeasuredKwhPerUse(
        Number(
          estimatedConsumption.toFixed(3)
        )
      );
    }
  }

  function handleDeviceChange(name: string) {
    setDevice(name);
    setDeviceSearch("");
    loadDeviceDefaults(name);
    setActiveSavedDeviceId(null);

    if (name === comparisonDeviceName) {
      const alternative = devices.find((item) => item.name !== name);
      if (alternative) {
        setComparisonDeviceName(alternative.name);
        setComparisonUsesPerWeek(alternative.typicalUsesPerWeek ?? 1);
      }
    }

    if (name !== CUSTOM_DEVICE) {
      setRecentDevices((current) => {
        const next = [
          name,
          ...current.filter((item) => item !== name),
        ].slice(0, 3);
        window.localStorage.setItem(
          RECENT_DEVICES_STORAGE_KEY,
          JSON.stringify(next)
        );
        return next;
      });
    }
  }

  function handleComparisonDeviceChange(name: string) {
    const comparisonDevice = devices.find((item) => item.name === name);
    if (!comparisonDevice) return;

    setComparisonDeviceName(name);
    setComparisonUsesPerWeek(comparisonDevice.typicalUsesPerWeek ?? 1);
  }

  function handleOpenSavedDevice(item: SavedDevice) {
    setDevice(item.device);
    setCustomDeviceName(item.customDeviceName);
    changeMode(item.mode);
    setCurrency(item.currency);
    setPrice(item.price);
    setWatts(item.watts);
    setMinutesPerUse(item.minutesPerUse);
    setUsesPerWeek(item.usesPerWeek);
    setScenarioUsesPerWeek(Math.max(0, item.usesPerWeek - 1));
    setEstimatedKwhPerUse(item.estimatedKwhPerUse);
    setMeasuredKwhPerUse(item.measuredKwhPerUse);
    setActiveSavedDeviceId(item.id);

    if (item.device === comparisonDeviceName) {
      const alternative = devices.find(
        (candidate) => candidate.name !== item.device
      );
      if (alternative) {
        setComparisonDeviceName(alternative.name);
        setComparisonUsesPerWeek(alternative.typicalUsesPerWeek ?? 1);
      }
    }
    window.localStorage.setItem(
      CURRENCY_STORAGE_KEY,
      item.currency
    );

    window.requestAnimationFrame(() => {
      document
        .getElementById("rechner")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }

  function handleReset() {
    setPrice(currency === "EUR" ? 0.35 : "");
    loadDeviceDefaults(device);

    window.requestAnimationFrame(() => {
      document
        .getElementById("rechner")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }

  const resultRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resultElement = resultRef.current;
    if (!resultElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => setResultVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(resultElement);

    return () => observer.disconnect();
  }, []);

  /*
    MOBILE:
    Nach dem letzten Feld automatisch zum Ergebnis.
  */
  function scrollToResultAfterLastField() {
    if (window.innerWidth >= 640) {
      return;
    }

    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
  }

  /*
    DESKTOP:
    Beim Fokussieren relevanter Felder das Ergebnis
    dezent in den sichtbaren Bereich holen.
  */
  function handleCalculatorFieldFocus() {
    if (window.innerWidth < 640) {
      return;
    }

    window.setTimeout(() => {
      const resultElement =
        resultRef.current;

      if (!resultElement) {
        return;
      }

      const resultRect =
        resultElement.getBoundingClientRect();

      const viewportHeight =
        window.innerHeight;

      const resultIsAlreadyVisible =
        resultRect.top <
          viewportHeight * 0.82 &&
        resultRect.bottom > 96;

      if (resultIsAlreadyVisible) {
        return;
      }

      const resultTargetPosition =
        viewportHeight * 0.58;

      window.scrollBy({
        top:
          resultRect.top -
          resultTargetPosition,
        behavior: "smooth",
      });
    }, 80);
  }

  const priceValue =
    numericValue(price);

  const wattsValue =
    numericValue(watts);

  const minutesPerUseValue =
    numericValue(minutesPerUse);

  const usesPerWeekValue =
    numericValue(usesPerWeek);

  const estimatedKwhPerUseValue =
    numericValue(estimatedKwhPerUse);

  const measuredKwhPerUseValue =
    numericValue(measuredKwhPerUse);

  const calculatedPowerKwhPerUse =
    (wattsValue / 1000) *
    (minutesPerUseValue / 60);

  const estimateKwhPerUse =
    isConsumptionDevice
      ? estimatedKwhPerUseValue
      : calculatedPowerKwhPerUse;

  const actualKwhPerUse =
    mode === "estimate"
      ? estimateKwhPerUse
      : measuredKwhPerUseValue;

  const hasValidPrice =
    priceValue > 0;

  const hasValidUses =
    usesPerWeekValue > 0;

  const hasValidConsumption =
    mode === "exact"
      ? measuredKwhPerUseValue > 0
      : isConsumptionDevice
        ? estimatedKwhPerUseValue > 0
        : wattsValue > 0 &&
          minutesPerUseValue > 0;

  const calculationIsValid =
    hasValidPrice &&
    hasValidUses &&
    hasValidConsumption;

  const yearlyKwh =
    calculationIsValid
      ? actualKwhPerUse *
        usesPerWeekValue *
        52
      : 0;

  const yearlyCost =
    yearlyKwh * priceValue;

  const monthlyCost =
    yearlyCost / 12;

  const weeklyCost =
    yearlyCost / 52;

  const costPerUse =
    actualKwhPerUse * priceValue;

  const scenarioUsesPerWeekValue = Math.min(
    numericValue(scenarioUsesPerWeek),
    usesPerWeekValue
  );
  const scenarioYearlyCost =
    actualKwhPerUse * scenarioUsesPerWeekValue * 52 * priceValue;
  const scenarioSavings = yearlyCost - scenarioYearlyCost;

  const comparisonDevice =
    devices.find((item) => item.name === comparisonDeviceName) ?? devices[0];
  const localizedComparisonDevice = getLocalizedDevice(
    comparisonDevice,
    activeLocale
  );
  const comparisonKwhPerUse =
    comparisonDevice.calculationType === "consumption"
      ? comparisonDevice.kwhPerUse ?? 0
      : ((comparisonDevice.watts ?? 0) / 1000) *
        ((comparisonDevice.typicalMinutes ?? 0) / 60);
  const comparisonUsesValue = numericValue(comparisonUsesPerWeek);
  const comparisonYearlyKwh = comparisonKwhPerUse * comparisonUsesValue * 52;
  const comparisonYearlyCost = comparisonYearlyKwh * priceValue;
  const comparisonCostPerUse = comparisonKwhPerUse * priceValue;
  const comparisonDifference = Math.abs(yearlyCost - comparisonYearlyCost);
  const currentIsCheaper = yearlyCost < comparisonYearlyCost;

  const warnings: string[] = [];

  if (priceValue > highPriceThresholds[currency]) {
    warnings.push(
      text.warnings.highPrice
    );
  }

  if (usesPerWeekValue > 168) {
    warnings.push(
      text.warnings.manyUses
    );
  }

  if (
    mode === "estimate" &&
    isPowerDevice &&
    wattsValue > 10000
  ) {
    warnings.push(
      text.warnings.highPower
    );
  }

  if (
    mode === "estimate" &&
    isPowerDevice &&
    minutesPerUseValue > 1440
  ) {
    warnings.push(
      text.warnings.longDuration
    );
  }

  if (
    mode === "exact" &&
    measuredKwhPerUseValue > 50
  ) {
    warnings.push(
      text.warnings.highConsumption
    );
  }

  const localizedTip =
    isCustomDevice
      ? text.savingTip.custom
      : localizedSelectedDevice?.tip ??
        text.savingTip.fallback;

  const fieldClassName =
    "w-full rounded-xl border border-slate-200 bg-[#fbfcfb] px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100";

  const feedbackSubject =
    encodeURIComponent(
      text.feedback.subject
    );

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
      {/* Mode switch */}
      <div className="mb-8">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1.5">
          <button
            type="button"
            onClick={() =>
              changeMode("estimate")
            }
            className={`relative flex min-h-[68px] items-center justify-center rounded-lg px-2 py-3 text-sm font-black transition duration-200 active:scale-[0.99] sm:min-h-0 sm:px-3 ${
              mode === "estimate"
                ? "bg-green-100 text-green-950 shadow-sm"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            <span className="flex flex-col items-center justify-center text-center leading-tight sm:hidden">
              <span className="flex items-center justify-center gap-1.5">
                <span className="shrink-0">
                  <LeafIcon />
                </span>
                <span>{mobileModeLabels.estimateFirst}</span>
              </span>
              <span className="mt-1 block">
                {mobileModeLabels.estimateSecond}
              </span>
            </span>

            <span className="hidden items-center justify-center gap-2 text-center sm:flex">
              <span className="shrink-0">
                <LeafIcon />
              </span>
              <span>{text.modes.estimate}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              changeMode("exact")
            }
            className={`relative flex min-h-[68px] items-center justify-center rounded-lg px-2 py-3 text-sm font-black transition duration-200 active:scale-[0.99] sm:min-h-0 sm:px-3 ${
              mode === "exact"
                ? "bg-green-100 text-green-950 shadow-sm"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            <span className="flex flex-col items-center justify-center text-center leading-tight sm:hidden">
              <span className="flex items-center justify-center gap-1.5">
                <span className="shrink-0">
                  <CalculatorIcon />
                </span>
                <span>{mobileModeLabels.exactFirst}</span>
              </span>
              <span className="mt-1 block">
                {mobileModeLabels.exactSecond}
              </span>
            </span>

            <span className="hidden items-center justify-center gap-2 text-center sm:flex">
              <span className="shrink-0">
                <CalculatorIcon />
              </span>
              <span>{text.modes.exact}</span>
            </span>
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-500">
          {mode === "estimate"
            ? text.modes
                .estimateDescription
            : text.modes
                .exactDescription}
        </p>
      </div>

      {/* Device */}
      <div className="mb-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-green-700">
          1 · {text.device.label}
        </p>
        {detailPage ? (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-[#fbfcfb] px-4 py-3.5">
            <span className="font-semibold text-slate-900">
              {displayDeviceName}
            </span>
            <a
              href={getDevicesHref(activeLocale)}
              className="shrink-0 text-sm font-semibold text-green-800 transition hover:text-green-950"
            >
              {text.device.change}
            </a>
          </div>
        ) : (
          <>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {text.device.label}
            </label>

            <select
          value={device}
          onChange={(event) =>
            handleDeviceChange(
              event.target.value
            )
          }
          className={fieldClassName}
        >
          {categories
            .filter((category) =>
              visibleDevices.some((item) => item.category === category)
            )
            .map((category) => (
            <optgroup
              key={category}
              label={getLocalizedCategory(
                category,
                activeLocale
              )}
            >
              {visibleDevices
                .filter(
                  (item) =>
                    item.category ===
                    category
                )
                .map((item) => {
                  const localizedDevice =
                    getLocalizedDevice(
                      item,
                      activeLocale
                    );

                  return (
                    <option
                      key={item.name}
                      value={item.name}
                    >
                      {
                        localizedDevice.name
                      }
                    </option>
                  );
                })}
            </optgroup>
          ))}

          <optgroup
            label={
              text.device.otherCategory
            }
          >
            <option
              value={CUSTOM_DEVICE}
            >
              {text.device.custom}
            </option>
          </optgroup>
            </select>

            <details className="group mt-3">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-green-800 transition hover:text-green-950 [&::-webkit-details-marker]:hidden">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4 4" />
            </svg>
            {text.device.search}
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-90"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m7.5 5 5 5-5 5" />
            </svg>
          </summary>
          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <input
              type="search"
              value={deviceSearch}
              onChange={(event) => setDeviceSearch(event.target.value)}
              placeholder={text.device.searchPlaceholder}
              className={fieldClassName}
            />

            {normalizedDeviceSearch && visibleDevices.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">
                {text.device.noResults}
              </p>
            )}

            {recentDevices.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">
                  {text.device.recent}:
                </span>
                {recentDevices.map((name) => {
                  const recentDevice = devices.find((item) => item.name === name);
                  if (!recentDevice) return null;

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleDeviceChange(name)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-green-200 hover:text-green-800"
                    >
                      {getLocalizedDevice(recentDevice, activeLocale).name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
            </details>
          </>
        )}
      </div>

      {/* Custom device */}
      {isCustomDevice && (
        <div className="mb-8 rounded-2xl border border-green-100 bg-green-50/70 p-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {text.device.customName}
          </label>

          <input
            type="text"
            value={customDeviceName}
            onChange={(event) =>
              setCustomDeviceName(
                event.target.value
              )
            }
            placeholder={
              text.device
                .customPlaceholder
            }
            className={fieldClassName}
          />

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {text.device.customHint}
          </p>
        </div>
      )}

      {/* Inputs */}
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-green-700">
        2 · {activeLocale === "de" ? "Nutzung" : "Usage"}
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {mode === "estimate" &&
          isPowerDevice && (
            <>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {text.fields.power}
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={watts}
                    onFocus={
                      handleCalculatorFieldFocus
                    }
                    onChange={(event) =>
                      setWatts(
                        parseNumericInput(
                          event.target.value
                        )
                      )
                    }
                    className={`${fieldClassName} pr-14`}
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    W
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isCustomDevice
                    ? text.hints
                        .customPower
                    : text.hints
                        .devicePower}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {
                    text.fields
                      .minutesPerUse
                  }
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    minutesPerUse
                  }
                  onFocus={
                    handleCalculatorFieldFocus
                  }
                  onChange={(event) =>
                    setMinutesPerUse(
                      parseNumericInput(
                        event.target.value
                      )
                    )
                  }
                  className={
                    fieldClassName
                  }
                />

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isCustomDevice
                    ? text.hints
                        .customMinutes
                    : text.hints
                        .deviceMinutes}
                </p>
              </div>
            </>
          )}

        {mode === "estimate" &&
          isConsumptionDevice && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {
                  text.fields
                    .consumptionPerUse
                }
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    estimatedKwhPerUse
                  }
                  onFocus={
                    handleCalculatorFieldFocus
                  }
                  onChange={(event) =>
                    setEstimatedKwhPerUse(
                      parseNumericInput(
                        event.target.value
                      )
                    )
                  }
                  className={`${fieldClassName} pr-16`}
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  kWh
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {
                  text.hints
                    .estimatedConsumption
                }
              </p>
            </div>
          )}

        {mode === "exact" && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {
                text.fields
                  .actualConsumptionPerUse
              }
            </label>

            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  measuredKwhPerUse
                }
                onFocus={
                  handleCalculatorFieldFocus
                }
                onChange={(event) =>
                  setMeasuredKwhPerUse(
                    parseNumericInput(
                      event.target.value
                    )
                  )
                }
                className={`${fieldClassName} pr-16`}
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                kWh
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {
                text.hints
                  .measuredConsumption
              }
            </p>
          </div>
        )}

        {/* Electricity price */}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {
              text.fields
                .electricityPrice
            }
          </label>

          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onFocus={
                handleCalculatorFieldFocus
              }
              onChange={(event) =>
                setPrice(
                  parseNumericInput(
                    event.target.value
                  )
                )
              }
              className={`${fieldClassName} pr-16`}
            />

            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
              {currencySymbol}/kWh
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {
              text.hints
                .electricityPrice
            }
          </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {text.fields.currency}
            </label>

            <select
              value={currency}
              onChange={(event) => changeCurrency(event.target.value)}
              className={fieldClassName}
            >
              {currencies.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} ({item.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Uses */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {
              text.fields
                .usesPerWeek
            }
          </label>

          <input
            type="number"
            min="0"
            step="0.1"
            value={usesPerWeek}
            onFocus={
              handleCalculatorFieldFocus
            }
            onBlur={
              scrollToResultAfterLastField
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                event.currentTarget.blur();
              }
            }}
            onChange={(event) => {
              const nextUses = parseNumericInput(event.target.value);
              setUsesPerWeek(nextUses);
              setScenarioUsesPerWeek(
                Math.max(0, numericValue(nextUses) - 1)
              );
            }}
            className={fieldClassName}
          />

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {text.hints.usesPerWeek}
          </p>
        </div>
      </div>

      {/* Reset */}
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="group inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50/80 px-4 py-2.5 text-sm font-semibold text-green-800 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-100 hover:shadow-md active:translate-y-0 active:scale-[0.97]"
        >
          <span
            aria-hidden="true"
            className="text-base transition-transform duration-200 group-hover:-rotate-45"
          >
            ↻
          </span>
          {text.reset}
        </button>
      </div>

      {/* Missing input */}
      {!calculationIsValid && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-slate-900">
            {text.missing.title}
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            {text.missing.text}
          </p>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="font-semibold text-slate-900">
            {text.warnings.title}
          </p>

          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
            {warnings.map(
              (warning) => (
                <li key={warning}>
                  • {warning}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* Result */}
      <div
        ref={resultRef}
        className="mt-8 rounded-2xl bg-gradient-to-br from-green-950 via-green-900 to-emerald-950 p-6 text-white shadow-lg shadow-green-950/10 sm:p-8"
      >
        {calculationIsValid ? (
          <>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-green-200">
              3 · {text.result.title}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-green-100/80">
                {displayDeviceName}{" "}
                {text.result.costsYou}
              </p>

              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-semibold text-green-50">
                {mode === "estimate"
                  ? text.result.estimate
                  : text.result
                      .ownValue}
              </span>
            </div>

            <div className="mt-3">
              <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                {formatMoney(
                  yearlyCost,
                  activeLocale,
                  currency
                )}
              </span>

              <span className="ml-2 text-green-100/80">
                {text.result.perYear}
              </span>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm text-green-100/75">
                  {
                    text.result
                      .perUse
                  }
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {formatMoney(
                    costPerUse,
                    activeLocale,
                    currency
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm text-green-100/75">
                  {
                    text.result
                      .perWeek
                  }
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {formatMoney(
                    weeklyCost,
                    activeLocale,
                    currency
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm text-green-100/75">
                  {
                    text.result
                      .perMonth
                  }
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {formatMoney(
                    monthlyCost,
                    activeLocale,
                    currency
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm text-green-100/75">
                  {
                    text.result
                      .consumptionPerYear
                  }
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {formatKwh(
                    yearlyKwh,
                    activeLocale
                  )}{" "}
                  kWh
                </p>
              </div>
            </div>

            <details className="group mt-5 rounded-xl border border-white/10 bg-black/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-green-50 [&::-webkit-details-marker]:hidden">
                {text.result.details}
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center text-lg leading-none transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="border-t border-white/10 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-green-200/80">
                  {text.result.formula}
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-green-50/85">
                  {mode === "estimate" && isPowerDevice
                    ? `${formatNumber(wattsValue, activeLocale, 0, 0)} W ÷ 1.000 × ${formatNumber(minutesPerUseValue, activeLocale, 0, 1)} min ÷ 60 × ${formatNumber(usesPerWeekValue, activeLocale, 0, 1)} × 52 × ${formatMoney(priceValue, activeLocale, currency)}/kWh`
                    : `${formatNumber(actualKwhPerUse, activeLocale, 0, 3)} kWh × ${formatNumber(usesPerWeekValue, activeLocale, 0, 1)} × 52 × ${formatMoney(priceValue, activeLocale, currency)}/kWh`}
                </p>
              </div>
            </details>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-green-100/80">
              {text.result.title}
            </p>

            <p className="mt-3 text-2xl font-bold">
              {text.result.waiting}
            </p>

            <p className="mt-2 text-sm leading-6 text-green-100/80">
              {
                text.result
                  .waitingText
              }
            </p>
          </>
        )}
      </div>

      {/* Saving tip */}
      <div className="mt-5 border-l-2 border-amber-300 bg-amber-50/60 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M8.6 15.5c-1.4-1.1-2.3-2.8-2.3-4.7a5.7 5.7 0 1 1 11.4 0c0 1.9-.9 3.6-2.3 4.7-.9.7-1.4 1.5-1.4 2.5h-4c0-1-.5-1.8-1.4-2.5Z" />
              <path d="M12 2V1" />
              <path d="m4.9 4.9-.8-.8" />
              <path d="M3 11H2" />
              <path d="m19.1 4.9.8-.8" />
              <path d="M21 11h1" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {text.savingTip.title.replace("💡 ", "")}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {localizedTip}
            </p>
          </div>
        </div>
      </div>

      {calculationIsValid && (
        <details className="group mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-green-800 [&::-webkit-details-marker]:hidden">
            {text.result.scenario}
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center text-lg leading-none text-green-700 transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="border-t border-slate-100 bg-green-50/40 p-4 sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                {text.result.currentUses}: {formatNumber(usesPerWeekValue, activeLocale, 0, 1)} {text.fields.usesPerWeek.toLocaleLowerCase()}
              </p>
              <p className="font-semibold text-slate-950">
                {text.result.scenarioText}: {formatNumber(scenarioUsesPerWeekValue, activeLocale, 0, 1)} {text.fields.usesPerWeek.toLocaleLowerCase()}
              </p>
            </div>
            <input
              type="range"
              min="0"
              max={usesPerWeekValue}
              step={usesPerWeekValue <= 10 ? 0.5 : 1}
              value={scenarioUsesPerWeekValue}
              onChange={(event) =>
                setScenarioUsesPerWeek(Number(event.target.value))
              }
              className="mt-4 w-full accent-green-700"
              aria-label={text.result.scenarioText}
            />
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>0</span>
              <span>{formatNumber(usesPerWeekValue, activeLocale, 0, 1)}</span>
            </div>
            <div className="mt-4 grid gap-3 border-t border-green-100 pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">
                  {text.result.newYearlyCost}
                </p>
                <p className="mt-1 text-lg font-extrabold text-slate-950">
                  {formatMoney(scenarioYearlyCost, activeLocale, currency)}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-slate-500">
                  {text.result.savings}
                </p>
                <p className="mt-1 text-lg font-extrabold text-green-800">
                  {formatMoney(scenarioSavings, activeLocale, currency)}
                </p>
              </div>
            </div>
          </div>
        </details>
      )}

      {calculationIsValid && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setComparisonOpen((open) => !open)}
            aria-expanded={comparisonOpen}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left text-sm font-semibold text-slate-700 transition hover:border-green-300 hover:bg-slate-50 hover:text-green-800"
          >
            <span>
              {comparisonOpen
                ? text.comparison.close
                : text.comparison.open}
            </span>
            <span
              aria-hidden="true"
              className={`flex h-7 w-7 shrink-0 items-center justify-center text-lg leading-none text-green-700 transition-transform duration-200 ${
                comparisonOpen ? "rotate-45" : ""
              }`}
            >
              +
            </span>
          </button>

          {comparisonOpen && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
              <h3 className="text-xl font-extrabold text-slate-950">
                {text.comparison.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {text.comparison.description}
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {text.comparison.select}
                  </label>
                  <select
                    value={comparisonDeviceName}
                    onChange={(event) =>
                      handleComparisonDeviceChange(event.target.value)
                    }
                    className={fieldClassName}
                  >
                    {categories.map((category) => (
                      <optgroup
                        key={category}
                        label={getLocalizedCategory(category, activeLocale)}
                      >
                        {devices
                          .filter(
                            (item) =>
                              item.category === category &&
                              item.name !== device
                          )
                          .map((item) => (
                            <option key={item.name} value={item.name}>
                              {getLocalizedDevice(item, activeLocale).name}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {text.comparison.uses}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={comparisonUsesPerWeek}
                    onChange={(event) =>
                      setComparisonUsesPerWeek(
                        parseNumericInput(event.target.value)
                      )
                    }
                    className={fieldClassName}
                  />
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                {text.comparison.typicalNote}
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    key: "current",
                    eyebrow: text.comparison.current,
                    name: displayDeviceName,
                    yearly: yearlyCost,
                    kwh: yearlyKwh,
                    perUse: costPerUse,
                    cheaper: currentIsCheaper,
                  },
                  {
                    key: "alternative",
                    eyebrow: text.comparison.alternative,
                    name: localizedComparisonDevice.name,
                    yearly: comparisonYearlyCost,
                    kwh: comparisonYearlyKwh,
                    perUse: comparisonCostPerUse,
                    cheaper: !currentIsCheaper,
                  },
                ].map((option) => (
                  <div
                    key={option.key}
                    className={`rounded-xl border bg-white p-4 ${
                      option.cheaper && comparisonDifference >= 0.01
                        ? "border-green-300 ring-2 ring-green-100"
                        : "border-slate-200"
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                      {option.eyebrow}
                    </p>
                    <p className="mt-1 truncate font-bold text-slate-950">
                      {option.name}
                    </p>
                    <p className="mt-4 text-2xl font-extrabold text-green-800">
                      {formatMoney(option.yearly, activeLocale, currency)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {text.comparison.yearlyCost}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">
                          {text.comparison.yearlyConsumption}
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatKwh(option.kwh, activeLocale)} kWh
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          {text.comparison.perUse}
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatMoney(option.perUse, activeLocale, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-green-950 px-4 py-3 text-center text-sm font-semibold text-white">
                {comparisonDifference < 0.01
                  ? text.comparison.same
                  : `${
                      currentIsCheaper
                        ? displayDeviceName
                        : localizedComparisonDevice.name
                    }: ${formatMoney(
                      comparisonDifference,
                      activeLocale,
                      currency
                    )} ${text.comparison.lowerBy.toLocaleLowerCase()}`}
              </div>
            </div>
          )}
        </div>
      )}

      <MyDevicesPanel
        locale={activeLocale}
        canSave={calculationIsValid}
        activeSavedDeviceId={activeSavedDeviceId}
        onActiveSavedDeviceChange={setActiveSavedDeviceId}
        onOpen={handleOpenSavedDevice}
        compact={detailPage}
        currentDevice={{
          device,
          customDeviceName,
          mode,
          currency,
          price: priceValue,
          watts: wattsValue,
          minutesPerUse: minutesPerUseValue,
          usesPerWeek: usesPerWeekValue,
          estimatedKwhPerUse: estimatedKwhPerUseValue,
          measuredKwhPerUse: measuredKwhPerUseValue,
          yearlyKwh,
          yearlyCost,
          monthlyCost,
        }}
      />

      {calculationIsValid && !resultVisible && (
        <button
          type="button"
          onClick={() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-2xl bg-green-950 px-4 py-3 text-left text-white shadow-2xl sm:hidden"
        >
          <span>
            <span className="block text-xs text-green-100/75">{text.result.perYear}</span>
            <span className="font-extrabold">{formatMoney(yearlyCost, activeLocale, currency)}</span>
          </span>
          <span className="text-sm font-bold">{text.result.viewResult} ↑</span>
        </button>
      )}

      {/* Accuracy */}
      <details className="group mt-4 border-b border-slate-200 pb-4">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-800 [&::-webkit-details-marker]:hidden">
          {text.accuracy.title}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-open:rotate-90"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m7.5 5 5 5-5 5" />
          </svg>
        </summary>
        <p className="mt-3 max-w-3xl text-xs leading-5 text-slate-500">
          {mode === "estimate"
            ? isConsumptionDevice
              ? text.accuracy.consumptionEstimate
              : text.accuracy.powerEstimate
            : text.accuracy.exact}
        </p>
      </details>

      {/* Feedback */}
      <div className="mt-6 border-t border-slate-200 pt-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
          <p className="text-base font-bold tracking-tight text-slate-900">
            {text.feedback.title.replace("💬 ", "")}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {text.feedback.text}
          </p>

          </div>

          <a
            href={`mailto:${FEEDBACK_EMAIL}?subject=${feedbackSubject}`}
            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-bold text-green-800 transition hover:border-green-400 hover:bg-green-50"
          >
            {text.feedback.button}
          </a>

        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-400">
          {text.feedback.note}
        </p>
      </div>

    </section>
  );
}
