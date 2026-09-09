"use client";

import { useState } from "react";

import EnergyCalculator from "@/components/EnergyCalculator";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { Locale } from "@/i18n/config";

type CalculatorMode = "estimate" | "exact";

type IconName =
  | "kitchen"
  | "washer"
  | "home"
  | "shower"
  | "monitor"
  | "laptop"
  | "gift"
  | "chart"
  | "search"
  | "settings";

type HomePageProps = {
  locale?: Locale;
};

const content = {
  de: {
    categories: [
      {
        name: "Küche",
        href: "/geraete#kueche",
        icon: "kitchen" as IconName,
      },
      {
        name: "Waschen",
        href: "/geraete#waschen",
        icon: "washer" as IconName,
      },
      {
        name: "Haushalt",
        href: "/geraete#haushalt",
        icon: "home" as IconName,
      },
      {
        name: "Bad",
        href: "/geraete#bad",
        icon: "shower" as IconName,
      },
      {
        name: "Unterhaltung",
        href: "/geraete#unterhaltung",
        icon: "monitor" as IconName,
      },
      {
        name: "Büro",
        href: "/geraete#buero",
        icon: "laptop" as IconName,
      },
    ],

    hero: {
      badge: "Einfach. Klar. Direkt verständlich.",
      titleFirst: "Viele Geräte,",
      titleHighlight: "ein Rechner",
      subtitle: "Berechne die Stromkosten deines Alltags",
      text:
        "Ob Wasserkocher, Waschmaschine oder Fernseher – mit EAVESENCE findest du schnell heraus, wie viel Strom deine Geräte wirklich kosten. Einfach, verständlich und kostenlos.",
      calculate: "Jetzt Stromkosten berechnen",
      discoverDevices: "Geräte entdecken",
      features: [
        "Kostenlos",
        "Ohne Anmeldung",
        "Direkt im Browser",
      ],

      visualBadge: "⚡ Stromkosten auf einen Blick",
      visualTitleFirst: "Kleine Geräte.",
      visualTitleHighlight: "Große Wirkung.",
      visualText:
        "Schon kleine Verbräuche können sich über Wochen und Monate bemerkbar machen.",

      examples: [
        {
          icon: "☕",
          name: "Wasserkocher",
          usage: "1 Nutzung",
          cost: "0,04 €",
          label: "Beispiel",
        },
        {
          icon: "🧺",
          name: "Waschmaschine",
          usage: "1 Waschgang",
          cost: "0,31 €",
          label: "Beispiel",
        },
        {
          icon: "📺",
          name: "Fernseher",
          usage: "1 Stunde",
          cost: "0,02 €",
          label: "Beispiel",
        },
      ],
    },

    calculator: {
      label: "Stromkosten-Rechner",
      title: "Schnell zur Antwort",
      text: "Wähle ein Gerät oder gib eigene Werte ein.",
    },

    benefits: [
      {
        icon: "gift" as IconName,
        title: "Kostenlos",
        text:
          "Nutze den Rechner ohne Anmeldung oder versteckte Kosten.",
      },
      {
        icon: "chart" as IconName,
        title: "Sofort verständlich",
        text:
          "Sieh Kosten pro Nutzung, Woche, Monat und Jahr auf einen Blick.",
      },
      {
        icon: "settings" as IconName,
        title: "Flexibel",
        text:
          "Nutze unsere Orientierungswerte oder trage deine eigenen Messwerte ein.",
      },
    ],

    howItWorks: {
      label: "So funktioniert's",
      title: "Von Watt zu Euro – ohne Kopfrechnen",
      text:
        "EAVESENCE nimmt dir die Umrechnung ab und zeigt dir das Ergebnis in Größen, die im Alltag verständlich sind.",

      steps: [
        {
          number: "01",
          icon: "search" as IconName,
          title: "Gerät auswählen",
          text:
            "Wähle ein typisches Haushaltsgerät oder lege ein eigenes Gerät an.",
        },
        {
          number: "02",
          icon: "settings" as IconName,
          title: "Nutzung anpassen",
          text:
            "Passe Strompreis, Laufzeit und Nutzungshäufigkeit an deinen Alltag an.",
        },
        {
          number: "03",
          icon: "chart" as IconName,
          title: "Kosten verstehen",
          text:
            "EAVESENCE berechnet deinen ungefähren Stromverbrauch und die daraus entstehenden Kosten.",
        },
      ],
    },

    twoWays: {
      label: "Zwei Wege zum Ergebnis",
      title: "Schnell schätzen oder genauer rechnen",
      text:
        "Entscheide selbst, ob du mit unseren Orientierungswerten starten oder einen eigenen Verbrauchswert verwenden möchtest.",

      estimate: {
        title: "Schnell schätzen",
        text:
          "Nutze unsere Orientierungswerte und passe deine Nutzung an. Ideal für einen schnellen Überblick.",
      },

      exact: {
        title: "Genau berechnen",
        text:
          "Gib deinen tatsächlichen Verbrauch pro Nutzung ein, wenn du einen Mess- oder Herstellerwert kennst.",
      },
    },

    about: {
      label: "Über EAVESENCE",
      title: "Ein Name für bewusstere Entscheidungen",
      text:
        "EAVESENCE verbindet die Themen unseres Alltags unter einem Dach und macht das Wesentliche leichter verständlich.",
      parts: [
        {
          term: "EAVE",
          meaning:
            "Ein gemeinsames Dach über den Themen unseres Alltags",
        },
        {
          term: "SENCE",
          meaning:
            "Verbindet „essence“ und „sense“ – das Wesentliche erkennen und verstehen",
        },
      ],
      closing:
        "EAVESENCE entwickelt daraus einfache Werkzeuge für klarere Entscheidungen.",
    },

    faq: {
      label: "Häufige Fragen",
      title: "Fragen zu EAVESENCE",

      items: [
        {
          question: "Wie genau ist der Stromkosten-Rechner?",
          answer:
            "Im Modus „Gerät auswählen“ arbeitet EAVESENCE mit Orientierungswerten und deinen Angaben zur Nutzung. Das Ergebnis ist deshalb eine Schätzung. Unter „Eigene Werte“ kannst du einen selbst gemessenen oder bekannten Verbrauch pro Nutzung eintragen.",
        },
        {
          question: "Wo finde ich die Leistung meines Geräts?",
          answer:
            "Die Leistung in Watt findest du häufig auf dem Typenschild, auf dem Netzteil oder in der Bedienungsanleitung des Geräts.",
        },
        {
          question: "Wo finde ich meinen Strompreis?",
          answer:
            "Für die Berechnung brauchst du deinen Arbeitspreis in Euro pro Kilowattstunde. Diesen findest du in der Regel auf deiner Stromrechnung oder in deinem Stromtarif.",
        },
        {
          question:
            "Warum können die tatsächlichen Kosten abweichen?",
          answer:
            "Programme, Temperatur, Alter des Geräts und die tatsächliche Nutzung können den Verbrauch beeinflussen.",
        },
        {
          question:
            "Kann ich auch ein Gerät berechnen, das nicht in der Liste steht?",
          answer:
            "Ja. Wähle „Eigenes Gerät“ und trage Leistung und Nutzung selbst ein.",
        },
      ],
    },

    closing: {
      title: "Was kostet dein Gerät wirklich?",
      text:
        "Mit wenigen Angaben bekommst du einen schnellen Überblick über Stromverbrauch und Kosten.",
      button: "Jetzt berechnen",
    },
  },

  en: {
    categories: [
      {
        name: "Kitchen",
        href: "/en/devices#kitchen",
        icon: "kitchen" as IconName,
      },
      {
        name: "Laundry",
        href: "/en/devices#laundry",
        icon: "washer" as IconName,
      },
      {
        name: "Household",
        href: "/en/devices#household",
        icon: "home" as IconName,
      },
      {
        name: "Bathroom",
        href: "/en/devices#bathroom",
        icon: "shower" as IconName,
      },
      {
        name: "Entertainment",
        href: "/en/devices#entertainment",
        icon: "monitor" as IconName,
      },
      {
        name: "Office",
        href: "/en/devices#office",
        icon: "laptop" as IconName,
      },
    ],

    hero: {
      badge: "Simple. Clear. Easy to understand.",
      titleFirst: "Many devices,",
      titleHighlight: "one calculator",
      subtitle: "Calculate the electricity costs of everyday devices",
      text:
        "From kettles and washing machines to TVs – EAVESENCE helps you quickly understand how much electricity your devices really cost. Simple, clear and free.",
      calculate: "Calculate electricity costs",
      discoverDevices: "Explore devices",
      features: [
        "Free",
        "No sign-up",
        "Works in your browser",
      ],

      visualBadge: "⚡ Electricity costs at a glance",
      visualTitleFirst: "Small devices.",
      visualTitleHighlight: "Big impact.",
      visualText:
        "Even small amounts of electricity use can add up over weeks and months.",

      examples: [
        {
          icon: "☕",
          name: "Kettle",
          usage: "1 use",
          cost: "€0.04",
          label: "Example",
        },
        {
          icon: "🧺",
          name: "Washing machine",
          usage: "1 cycle",
          cost: "€0.31",
          label: "Example",
        },
        {
          icon: "📺",
          name: "Television",
          usage: "1 hour",
          cost: "€0.02",
          label: "Example",
        },
      ],
    },

    calculator: {
      label: "Electricity cost calculator",
      title: "Get your answer quickly",
      text: "Choose a device or enter your own values.",
    },

    benefits: [
      {
        icon: "gift" as IconName,
        title: "Free",
        text:
          "Use the calculator without signing up or paying hidden fees.",
      },
      {
        icon: "chart" as IconName,
        title: "Easy to understand",
        text:
          "See costs per use, week, month and year at a glance.",
      },
      {
        icon: "settings" as IconName,
        title: "Flexible",
        text:
          "Use our typical values or enter your own measured consumption.",
      },
    ],

    howItWorks: {
      label: "How it works",
      title: "From watts to euros – without the maths",
      text:
        "EAVESENCE handles the conversion for you and shows the result in values that make sense in everyday life.",

      steps: [
        {
          number: "01",
          icon: "search" as IconName,
          title: "Choose a device",
          text:
            "Select a typical household device or create your own.",
        },
        {
          number: "02",
          icon: "settings" as IconName,
          title: "Adjust your usage",
          text:
            "Set your electricity price, running time and usage frequency to match your routine.",
        },
        {
          number: "03",
          icon: "chart" as IconName,
          title: "Understand the cost",
          text:
            "EAVESENCE calculates your estimated electricity consumption and the resulting cost.",
        },
      ],
    },

    twoWays: {
      label: "Two ways to calculate",
      title: "Get a quick estimate or calculate more precisely",
      text:
        "Choose whether you want to start with our typical values or use your own electricity consumption figure.",

      estimate: {
        title: "Quick estimate",
        text:
          "Use our typical values and adjust the usage to match your routine. Ideal for a quick overview.",
      },

      exact: {
        title: "More precise",
        text:
          "Enter the actual electricity consumption per use if you know a measured or manufacturer value.",
      },
    },

    about: {
      label: "About EAVESENCE",
      title: "A name for smarter everyday decisions",
      text:
        "EAVESENCE brings the themes of everyday life together under one roof and makes what matters most easier to understand.",
      parts: [
        {
          term: "EAVE",
          meaning:
            "A shared roof over the themes of everyday life",
        },
        {
          term: "SENCE",
          meaning:
            "Combines “essence” and “sense” – recognizing and understanding what matters most",
        },
      ],
      closing:
        "EAVESENCE turns this idea into simple tools for clearer decisions.",
    },

    faq: {
      label: "Frequently asked questions",
      title: "Questions about EAVESENCE",

      items: [
        {
          question:
            "How accurate is the electricity cost calculator?",
          answer:
            "In the “Choose a device” mode, EAVESENCE uses typical consumption values together with your usage details, so the result is an estimate. Under “Your own values”, you can enter a measured or known electricity consumption per use.",
        },
        {
          question:
            "Where can I find the power rating of my device?",
          answer:
            "The power rating in watts is often shown on the device label, power adapter or in the instruction manual.",
        },
        {
          question:
            "Where can I find my electricity price?",
          answer:
            "For the calculation, you need your electricity price per kilowatt-hour. You can usually find it on your electricity bill or in your tariff information.",
        },
        {
          question:
            "Why can the actual electricity cost be different?",
          answer:
            "Programs, temperature settings, the age of the device and your actual usage can all affect electricity consumption.",
        },
        {
          question:
            "Can I calculate a device that is not in the list?",
          answer:
            "Yes. Choose “Custom device” and enter the power rating and usage yourself.",
        },
      ],
    },

    closing: {
      title: "What does your device really cost?",
      text:
        "With just a few details, you can quickly understand its electricity consumption and cost.",
      button: "Calculate now",
    },
  },
} as const;

function Icon({
  name,
  className = "h-6 w-6",
}: {
  name: IconName;
  className?: string;
}) {
  const props = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "kitchen":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          {...props}
          aria-hidden="true"
        >
          <path d="M5 9h14l-1 10H6L5 9Z" />
          <path d="M8 9V7h8v2" />
          <path d="M10 5h4" />
          <path d="M19 11h2v5h-2" />
        </svg>
      );

    case "washer":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          {...props}
          aria-hidden="true"
        >
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 6h1" />
          <path d="M12 6h4" />
          <circle cx="12" cy="14" r="4" />
        </svg>
      );

    case "home":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          {...props}
          aria-hidden="true"
        >
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );

    case "shower":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
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

    case "monitor":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          {...props}
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );

    case "laptop":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          {...props}
          aria-hidden="true"
        >
          <rect x="5" y="4" width="14" height="11" rx="1.5" />
          <path d="M3 19h18" />
          <path d="m5 15-2 4" />
          <path d="m19 15 2 4" />
        </svg>
      );

    case "gift":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          {...props}
          aria-hidden="true"
        >
          <rect x="3" y="9" width="18" height="12" rx="2" />
          <path d="M12 9v12" />
          <path d="M3 13h18" />
          <path d="M12 9H8.5A2.5 2.5 0 1 1 11 6.5V9" />
          <path d="M12 9h3.5A2.5 2.5 0 1 0 13 6.5V9" />
        </svg>
      );

    case "chart":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          {...props}
          aria-hidden="true"
        >
          <path d="M5 20V11" />
          <path d="M10 20V6" />
          <path d="M15 20V14" />
          <path d="M20 20V3" />
        </svg>
      );

    case "search":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          {...props}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6" />
          <path d="m16 16 5 5" />
        </svg>
      );

    case "settings":
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          {...props}
          aria-hidden="true"
        >
          <path d="M4 6h10" />
          <path d="M18 6h2" />
          <path d="M4 12h2" />
          <path d="M10 12h10" />
          <path d="M4 18h7" />
          <path d="M15 18h5" />
          <circle cx="16" cy="6" r="2" />
          <circle cx="8" cy="12" r="2" />
          <circle cx="13" cy="18" r="2" />
        </svg>
      );
  }
}

export default function HomePage({
  locale = "de",
}: HomePageProps) {
  const [calculatorMode, setCalculatorMode] =
    useState<CalculatorMode>("estimate");

  const text = content[locale];

  function openCalculator(mode: CalculatorMode) {
    setCalculatorMode(mode);

    window.requestAnimationFrame(() => {
      document.getElementById("rechner")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <div className="min-h-screen bg-[#f8faf8] text-slate-950">
      <Header locale={locale} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_35%,rgba(34,197,94,0.10),transparent_36%),radial-gradient(circle_at_5%_10%,rgba(34,197,94,0.07),transparent_28%)]" />

          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-800">
                <span>🌿</span>
                {text.hero.badge}
              </div>

              <h1 className="mt-7 max-w-3xl text-5xl font-extrabold tracking-[-0.055em] text-slate-950 sm:text-6xl">
                {text.hero.titleFirst}
                <br />
                <span className="text-green-700">
                  {text.hero.titleHighlight}
                </span>
              </h1>

              <h2 className="mt-6 max-w-2xl text-2xl font-bold tracking-tight text-slate-900">
                {text.hero.subtitle}
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                {text.hero.text}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openCalculator("estimate")}
                  className="inline-flex items-center justify-center gap-3 rounded-xl bg-green-700 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-800 hover:shadow-md"
                >
                  {text.hero.calculate}
                  <span>→</span>
                </button>

                <a
                  href={
                    locale === "de"
                      ? "/geraete"
                      : "/en/devices"
                  }
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3.5 font-semibold text-slate-700 transition hover:bg-green-50 hover:text-green-800"
                >
                  {text.hero.discoverDevices}
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
                {text.hero.features.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-2"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                      ✓
                    </span>

                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden min-h-[540px] lg:block">
              <div className="absolute inset-0 rounded-[3rem] border border-green-100 bg-gradient-to-br from-green-50 via-white to-emerald-50 shadow-[0_30px_80px_-45px_rgba(21,128,61,0.35)]" />

              <div className="absolute left-10 top-9 rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-sm">
                {text.hero.visualBadge}
              </div>

              <div className="absolute inset-x-10 top-[105px]">
                <h3 className="text-3xl font-extrabold tracking-[-0.04em] text-slate-950">
                  {text.hero.visualTitleFirst}
                  <br />
                  <span className="text-green-700">
                    {text.hero.visualTitleHighlight}
                  </span>
                </h3>

                <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
                  {text.hero.visualText}
                </p>
              </div>

              <div className="absolute inset-x-10 bottom-8 space-y-3">
                {text.hero.examples.map((example) => (
                  <div
                    key={example.name}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_35px_-25px_rgba(15,23,42,0.35)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-xl">
                        {example.icon}
                      </div>

                      <div>
                        <p className="font-bold text-slate-950">
                          {example.name}
                        </p>

                        <p className="text-sm text-slate-500">
                          {example.usage}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-extrabold text-green-700">
                        {example.cost}
                      </p>

                      <p className="text-xs text-slate-400">
                        {example.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className="px-5 py-12 sm:px-6 sm:py-16">
          <div
            id="rechner"
            className="mx-auto max-w-5xl scroll-mt-[76px] sm:scroll-mt-[84px]"
          >
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
              {text.calculator.label}
            </p>

            <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-slate-950">
              {text.calculator.title}
            </h2>

            <p className="mt-3 text-lg text-slate-600">
              {text.calculator.text}
            </p>

            <div className="mt-8">
              <EnergyCalculator
                controlledMode={calculatorMode}
                onModeChange={setCalculatorMode}
                locale={locale}
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="so-funktionierts"
          className="scroll-mt-24 border-y border-slate-200/70 bg-white px-5 py-16 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
              {text.howItWorks.label}
            </p>

            <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-slate-950">
              {text.howItWorks.title}
            </h2>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              {text.howItWorks.text}
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {text.howItWorks.steps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl border border-slate-200 bg-[#fbfcfb] p-6"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-green-700">
                      {step.number}
                    </span>

                    <span className="text-green-700">
                      <Icon name={step.icon} />
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-950">
                    {step.title}
                  </h3>

                  <p className="mt-2 leading-7 text-slate-600">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About EAVESENCE */}
        <section
          id="about"
          className="scroll-mt-[120px] px-5 pb-16 sm:px-6 sm:pb-20"
        >
          <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)] lg:grid-cols-[0.8fr_1.2fr]">
            <div className="flex items-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 p-8 text-white sm:p-10">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-200">
                  {text.about.label}
                </p>

                <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {text.about.title}
                </h2>
              </div>
            </div>

            <div className="p-8 sm:p-10">
              <p className="text-lg leading-8 text-slate-700">
                {text.about.text}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {text.about.parts.map((part) => (
                  <div
                    key={part.term}
                    className="rounded-2xl border border-slate-200 bg-[#f8faf8] p-4"
                  >
                    <p className="font-extrabold text-green-700">
                      {part.term}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {part.meaning}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-6 border-t border-green-100 pt-5 font-semibold leading-7 text-slate-700">
                {text.about.closing}
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="scroll-mt-24 border-t border-slate-200 bg-white px-5 py-16 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
              {text.faq.label}
            </p>

            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">
              {text.faq.title}
            </h2>

            <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
              {text.faq.items.map((faq) => (
                <details
                  key={faq.question}
                  className="group py-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                    {faq.question}

                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-lg leading-none text-slate-400 transition duration-200 group-open:rotate-45 group-open:bg-green-50 group-open:text-green-700"
                    >
                      +
                    </span>
                  </summary>

                  <p className="mt-4 leading-7 text-slate-600">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer locale={locale} />
    </div>
  );
}
