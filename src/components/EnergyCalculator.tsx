"use client";

import { track } from "@vercel/analytics";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import DeviceCategoryIcon from "@/components/DeviceCategoryIcon";
import {
  devices,
  getDeviceCalculationDefaults,
  getDeviceTypicalYearlyKwh,
} from "@/data/devices";
import { getDevicesHref, type Locale } from "@/i18n/config";
import {
  getLocalizedCategory,
  getLocalizedDevice,
} from "@/i18n/devices";
import {
  calculateEnergyCosts,
  calculateUsageScenario,
} from "@/lib/energyCalculations";
import type {
  SavedDevice,
  SavedDeviceCurrency,
} from "@/lib/savedDevices";

import MyDevicesPanel, {
  type MyDevicesPanelHandle,
} from "./MyDevicesPanel";

const CUSTOM_DEVICE = "__custom_device__";

type Mode = "estimate" | "exact";
type NumericInput = number | "";
type UsagePeriod = "week" | "month";
type CurrencyCode = SavedDeviceCurrency;
type CalculatorInteraction =
  | "device_selection"
  | "field_change"
  | "mode_change"
  | "period_change"
  | "reset"
  | "save"
  | "saved_device_open";

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
  trustItems?: readonly string[];
  afterSavingTip?: ReactNode;
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
      prefilledHint:
        "Typische Werte sind vorausgefüllt – bei Bedarf anpassen.",
      prefilledQuestion: "Informationen zu typischen Werten",
      prefilledExplanation:
        "Typische Werte sind Schätzwerte und können je nach Modell und Nutzung abweichen.",
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
      actualConsumptionPerDay:
        "Tatsächlicher Verbrauch pro Betriebstag",
      annualConsumption: "Verbrauch pro Jahr",
      hoursPerDay: "Stunden pro Tag",
      daysPerWeek: "Tage pro Woche",
      electricityPrice: "Strompreis",
      currency: "Währung",
      uses: "Nutzungen",
      perWeek: "pro Woche",
      perMonth: "pro Monat",
      week: "Woche",
      month: "Monat",
      usagePeriod: "Zeitraum der Nutzung",
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
      annualConsumption:
        "Übernimm den kWh/Jahr-Wert direkt vom Energielabel deines Geräts.",
      hoursPerDay:
        "Wie viele Stunden das Gerät an einem typischen Tag läuft.",
      daysPerWeek:
        "An wie vielen Tagen pro Woche das Gerät läuft.",
      electricityPrice:
        "Deinen Arbeitspreis findest du auf deiner Stromrechnung.",
      usesPerWeek:
        "Wähle Woche oder Monat. Auch halbe Schritte wie 0,5 sind möglich.",
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
      longDailyRuntime:
        "Mehr als 24 Stunden pro Tag sind nicht möglich. Prüfe bitte deine Eingabe.",
      manyDays:
        "Mehr als 7 Tage pro Woche sind nicht möglich. Prüfe bitte deine Eingabe.",
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
      scenario: "Was wäre bei seltenerer Nutzung?",
      scenarioText: "Wähle, wie oft du das Gerät im gewählten Zeitraum verwenden würdest.",
      currentUses: "Aktuell",
      selectedUses: "Gewählt",
      newYearlyCost: "Neue Jahreskosten",
      savings: "Spare ca.",
      viewResult: "Ergebnis ansehen",
    },

    comparison: {
      open: "Mit einem ähnlichen Gerät vergleichen",
      close: "Vergleich schließen",
      title: "Geräte vergleichen",
      description:
        "Vergleiche deine aktuelle Berechnung mit den typischen Werten eines Geräts aus derselben Kategorie.",
      current: "Aktuelle Berechnung",
      alternative: "Vergleichsgerät",
      select: "Zweites Gerät",
      uses: "Nutzungen pro Woche",
      yearlyCost: "Kosten pro Jahr",
      yearlyConsumption: "Verbrauch pro Jahr",
      perUse: "Kosten pro Nutzung",
      perDay: "Kosten pro Betriebstag",
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
      title: "Einordnung",
      note: "Realistische Schätzung auf Basis typischer Werte – dein tatsächlicher Verbrauch kann abweichen.",
    },

    calculate: "In „Meine Geräte“ speichern",
    saveChanges: "Gespeichertes Gerät aktualisieren",
    deviceSaved: "Gerät wurde lokal gespeichert.",
    changesSaved: "Änderungen wurden lokal gespeichert.",
    alreadySaved: "Dieses Gerät ist bereits lokal gespeichert.",
    reset: "Werte zurücksetzen",
    fallbackDevice: "Gerät",
    homeNextStep: {
      label: "Nächster Schritt",
      text: "Speichere das Gerät und führe es in My Home mit deinen übrigen Geräten und Haushaltskosten zusammen.",
      link: "In My Home weiter",
    },
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
      prefilledHint:
        "Typical values are prefilled – adjust if needed.",
      prefilledQuestion: "Information about typical values",
      prefilledExplanation:
        "Typical values are estimates and may vary by model and usage.",
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
      actualConsumptionPerDay:
        "Actual consumption per operating day",
      annualConsumption: "Consumption per year",
      hoursPerDay: "Hours per day",
      daysPerWeek: "Days per week",
      electricityPrice: "Electricity price",
      currency: "Currency",
      uses: "Uses",
      perWeek: "per week",
      perMonth: "per month",
      week: "week",
      month: "month",
      usagePeriod: "Usage period",
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
      annualConsumption:
        "Enter the kWh/year figure shown on your appliance's energy label.",
      hoursPerDay:
        "How many hours the device runs on a typical day.",
      daysPerWeek:
        "How many days per week the device runs.",
      electricityPrice:
        "You can find your electricity price on your electricity bill.",
      usesPerWeek:
        "Choose week or month. Half steps such as 0.5 are supported.",
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
      longDailyRuntime:
        "A day cannot have more than 24 running hours. Please check your entry.",
      manyDays:
        "A week cannot have more than 7 running days. Please check your entry.",
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
      scenario: "What if you used it less?",
      scenarioText: "Choose how often you would use the device in the selected period.",
      currentUses: "Current",
      selectedUses: "Selected",
      newYearlyCost: "New yearly cost",
      savings: "Save about",
      viewResult: "View result",
    },

    comparison: {
      open: "Compare with a related device",
      close: "Close comparison",
      title: "Compare devices",
      description:
        "Compare your current calculation with typical values for a device in the same category.",
      current: "Current calculation",
      alternative: "Comparison device",
      select: "Second device",
      uses: "Uses per week",
      yearlyCost: "Cost per year",
      yearlyConsumption: "Consumption per year",
      perUse: "Cost per use",
      perDay: "Cost per operating day",
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
      title: "Context",
      note: "Realistic estimate based on typical values – actual consumption may vary.",
    },

    calculate: "Save to My devices",
    saveChanges: "Update saved device",
    deviceSaved: "Device saved locally.",
    changesSaved: "Changes saved locally.",
    alreadySaved: "This device is already saved locally.",
    reset: "Reset values",
    fallbackDevice: "Device",
    homeNextStep: {
      label: "Next step",
      text: "Save this device and bring it together with your other devices and household costs in My Home.",
      link: "Continue to My Home",
    },
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

function usageAmountToWeekly(amount: number, period: UsagePeriod) {
  return period === "month" ? (amount * 12) / 52 : amount;
}

function weeklyUsageToAmount(usesPerWeek: number, period: UsagePeriod) {
  return period === "month" ? (usesPerWeek * 52) / 12 : usesPerWeek;
}

function TrustSignalIcon({ index }: { index: number }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-4 w-4",
    "aria-hidden": true,
  };

  if (index === 0) {
    return (
      <svg {...commonProps}>
        <rect x="3" y="6" width="18" height="12" rx="3" />
        <path d="M7 9.5h.01M17 14.5h.01" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg {...commonProps}>
        <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="8" cy="12" r="2" />
        <circle cx="13" cy="18" r="2" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <rect x="5" y="4" width="14" height="11" rx="1.5" />
      <path d="M3 19h18M5 15l-2 4M19 15l2 4" />
    </svg>
  );
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
  initialDevice = "Kaffeemaschine",
  locale,
  detailPage = false,
  homePresentation = false,
  trustItems = [],
  afterSavingTip,
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

  const initialDefaults = getDeviceCalculationDefaults(initialDeviceData);
  const initialWatts = initialDefaults.watts;
  const initialMinutes = initialDefaults.minutesPerUse;
  const initialUses = initialDefaults.usesPerWeek;
  const initialEstimatedKwh = initialDefaults.estimatedKwhPerUse;

  const initialMeasuredKwh =
    initialDeviceData.calculationType === "consumption"
      ? initialEstimatedKwh
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
  const [deviceSearchOpen, setDeviceSearchOpen] = useState(false);
  const [recentDevices, setRecentDevices] = useState<string[]>([]);
  const [scenarioUsesPerWeek, setScenarioUsesPerWeek] =
    useState<NumericInput>(Math.max(0, initialUses - 1));
  const [resultVisible, setResultVisible] = useState(false);
  const initialComparisonDevice =
    devices.find((item) => item.name !== initialDeviceData.name) ?? devices[0];
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [calculationDetailsOpen, setCalculationDetailsOpen] = useState(false);
  const [prefilledHelpOpen, setPrefilledHelpOpen] = useState(false);

  useEffect(() => {
    if (!prefilledHelpOpen) {
      return;
    }

    const closeHelp = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Element &&
        target.closest("[data-prefilled-help-trigger]")
      ) {
        return;
      }

      setPrefilledHelpOpen(false);
    };
    const closeHelpWithKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPrefilledHelpOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeHelp);
    document.addEventListener("keydown", closeHelpWithKeyboard);

    return () => {
      document.removeEventListener("pointerdown", closeHelp);
      document.removeEventListener("keydown", closeHelpWithKeyboard);
    };
  }, [prefilledHelpOpen]);

  const [comparisonDeviceName, setComparisonDeviceName] = useState(
    initialComparisonDevice.name
  );
  const [comparisonUsesPerWeek, setComparisonUsesPerWeek] =
    useState<NumericInput>(
      getDeviceCalculationDefaults(initialComparisonDevice).usesPerWeek
    );

  const [
    activeSavedDeviceId,
    setActiveSavedDeviceId,
  ] = useState<string | null>(null);
  const [saveConfirmation, setSaveConfirmation] = useState<{
    message: string;
    originalLabel: string;
    visible: boolean;
  } | null>(null);
  const saveConfirmationDelayRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const saveConfirmationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const engagementTrackedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (saveConfirmationDelayRef.current) {
        clearTimeout(saveConfirmationDelayRef.current);
      }
      if (saveConfirmationTimeoutRef.current) {
        clearTimeout(saveConfirmationTimeoutRef.current);
      }
    };
  }, []);

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

  const [usagePeriod, setUsagePeriod] =
    useState<UsagePeriod>("week");

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

  const fieldIdPrefix = useId().replaceAll(":", "");
  const fieldIds = {
    device: `${fieldIdPrefix}-device`,
    search: `${fieldIdPrefix}-device-search`,
    customName: `${fieldIdPrefix}-custom-name`,
    power: `${fieldIdPrefix}-power`,
    duration: `${fieldIdPrefix}-duration`,
    estimatedConsumption: `${fieldIdPrefix}-estimated-consumption`,
    measuredConsumption: `${fieldIdPrefix}-measured-consumption`,
    electricityPrice: `${fieldIdPrefix}-electricity-price`,
    currency: `${fieldIdPrefix}-currency`,
    uses: `${fieldIdPrefix}-uses`,
    comparisonDevice: `${fieldIdPrefix}-comparison-device`,
    comparisonUses: `${fieldIdPrefix}-comparison-uses`,
  };

  const isCustomDevice =
    device === CUSTOM_DEVICE;

  const isPowerDevice =
    isCustomDevice ||
    selectedDevice?.calculationType === "power";

  const isConsumptionDevice =
    !isCustomDevice &&
    selectedDevice?.calculationType ===
      "consumption";

  const isAnnualDevice =
    selectedDevice?.usagePattern === "annual";

  const isContinuousDevice =
    selectedDevice?.usagePattern === "continuous";

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
  const selectableDevices =
    selectedDevice && !visibleDevices.some((item) => item.name === device)
      ? [selectedDevice, ...visibleDevices]
      : visibleDevices;

  function loadDeviceDefaults(name: string) {
    setUsagePeriod("week");

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

    const defaults = getDeviceCalculationDefaults(selected);

    setWatts(defaults.watts);
    setMinutesPerUse(defaults.minutesPerUse);

    const selectedUses = defaults.usesPerWeek;
    setUsesPerWeek(selectedUses);
    setScenarioUsesPerWeek(Math.max(0, selectedUses - 1));

    setEstimatedKwhPerUse(
      defaults.estimatedKwhPerUse
    );

    if (
      selected.calculationType ===
      "consumption"
    ) {
      setMeasuredKwhPerUse(
        defaults.estimatedKwhPerUse
      );
    } else {
      const estimatedConsumption =
        (defaults.watts / 1000) *
        (defaults.minutesPerUse / 60);

      setMeasuredKwhPerUse(
        Number(
          estimatedConsumption.toFixed(3)
        )
      );
    }
  }

  function trackCalculatorEngagement(interaction: CalculatorInteraction) {
    if (engagementTrackedRef.current) return;

    engagementTrackedRef.current = true;
    track("Calculator Engaged", {
      context: detailPage ? "device_detail" : "home",
      interaction,
      locale: activeLocale,
    });
  }

  function handleDeviceChange(name: string) {
    trackCalculatorEngagement("device_selection");
    setDevice(name);
    setMode("estimate");
    setDeviceSearch("");
    setDeviceSearchOpen(false);
    loadDeviceDefaults(name);
    setActiveSavedDeviceId(null);

    const selectedDevice = devices.find((item) => item.name === name);
    track("Calculator Device Selected", {
      category: selectedDevice?.category ?? "custom",
      kind: name === CUSTOM_DEVICE ? "custom" : "preset",
      locale: activeLocale,
    });

    const selectedForComparison = devices.find((item) => item.name === name);
    const alternative = devices.find(
      (item) =>
        item.name !== name &&
        (!selectedForComparison || item.category === selectedForComparison.category)
    );
    if (alternative) {
      setComparisonDeviceName(alternative.name);
      setComparisonUsesPerWeek(
        getDeviceCalculationDefaults(alternative).usesPerWeek
      );
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
    setComparisonUsesPerWeek(
      getDeviceCalculationDefaults(comparisonDevice).usesPerWeek
    );
  }

  function handleOpenSavedDevice(item: SavedDevice) {
    trackCalculatorEngagement("saved_device_open");
    const savedSourceDevice = devices.find(
      (candidate) => candidate.name === item.device
    );
    const canUseMeasuredMode =
      item.device === CUSTOM_DEVICE ||
      savedSourceDevice?.calculationType === "power";
    const restoredUsagePeriod: UsagePeriod =
      savedSourceDevice?.usagePattern === "annual" ||
      savedSourceDevice?.usagePattern === "continuous"
        ? "week"
        : item.usagePeriod ?? "week";
    const restoredUsageAmount =
      savedSourceDevice?.usagePattern === "annual"
        ? item.usesPerWeek
        : item.usageAmount ??
          weeklyUsageToAmount(item.usesPerWeek, restoredUsagePeriod);
    const scenarioStepInWeeks =
      restoredUsagePeriod === "month" ? 6 / 52 : 0.5;

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
    setUsagePeriod(restoredUsagePeriod);
    setUsesPerWeek(restoredUsageAmount);
    setScenarioUsesPerWeek(
      Math.max(0, item.usesPerWeek - scenarioStepInWeeks)
    );
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
        setComparisonUsesPerWeek(
          getDeviceCalculationDefaults(alternative).usesPerWeek
        );
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

  function handleReset(button?: HTMLButtonElement) {
    trackCalculatorEngagement("reset");
    const scrollPosition = {
      left: window.scrollX,
      top: window.scrollY,
    };

    button?.blur();
    setPrice(currency === "EUR" ? 0.35 : "");
    loadDeviceDefaults(device);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ ...scrollPosition, behavior: "auto" });
      });
    });
  }

  function handleSaveCurrentDevice() {
    if (saveConfirmation) return;

    trackCalculatorEngagement("save");

    const originalLabel = activeSavedDeviceId
      ? text.saveChanges
      : text.calculate;
    const saveAction = activeSavedDeviceId ? "updated" : "created";
    const message = myDevicesPanelRef.current?.saveCurrentDevice();
    if (!message) return;

    track("Saved Device Changed", {
      action: saveAction,
      locale: activeLocale,
    });

    if (saveConfirmationDelayRef.current) {
      clearTimeout(saveConfirmationDelayRef.current);
    }
    if (saveConfirmationTimeoutRef.current) {
      clearTimeout(saveConfirmationTimeoutRef.current);
    }

    setSaveConfirmation({ message, originalLabel, visible: false });
    saveConfirmationDelayRef.current = setTimeout(() => {
      setSaveConfirmation({ message, originalLabel, visible: true });
      saveConfirmationDelayRef.current = null;
      saveConfirmationTimeoutRef.current = setTimeout(() => {
        setSaveConfirmation(null);
        saveConfirmationTimeoutRef.current = null;
      }, 2200);
    }, 350);
  }

  function toggleMeasuredMode() {
    trackCalculatorEngagement("mode_change");
    setDeviceSearchOpen(false);
    setDeviceSearch("");
    const nextMode = mode === "exact" ? "estimate" : "exact";
    setMode(nextMode);
    track("Calculator Mode Changed", {
      locale: activeLocale,
      mode: nextMode,
    });
  }

  function handleUsagePeriodChange(nextPeriod: UsagePeriod) {
    trackCalculatorEngagement("period_change");
    const nextUsesPerWeek = usageAmountToWeekly(
      numericValue(usesPerWeek),
      nextPeriod
    );
    const scenarioStep = nextPeriod === "month" ? 6 / 52 : 0.5;

    setUsagePeriod(nextPeriod);
    setScenarioUsesPerWeek(
      Math.max(0, nextUsesPerWeek - scenarioStep)
    );
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

  const usageAmountValue =
    numericValue(usesPerWeek);

  const usesPerWeekValue =
    !isAnnualDevice && !isContinuousDevice
      ? usageAmountToWeekly(usageAmountValue, usagePeriod)
      : usageAmountValue;

  const displayedScenarioUses =
    isContinuousDevice
      ? numericValue(scenarioUsesPerWeek)
      : weeklyUsageToAmount(
          numericValue(scenarioUsesPerWeek),
          usagePeriod
        );

  const usagePeriodText =
    usagePeriod === "month"
      ? text.fields.perMonth
      : text.fields.perWeek;

  const estimatedKwhPerUseValue =
    numericValue(estimatedKwhPerUse);

  const measuredKwhPerUseValue =
    numericValue(measuredKwhPerUse);

  const {
    isValid: calculationIsValid,
    kwhPerUse: actualKwhPerUse,
    yearlyKwh,
    yearlyCost,
    monthlyCost,
    weeklyCost,
    costPerUse,
  } = calculateEnergyCosts({
    mode,
    calculationType: isConsumptionDevice ? "consumption" : "power",
    electricityPrice: priceValue,
    watts: wattsValue,
    minutesPerUse: minutesPerUseValue,
    usesPerWeek: usesPerWeekValue,
    estimatedKwhPerUse: estimatedKwhPerUseValue,
    measuredKwhPerUse: measuredKwhPerUseValue,
  });

  const {
    adjustedUsesPerWeek: scenarioUsesPerWeekValue,
    savings: scenarioSavings,
  } = calculateUsageScenario({
    kwhPerUse: actualKwhPerUse,
    usesPerWeek: usesPerWeekValue,
    scenarioUsesPerWeek: numericValue(scenarioUsesPerWeek),
    electricityPrice: priceValue,
  });
  const supportsUsageScenario =
    !isAnnualDevice;
  const calculationFormula =
    mode === "estimate" && isAnnualDevice
      ? `${formatNumber(estimatedKwhPerUseValue, activeLocale, 0, 1)} kWh/${activeLocale === "de" ? "Jahr" : "year"} × ${formatMoney(priceValue, activeLocale, currency)}/kWh`
      : mode === "estimate" && isContinuousDevice
        ? `${formatNumber(wattsValue, activeLocale, 0, 0)} W ÷ 1.000 × ${formatNumber(minutesPerUseValue / 60, activeLocale, 0, 1)} h/${activeLocale === "de" ? "Tag" : "day"} × ${formatNumber(usesPerWeekValue, activeLocale, 0, 1)} ${activeLocale === "de" ? "Tage/Woche" : "days/week"} × 52 × ${formatMoney(priceValue, activeLocale, currency)}/kWh`
      : mode === "estimate" && isPowerDevice
      ? `${formatNumber(wattsValue, activeLocale, 0, 0)} W ÷ 1.000 × ${formatNumber(minutesPerUseValue, activeLocale, 0, 1)} min ÷ 60 × ${formatNumber(usageAmountValue, activeLocale, 0, 1)} ${usagePeriodText} × ${usagePeriod === "month" ? 12 : 52} × ${formatMoney(priceValue, activeLocale, currency)}/kWh`
      : `${formatNumber(actualKwhPerUse, activeLocale, 0, 3)} kWh × ${formatNumber(usageAmountValue, activeLocale, 0, 1)} ${usagePeriodText} × ${usagePeriod === "month" ? 12 : 52} × ${formatMoney(priceValue, activeLocale, currency)}/kWh`;

  const comparisonCandidates = devices.filter(
    (item) =>
      item.name !== device &&
      (!selectedDevice || item.category === selectedDevice.category)
  );
  const comparisonDevice =
    comparisonCandidates.find((item) => item.name === comparisonDeviceName) ??
    comparisonCandidates[0] ??
    devices.find((item) => item.name !== device) ??
    devices[0];
  const localizedComparisonDevice = getLocalizedDevice(
    comparisonDevice,
    activeLocale
  );
  const comparisonDefaults = getDeviceCalculationDefaults(comparisonDevice);
  const comparisonKwhPerUse =
    comparisonDevice.calculationType === "consumption"
      ? comparisonDefaults.estimatedKwhPerUse
      : (comparisonDefaults.watts / 1000) *
        (comparisonDefaults.minutesPerUse / 60);
  const comparisonUsesValue =
    comparisonDevice.usagePattern === "annual"
      ? comparisonDefaults.usesPerWeek
      : numericValue(comparisonUsesPerWeek);
  const comparisonYearlyKwh =
    comparisonDevice.usagePattern === "annual"
      ? getDeviceTypicalYearlyKwh(comparisonDevice)
      : comparisonKwhPerUse * comparisonUsesValue * 52;
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

  if (isContinuousDevice && usesPerWeekValue > 7) {
    warnings.push(text.warnings.manyDays);
  }

  if (isContinuousDevice && minutesPerUseValue > 1440) {
    warnings.push(text.warnings.longDailyRuntime);
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
    !isContinuousDevice &&
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
    `w-full min-w-0 max-w-full rounded-xl border border-white/[0.12] bg-[#202b28] px-4 ${homePresentation ? "py-2.5" : "py-3"} text-[14px] font-semibold text-[#f7faf8] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] outline-none transition-[border-color,background-color,box-shadow] placeholder:text-[#7f918b] hover:border-white/[0.2] focus:border-[var(--brand-green-mint)] focus:bg-[#24312d] focus:ring-2 focus:ring-[#72dca3]/12`;
  const secondaryFieldClassName =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-green-mint)] focus:ring-2 focus:ring-[#72dca3]/20";
  const fieldLabelClassName =
    "calculator-field-label mb-1.5 block text-[12px] font-semibold leading-5";
  const fieldHintClassName = homePresentation
    ? "hidden"
    : "mt-2 text-sm leading-6 text-slate-500";

  const accuracyText = text.accuracy.note;

  return (
    <section>
      <div
        data-calculator-shell
        onChangeCapture={() => trackCalculatorEngagement("field_change")}
        className={`grid w-full min-w-0 max-w-full rounded-[1.65rem] border border-[#34413e] bg-[linear-gradient(135deg,#1d2725_0%,#17211f_62%,#141c1a_100%)] text-white shadow-[0_28px_70px_-44px_rgba(18,35,30,0.52)] xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)] ${
        homePresentation
          ? "gap-4 p-4 sm:p-5 lg:gap-6 lg:p-5"
          : "gap-5 p-4 sm:p-6 lg:gap-8 lg:p-7"
      }`}
      >
        <div
          data-calculator-form
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.target instanceof HTMLInputElement && event.target.type === "number") {
              event.preventDefault();
              event.target.blur();
            }
          }}
          className="calculator-form flex min-w-0 flex-col justify-start px-1 py-1 sm:px-2"
        >

      {/* Device */}
      <div className={homePresentation ? "mb-7" : "mb-6"}>
        <div className="calculator-field-label relative mb-5 flex min-w-0 items-start gap-1.5 text-[12px] font-semibold leading-5">
          {homePresentation && (
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[var(--brand-green-mint)]"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="7" />
              <path d="M10 9v4M10 6.5h.01" />
            </svg>
          )}
          <span className="min-w-0">
            {homePresentation
              ? text.device.prefilledHint
              : text.device.label}
          </span>
          {homePresentation && (
            <button
              type="button"
              data-prefilled-help-trigger
              aria-label={text.device.prefilledQuestion}
              aria-controls="prefilled-values-help"
              aria-expanded={prefilledHelpOpen}
              onClick={() => setPrefilledHelpOpen((open) => !open)}
              className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[var(--brand-green-mint)] transition-colors before:absolute before:-inset-2.5 before:content-[''] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-green-mint)]/50"
            >
              <span
                className={`flex h-5 w-5 origin-center items-center justify-center text-lg leading-none transition-transform duration-[180ms] ${prefilledHelpOpen ? "-rotate-45" : "rotate-0"}`}
                aria-hidden="true"
              >
                +
              </span>
            </button>
          )}
        </div>
        {detailPage ? (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-[#fbfcfb] px-4 py-3.5">
            <span className="flex min-w-0 items-center gap-3 font-semibold text-slate-900">
              <span className="shrink-0 text-[var(--brand-green)]">
                <DeviceCategoryIcon
                  category={selectedDevice?.category ?? "custom"}
                />
              </span>
              <span className="truncate">{displayDeviceName}</span>
            </span>
            <a
              href={getDevicesHref(activeLocale)}
              className="shrink-0 text-sm font-semibold text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]"
            >
              {text.device.change}
            </a>
          </div>
        ) : (
          <>
            <label htmlFor={fieldIds.device} className="sr-only">
              {text.device.label}
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 flex -translate-y-1/2 text-[var(--brand-green-mint)]">
                <DeviceCategoryIcon
                  category={selectedDevice?.category ?? "custom"}
                />
              </span>
              <select
                id={fieldIds.device}
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
              selectableDevices.some((item) => item.category === category)
            )
            .map((category) => (
            <optgroup
              key={category}
              label={getLocalizedCategory(
                category,
                activeLocale
              )}
            >
              {selectableDevices
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
              {homePresentation && prefilledHelpOpen && (
                <p
                  id="prefilled-values-help"
                  data-prefilled-help-panel
                  role="status"
                  className="absolute inset-0 z-30 flex items-center rounded-xl border border-[var(--brand-green-mint)]/25 bg-[#24312d] px-4 text-[10px] font-medium leading-[1.35] text-[#d2dbd8] shadow-[0_14px_35px_-18px_rgba(0,0,0,0.85)] sm:text-[11px]"
                >
                  {text.device.prefilledExplanation}
                </p>
              )}
            </div>

            <div className={`flex flex-wrap items-start gap-x-5 gap-y-2 ${homePresentation ? "mt-2" : "mt-3"}`}>
            <div className={`min-w-0 ${deviceSearchOpen ? "basis-full" : ""}`}>
          <button
            type="button"
            aria-expanded={deviceSearchOpen}
            aria-controls={`${fieldIds.search}-panel`}
            onClick={() => {
              const nextOpen = !deviceSearchOpen;
              setDeviceSearchOpen(nextOpen);
            }}
            className="calculator-secondary-action inline-flex min-h-10 cursor-pointer items-center gap-2 text-[var(--brand-green-mint)] transition hover:text-[#a0ecc2]"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4 4" />
            </svg>
            {text.device.search}
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${deviceSearchOpen ? "rotate-90" : ""}`}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m7.5 5 5 5-5 5" />
            </svg>
          </button>
          {deviceSearchOpen && <div id={`${fieldIds.search}-panel`} className="mt-1.5 w-full rounded-xl bg-[#202b28] p-3 ring-1 ring-white/[0.1]">
            <label htmlFor={fieldIds.search} className="sr-only">
              {text.device.search}
            </label>
            <input
              id={fieldIds.search}
              type="search"
              value={deviceSearch}
              onChange={(event) => setDeviceSearch(event.target.value)}
              placeholder={text.device.searchPlaceholder}
              className={`${secondaryFieldClassName} border-slate-300 shadow-[inset_0_1px_2px_rgba(15,23,42,0.035)]`}
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
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-green-200 hover:text-[var(--brand-green-dark)]"
                    >
                      {getLocalizedDevice(recentDevice, activeLocale).name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>}
            </div>
            {isPowerDevice && (
              <button
                type="button"
                onClick={toggleMeasuredMode}
                className="calculator-secondary-action inline-flex min-h-10 items-center gap-2 text-[var(--brand-green-mint)] transition hover:text-[#a0ecc2]"
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
            </div>
          </>
        )}
      </div>

      {/* Custom device */}
      {isCustomDevice && (
        <div className="mb-8 rounded-2xl border border-white/[0.12] bg-white/[0.035] p-5">
          <label htmlFor={fieldIds.customName} className={fieldLabelClassName}>
            {text.device.customName}
          </label>

          <input
            id={fieldIds.customName}
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

          <p className="mt-2 text-sm leading-6 text-[#9fb0aa]">
            {text.device.customHint}
          </p>
        </div>
      )}

      {/* Inputs */}
      <p className="sr-only">{text.steps.usage}</p>
      {detailPage && isPowerDevice && (
        <button
          type="button"
          onClick={toggleMeasuredMode}
          className={`${homePresentation ? "mb-3" : "mb-5"} calculator-secondary-action inline-flex min-h-10 items-center gap-2 text-[var(--brand-green-mint)] transition hover:text-[#a0ecc2]`}
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
      <div className={`grid min-w-0 md:grid-cols-2 [&>*]:min-w-0 ${homePresentation ? "gap-3" : "gap-5"}`}>
        {mode === "estimate" &&
          isPowerDevice && (
            <>
              <div>
                <label htmlFor={fieldIds.power} className={fieldLabelClassName}>
                  {text.fields.power}
                </label>

                <div className="relative">
                  <input
                    id={fieldIds.power}
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

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#9fb0aa]">
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
                <label htmlFor={fieldIds.duration} className={fieldLabelClassName}>
                  {isContinuousDevice
                    ? text.fields.hoursPerDay
                    : text.fields.minutesPerUse}
                </label>

                <input
                  id={fieldIds.duration}
                  type="number"
                  min="0"
                  max={isContinuousDevice ? 24 : undefined}
                  step={isContinuousDevice ? "0.5" : "1"}
                  value={
                    isContinuousDevice && minutesPerUse !== ""
                      ? minutesPerUse / 60
                      : minutesPerUse
                  }
                  onFocus={
                    handleCalculatorFieldFocus
                  }
                  onChange={(event) =>
                    setMinutesPerUse(() => {
                      const nextValue = parseNumericInput(event.target.value);
                      return isContinuousDevice && nextValue !== ""
                        ? nextValue * 60
                        : nextValue;
                    })
                  }
                  className={
                    fieldClassName
                  }
                />

                <p className={fieldHintClassName}>
                  {isContinuousDevice
                    ? text.hints.hoursPerDay
                    : isCustomDevice
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
              <label htmlFor={fieldIds.estimatedConsumption} className={fieldLabelClassName}>
                {
                  text.fields
                    [isAnnualDevice
                      ? "annualConsumption"
                      : "consumptionPerUse"]
                }
              </label>

              <div className="relative">
                <input
                  id={fieldIds.estimatedConsumption}
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

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#9fb0aa]">
                  kWh
                </span>
              </div>

              <p className={fieldHintClassName}>
                {
                  isAnnualDevice
                    ? text.hints.annualConsumption
                    : text.hints.estimatedConsumption
                }
              </p>
            </div>
          )}

        {mode === "exact" && (
          <div>
            <label htmlFor={fieldIds.measuredConsumption} className={fieldLabelClassName}>
              {
                isContinuousDevice
                  ? text.fields.actualConsumptionPerDay
                  : text.fields.actualConsumptionPerUse
              }
            </label>

            <div className="relative">
              <input
                id={fieldIds.measuredConsumption}
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

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#9fb0aa]">
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
        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_7rem] [&>*]:min-w-0">
          <div>
          <label htmlFor={fieldIds.electricityPrice} className={fieldLabelClassName}>
            {
              text.fields
                .electricityPrice
            }
          </label>

          <div className="flex w-full min-w-0 max-w-full items-center rounded-xl border border-white/[0.12] bg-[#202b28] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-[border-color,background-color,box-shadow] hover:border-white/[0.2] focus-within:border-[var(--brand-green-mint)] focus-within:bg-[#24312d] focus-within:ring-2 focus-within:ring-[#72dca3]/12">
            <input
              id={fieldIds.electricityPrice}
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
              className={`min-w-0 flex-1 bg-transparent px-4 ${homePresentation ? "py-2.5" : "py-3"} text-[14px] font-semibold text-[#f7faf8] outline-none tabular-nums`}
            />

            <span className="pointer-events-none shrink-0 whitespace-nowrap pr-3 text-xs font-medium text-[#9fb0aa]">
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
            <label htmlFor={fieldIds.currency} className={fieldLabelClassName}>
              {text.fields.currency}
            </label>

            <select
              id={fieldIds.currency}
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
        {!isAnnualDevice && <div>
          <label htmlFor={fieldIds.uses} className={fieldLabelClassName}>
            {isContinuousDevice
              ? text.fields.daysPerWeek
              : text.fields.uses}
          </label>

          <div
            className={
              isContinuousDevice
                ? ""
                : "flex w-full min-w-0 max-w-full items-center rounded-xl border border-white/[0.12] bg-[#202b28] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-[border-color,background-color,box-shadow] hover:border-white/[0.2] focus-within:border-[var(--brand-green-mint)] focus-within:bg-[#24312d] focus-within:ring-2 focus-within:ring-[#72dca3]/12"
            }
          >
            <input
              id={fieldIds.uses}
              type="number"
              min="0"
              max={isContinuousDevice ? 7 : undefined}
              step="0.5"
              inputMode="decimal"
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
                const nextAmount = numericValue(nextUses);
                const nextUsesPerWeek = isContinuousDevice
                  ? nextAmount
                  : usageAmountToWeekly(nextAmount, usagePeriod);
                const scenarioStep =
                  !isContinuousDevice && usagePeriod === "month"
                    ? 6 / 52
                    : 0.5;

                setUsesPerWeek(nextUses);
                setScenarioUsesPerWeek(
                  Math.max(0, nextUsesPerWeek - scenarioStep)
                );
              }}
              className={
                isContinuousDevice
                  ? fieldClassName
                  : `min-w-0 flex-1 bg-transparent px-4 ${homePresentation ? "py-2.5" : "py-3"} text-[14px] font-semibold text-[#f7faf8] outline-none`
              }
            />

            {!isContinuousDevice && (
              <div
                role="group"
                aria-label={text.fields.usagePeriod}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap pr-4 text-[12px]"
              >
                <button
                  type="button"
                  aria-pressed={usagePeriod === "week"}
                  onClick={() => handleUsagePeriodChange("week")}
                  className={`relative px-0.5 py-2 font-semibold transition-colors focus-visible:outline-none focus-visible:text-[var(--brand-green-mint)] ${
                    usagePeriod === "week"
                      ? "text-[var(--brand-green-mint)]"
                      : "text-[#65736e] hover:text-[#aebbb6]"
                  }`}
                >
                  × {text.fields.week}
                </button>

                <span aria-hidden="true" className="text-[#53615d]">/</span>

                <button
                  type="button"
                  aria-pressed={usagePeriod === "month"}
                  onClick={() => handleUsagePeriodChange("month")}
                  className={`relative px-0.5 py-2 font-semibold transition-colors focus-visible:outline-none focus-visible:text-[var(--brand-green-mint)] ${
                    usagePeriod === "month"
                      ? "text-[var(--brand-green-mint)]"
                      : "text-[#65736e] hover:text-[#aebbb6]"
                  }`}
                >
                  × {text.fields.month}
                </button>
              </div>
            )}
          </div>

          <p className={fieldHintClassName}>
            {isContinuousDevice
              ? text.hints.daysPerWeek
              : text.hints.usesPerWeek}
          </p>
        </div>}
      </div>

      <div className={`${homePresentation ? "mt-auto pt-7" : "mt-6"} flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4`}>
        <button
          type="button"
          onClick={(event) => handleReset(event.currentTarget)}
          className="calculator-secondary-action group inline-flex min-h-10 items-center gap-2 text-[var(--brand-green-mint)] transition hover:text-[#a0ecc2] active:scale-[0.98]"
        >
          <span
            aria-hidden="true"
            className="text-base transition-transform duration-200 group-hover:-rotate-45"
          >
            ↻
          </span>
          {text.reset}
        </button>

        <div className="relative ml-0 max-w-full self-end sm:ml-auto sm:self-auto">
          <button
            type="button"
            onClick={handleSaveCurrentDevice}
            disabled={!calculationIsValid}
            className="calculator-save-action inline-flex min-h-10 max-w-full items-center justify-center whitespace-normal px-1 text-right text-[var(--brand-green-mint)] transition hover:text-[#a0ecc2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-green-mint)] focus-visible:ring-offset-4 focus-visible:ring-offset-[#17211f] disabled:cursor-not-allowed disabled:text-[#65736e]"
          >
            <span className="grid max-w-full text-right">
              {[
                text.calculate,
                text.saveChanges,
                text.deviceSaved,
                text.changesSaved,
                text.alreadySaved,
              ].map((label) => (
                <span
                  key={label}
                  aria-hidden="true"
                  className="invisible col-start-1 row-start-1 inline-flex items-center gap-2"
                >
                  <span className="h-4 w-4 shrink-0" />
                  {label}
                </span>
              ))}
              <span className="col-start-1 row-start-1 inline-flex items-center justify-end gap-2">
                {saveConfirmation?.visible ? (
                  <svg
                    data-save-status-icon
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-4 w-4 shrink-0"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="10" cy="10" r="7" />
                    <path d="M10 9v4" />
                    <path d="M10 6.5h.01" />
                  </svg>
                ) : (
                  <svg
                    data-save-action-icon
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-4 w-4 shrink-0"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5.5 3.5h9a1 1 0 0 1 1 1v12l-5.5-3-5.5 3v-12a1 1 0 0 1 1-1Z" />
                  </svg>
                )}
                <span aria-live="polite">
                  {saveConfirmation
                    ? saveConfirmation.visible
                      ? saveConfirmation.message
                      : saveConfirmation.originalLabel
                    : activeSavedDeviceId
                      ? text.saveChanges
                      : text.calculate}
                </span>
              </span>
            </span>
          </button>
        </div>
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
        data-calculator-result
        className={`relative flex min-w-0 flex-col justify-center overflow-hidden rounded-[1.45rem] border border-[#dde2d8] bg-[#f6f6f0] !pb-16 text-[#24302d] shadow-[inset_0_1px_0_rgba(255,255,255,0.94),0_12px_30px_-28px_rgba(35,48,44,0.32)] ${
          homePresentation
            ? "min-h-[280px] p-6 sm:p-7"
            : "min-h-[420px] p-6 sm:p-8 lg:p-10"
        }`}
      >
        {calculationIsValid ? (
          <>
            <p className={`${homePresentation ? "text-[15px]" : "text-lg sm:text-xl"} font-semibold tracking-[-0.02em] text-[#44524d]`}>
              {activeLocale === "de" ? "Deine Jahreskosten" : "Your yearly cost"}
            </p>

            <div className={homePresentation ? "mt-3" : "mt-5"}>
              <span className={`${homePresentation ? "text-[clamp(2rem,3.3vw,3.5rem)]" : "text-[clamp(2.5rem,4.4vw,4.6rem)]"} block max-w-full whitespace-normal font-bold leading-[0.98] tracking-[-0.045em] text-[#1d2926] tabular-nums [overflow-wrap:anywhere]`}>
                {formatMoney(
                  yearlyCost,
                  activeLocale,
                  currency
                )}
              </span>
            </div>

            <div className={`${homePresentation ? "mt-4 pt-4" : "mt-7 pt-6"} grid grid-cols-2 divide-x divide-[#dfe4da] border-t border-[#dfe4da]`}>
              <div className="flex min-w-0 items-center gap-3 pr-4">
                <span className={`${homePresentation ? "h-9 w-9" : "h-11 w-11"} flex shrink-0 items-center justify-center rounded-full bg-[#dcf5e6] text-[var(--brand-green)]`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="5" width="16" height="15" rx="2" />
                    <path d="M8 3v4M16 3v4M4 9h16" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className={`${homePresentation ? "text-base sm:text-lg" : "text-lg sm:text-xl"} break-words font-bold tracking-[-0.02em] text-[#24302d] tabular-nums [overflow-wrap:anywhere]`}>
                    {formatMoney(monthlyCost, activeLocale, currency)}
                  </p>
                  <p className="text-sm text-[#66736e]">{text.result.perMonth}</p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3 pl-4">
                <span className={`${homePresentation ? "h-9 w-9" : "h-11 w-11"} flex shrink-0 items-center justify-center rounded-full bg-[#dcf5e6] text-[var(--brand-green)]`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 20v-5M10 20V9M15 20v-8M20 20V4" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className={`${homePresentation ? "text-base sm:text-lg" : "text-lg sm:text-xl"} break-words font-bold tracking-[-0.02em] text-[#24302d] tabular-nums [overflow-wrap:anywhere]`}>
                    {formatMoney(weeklyCost, activeLocale, currency)}
                  </p>
                  <p className="text-sm text-[#66736e]">{text.result.perWeek}</p>
                </div>
              </div>
            </div>

            {supportsUsageScenario && (
              <div className={`${homePresentation ? "mt-3 pt-3" : "mt-5 pt-4"} border-t border-[#dfe4da] pb-4`}>
                <div className="flex items-start justify-between gap-3 text-xs">
                  <span className="font-semibold text-[#52605b]">{text.result.scenario}</span>
                  <span className="whitespace-nowrap font-bold text-[var(--brand-green)] tabular-nums">
                    {text.result.savings} {formatMoney(scenarioSavings, activeLocale, currency)} / {activeLocale === "de" ? "Jahr" : "year"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-[#7a8580]">
                  {text.result.scenarioText}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={usesPerWeekValue}
                    step={
                      !isContinuousDevice && usagePeriod === "month"
                        ? 6 / 52
                        : 0.5
                    }
                    value={scenarioUsesPerWeekValue}
                    onChange={(event) => setScenarioUsesPerWeek(Number(event.target.value))}
                    className="calculator-scenario-slider h-6 min-w-0 flex-1 cursor-pointer"
                    aria-label={text.result.scenarioText}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 text-[10px] font-medium text-[#66736e] tabular-nums">
                  <span>
                    {text.result.currentUses}: {formatNumber(usageAmountValue, activeLocale, 0, 1)}× {isContinuousDevice ? text.fields.perWeek : usagePeriodText}
                  </span>
                  <span className="text-right font-semibold text-[var(--brand-green)]">
                    {text.result.selectedUses}: {formatNumber(displayedScenarioUses, activeLocale, 0, 1)}× {isContinuousDevice ? text.fields.perWeek : usagePeriodText}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setCalculationDetailsOpen((open) => !open)}
              aria-expanded={calculationDetailsOpen}
              className="group absolute inset-x-0 bottom-0 z-10 flex h-16 w-full items-center gap-4 border-t border-[#dfe4da] bg-[#f6f6f0] px-6 text-left transition-colors hover:bg-[#f0f3eb] sm:px-7 lg:px-10"
            >
              <span className="min-w-0 flex-1">
                {calculationDetailsOpen ? (
                  <>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--brand-green)]">
                      {text.result.formula}
                    </span>
                    <span title={calculationFormula} className="mt-0.5 block truncate text-[11px] font-medium leading-4 text-[#52605b]">
                      {calculationFormula}
                    </span>
                    <span title={accuracyText} className="block whitespace-normal text-[9px] leading-3 text-[#7a8580]">
                      {text.accuracy.title}: {accuracyText}
                    </span>
                  </>
                ) : (
                  <span className="block text-[13px] font-semibold text-[var(--brand-green)] transition-colors group-hover:text-[var(--brand-green-dark)]">
                    {text.result.details}
                  </span>
                )}
              </span>
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 shrink-0 origin-center items-center justify-center text-lg leading-none text-[var(--brand-green)] transition-transform duration-[180ms] ${
                  calculationDetailsOpen ? "-rotate-45" : "rotate-0"
                }`}
              >
                +
              </span>
            </button>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold tracking-[-0.025em] text-[#33413d]">
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

      {homePresentation && calculationIsValid && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#b8efcc] bg-[#eefbf3] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--brand-green)]">
              {text.homeNextStep.label}
            </p>
            <p className="mt-1 text-[13px] leading-5 text-[#52605b]">
              {text.homeNextStep.text}
            </p>
          </div>
          <a
            href={activeLocale === "de" ? "/de/zuhause" : "/home"}
            className="eavesence-pill-link shrink-0"
          >
            {text.homeNextStep.link}
          </a>
        </div>
      )}

      {homePresentation && trustItems.length > 0 && (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5">
          {trustItems.map((item, index) => (
            <div
              key={item}
              className="flex items-center justify-center gap-2 text-[12px] font-semibold text-slate-600"
            >
              <span className="text-[var(--brand-green)]" aria-hidden="true">
                <TrustSignalIcon index={index} />
              </span>
              {item}
            </div>
          ))}
        </div>
      )}

      {/* Saving tip */}
      <div className={`${homePresentation ? "mt-10" : "mt-5"} px-1 py-2`}>
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[var(--brand-green)]"
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
            <p className="text-xs font-bold text-[var(--brand-green)]">
              {text.savingTip.title.replace("💡 ", "")}
            </p>
            <p className="mt-0.5 text-[13px] leading-5 text-[#52605b]">
              {localizedTip}
            </p>
          </div>
        </div>
      </div>

      {afterSavingTip}

      {!homePresentation && calculationIsValid && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setComparisonOpen((open) => !open)}
            aria-expanded={comparisonOpen}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left text-sm font-semibold text-slate-700 transition hover:border-green-300 hover:bg-slate-50 hover:text-[var(--brand-green-dark)]"
          >
            <span>
              {comparisonOpen
                ? text.comparison.close
                : text.comparison.open}
            </span>
            <span
              aria-hidden="true"
              className={`flex h-7 w-7 shrink-0 items-center justify-center text-lg leading-none text-[var(--brand-green)] transition-transform duration-200 ${
                comparisonOpen ? "-rotate-45" : ""
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
                  <label htmlFor={fieldIds.comparisonDevice} className="mb-2 block text-sm font-semibold text-slate-700">
                    {text.comparison.select}
                  </label>
                  <select
                    id={fieldIds.comparisonDevice}
                    value={comparisonDevice.name}
                    onChange={(event) =>
                      handleComparisonDeviceChange(event.target.value)
                    }
                    className={secondaryFieldClassName}
                  >
                    {comparisonCandidates.map((item) => (
                      <option key={item.name} value={item.name}>
                        {getLocalizedDevice(item, activeLocale).name}
                      </option>
                    ))}
                  </select>
                </div>
                {comparisonDevice.usagePattern !== "annual" && <div>
                  <label htmlFor={fieldIds.comparisonUses} className="mb-2 block text-sm font-semibold text-slate-700">
                    {comparisonDevice.usagePattern === "continuous"
                      ? text.fields.daysPerWeek
                      : text.comparison.uses}
                  </label>
                  <input
                    id={fieldIds.comparisonUses}
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    value={comparisonUsesPerWeek}
                    onChange={(event) =>
                      setComparisonUsesPerWeek(
                        parseNumericInput(event.target.value)
                      )
                    }
                    className={secondaryFieldClassName}
                  />
                </div>}
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
                    usagePattern: isAnnualDevice
                      ? "annual"
                      : isContinuousDevice
                        ? "continuous"
                        : "perUse",
                    cheaper: currentIsCheaper,
                  },
                  {
                    key: "alternative",
                    eyebrow: text.comparison.alternative,
                    name: localizedComparisonDevice.name,
                    yearly: comparisonYearlyCost,
                    kwh: comparisonYearlyKwh,
                    perUse: comparisonCostPerUse,
                    usagePattern: comparisonDevice.usagePattern ?? "perUse",
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
                    <p className="mt-4 text-2xl font-extrabold text-[var(--brand-green)]">
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
                          {option.usagePattern === "annual"
                            ? text.comparison.yearlyCost
                            : option.usagePattern === "continuous"
                              ? text.comparison.perDay
                              : text.comparison.perUse}
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatMoney(option.perUse, activeLocale, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-[var(--brand-green)] px-4 py-3 text-center text-sm font-semibold text-[var(--brand-off-white)]">
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
        teaser
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
          usagePeriod,
          usageAmount: usageAmountValue,
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
            <span className="block text-xs text-[color:var(--brand-green)]/65">{text.result.perYear}</span>
            <span className="font-extrabold">{formatMoney(yearlyCost, activeLocale, currency)}</span>
          </span>
          <span className="text-sm font-bold">{text.result.viewResult} ↑</span>
        </button>
      )}

    </section>
  );
}
