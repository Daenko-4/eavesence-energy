import Link from "next/link";

import EnergyCalculator from "@/components/EnergyCalculator";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { Device } from "@/data/devices";
import { devices } from "@/data/devices";
import type { Locale } from "@/i18n/config";
import {
  getLocalizedCategory,
  getLocalizedDevice,
} from "@/i18n/devices";

type DeviceDetailPageProps = {
  device: Device;
  locale?: Locale;
};

const DEFAULT_ELECTRICITY_PRICE = 0.35;

const pageText = {
  de: {
    devices: "Geräte",
    calculator: "Stromkosten-Rechner",

    heroTitleBefore: "Was kostet",
    heroTitleAfter: "an Strom?",

    example: "Beispielrechnung",
    referenceValues: "Orientierungswerte für",
    referenceDescription:
      "Diese Werte sind ein sinnvoller Startpunkt für den Rechner, aber keine garantierten Verbrauchswerte für dein konkretes Modell.",

    power: "Leistung",
    durationPerUse: "Dauer/Nutzung",
    consumptionPerUse: "Verbrauch/Nutzung",
    usesPerWeek: "Nutzungen/Woche",
    examplePerYear: "Beispiel/Jahr",

    minutes: "Min.",

    dataBasis: "Zur Datenbasis",

    exampleWith: "Beispiel mit",
    resultingIn: "Daraus ergeben sich ungefähr",
    perUse: "pro Nutzung",
    perMonth: "pro Monat",
    perYearKwh: "kWh pro Jahr",

    yourValues: "Deine Werte",
    calculatorTitleAfter:
      "Stromkosten selbst berechnen",
    calculatorDescription:
      "Passe die vorgeschlagenen Werte an dein eigenes Gerät, deinen Stromtarif und deine tatsächliche Nutzung an.",

    understandCalculation:
      "Berechnung verstehen",
    howCalculated:
      "Wie berechnet EAVESENCE die Stromkosten?",

    powerExplanation1:
      "EAVESENCE rechnet die Leistung des Geräts von Watt in Kilowatt um und multipliziert sie mit der Nutzungsdauer.",
    powerExplanation2:
      "Anschließend wird der errechnete Verbrauch mit deinem Strompreis und der Nutzungshäufigkeit multipliziert.",
    powerFormula:
      "Watt ÷ 1.000 × Stunden × Strompreis",
    powerExplanation3:
      "Das ist eine Näherung. Bei Geräten, deren Leistungsaufnahme während des Betriebs schwankt, ist ein gemessener Verbrauch genauer.",

    consumptionExplanation1:
      "Bei diesem Gerät ist ein Verbrauchswert pro Nutzung sinnvoller als eine einfache Rechnung aus Watt und Laufzeit.",
    consumptionExplanation2:
      "EAVESENCE multipliziert deshalb den Verbrauch pro Nutzung mit deinem Strompreis und deiner Nutzungshäufigkeit.",
    consumptionFormula:
      "kWh pro Nutzung × Strompreis × Nutzungen",
    consumptionExplanation3:
      "Wenn dein Energielabel einen Wert pro 100 Zyklen angibt, kannst du diesen durch 100 teilen und als Verbrauch pro Nutzung in EAVESENCE eintragen.",

    savingTip: "💡 Spartipp für",

    moreAccurate: "Noch genauer?",
    moreAccurateText1:
      "Verwende im Rechner den Modus",
    exactMode: "„Eigene Werte“",
    moreAccurateText2:
      "und gib einen eigenen Messwert in kWh pro Nutzung ein.",

    moreFrom: "Mehr aus",
    relatedDevices: "Verwandte Geräte",
    viewAllDevices: "Alle Geräte ansehen →",
    calculateCosts:
      "Stromkosten berechnen →",

    anotherDevice:
      "Noch ein Gerät prüfen?",
    libraryText:
      "In unserer Gerätebibliothek findest du weitere Stromkosten-Rechner.",
    allDevices: "Alle Geräte",
  },

  en: {
    devices: "Devices",
    calculator: "Electricity cost calculator",

    heroTitleBefore: "How much does",
    heroTitleAfter: "cost to run?",

    example: "Example calculation",
    referenceValues: "Typical values for",
    referenceDescription:
      "These values are a useful starting point for the calculator, but they are not guaranteed consumption figures for your specific model.",

    power: "Power",
    durationPerUse: "Duration/use",
    consumptionPerUse: "Consumption/use",
    usesPerWeek: "Uses/week",
    examplePerYear: "Example/year",

    minutes: "min",

    dataBasis: "About the data",

    exampleWith: "Example using",
    resultingIn: "This works out to approximately",
    perUse: "per use",
    perMonth: "per month",
    perYearKwh: "kWh per year",

    yourValues: "Your values",
    calculatorTitleAfter:
      "electricity cost calculator",
    calculatorDescription:
      "Adjust the suggested values to match your own device, electricity tariff and actual usage.",

    understandCalculation:
      "Understand the calculation",
    howCalculated:
      "How does EAVESENCE calculate electricity costs?",

    powerExplanation1:
      "EAVESENCE converts the device's power from watts to kilowatts and multiplies it by the usage time.",
    powerExplanation2:
      "The calculated electricity consumption is then multiplied by your electricity price and usage frequency.",
    powerFormula:
      "Watts ÷ 1,000 × hours × electricity price",
    powerExplanation3:
      "This is an estimate. For devices whose power consumption changes during operation, a measured consumption value is more accurate.",

    consumptionExplanation1:
      "For this device, a consumption value per use is more useful than a simple calculation based on watts and runtime.",
    consumptionExplanation2:
      "EAVESENCE therefore multiplies consumption per use by your electricity price and usage frequency.",
    consumptionFormula:
      "kWh per use × electricity price × uses",
    consumptionExplanation3:
      "If your energy label states a value per 100 cycles, divide it by 100 and enter the result in EAVESENCE as consumption per use.",

    savingTip: "💡 Energy-saving tip for",

    moreAccurate: "Want a more accurate result?",
    moreAccurateText1:
      "Use the calculator mode",
    exactMode: "“Your own values”",
    moreAccurateText2:
      "and enter your own measured consumption in kWh per use.",

    moreFrom: "More from",
    relatedDevices: "Related devices",
    viewAllDevices: "View all devices →",
    calculateCosts:
      "Calculate electricity costs →",

    anotherDevice:
      "Want to check another device?",
    libraryText:
      "You'll find more electricity cost calculators in our device library.",
    allDevices: "All devices",
  },
} as const;

function formatNumber(
  value: number,
  locale: Locale,
  minimumFractionDigits: number,
  maximumFractionDigits: number
) {
  return value.toLocaleString(
    locale === "de" ? "de-DE" : "en-GB",
    {
      minimumFractionDigits,
      maximumFractionDigits,
    }
  );
}

function formatEuro(
  value: number,
  locale: Locale
) {
  const valueText = formatNumber(
    value,
    locale,
    2,
    2
  );

  return locale === "de"
    ? `${valueText} €`
    : `€${valueText}`;
}

function formatKwh(
  value: number,
  locale: Locale
) {
  return formatNumber(
    value,
    locale,
    1,
    2
  );
}

function getTypicalKwhPerUse(
  device: Device
) {
  if (
    device.calculationType ===
    "consumption"
  ) {
    return device.kwhPerUse ?? 0;
  }

  return (
    ((device.watts ?? 0) / 1000) *
    ((device.typicalMinutes ?? 0) / 60)
  );
}

export default function DeviceDetailPage({
  device,
  locale = "de",
}: DeviceDetailPageProps) {
  const text = pageText[locale];

  const localizedDevice =
    getLocalizedDevice(device, locale);

  const localizedCategory =
    getLocalizedCategory(
      device.category,
      locale
    );

  const devicesHref =
    locale === "de"
      ? "/geraete"
      : "/en/devices";

  const homeHref =
    locale === "de" ? "/" : "/en";

  const kwhPerUse =
    getTypicalKwhPerUse(device);

  const typicalUsesPerWeek =
    device.typicalUsesPerWeek ?? 1;

  const yearlyKwh =
    kwhPerUse *
    typicalUsesPerWeek *
    52;

  const yearlyCost =
    yearlyKwh *
    DEFAULT_ELECTRICITY_PRICE;

  const costPerUse =
    kwhPerUse *
    DEFAULT_ELECTRICITY_PRICE;

  const monthlyCost =
    yearlyCost / 12;

  const relatedDevices = devices
    .filter(
      (item) =>
        item.category ===
          device.category &&
        item.slug !== device.slug
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header locale={locale} />

      <main>
        {/* Hero */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-20">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href={homeHref}
                className="font-semibold text-blue-600 transition hover:text-blue-800"
              >
                EAVESENCE Energy
              </Link>

              <span className="text-slate-300">
                /
              </span>

              <Link
                href={devicesHref}
                className="font-semibold text-blue-600 transition hover:text-blue-800"
              >
                {text.devices}
              </Link>

              <span className="text-slate-300">
                /
              </span>

              <span className="text-slate-500">
                {localizedDevice.name}
              </span>
            </div>

            <div className="mt-8">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                {localizedCategory} ·{" "}
                {text.calculator}
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
                {text.heroTitleBefore}{" "}
                {localizedDevice.name}{" "}
                {text.heroTitleAfter}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
                {
                  localizedDevice.description
                }
              </p>
            </div>
          </div>
        </section>

        {/* Example calculation */}
        <section className="px-5 py-12 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                    {text.example}
                  </p>

                  <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    {
                      text.referenceValues
                    }{" "}
                    {localizedDevice.name}
                  </h2>
                </div>

                <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  {
                    localizedDevice.dataBasis
                  }
                </span>
              </div>

              <p className="mt-4 max-w-3xl leading-7 text-slate-600">
                {
                  text.referenceDescription
                }
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {device.calculationType ===
                "power" ? (
                  <>
                    <div className="rounded-xl bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">
                        {text.power}
                      </p>

                      <p className="mt-1 text-2xl font-bold">
                        {device.watts} W
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">
                        {
                          text.durationPerUse
                        }
                      </p>

                      <p className="mt-1 text-2xl font-bold">
                        {
                          device.typicalMinutes
                        }{" "}
                        {text.minutes}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">
                      {
                        text.consumptionPerUse
                      }
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {formatKwh(
                        kwhPerUse,
                        locale
                      )}{" "}
                      kWh
                    </p>
                  </div>
                )}

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">
                    {text.usesPerWeek}
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {typicalUsesPerWeek}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900 p-5 text-white">
                  <p className="text-sm text-slate-300">
                    {
                      text.examplePerYear
                    }
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {formatEuro(
                      yearlyCost,
                      locale
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {text.dataBasis}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {localizedDevice.dataNote}
                </p>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-500">
                {text.exampleWith}{" "}
                {formatEuro(
                  DEFAULT_ELECTRICITY_PRICE,
                  locale
                )}
                /kWh. {text.resultingIn}{" "}
                {formatEuro(
                  costPerUse,
                  locale
                )}{" "}
                {text.perUse},{" "}
                {formatEuro(
                  monthlyCost,
                  locale
                )}{" "}
                {text.perMonth}{" "}
                {locale === "de"
                  ? "und"
                  : "and"}{" "}
                {formatKwh(
                  yearlyKwh,
                  locale
                )}{" "}
                {text.perYearKwh}.
              </p>
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section
          id="rechner"
          className="px-5 pb-16 pt-4 sm:px-6 sm:pb-20"
        >
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                {text.yourValues}
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {localizedDevice.name}{" "}
                {
                  text.calculatorTitleAfter
                }
              </h2>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                {
                  text.calculatorDescription
                }
              </p>
            </div>

            <EnergyCalculator
              initialDevice={device.name}
              locale={locale}
            />
          </div>
        </section>

        {/* Explanation */}
        <section className="bg-white px-5 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                  {
                    text.understandCalculation
                  }
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  {text.howCalculated}
                </h2>

                {device.calculationType ===
                "power" ? (
                  <div className="mt-5 space-y-4 leading-8 text-slate-600">
                    <p>
                      {
                        text.powerExplanation1
                      }
                    </p>

                    <p>
                      {
                        text.powerExplanation2
                      }
                    </p>

                    <div className="rounded-xl bg-slate-50 p-4 font-medium text-slate-700">
                      {text.powerFormula}
                    </div>

                    <p>
                      {
                        text.powerExplanation3
                      }
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4 leading-8 text-slate-600">
                    <p>
                      {
                        text.consumptionExplanation1
                      }
                    </p>

                    <p>
                      {
                        text.consumptionExplanation2
                      }
                    </p>

                    <div className="rounded-xl bg-slate-50 p-4 font-medium text-slate-700">
                      {
                        text.consumptionFormula
                      }
                    </div>

                    <p>
                      {
                        text.consumptionExplanation3
                      }
                    </p>
                  </div>
                )}
              </div>

              <div>
                <div className="rounded-2xl bg-blue-50 p-6 ring-1 ring-blue-100 sm:p-8">
                  <p className="text-lg font-bold text-slate-900">
                    {text.savingTip}{" "}
                    {localizedDevice.name}
                  </p>

                  <p className="mt-4 leading-8 text-slate-600">
                    {localizedDevice.tip}
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 p-6 sm:p-8">
                  <p className="font-bold text-slate-900">
                    {text.moreAccurate}
                  </p>

                  <p className="mt-3 leading-7 text-slate-600">
                    {
                      text.moreAccurateText1
                    }{" "}
                    <strong>
                      {text.exactMode}
                    </strong>{" "}
                    {
                      text.moreAccurateText2
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related devices */}
        {relatedDevices.length > 0 && (
          <section className="px-5 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-5xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                    {text.moreFrom}{" "}
                    {localizedCategory}
                  </p>

                  <h2 className="mt-3 text-3xl font-bold tracking-tight">
                    {
                      text.relatedDevices
                    }
                  </h2>
                </div>

                <Link
                  href={devicesHref}
                  className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                >
                  {text.viewAllDevices}
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedDevices.map(
                  (relatedDevice) => {
                    const localizedRelated =
                      getLocalizedDevice(
                        relatedDevice,
                        locale
                      );

                    const href =
                      locale === "de"
                        ? `/geraete/${relatedDevice.slug}`
                        : `/en/devices/${localizedRelated.slug}`;

                    return (
                      <Link
                        key={
                          relatedDevice.slug
                        }
                        href={href}
                        className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                      >
                        <p className="text-sm font-semibold text-blue-600">
                          {getLocalizedCategory(
                            relatedDevice.category,
                            locale
                          )}
                        </p>

                        <h3 className="mt-2 text-xl font-bold">
                          {
                            localizedRelated.name
                          }
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {
                            localizedRelated.description
                          }
                        </p>

                        <p className="mt-5 text-sm font-semibold text-slate-900">
                          {
                            text.calculateCosts
                          }
                        </p>
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        )}

        {/* Back to library */}
        <section className="px-5 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto flex max-w-5xl flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-900">
                {text.anotherDevice}
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                {text.libraryText}
              </p>
            </div>

            <Link
              href={devicesHref}
              className="shrink-0 rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98]"
            >
              {text.allDevices}
            </Link>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}