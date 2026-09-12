"use client";

import Link from "next/link";
import { useState } from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { devices } from "@/data/devices";
import {
  getCalculatorHref,
  type Locale,
} from "@/i18n/config";
import {
  getLocalizedCategory,
  getLocalizedDevice,
} from "@/i18n/devices";

type DevicesPageProps = {
  locale?: Locale;
};

const categoryOrder = [
  "Küche",
  "Waschen",
  "Haushalt",
  "Bad",
  "Unterhaltung",
  "Büro",
];

const categoryAnchors = {
  de: {
    Küche: "kueche",
    Waschen: "waschen",
    Haushalt: "haushalt",
    Bad: "bad",
    Unterhaltung: "unterhaltung",
    Büro: "buero",
  },

  en: {
    Küche: "kitchen",
    Waschen: "laundry",
    Haushalt: "household",
    Bad: "bathroom",
    Unterhaltung: "entertainment",
    Büro: "office",
  },
} as const;

const pageText = {
  de: {
    badge: "Einfach. Klar. Direkt verständlich.",

    heroFirst: "Stromkosten deiner",
    heroHighlight: "Haushaltsgeräte",

    description:
      "Wähle ein Gerät aus und finde heraus, wie viel Strom es verbraucht und welche Kosten bei deiner Nutzung entstehen können.",

    singularDevice: "Gerät",
    pluralDevices: "Geräte",

    searchLabel: "Geräte durchsuchen",
    searchPlaceholder: "z. B. Waschmaschine oder Laptop",
    noResults: "Kein passendes Gerät gefunden.",
    perUse: "pro Nutzung",

    ctaTitle: "Dein Gerät ist nicht dabei?",

    ctaText:
      "Kein Problem. Im Stromkosten-Rechner kannst du auch ein eigenes Gerät anlegen und deine Werte selbst eingeben.",

    ctaButton: "Zum Stromkosten-Rechner",
  },

  en: {
    badge: "Simple. Clear. Easy to understand.",

    heroFirst: "Electricity costs of your",
    heroHighlight: "household devices",

    description:
      "Choose a device and find out how much electricity it uses and what it could cost based on your usage.",

    singularDevice: "device",
    pluralDevices: "devices",

    searchLabel: "Search devices",
    searchPlaceholder: "e.g. washing machine or laptop",
    noResults: "No matching device found.",
    perUse: "per use",

    ctaTitle: "Can't find your device?",

    ctaText:
      "No problem. You can also add your own device in the electricity cost calculator and enter your own values.",

    ctaButton: "Go to the electricity cost calculator",
  },
} as const;

function getCategoryAnchor(
  category: string,
  locale: Locale
) {
  const anchors =
    categoryAnchors[locale] as Record<
      string,
      string
    >;

  return (
    anchors[category] ??
    category
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/\s+/g, "-")
  );
}

function CategoryIcon({
  category,
}: {
  category: string;
}) {
  const props = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (category) {
    case "Küche":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          {...props}
          aria-hidden="true"
        >
          <path d="M5 9h14l-1 10H6L5 9Z" />
          <path d="M8 9V7h8v2" />
          <path d="M10 5h4" />
          <path d="M19 11h2v5h-2" />
        </svg>
      );

    case "Waschen":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          {...props}
          aria-hidden="true"
        >
          <rect
            x="5"
            y="3"
            width="14"
            height="18"
            rx="2"
          />
          <path d="M8 6h1" />
          <path d="M12 6h4" />
          <circle cx="12" cy="14" r="4" />
        </svg>
      );

    case "Haushalt":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          {...props}
          aria-hidden="true"
        >
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );

    case "Bad":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          {...props}
          aria-hidden="true"
        >
          <path d="M5 13V8a5 5 0 0 1 10 0" />
          <path d="M14 8h5" />
          <path d="M15 12v1" />
          <path d="M18 12v1" />
          <path d="M12 15v1" />
          <path d="M15 16v1" />
          <path d="M18 15v1" />
        </svg>
      );

    case "Unterhaltung":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          {...props}
          aria-hidden="true"
        >
          <rect
            x="3"
            y="4"
            width="18"
            height="13"
            rx="2"
          />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );

    case "Büro":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          {...props}
          aria-hidden="true"
        >
          <rect
            x="5"
            y="4"
            width="14"
            height="11"
            rx="1.5"
          />
          <path d="M3 19h18" />
          <path d="m5 15-2 4" />
          <path d="m19 15 2 4" />
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          {...props}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
  }
}

export default function DevicesPage({
  locale = "de",
}: DevicesPageProps) {
  const text = pageText[locale];
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearch = searchQuery
    .trim()
    .toLocaleLowerCase(locale === "de" ? "de-DE" : "en-GB");
  const visibleDevices = devices.filter((device) => {
    if (!normalizedSearch) return true;

    const localizedDevice = getLocalizedDevice(device, locale);
    const localizedCategory = getLocalizedCategory(device.category, locale);

    return `${localizedDevice.name} ${localizedCategory}`
      .toLocaleLowerCase(locale === "de" ? "de-DE" : "en-GB")
      .includes(normalizedSearch);
  });

  const categories = categoryOrder
    .map((category) => ({
      category,
      devices: visibleDevices.filter(
        (device) =>
          device.category === category
      ),
    }))
    .filter(
      (group) =>
        group.devices.length > 0
    );

  const calculatorHref = getCalculatorHref(locale);

  return (
    <div
      lang={locale}
      className="min-h-screen bg-[#f8faf8] text-slate-950"
    >
      <Header locale={locale} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.10),transparent_35%),radial-gradient(circle_at_5%_5%,rgba(34,197,94,0.06),transparent_25%)]" />

          <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-[var(--brand-green)]">
              <span>🌿</span>
              {text.badge}
            </div>

            <h1 className="mt-7 max-w-4xl text-4xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
              {text.heroFirst}
              <br />

              <span className="text-[var(--brand-green)]">
                {text.heroHighlight}
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              {text.description}
            </p>

            <label className="mt-8 block max-w-xl">
              <span className="sr-only">{text.searchLabel}</span>
              <span className="relative block">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="8.5" cy="8.5" r="5.5" />
                  <path d="m13 13 4 4" />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={text.searchPlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-green-400 focus:ring-4 focus:ring-green-100"
                />
              </span>
            </label>

            {categories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {categories.map(
                ({ category }) => (
                  <a
                    key={category}
                    href={`#${getCategoryAnchor(
                      category,
                      locale
                    )}`}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-green-200 hover:bg-green-50 hover:text-[var(--brand-green-dark)] active:scale-[0.98]"
                  >
                    <span className="text-[var(--brand-green)]">
                      <CategoryIcon
                        category={category}
                      />
                    </span>

                    {getLocalizedCategory(
                      category,
                      locale
                    )}
                  </a>
                )
              )}
            </div>
            )}
          </div>
        </section>

        {/* Devices */}
        <section className="px-5 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            {categories.length > 0 ? (
            <div className="space-y-16">
              {categories.map(
                ({
                  category,
                  devices:
                    categoryDevices,
                }) => (
                  <section
                    key={category}
                    id={getCategoryAnchor(
                      category,
                      locale
                    )}
                    className="scroll-mt-28"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-[var(--brand-green)]">
                        <CategoryIcon
                          category={
                            category
                          }
                        />
                      </span>

                      <div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                          {getLocalizedCategory(
                            category,
                            locale
                          )}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            categoryDevices.length
                          }{" "}
                          {categoryDevices.length ===
                          1
                            ? text.singularDevice
                            : text.pluralDevices}
                        </p>
                      </div>
                    </div>

                    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryDevices.map(
                        (device) => {
                          const localizedDevice =
                            getLocalizedDevice(
                              device,
                              locale
                            );

                          const href =
                            locale === "de"
                              ? `/geraete/${device.slug}`
                              : `/en/devices/${localizedDevice.slug}`;

                          const typicalValue =
                            device.calculationType === "power"
                              ? `${device.watts ?? 0} W`
                              : `${(device.kwhPerUse ?? 0).toLocaleString(
                                  locale === "de" ? "de-DE" : "en-GB",
                                  { maximumFractionDigits: 2 }
                                )} kWh ${text.perUse}`;

                          return (
                            <Link
                              key={
                                device.slug
                              }
                              href={href}
                              className="group flex min-h-[150px] flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_35px_-25px_rgba(15,23,42,0.3)] transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md active:scale-[0.99]"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-xl">
                                  ⚡
                                </div>

                                <span className="text-xl text-[var(--brand-green)] transition group-hover:translate-x-1">
                                  →
                                </span>
                              </div>

                              <h3 className="mt-5 text-lg font-bold text-slate-950 transition group-hover:text-[var(--brand-green-dark)]">
                                {
                                  localizedDevice.name
                                }
                              </h3>

                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                {typicalValue}
                              </p>
                            </Link>
                          );
                        }
                      )}
                    </div>
                  </section>
                )
              )}
            </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <p className="font-semibold text-slate-700">
                  {text.noResults}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-green-100 bg-gradient-to-br from-green-50 via-white to-green-50 p-8 text-center shadow-[0_20px_60px_-35px_rgba(21,128,61,0.35)] sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
              🌿
            </div>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950">
              {text.ctaTitle}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
              {text.ctaText}
            </p>

            <Link
              href={calculatorHref}
              className="mt-7 inline-flex items-center gap-3 rounded-xl border border-[var(--brand-green)] bg-[var(--brand-green)] px-6 py-3.5 font-semibold text-[var(--brand-off-white)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--brand-green-dark)] hover:shadow-md active:scale-[0.98]"
            >
              {text.ctaButton}
              <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
