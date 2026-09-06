"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { devices } from "@/data/devices";
import type { Locale } from "@/i18n/config";
import {
  getLocalizedCategory,
  getLocalizedDevice,
} from "@/i18n/devices";

const CUSTOM_DEVICE = "__custom_device__";

/*
  Hier bitte wieder dieselbe Feedback-E-Mail einsetzen,
  die aktuell bereits in deiner Datei verwendet wird.
*/
const FEEDBACK_EMAIL = "parkwaydrive@gmx.at";

type Mode = "estimate" | "exact";
type NumericInput = number | "";

type EnergyCalculatorProps = {
  initialDevice?: string;
  controlledMode?: Mode;
  onModeChange?: (mode: Mode) => void;
  locale?: Locale;
};

const calculatorText = {
  de: {
    modes: {
      estimate: "Gerät auswählen",
      exact: "Eigene Werte",
      estimateDescription:
        "TinyTools verwendet Orientierungswerte, die du an deine Nutzung anpassen kannst.",
      exactDescription:
        "Nutze einen gemessenen oder anderweitig bekannten Verbrauch in kWh pro Nutzung.",
    },

    device: {
      label: "Gerät",
      otherCategory: "Andere",
      custom: "Eigenes Gerät",
      customName: "Name des Geräts",
      customPlaceholder: "z. B. Ventilator",
      customHint:
        "Optional – der Name erscheint später in deinem Ergebnis.",
    },

    fields: {
      power: "Leistung",
      minutesPerUse: "Minuten pro Nutzung",
      consumptionPerUse: "Verbrauch pro Nutzung",
      actualConsumptionPerUse:
        "Tatsächlicher Verbrauch pro Nutzung",
      electricityPrice: "Strompreis",
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
        "Gib für alle benötigten Felder einen Wert größer als 0 ein, damit TinyTools deine Stromkosten berechnen kann.",
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
        "TinyTools zeigt dir dann Kosten pro Nutzung, Woche, Monat und Jahr.",
    },

    savingTip: {
      title: "💡 Spartipp",
      custom:
        "Prüfe die Leistungs- oder Verbrauchsangabe auf dem Typenschild, in der Bedienungsanleitung oder mit einem Strommessgerät.",
      fallback:
        "Vergleiche deinen tatsächlichen Verbrauch mit dem geschätzten Wert.",
    },

    accuracy: {
      consumptionEstimate:
        "Die Berechnung nutzt einen anpassbaren Orientierungswert für den Verbrauch pro Nutzung. Der tatsächliche Verbrauch kann je nach Gerät, Programm und Nutzung abweichen.",
      powerEstimate:
        "Die Berechnung nutzt Leistung × Nutzungsdauer als Näherung. Bei Geräten, deren Leistungsaufnahme während des Betriebs schwankt, kann der tatsächliche Verbrauch abweichen.",
      exact:
        "Die Berechnung verwendet den von dir angegebenen Verbrauch pro Nutzung. Die Genauigkeit hängt davon ab, wie zuverlässig dieser Wert ermittelt wurde.",
    },

    feedback: {
      title: "💬 Hat dir TinyTools geholfen?",
      text:
        "Fehlt dir ein Gerät, war etwas unklar oder hast du eine Idee, wie TinyTools besser werden kann? Kurzes Feedback hilft uns sehr.",
      button: "Feedback senden →",
      note:
        "Der Button öffnet dein E-Mail-Programm. TinyTools speichert dabei keine Daten und verwendet weiterhin kein Tracking.",
      subject: "Feedback zu TinyTools Energy",
    },

    reset: "Werte zurücksetzen",
    fallbackDevice: "Gerät",
  },

  en: {
    modes: {
      estimate: "Choose a device",
      exact: "Your own values",
      estimateDescription:
        "TinyTools uses typical values that you can adjust to match your usage.",
      exactDescription:
        "Use a measured or otherwise known electricity consumption in kWh per use.",
    },

    device: {
      label: "Device",
      otherCategory: "Other",
      custom: "Custom device",
      customName: "Device name",
      customPlaceholder: "e.g. Fan",
      customHint:
        "Optional – the name will appear in your result.",
    },

    fields: {
      power: "Power",
      minutesPerUse: "Minutes per use",
      consumptionPerUse: "Consumption per use",
      actualConsumptionPerUse:
        "Actual consumption per use",
      electricityPrice: "Electricity price",
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
        "Enter a value greater than 0 in all required fields so TinyTools can calculate your electricity costs.",
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
        "TinyTools will show your costs per use, week, month and year.",
    },

    savingTip: {
      title: "💡 Energy-saving tip",
      custom:
        "Check the power or consumption rating on the device label, in the instruction manual or with an electricity meter.",
      fallback:
        "Compare your actual electricity consumption with the estimated value.",
    },

    accuracy: {
      consumptionEstimate:
        "The calculation uses an adjustable typical value for electricity consumption per use. Actual consumption may vary depending on the device, program and usage.",
      powerEstimate:
        "The calculation uses power × usage duration as an estimate. For devices whose power consumption varies during operation, actual electricity consumption may differ.",
      exact:
        "The calculation uses the electricity consumption per use that you entered. Accuracy depends on how reliably this value was measured or determined.",
    },

    feedback: {
      title: "💬 Did TinyTools help you?",
      text:
        "Is a device missing, was something unclear or do you have an idea for improving TinyTools? A short message helps us a lot.",
      button: "Send feedback →",
      note:
        "The button opens your email application. TinyTools does not store any data and continues to use no tracking.",
      subject: "Feedback about TinyTools Energy",
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

function formatMoney(value: number, locale: Locale) {
  const formatted = formatNumber(value, locale, 2, 2);

  return locale === "de"
    ? `${formatted} €`
    : `€${formatted}`;
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

  const [customDeviceName, setCustomDeviceName] =
    useState("");

  const [price, setPrice] =
    useState<NumericInput>(0.35);

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

  function loadDeviceDefaults(name: string) {
    if (name === CUSTOM_DEVICE) {
      setCustomDeviceName("");
      setWatts(0);
      setMinutesPerUse(0);
      setUsesPerWeek(1);
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

    setUsesPerWeek(
      selected.typicalUsesPerWeek ?? 1
    );

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
    loadDeviceDefaults(name);
  }

  function handleReset() {
    setPrice(0.35);
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

  const warnings: string[] = [];

  if (priceValue > 1) {
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
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.25)] sm:p-8">
      {/* Mode switch */}
      <div className="mb-8">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1.5">
          <button
            type="button"
            onClick={() =>
              changeMode("estimate")
            }
            className={`relative flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-black transition duration-200 active:scale-[0.99] ${
              mode === "estimate"
                ? "bg-green-100 text-green-950 shadow-sm"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            <LeafIcon />

            <span>
              {text.modes.estimate}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              changeMode("exact")
            }
            className={`relative flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-black transition duration-200 active:scale-[0.99] ${
              mode === "exact"
                ? "bg-green-100 text-green-950 shadow-sm"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            <CalculatorIcon />

            <span>
              {text.modes.exact}
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
          {categories.map((category) => (
            <optgroup
              key={category}
              label={getLocalizedCategory(
                category,
                activeLocale
              )}
            >
              {devices
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
              €/kWh
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {
              text.hints
                .electricityPrice
            }
          </p>
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
            onChange={(event) =>
              setUsesPerWeek(
                parseNumericInput(
                  event.target.value
                )
              )
            }
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
                  activeLocale
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
                    activeLocale
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
                    activeLocale
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
                    activeLocale
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
      <div className="mt-6 rounded-2xl bg-amber-50/80 px-5 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700"
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

            <p className="text-lg font-bold text-slate-900">
              {text.savingTip.title.replace("💡 ", "")}
            </p>
          </div>

          <p className="mt-4 text-center text-sm leading-6 text-slate-600">
            {localizedTip}
          </p>
        </div>
      </div>

      {/* Accuracy */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-[#f7faf7] p-4">
        <p className="text-sm leading-6 text-slate-500">
          {mode === "estimate"
            ? isConsumptionDevice
              ? text.accuracy
                  .consumptionEstimate
              : text.accuracy
                  .powerEstimate
            : text.accuracy.exact}
        </p>
      </div>

      {/* Feedback */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-[#f1f6f1]">
        <div className="flex items-center gap-3 px-5 pb-3 pt-5 sm:px-6">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-[18px] w-[18px]"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
              <path d="M8 9h8" />
              <path d="M8 13h5" />
            </svg>
          </span>

          <p className="text-base font-bold text-slate-900">
            {text.feedback.title.replace("💬 ", "")}
          </p>
        </div>

        <div className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6">
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            {text.feedback.text}
          </p>

          <a
            href={`mailto:${FEEDBACK_EMAIL}?subject=${feedbackSubject}`}
            className="mt-4 inline-flex items-center rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-800 hover:shadow-md active:scale-[0.98]"
          >
            {text.feedback.button}
          </a>

          <p className="mt-4 max-w-2xl text-xs leading-5 text-slate-500">
            {text.feedback.note}
          </p>
        </div>
      </div>

    </section>
  );
}