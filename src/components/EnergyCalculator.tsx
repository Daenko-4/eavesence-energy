"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import DeviceCategoryIcon from "@/components/DeviceCategoryIcon";
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

import MyDevicesPanel, {
  type MyDevicesPanelHandle,
} from "./MyDevicesPanel";

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
  locale?: Locale;
  detailPage?: boolean;
  homePresentation?: boolean;
};

const calculatorText = {
  de: {
    steps: {
      device: "Gerät auswählen",
      usage: "Nutzung anpassen",
      result: "Ergebnis ansehen",
    },

    modes: {
      title: "Typische Startwerte",
      description:
        "Die Werte dienen als Orientierung. Passe sie an dein Gerät und deine tatsächliche Nutzung an.",
      useMeasured: "Gemessenen Verbrauch eingeben",
      useTypical: "Aus Leistung und Laufzeit berechnen",
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

    calculate: "Berechnung speichern",
    saveChanges: "Änderungen speichern",
    reset: "Werte zurücksetzen",
    fallbackDevice: "Gerät",
  },

  en: {
    steps: {
      device: "Choose a device",
      usage: "Adjust usage",
      result: "View your result",
    },

    modes: {
      title: "Typical starting values",
      description:
        "These values are provided as a guide. Adjust them to match your device and actual usage.",
      useMeasured: "Enter measured consumption",
      useTypical: "Calculate from power and runtime",
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

    calculate: "Save calculation",
    saveChanges: "Save changes",
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

export default function EnergyCalculator({
  initialDevice = "Wasserkocher",
  locale,
  detailPage = false,
  homePresentation = false,
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

  const [mode, setMode] =
    useState<Mode>("estimate");

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
    setMode("estimate");
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
    const savedSourceDevice = devices.find(
      (candidate) => candidate.name === item.device
    );
    const canUseMeasuredMode =
      item.device === CUSTOM_DEVICE ||
      savedSourceDevice?.calculationType === "power";

    setDevice(item.device);
    setCustomDeviceName(item.customDeviceName);
    setMode(
      item.mode === "exact" && canUseMeasuredMode
        ? "exact"
        : "estimate"
    );
    setCurrency(item.currency);
    setPrice(item.price);
    setWatts(item.watts);
    setMinutesPerUse(item.minutesPerUse);
    setUsesPerWeek(item.usesPerWeek);
    setScenarioUsesPerWeek(Math.max(0, item.usesPerWeek - 1));
    setEstimatedKwhPerUse(
      item.mode === "exact" && !canUseMeasuredMode
        ? item.measuredKwhPerUse
        : item.estimatedKwhPerUse
    );
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
  const myDevicesPanelRef =
    useRef<MyDevicesPanelHandle>(null);

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
    `w-full rounded-xl border border-white/15 bg-white/[0.055] px-4 ${homePresentation ? "py-3" : "py-3.5"} text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/70 focus:bg-white/[0.08] focus:ring-4 focus:ring-emerald-500/10`;
  const secondaryFieldClassName =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100";
  const fieldHintClassName = homePresentation
    ? "hidden"
    : "mt-2 text-sm leading-6 text-slate-500";

  const feedbackSubject =
    encodeURIComponent(
      text.feedback.subject
    );

  return (
    <section>
      <div className={`grid rounded-[1.65rem] border border-white/10 bg-[linear-gradient(135deg,#142323_0%,#0d1819_58%,#081314_100%)] text-white shadow-[0_28px_80px_-42px_rgba(3,31,20,0.72)] lg:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)] ${
        homePresentation
          ? "gap-4 p-4 sm:p-5 lg:gap-6 lg:p-5"
          : "gap-5 p-4 sm:p-6 lg:gap-8 lg:p-7"
      }`}>
        <div className="calculator-form min-w-0 px-1 py-1 sm:px-2">

      {/* Device */}
      <div className={homePresentation ? "mb-4" : "mb-6"}>
        <p className="mb-3 text-sm font-semibold text-slate-200">
          {text.device.label}
        </p>
        {detailPage ? (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-[#fbfcfb] px-4 py-3.5">
            <span className="flex min-w-0 items-center gap-3 font-semibold text-slate-900">
              <span className="shrink-0 text-green-700">
                <DeviceCategoryIcon
                  category={selectedDevice?.category ?? "custom"}
                />
              </span>
              <span className="truncate">{displayDeviceName}</span>
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
            <label className="sr-only">
              {text.device.label}
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 flex -translate-y-1/2 text-emerald-400">
                <DeviceCategoryIcon
                  category={selectedDevice?.category ?? "custom"}
                />
              </span>
              <select
                value={device}
                onChange={(event) =>
                  handleDeviceChange(
                    event.target.value
                  )
                }
                className={`${fieldClassName} pl-11`}
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
            </div>

            <details className={`group ${homePresentation ? "mt-2" : "mt-3"}`}>
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-green-800 transition hover:text-white [&::-webkit-details-marker]:hidden">
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
      <p className="sr-only">{text.steps.usage}</p>
      {isPowerDevice && (
        <button
          type="button"
          onClick={() =>
            setMode((current) =>
              current === "exact" ? "estimate" : "exact"
            )
          }
          className={`${homePresentation ? "mb-3" : "mb-5"} inline-flex items-center gap-2 text-sm font-semibold text-green-800 transition hover:text-white`}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="h-4 w-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 6h12" />
            <path d="m13 3 3 3-3 3" />
            <path d="M16 14H4" />
            <path d="m7 11-3 3 3 3" />
          </svg>
          {mode === "exact"
            ? text.modes.useTypical
            : text.modes.useMeasured}
        </button>
      )}
      <div className={`grid sm:grid-cols-2 ${homePresentation ? "gap-3" : "gap-5"}`}>
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

                <p className={fieldHintClassName}>
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

                <p className={fieldHintClassName}>
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

              <p className={fieldHintClassName}>
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

            <p className={fieldHintClassName}>
              {
                text.hints
                  .measuredConsumption
              }
            </p>
          </div>
        )}

        {/* Electricity price */}
        <div className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_8rem]">
          <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {
              text.fields
                .electricityPrice
            }
          </label>

          <div className="flex w-full items-center rounded-xl border border-white/15 bg-white/[0.055] transition focus-within:border-emerald-400/70 focus-within:bg-white/[0.08] focus-within:ring-4 focus-within:ring-emerald-500/10">
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
              className={`min-w-0 flex-1 bg-transparent px-4 ${homePresentation ? "py-3" : "py-3.5"} text-white outline-none tabular-nums`}
            />

            <span className="pointer-events-none shrink-0 whitespace-nowrap pr-3 text-xs font-medium text-slate-400">
              {currencySymbol}/kWh
            </span>
          </div>

          <p className={fieldHintClassName}>
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

          <p className={fieldHintClassName}>
            {text.hints.usesPerWeek}
          </p>
        </div>
      </div>

      <div className={`${homePresentation ? "mt-4" : "mt-6"} flex flex-col gap-3 sm:flex-row sm:items-center`}>
        <button
          type="button"
          onClick={() => myDevicesPanelRef.current?.saveCurrentDevice()}
          disabled={!calculationIsValid}
          className="inline-flex min-h-10 self-start items-center justify-center gap-2 rounded-lg border border-[#14945a] bg-[#087a45] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_-18px_rgba(0,122,61,0.8)] transition hover:-translate-y-0.5 hover:bg-[#06683b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65d89b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1819] disabled:cursor-not-allowed disabled:border-slate-600 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none disabled:hover:translate-y-0 active:translate-y-0"
        >
          {activeSavedDeviceId ? text.saveChanges : text.calculate}
          <span aria-hidden="true">+</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white active:scale-[0.98]"
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
        </div>

      {/* Result */}
      <div
        ref={resultRef}
        className={`flex min-w-0 flex-col justify-center rounded-[1.45rem] border border-[#e1e6dc] bg-[#f7f8f2] text-[#07111f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_32px_-28px_rgba(7,17,31,0.34)] ${
          homePresentation
            ? "min-h-[300px] p-6 sm:p-7"
            : "min-h-[420px] p-6 sm:p-8 lg:p-10"
        }`}
      >
        {calculationIsValid ? (
          <>
            <p className={`${homePresentation ? "text-base sm:text-lg" : "text-lg sm:text-xl"} font-bold tracking-[-0.025em] text-[#07111f]`}>
              {activeLocale === "de" ? "Deine Jahreskosten" : "Your yearly cost"}
            </p>

            <div className={homePresentation ? "mt-3" : "mt-5"}>
              <span className={`${homePresentation ? "text-[clamp(2.35rem,4.4vw,4.5rem)]" : "text-[clamp(2.8rem,5.5vw,5.5rem)]"} block max-w-full whitespace-normal font-extrabold leading-[0.95] tracking-[-0.055em] tabular-nums [overflow-wrap:anywhere]`}>
                {formatMoney(
                  yearlyCost,
                  activeLocale,
                  currency
                )}
              </span>
            </div>

            <div className={`${homePresentation ? "mt-4 pt-4" : "mt-7 pt-6"} grid grid-cols-2 divide-x divide-[#dce4d7] border-t border-[#dce4d7]`}>
              <div className="flex items-center gap-3 pr-4">
                <span className={`${homePresentation ? "h-9 w-9" : "h-11 w-11"} flex shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#008c4a]`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="5" width="16" height="15" rx="2" />
                    <path d="M8 3v4M16 3v4M4 9h16" />
                  </svg>
                </span>
                <div>
                  <p className={`${homePresentation ? "text-base sm:text-lg" : "text-lg sm:text-xl"} font-extrabold tabular-nums`}>
                    {formatMoney(monthlyCost, activeLocale, currency)}
                  </p>
                  <p className="text-sm text-slate-600">{text.result.perMonth}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pl-4">
                <span className={`${homePresentation ? "h-9 w-9" : "h-11 w-11"} flex shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#008c4a]`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 20v-5M10 20V9M15 20v-8M20 20V4" />
                  </svg>
                </span>
                <div>
                  <p className={`${homePresentation ? "text-base sm:text-lg" : "text-lg sm:text-xl"} font-extrabold tabular-nums`}>
                    {formatMoney(weeklyCost, activeLocale, currency)}
                  </p>
                  <p className="text-sm text-slate-600">{text.result.perWeek}</p>
                </div>
              </div>
            </div>

            <details className={`group border-t border-[#dce4d7] pt-4 ${homePresentation ? "mt-4" : "mt-6"}`}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#007a3d] [&::-webkit-details-marker]:hidden">
                {text.result.details}
                <span
                  aria-hidden="true"
                  className="text-lg leading-none transition-transform duration-150 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="pt-3">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-700">
                  {text.result.formula}
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                  {mode === "estimate" && isPowerDevice
                    ? `${formatNumber(wattsValue, activeLocale, 0, 0)} W ÷ 1.000 × ${formatNumber(minutesPerUseValue, activeLocale, 0, 1)} min ÷ 60 × ${formatNumber(usesPerWeekValue, activeLocale, 0, 1)} × 52 × ${formatMoney(priceValue, activeLocale, currency)}/kWh`
                    : `${formatNumber(actualKwhPerUse, activeLocale, 0, 3)} kWh × ${formatNumber(usesPerWeekValue, activeLocale, 0, 1)} × 52 × ${formatMoney(priceValue, activeLocale, currency)}/kWh`}
                </p>
              </div>
            </details>
          </>
        ) : (
          <>
            <p className="text-lg font-bold tracking-[-0.025em]">
              {activeLocale === "de" ? "Deine Jahreskosten" : "Your yearly cost"}
            </p>
            <p className={`${homePresentation ? "text-xl" : "text-2xl"} mt-5 font-bold`}>
              {text.result.waiting}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {
                text.result
                  .waitingText
              }
            </p>
          </>
        )}
      </div>
      </div>

      <a
        href="#meine-geraete"
        className="mx-auto mt-5 flex w-fit items-center gap-3 rounded-full px-3 py-2 text-sm font-bold text-[#07111f] transition hover:bg-emerald-50 hover:text-[#007a3d]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[#008c4a]" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 4h10a1 1 0 0 1 1 1v16l-6-4-6 4V5a1 1 0 0 1 1-1Z" />
          </svg>
        </span>
        {activeLocale === "de"
          ? "Gesamtkosten vergleichen"
          : "Compare total costs"}
        <span className="text-[#008c4a]" aria-hidden="true">→</span>
      </a>

      {/* Saving tip */}
      {!homePresentation && (
      <div className="mt-5 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3.5">
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
      )}

      {!homePresentation && calculationIsValid && (
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

      {!homePresentation && calculationIsValid && (
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
                    className={secondaryFieldClassName}
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
                    className={secondaryFieldClassName}
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
        ref={myDevicesPanelRef}
        locale={activeLocale}
        canSave={calculationIsValid}
        activeSavedDeviceId={activeSavedDeviceId}
        onActiveSavedDeviceChange={setActiveSavedDeviceId}
        onOpen={handleOpenSavedDevice}
        compact={detailPage || homePresentation}
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
          className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-2xl border border-[#b8efcc] bg-[#dcfce8] px-4 py-3 text-left text-[#064e3b] shadow-2xl sm:hidden"
        >
          <span>
            <span className="block text-xs text-green-900/65">{text.result.perYear}</span>
            <span className="font-extrabold">{formatMoney(yearlyCost, activeLocale, currency)}</span>
          </span>
          <span className="text-sm font-bold">{text.result.viewResult} ↑</span>
        </button>
      )}

      {/* Accuracy */}
      {!homePresentation && (
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
      )}

      {/* Feedback */}
      {!homePresentation && (
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
      )}

    </section>
  );
}
