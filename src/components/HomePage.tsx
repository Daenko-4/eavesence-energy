"use client";

import { useEffect, useState } from "react";

import AppInterestPrompt from "@/components/AppInterestPrompt";
import EnergyCalculator from "@/components/EnergyCalculator";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { Locale } from "@/i18n/config";

type IconName =
  | "kitchen"
  | "washer"
  | "home"
  | "wind"
  | "shower"
  | "monitor"
  | "laptop"
  | "free"
  | "chart"
  | "search"
  | "settings";

type HomePageProps = {
  locale?: Locale;
};

const FEEDBACK_EMAIL = "feedback@eavesence.com";
const FAQ_LANGUAGE_TRANSFER_KEY = "eavesence-keep-faq-open-after-language-change";

const content = {
  de: {
    categories: [
      {
        name: "Küche",
        href: "/geraete#kueche",
        icon: "kitchen" as IconName,
      },
      {
        name: "Wäschepflege",
        href: "/geraete#waschen",
        icon: "washer" as IconName,
      },
      {
        name: "Haushalt",
        href: "/geraete#haushalt",
        icon: "home" as IconName,
      },
      {
        name: "Raumklima",
        href: "/geraete#raumklima",
        icon: "wind" as IconName,
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

    fullVersion: {
      eyebrow: "Vom Rechner zum Haushaltsbuch",
      title: "My Home bündelt deinen ganzen Haushalt.",
      text:
        "Der Rechner bleibt kostenlos. In My Home führst du Geräte, Stromverbrauch und laufende Haushaltskosten übersichtlich an einem Ort zusammen.",
      proLabel: "Vollversion in Vorbereitung",
      proPrice: "geplant ab 5,99 € / Monat",
      button: "My Home kostenlos starten",
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

    faq: {
      label: "Gut zu wissen",
      title: "Antworten zum Stromkosten-Rechner",
      feedbackText: "Fehlt etwas oder war eine Erklärung unklar?",
      feedbackLink: "Feedback senden",
      feedbackSubject: "Feedback zu EAVESENCE Energy",

      items: [
        {
          question: "Wie genau ist meine Berechnung?",
          answer:
            "Mit typischen Verbrauchswerten erhältst du eine gute Orientierung. Am genauesten wird das Ergebnis, wenn du einen gemessenen oder bekannten Verbrauch sowie deinen tatsächlichen Strompreis einträgst.",
        },
        {
          question: "Kann ich eigene Messwerte verwenden?",
          answer:
            "Ja. Alle vorgeschlagenen Werte sind bearbeitbar. Bei leistungsbasierten Geräten kannst du zusätzlich „Gemessenen Verbrauch eingeben“ auswählen und einen kWh-Wert pro Nutzung eintragen.",
        },
        {
          question: "Was zeigen „Was wäre, wenn?“ und der Gerätevergleich?",
          answer:
            "Mit „Was wäre, wenn?“ siehst du, wie sich weniger Nutzungen auf deine Jahreskosten auswirken. Der Vergleich stellt dein Ergebnis einem anderen Gerät mit typischen Verbrauchswerten gegenüber.",
        },
        {
          question: "Wie funktioniert „Meine Geräte“?",
          answer:
            "Du kannst Berechnungen ohne Konto lokal in deinem Browser speichern, öffnen und aktualisieren. Die Daten werden nicht an EAVESENCE übertragen. Für einen Browser- oder Gerätewechsel kannst du eine Sicherung exportieren.",
        },
        {
          question: "Wo finde ich Verbrauch und Strompreis?",
          answer:
            "Leistung oder Verbrauch findest du häufig auf dem Typenschild, dem Energielabel, in der Anleitung oder über ein Strommessgerät. Deinen Preis pro Kilowattstunde findest du auf der Stromrechnung oder in deinem Tarif.",
        },
        {
          question: "Kann ich eigene Geräte und andere Währungen verwenden?",
          answer:
            "Ja. Wähle „Eigenes Gerät“ und trage Verbrauch und Nutzung selbst ein. Strompreis und Ergebnis kannst du außerdem in einer der verfügbaren Währungen anzeigen lassen.",
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
        name: "Room climate",
        href: "/en/devices#room-climate",
        icon: "wind" as IconName,
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

    fullVersion: {
      eyebrow: "From calculator to household book",
      title: "My Home brings your whole household together.",
      text:
        "The calculator stays free. My Home brings devices, electricity use and recurring household costs together clearly in one place.",
      proLabel: "Full version in development",
      proPrice: "planned from €5.99 / month",
      button: "Start My Home for free",
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

    faq: {
      label: "Good to know",
      title: "Answers about the electricity calculator",
      feedbackText: "Is something missing or was an explanation unclear?",
      feedbackLink: "Send feedback",
      feedbackSubject: "Feedback about EAVESENCE Energy",

      items: [
        {
          question: "How accurate is my calculation?",
          answer:
            "Typical consumption values provide a useful estimate. For the most accurate result, enter a measured or known consumption value together with your actual electricity price.",
        },
        {
          question: "Can I use my own measured values?",
          answer:
            "Yes. Every suggested value can be edited. For power-based devices, you can also choose “Enter measured consumption” and enter a kWh value per use.",
        },
        {
          question: "What do “What if?” and device comparison show?",
          answer:
            "“What if?” shows how fewer weekly uses could change your yearly cost. Device comparison places your result next to another device using its typical consumption values.",
        },
        {
          question: "How does “My devices” work?",
          answer:
            "You can save, reopen and update calculations locally in your browser without an account. EAVESENCE does not receive this data. Export a backup if you want to change browsers or devices.",
        },
        {
          question: "Where can I find consumption and electricity price?",
          answer:
            "Power or consumption is often listed on the device label, energy label or in the manual, and can also be measured with an electricity meter. Your price per kilowatt-hour is shown on your bill or tariff.",
        },
        {
          question: "Can I use custom devices and other currencies?",
          answer:
            "Yes. Choose “Custom device” and enter its consumption and usage yourself. You can also display the electricity price and results in any of the available currencies.",
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
    case "wind":
      return (
        <svg viewBox="0 0 24 24" className={className} {...props}>
          <path d="M4 8h10a3 3 0 1 0-3-3M4 12h15a3 3 0 1 1-3 3M4 16h7" />
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

    case "free":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          {...props}
          aria-hidden="true"
        >
          <rect x="3" y="6" width="18" height="12" rx="3" />
          <path d="M7 9.5h.01M17 14.5h.01" />
          <circle cx="12" cy="12" r="2.5" />
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
  const [faqOpen, setFaqOpen] = useState(false);
  const text = content[locale];
  const hero =
    locale === "de"
      ? {
          calculate: "Planen.",
          understand: "Verstehen.",
          save: "Sparen.",
          subtitle: "My Home zeigt Einkommen, laufende Kosten und anstehende Zahlungen auf einen Blick.",
          devicesTitle: "Berechne die Kosten deiner Geräte",
          allDevices: "Alle Geräte ansehen",
        }
      : {
          calculate: "Plan.",
          understand: "Understand.",
          save: "Save.",
          subtitle: "My Home brings income, recurring costs and upcoming payments into one clear view.",
          devicesTitle: "Calculate the cost of your devices",
          allDevices: "View all devices",
        };

  const devicesHref =
    locale === "de" ? "/geraete" : "/en/devices";
  const householdHref = locale === "de" ? "/de/zuhause" : "/home";
  const feedbackHref = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
    text.faq.feedbackSubject
  )}`;

  useEffect(() => {
    const keepFaqOpen =
      window.sessionStorage.getItem(FAQ_LANGUAGE_TRANSFER_KEY) === "true";

    function syncFaqWithHash() {
      setFaqOpen(
        window.location.hash === "#faq" ||
          window.sessionStorage.getItem(FAQ_LANGUAGE_TRANSFER_KEY) === "true",
      );
    }

    const initialFrame = window.requestAnimationFrame(() => {
      setFaqOpen(window.location.hash === "#faq" || keepFaqOpen);
    });
    const transferSettledTimeout = keepFaqOpen
      ? window.setTimeout(() => {
          window.sessionStorage.removeItem(FAQ_LANGUAGE_TRANSFER_KEY);
        }, 1000)
      : undefined;
    window.addEventListener("hashchange", syncFaqWithHash);
    window.addEventListener("popstate", syncFaqWithHash);
    window.addEventListener("eavesence:open-faq", syncFaqWithHash);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      if (transferSettledTimeout) {
        window.clearTimeout(transferSettledTimeout);
      }
      window.removeEventListener("hashchange", syncFaqWithHash);
      window.removeEventListener("popstate", syncFaqWithHash);
      window.removeEventListener("eavesence:open-faq", syncFaqWithHash);
    };
  }, [locale]);

  useEffect(() => {
    if (!faqOpen || window.location.hash !== "#faq") return;

    const scrollTimeout = window.setTimeout(() => {
      const faqElement = document.getElementById("faq");
      if (!faqElement) return;

      const requestedTop =
        faqElement.getBoundingClientRect().top + window.scrollY - 84;
      const maximumTop = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );

      window.scrollTo({
        top: Math.min(Math.max(0, requestedTop), maximumTop),
        behavior: "smooth",
      });
    }, 340);

    return () => window.clearTimeout(scrollTimeout);
  }, [faqOpen]);

  return (
    <div
      lang={locale}
      className="min-h-screen bg-[var(--background)] text-[#07111f]"
    >
      <Header
        locale={locale}
        onLanguageChange={() => {
          if (faqOpen) {
            window.sessionStorage.setItem(FAQ_LANGUAGE_TRANSFER_KEY, "true");
          } else {
            window.sessionStorage.removeItem(FAQ_LANGUAGE_TRANSFER_KEY);
          }
        }}
      />

      <main className="overflow-hidden">
        <section className="relative px-5 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10 lg:pb-11 lg:pt-12">
          <div className="pointer-events-none absolute inset-x-0 top-28 h-[680px] bg-[radial-gradient(ellipse_at_center,rgba(114,220,163,0.17),rgba(232,255,243,0.06)_38%,transparent_72%)]" />

          <div
            id="rechner"
            className="relative mx-auto max-w-7xl scroll-mt-[76px] sm:scroll-mt-[84px]"
          >
            <h1 className="text-balance text-center text-[clamp(1.9rem,4.1vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.06em] text-[#07111f] lg:whitespace-nowrap">
              {hero.calculate} {hero.understand}{" "}
              <span className="text-[var(--brand-green)]">
                {hero.save}
              </span>
            </h1>

            <p className="mt-3 text-center text-base font-medium tracking-[-0.02em] text-slate-600">
              {hero.subtitle}
            </p>

            <div className="mt-5 flex justify-center">
              <a
                href={householdHref}
                className="group grid w-full max-w-2xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[#b8efcc] bg-[#eefbf3] px-4 py-3 text-left shadow-[0_14px_30px_-26px_rgba(8,122,69,0.8)] transition hover:border-[#8ee2ae] hover:bg-[#e5f9ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-green-mint)]"
              >
                <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[var(--brand-green)] shadow-sm">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 7-6 7 6v8H3V9Z"/><path d="M8 17v-5h4v5"/></svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-green)]">EAVESENCE Home</span>
                  <span className="mt-0.5 block text-[14px] font-extrabold text-[#17211f]">{locale === "de" ? "Neu: Mein Zuhause als Haushaltsbuch" : "New: My Home as your household book"}</span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-[#65716d]">{locale === "de" ? "Geräte, Verträge und laufende Kosten gemeinsam organisieren." : "Organize devices, contracts and recurring costs together."}</span>
                </span>
                <span className="rounded-full bg-[var(--brand-green)] px-3 py-1.5 text-[11px] font-bold text-white transition group-hover:bg-[var(--brand-green-dark)]">{locale === "de" ? "Öffnen" : "Open"}</span>
              </a>
            </div>

            <div className="mx-auto mt-6 max-w-6xl sm:mt-7">
              <p className="mb-3 text-center text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-green)]">{text.calculator.label}</p>
              <EnergyCalculator
                locale={locale}
                homePresentation
                trustItems={text.hero.features}
                afterSavingTip={
                  <>
                    <section id="so-funktionierts" className="mt-4 scroll-mt-24 border-t border-slate-200/80 px-1 py-4">
                      <h2 className="text-[14px] font-bold text-[#07111f]">
                        {text.howItWorks.label}
                      </h2>
                      <div className="mt-3 grid gap-3 md:grid-cols-3 md:gap-4 md:divide-x md:divide-slate-200">
                        {text.howItWorks.steps.map((step) => (
                          <div key={step.number} className="flex gap-2.5 md:px-4 md:first:pl-0 md:last:pr-0">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dcfce8] text-[11px] font-extrabold text-[var(--brand-green)]">
                              {Number(step.number)}
                            </span>
                            <div>
                              <h3 className="text-[13px] font-bold text-[#07111f]">{step.title}</h3>
                              <p className="mt-0.5 max-w-sm text-[12px] leading-5 text-slate-600">
                                {step.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                    <div className="border-t border-slate-200/80 px-1 pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#07111f]">
                          {hero.devicesTitle}
                        </h2>
                        <a href={devicesHref} className="eavesence-pill-link">
                          {hero.allDevices}
                        </a>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {text.categories.map((category) => (
                          <a
                            key={category.name}
                            href={category.href}
                            className="group inline-flex min-h-9 items-center gap-2 rounded-full border border-[#dfe8df] bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:border-[#b8efcc] hover:bg-[#eaf8ef] hover:text-[var(--brand-green)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-green)]"
                          >
                            <span className="text-[var(--brand-green)] transition-transform duration-200 group-hover:-translate-y-0.5">
                              <Icon name={category.icon} className="h-4 w-4" />
                            </span>
                            {category.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                }
              />
            </div>
          </div>
        </section>

        <section className="px-5 pb-7 sm:px-6 sm:pb-9">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-2xl border border-[#dce8dd] bg-[#f6fbf7] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-green)]">
                {text.fullVersion.eyebrow}
              </p>
              <h2 className="mt-1 text-[16px] font-bold tracking-[-0.02em] text-[#07111f]">
                {text.fullVersion.title}
              </h2>
              <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[#596660]">
                {text.fullVersion.text}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
              <a href={householdHref} className="eavesence-pill-link">
                {text.fullVersion.button}
              </a>
              <span className="flex flex-col text-[11px] leading-4 text-[#65716d]">
                <span>{text.fullVersion.proLabel}</span>
                <span>{text.fullVersion.proPrice}</span>
              </span>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="scroll-mt-[84px] px-5 pb-9 pt-2 sm:px-6 sm:pb-12"
        >
          <div className="mx-auto max-w-5xl">
            <button
              type="button"
              onClick={() => setFaqOpen((current) => !current)}
              aria-expanded={faqOpen}
              aria-controls="faq-answers"
              className="group flex w-full items-center justify-between gap-5 border-y border-slate-200 py-4 text-left transition hover:text-[var(--brand-green)]"
            >
              <h2 className="text-[16px] font-bold text-[#07111f] transition group-hover:text-[var(--brand-green)]">
                {text.faq.title}
              </h2>
              <span
                aria-hidden="true"
                className={`shrink-0 text-xl font-light text-slate-500 transition-[color,transform] duration-200 ${
                  faqOpen
                    ? "-rotate-45 text-[var(--brand-green)]"
                    : "rotate-0"
                }`}
              >
                +
              </span>
            </button>

            <div
              id="faq-answers"
              aria-hidden={!faqOpen}
              inert={!faqOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                faqOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="divide-y divide-slate-200 border-b border-slate-200">
                  {text.faq.items.map((faq) => (
                    <details key={faq.question} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-semibold text-[#07111f] transition hover:text-[var(--brand-green)] [&::-webkit-details-marker]:hidden">
                        {faq.question}

                        <span
                          aria-hidden="true"
                          className="text-lg font-light text-slate-500 transition-transform duration-150 group-open:-rotate-45 group-open:text-[var(--brand-green)]"
                        >
                          +
                        </span>
                      </summary>

                      <p className="max-w-4xl pb-5 pr-10 text-sm leading-6 text-slate-600">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>{text.faq.feedbackText}</span>
              <a
                href={feedbackHref}
                className="eavesence-pill-link"
              >
                {text.faq.feedbackLink}
              </a>
            </div>
          </div>
        </section>

        <AppInterestPrompt locale={locale} />

      </main>

      <Footer locale={locale} />
    </div>
  );
}
