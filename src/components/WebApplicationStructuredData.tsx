import type { Locale } from "@/i18n/config";

type WebApplicationStructuredDataProps = {
  locale: Locale;
};

const content = {
  de: {
    url: "https://eavesence.com/de",
    description:
      "Kostenloser Stromkosten-Rechner für Haushaltsgeräte mit anpassbaren Werten, Nutzungsszenarien und Gerätevergleich.",
    features: [
      "Stromkosten pro Nutzung, Woche, Monat und Jahr",
      "Anpassbare Leistung, Laufzeit und Verbrauchswerte",
      "Nutzungsszenarien und Gerätevergleich",
      "Lokale Geräteliste ohne Benutzerkonto",
    ],
  },
  en: {
    url: "https://eavesence.com/",
    description:
      "Free household-device electricity cost calculator with adjustable values, usage scenarios and device comparison.",
    features: [
      "Electricity cost per use, week, month and year",
      "Adjustable power, runtime and consumption values",
      "Usage scenarios and device comparison",
      "Local device list without an account",
    ],
  },
} as const;

export default function WebApplicationStructuredData({
  locale,
}: WebApplicationStructuredDataProps) {
  const localized = content[locale];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://eavesence.com/#electricity-cost-calculator",
    name: "EAVESENCE Energy",
    url: localized.url,
    description: localized.description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    inLanguage: locale === "de" ? "de" : "en",
    isAccessibleForFree: true,
    featureList: [...localized.features],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(
          /</g,
          "\\u003c"
        ),
      }}
    />
  );
}
