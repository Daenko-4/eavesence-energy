"use client";

import { useEffect, useState } from "react";

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

export default function HomePage({
  locale = "de",
}: HomePageProps) {
  const [faqOpen, setFaqOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const text = content[locale];
  const hero =
    locale === "de"
      ? {
          calculate: "Planen.",
          understand: "Verstehen.",
          save: "Sparen.",
          subtitle: "My Home zeigt Einkommen, laufende Kosten und anstehende Zahlungen auf einen Blick.",
          allDevices: "Weitere Geräte berechnen",
        }
      : {
          calculate: "Plan.",
          understand: "Understand.",
          save: "Save.",
          subtitle: "My Home brings income, recurring costs and upcoming payments into one clear view.",
          allDevices: "Calculate another device",
        };

  const devicesHref =
    locale === "de" ? "/geraete" : "/en/devices";
  const householdHref = locale === "de" ? "/de/zuhause" : "/home";
  const feedbackHref = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
    text.faq.feedbackSubject
  )}`;

  useEffect(() => {
    function openHowItWorks() {
      if (window.location.hash === "#so-funktionierts") {
        setHowItWorksOpen(true);
      }
    }
    function openOnRequest() {
      setHowItWorksOpen(true);
    }

    openHowItWorks();
    window.addEventListener("hashchange", openHowItWorks);
    window.addEventListener("eavesence:open-how-it-works", openOnRequest);
    return () => {
      window.removeEventListener("hashchange", openHowItWorks);
      window.removeEventListener("eavesence:open-how-it-works", openOnRequest);
    };
  }, []);

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
                  <span className="mt-0.5 block text-[11px] leading-4 text-[#65716d]">{locale === "de" ? "Geräte und laufende Kosten organisieren. Jetzt kostenlos; Vollversion in Vorbereitung." : "Organize devices and recurring costs. Free now; full version in development."}</span>
                </span>
                <span className="rounded-full bg-[var(--brand-green)] px-3 py-1.5 text-[11px] font-bold text-white transition group-hover:bg-[var(--brand-green-dark)]">{locale === "de" ? "Öffnen" : "Open"}</span>
              </a>
            </div>

            <div className="mx-auto mt-6 max-w-6xl sm:mt-7">
              <p className="mb-3 text-center text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-green)]">{text.calculator.label}</p>
              <EnergyCalculator
                locale={locale}
                homePresentation
                savingTipActions={
                  <>
                    <a href={devicesHref} className="eavesence-pill-link">
                      {hero.allDevices}
                    </a>
                    <button
                      type="button"
                      aria-expanded={howItWorksOpen}
                      aria-controls="how-it-works-steps"
                      onClick={() => setHowItWorksOpen((current) => !current)}
                      className="eavesence-pill-button"
                    >
                      {text.howItWorks.label}
                      <span aria-hidden="true" className={`ml-1 inline-block origin-center transition-transform duration-[180ms] ${howItWorksOpen ? "-rotate-45" : "rotate-0"}`}>+</span>
                    </button>
                  </>
                }
                afterSavingTip={
                  <div id="how-it-works-steps" hidden={!howItWorksOpen} className={`${howItWorksOpen ? "grid" : "hidden"} mt-4 gap-3 border-t border-slate-200/80 px-1 pt-4 md:grid-cols-3 md:gap-4 md:divide-x md:divide-slate-200`}>
                    {text.howItWorks.steps.map((step) => (
                      <div key={step.number} className="flex gap-2.5 md:px-4 md:first:pl-0 md:last:pr-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dcfce8] text-[11px] font-extrabold text-[var(--brand-green)]">
                          {Number(step.number)}
                        </span>
                        <div>
                          <h3 className="text-[13px] font-bold text-[#07111f]">{step.title}</h3>
                          <p className="mt-0.5 max-w-sm text-[12px] leading-5 text-slate-600">{step.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              />
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
                className={`inline-block shrink-0 origin-center text-xl font-light text-slate-500 transition-[color,transform] duration-[180ms] ${
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
                          className="inline-block origin-center rotate-0 text-lg font-light text-slate-500 transition-[color,transform] duration-[180ms] group-open:-rotate-45 group-open:text-[var(--brand-green)]"
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

      </main>

      <Footer locale={locale} />
    </div>
  );
}
