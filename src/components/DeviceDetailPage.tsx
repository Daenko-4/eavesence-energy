import Link from "next/link";

import EnergyCalculator from "@/components/EnergyCalculator";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getDeviceSeoContent } from "@/data/deviceSeoContent";
import type { Device } from "@/data/devices";
import {
  devices,
  getDeviceCalculationDefaults,
  getDeviceTypicalYearlyKwh,
} from "@/data/devices";
import {
  getDevicesHref,
  getHomeHref,
  type Locale,
} from "@/i18n/config";
import {
  getLocalizedCategory,
  getLocalizedDevice,
} from "@/i18n/devices";

type DeviceDetailPageProps = {
  device: Device;
  locale?: Locale;
};

const DEFAULT_ELECTRICITY_PRICE = 0.35;
const SITE_URL = "https://eavesence.com";

function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

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
    annualConsumption: "Verbrauch/Jahr",
    hoursPerDay: "Stunden/Tag",
    daysPerWeek: "Tage/Woche",
    usesPerWeek: "Nutzungen/Woche",
    examplePerYear: "Beispiel/Jahr",

    minutes: "Min.",

    dataBasis: "Zur Datenbasis",

    exampleWith: "Beispiel mit",
    resultingIn: "Daraus ergeben sich ungefähr",
    perUse: "pro Nutzung",
    perDay: "pro Betriebstag",
    perYear: "pro Jahr",
    perMonth: "pro Monat",
    perYearKwh: "kWh pro Jahr",

    yourValues: "Deine Werte",
    calculatorTitleAfter:
      "Stromkosten selbst berechnen",
    calculatorDescription:
      "Passe die vorgeschlagenen Werte an dein eigenes Gerät, deinen Stromtarif und deine tatsächliche Nutzung an.",

    guide: "Praxis-Ratgeber",
    scenarioUses: "Nutzungen pro Woche",
    scenarioCost: "Stromkosten pro Jahr",

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
    annualConsumption: "Consumption/year",
    hoursPerDay: "Hours/day",
    daysPerWeek: "Days/week",
    usesPerWeek: "Uses/week",
    examplePerYear: "Example/year",

    minutes: "min",

    dataBasis: "About the data",

    exampleWith: "Example using",
    resultingIn: "This works out to approximately",
    perUse: "per use",
    perDay: "per operating day",
    perYear: "per year",
    perMonth: "per month",
    perYearKwh: "kWh per year",

    yourValues: "Your values",
    calculatorTitleAfter:
      "electricity cost calculator",
    calculatorDescription:
      "Adjust the suggested values to match your own device, electricity tariff and actual usage.",

    guide: "Practical guide",
    scenarioUses: "Uses per week",
    scenarioCost: "Electricity cost per year",

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
  const defaults = getDeviceCalculationDefaults(device);

  if (
    device.calculationType ===
    "consumption"
  ) {
    return defaults.estimatedKwhPerUse;
  }

  return (
    (defaults.watts / 1000) *
    (defaults.minutesPerUse / 60)
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

  const devicesHref = getDevicesHref(locale);
  const homeHref = getHomeHref(locale);
  const languageHref =
    locale === "de"
      ? `/en/devices/${getLocalizedDevice(device, "en").slug}`
      : `/geraete/${device.slug}`;
  const devicePath =
    locale === "de"
      ? `/geraete/${device.slug}`
      : `/en/devices/${localizedDevice.slug}`;
  const seoContent = getDeviceSeoContent(
    device.name,
    locale
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "EAVESENCE Energy",
        item: `${SITE_URL}${homeHref}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: text.devices,
        item: `${SITE_URL}${devicesHref}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: localizedDevice.name,
        item: `${SITE_URL}${devicePath}`,
      },
    ],
  };

  const faqJsonLd = seoContent
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: seoContent.faqs.map(
          (faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })
        ),
      }
    : null;

  const kwhPerUse =
    getTypicalKwhPerUse(device);

  const calculationDefaults = getDeviceCalculationDefaults(device);
  const typicalUsesPerWeek = calculationDefaults.usesPerWeek;

  const yearlyKwh = getDeviceTypicalYearlyKwh(device);

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
    <div
      lang={locale}
      className="min-h-screen bg-[var(--brand-off-white)] text-[#17211f]"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            breadcrumbJsonLd
          ),
        }}
      />

      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html:
              serializeJsonLd(faqJsonLd),
          }}
        />
      )}

      <Header
        locale={locale}
        calculatorHrefOverride="#rechner"
        languageHrefOverride={languageHref}
      />

      <main>
        {/* Hero */}
        <section className="border-b border-[#dfe5dd] bg-[var(--brand-off-white)] px-5 sm:px-6">
          <div className="mx-auto max-w-7xl py-7 sm:py-9">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href={homeHref}
                className="font-semibold text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]"
              >
                EAVESENCE Energy
              </Link>

              <span className="text-slate-300">
                /
              </span>

              <Link
                href={devicesHref}
                className="font-semibold text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]"
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

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-green)]">
                {localizedCategory} ·{" "}
                {text.calculator}
              </p>

              <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-[-0.04em] sm:text-4xl lg:text-[2.75rem]">
                {text.heroTitleBefore}{" "}
                {localizedDevice.name}{" "}
                {text.heroTitleAfter}
              </h1>

              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#65716d]">
                {
                  localizedDevice.description
                }
              </p>
            </div>
          </div>
        </section>

        {/* Example calculation */}
        <section className="px-5 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-7xl">
            <div className="border-y border-[#dfe5dd] py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-green)]">
                    {text.example}
                  </p>

                  <h2 className="mt-1.5 text-lg font-bold tracking-[-0.025em] sm:text-xl">
                    {
                      text.referenceValues
                    }{" "}
                    {localizedDevice.name}
                  </h2>
                </div>

                <span className="w-fit rounded-lg bg-[#e4f7ec] px-3 py-1.5 text-xs font-bold text-[var(--brand-green)]">
                  {
                    localizedDevice.dataBasis
                  }
                </span>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65716d]">
                {
                  text.referenceDescription
                }
              </p>

              <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-[#dfe5dd] bg-[#dfe5dd] sm:grid-cols-2 lg:grid-cols-4">
                {device.usagePattern === "annual" ? (
                  <div className="bg-[#f6f7f2] p-4">
                    <p className="text-sm text-slate-500">
                      {text.annualConsumption}
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {formatKwh(yearlyKwh, locale)} kWh
                    </p>
                  </div>
                ) : device.calculationType === "power" ? (
                  <>
                    <div className="bg-[#f6f7f2] p-4">
                      <p className="text-sm text-slate-500">
                        {text.power}
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        {device.watts} W
                      </p>
                    </div>

                    <div className="bg-[#f6f7f2] p-4">
                      <p className="text-sm text-slate-500">
                        {
                          device.usagePattern === "continuous"
                            ? text.hoursPerDay
                            : text.durationPerUse
                        }
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        {
                          device.usagePattern === "continuous"
                            ? device.typicalHoursPerDay
                            : device.typicalMinutes
                        }{" "}
                        {device.usagePattern === "continuous"
                          ? "h"
                          : text.minutes}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-[#f6f7f2] p-4">
                    <p className="text-sm text-slate-500">
                      {
                        text.consumptionPerUse
                      }
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {formatKwh(
                        kwhPerUse,
                        locale
                      )}{" "}
                      kWh
                    </p>
                  </div>
                )}

                {device.usagePattern !== "annual" && <div className="bg-[#f6f7f2] p-4">
                  <p className="text-sm text-slate-500">
                    {device.usagePattern === "continuous"
                      ? text.daysPerWeek
                      : text.usesPerWeek}
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {typicalUsesPerWeek}
                  </p>
                </div>}

                <div className="bg-[#1d2725] p-4 text-[var(--brand-off-white)]">
                  <p className="text-sm text-slate-300">
                    {
                      text.examplePerYear
                    }
                  </p>

                  <p className="mt-1 text-xl font-bold text-[var(--brand-green-mint)]">
                    {formatEuro(
                      yearlyCost,
                      locale
                    )}
                  </p>
                </div>
              </div>

              <details className="group mt-3">
                <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[var(--brand-green)] [&::-webkit-details-marker]:hidden">
                  {text.dataBasis}
                  <span
                    aria-hidden="true"
                    className="text-base font-light transition-transform duration-150 group-open:-rotate-45"
                  >
                    +
                  </span>
                </summary>

                <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
                  {localizedDevice.dataNote}
                </p>
              </details>

              <p className="mt-3 text-xs leading-5 text-slate-500">
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
                {device.usagePattern === "annual"
                  ? text.perYear
                  : device.usagePattern === "continuous"
                    ? text.perDay
                    : text.perUse},{" "}
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
          className="px-5 pb-12 pt-3 sm:px-6 sm:pb-14"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-green)]">
                {text.yourValues}
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                {localizedDevice.name}{" "}
                {
                  text.calculatorTitleAfter
                }
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#65716d]">
                {
                  text.calculatorDescription
                }
              </p>
            </div>

            <EnergyCalculator
              initialDevice={device.name}
              locale={locale}
              detailPage
            />
          </div>
        </section>

        {seoContent && (
          <section className="px-5 py-8 sm:px-6 sm:py-10">
            <details className="group/device-guide mx-auto max-w-7xl border-y border-[#dfe5dd]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-green)]">
                    {text.guide}
                  </span>
                  <span className="mt-2 block max-w-3xl text-xl font-bold tracking-[-0.03em] text-[#17211f] sm:text-2xl">
                    {seoContent.introTitle}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-xl font-light text-slate-500 transition-[color,transform] duration-200 group-open/device-guide:-rotate-45 group-open/device-guide:text-[var(--brand-green)]"
                >
                  +
                </span>
              </summary>

              <div className="pb-8">

              <div className="mt-4 max-w-4xl space-y-3 text-[15px] leading-7 text-[#65716d]">
                {seoContent.intro.map(
                  (paragraph) => (
                    <p key={paragraph}>
                      {paragraph}
                    </p>
                  )
                )}
              </div>

              <div className="mt-8">
                <h3 className="text-2xl font-bold tracking-tight">
                  {seoContent.scenariosTitle}
                </h3>

                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  {seoContent.scenariosIntro}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {seoContent.scenarios.map(
                    (scenario) => {
                      const scenarioYearlyCost =
                        kwhPerUse *
                        scenario.usesPerWeek *
                        52 *
                        DEFAULT_ELECTRICITY_PRICE;

                      return (
                        <div
                          key={scenario.label}
                          className="rounded-xl border border-[#dfe5dd] bg-[#fbfcf8] p-4"
                        >
                          <p className="font-bold text-slate-900">
                            {scenario.label}
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {scenario.note}
                          </p>

                          <p className="mt-5 text-2xl font-extrabold text-[var(--brand-green)]">
                            {formatEuro(
                              scenarioYearlyCost,
                              locale
                            )}
                          </p>

                          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {text.scenarioCost}
                          </p>

                          <p className="mt-4 text-sm text-slate-600">
                            {formatNumber(
                              scenario.usesPerWeek,
                              locale,
                              0,
                              1
                            )}{" "}
                            {text.scenarioUses}
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-[#dfe5dd] bg-[#fbfcf8] p-5 sm:p-6">
                  <h3 className="text-2xl font-bold tracking-tight">
                    {seoContent.valuesTitle}
                  </h3>

                  <p className="mt-4 leading-7 text-slate-600">
                    {seoContent.valuesText}
                  </p>
                </div>

                {seoContent.comparison && (
                  <div className="rounded-xl border border-[#cce8d7] bg-[#eaf8ef] p-5 sm:p-6">
                    <h3 className="text-2xl font-bold tracking-tight text-[var(--brand-green-dark)]">
                      {
                        seoContent.comparison
                          .title
                      }
                    </h3>

                    <p className="mt-4 leading-7 text-[color:var(--brand-green-dark)]/75">
                      {
                        seoContent.comparison
                          .text
                      }
                    </p>

                    <Link
                      href={
                        seoContent.comparison
                          .href
                      }
                      className="mt-6 inline-flex font-bold text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]"
                    >
                      {
                        seoContent.comparison
                          .linkLabel
                      }
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h3 className="text-2xl font-bold tracking-tight">
                  {seoContent.faqTitle}
                </h3>

                <div className="mt-5 space-y-3">
                  {seoContent.faqs.map((faq) => (
                    <details
                      key={faq.question}
                      className="group/faq-item rounded-xl border border-[#dfe5dd] bg-[#fbfcf8] p-4"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                        {faq.question}
                        <span
                          aria-hidden="true"
                          className="text-lg text-slate-400 transition group-open/faq-item:-rotate-45"
                        >
                          +
                        </span>
                      </summary>

                      <p className="mt-4 max-w-4xl leading-7 text-slate-600">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>

              <div className="mt-10 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  {seoContent.sourcesTitle}
                </h3>

                <ul className="mt-3 space-y-2 text-sm">
                  {seoContent.sources.map(
                    (source) => (
                      <li key={source.href}>
                        <a
                          href={source.href}
                          className="font-semibold text-[var(--brand-green)] underline decoration-[#a9d9bb] underline-offset-4 transition hover:text-[var(--brand-green-dark)]"
                        >
                          {source.label}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
              </div>
            </details>
          </section>
        )}

        {/* Related devices */}
        {relatedDevices.length > 0 && (
          <section className="border-t border-[#dfe5dd] px-5 py-10 sm:px-6 sm:py-12">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-green)]">
                    {text.moreFrom}{" "}
                    {localizedCategory}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em]">
                    {
                      text.relatedDevices
                    }
                  </h2>
                </div>

                <Link
                  href={devicesHref}
                  className="text-sm font-semibold text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]"
                >
                  {text.viewAllDevices}
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                        className="rounded-xl border border-[#dfe5dd] bg-[#fbfcf8] p-5 transition hover:border-[#a9d9bb] hover:bg-white active:scale-[0.995]"
                      >
                        <p className="text-xs font-semibold text-[var(--brand-green)]">
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

      </main>

      <Footer locale={locale} />
    </div>
  );
}
