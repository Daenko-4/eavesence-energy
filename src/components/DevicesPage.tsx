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
  "Wäschepflege",
  "Haushalt",
  "Raumklima",
  "Bad",
  "Unterhaltung",
  "Büro",
];

const categoryAnchors = {
  de: {
    Küche: "kueche",
    Wäschepflege: "waschen",
    Haushalt: "haushalt",
    Raumklima: "raumklima",
    Bad: "bad",
    Unterhaltung: "unterhaltung",
    Büro: "buero",
  },

  en: {
    Küche: "kitchen",
    Wäschepflege: "laundry",
    Haushalt: "household",
    Raumklima: "room-climate",
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

    ctaButton: "Rechner öffnen",
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

    ctaButton: "Open calculator",
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

    case "Wäschepflege":
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

    case "Raumklima":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          {...props}
          aria-hidden="true"
        >
          <path d="M4 8h10a3 3 0 1 0-3-3" />
          <path d="M4 12h15a3 3 0 1 1-3 3" />
          <path d="M4 16h7" />
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
          <path d="M12 19v1" />
          <path d="M16 19v1" />
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
      className="min-h-screen bg-[var(--brand-off-white)] text-[#17211f]"
    >
      <Header locale={locale} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-[#dfe5dd] bg-[var(--brand-off-white)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(114,220,163,0.13),transparent_30%)]" />

          <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-green)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-green-mint)]" />
              {text.badge}
            </div>

            <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-[-0.045em] text-[#17211f] sm:text-4xl lg:text-5xl">
              {text.heroFirst}
              {" "}<span className="text-[var(--brand-green)]">
                {text.heroHighlight}
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#65716d]">
              {text.description}
            </p>

            <div className="mt-6">
              <label className="block max-w-md">
                <span className="sr-only">{text.searchLabel}</span>
                <span className="relative block">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
                    className="w-full rounded-lg border border-[#cfd8d0] bg-[#fbfcf8] py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#17211f] outline-none transition placeholder:text-[#89938f] hover:border-[#aebbb1] focus:border-[var(--brand-green-mint)] focus:ring-2 focus:ring-[#72dca3]/20"
                  />
                </span>
              </label>

              {categories.length > 0 && (
                <nav
                  className="mt-5 grid grid-cols-2 border-y border-slate-200/80 sm:grid-cols-4 lg:grid-cols-7"
                  aria-label={text.searchLabel}
                >
                  {categories.map(({ category }) => (
                    <a
                      key={category}
                      href={`#${getCategoryAnchor(category, locale)}`}
                      className="group flex min-h-[72px] items-center gap-2.5 border-b border-r border-slate-200/70 px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-[#eaf8ef] hover:text-[var(--brand-green)] sm:px-5 lg:border-b-0 lg:last:border-r-0"
                    >
                      <span className="text-[var(--brand-green)] transition-transform duration-200 group-hover:-translate-y-0.5 [&>svg]:h-5 [&>svg]:w-5">
                        <CategoryIcon category={category} />
                      </span>

                      {getLocalizedCategory(category, locale)}
                    </a>
                  ))}
                </nav>
              )}
            </div>
          </div>
        </section>

        {/* Devices */}
        <section className="px-5 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-7xl">
            {categories.length > 0 ? (
            <div className="space-y-11">
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
                    className="scroll-mt-24 border-t border-[#dfe5dd] pt-6 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e4f7ec] text-[var(--brand-green)] [&>svg]:h-5 [&>svg]:w-5">
                        <CategoryIcon
                          category={
                            category
                          }
                        />
                      </span>

                      <div>
                        <h2 className="text-xl font-bold tracking-[-0.025em] text-[#17211f] sm:text-2xl">
                          {getLocalizedCategory(
                            category,
                            locale
                          )}
                        </h2>

                        <p className="mt-0.5 text-xs text-[#74807b]">
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

                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
                              className="group grid min-h-[92px] grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[#dfe5dd] bg-[#fbfcf8] px-4 py-3 transition hover:border-[#a9d9bb] hover:bg-white active:scale-[0.995]"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e4f7ec] text-[var(--brand-green)] [&>svg]:h-5 [&>svg]:w-5">
                                <CategoryIcon category={device.category} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="truncate text-[15px] font-bold text-[#17211f] transition group-hover:text-[var(--brand-green)]">{localizedDevice.name}</h3>
                                <p className="mt-1 text-xs text-[#74807b]">{typicalValue}</p>
                              </div>
                              <span className="text-base text-[var(--brand-green)] transition group-hover:translate-x-0.5">→</span>
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
        <section className="px-5 pb-12 sm:px-6 sm:pb-14">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-[#dfe5dd] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
            <h2 className="text-xl font-bold tracking-[-0.025em] text-[#17211f]">
              {text.ctaTitle}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65716d]">
              {text.ctaText}
            </p>
            </div>

            <Link
              href={calculatorHref}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--brand-green)] bg-[var(--brand-green)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-off-white)] transition hover:bg-[var(--brand-green-dark)] active:scale-[0.98]"
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
