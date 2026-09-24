import type { Locale } from "@/i18n/config";

type WebApplicationStructuredDataProps = {
  locale: Locale;
};

const content = {
  de: {
    url: "https://eavesence.com/de",
    description:
      "Haushaltsübersicht für Einkommen, wiederkehrende Kosten und anstehende Zahlungen mit Stromkosten-Rechner für Geräte.",
    features: [
      "Einkommen und laufende Haushaltskosten im Blick",
      "Anstehende Zahlungen im nächsten Monat",
      "Eigene Kacheln und lokale Datenspeicherung",
      "Stromkosten-Rechner und gespeicherte Geräte",
    ],
  },
  en: {
    url: "https://eavesence.com/",
    description:
      "Household overview for income, recurring costs and upcoming payments, with an electricity calculator for devices.",
    features: [
      "Income and recurring household costs",
      "Upcoming payments next month",
      "Custom tiles and local data storage",
      "Electricity calculator and saved devices",
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
    "@id": "https://eavesence.com/#household-overview",
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
