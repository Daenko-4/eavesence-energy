import Link from "next/link";

import {
  getCalculatorHref,
  getDevicesHref,
  getFaqHref,
  type Locale,
} from "@/i18n/config";

type FooterProps = {
  locale?: Locale;
};

const footerText = {
  de: {
    description:
      "Einfache Werkzeuge, die dir helfen, Stromverbrauch und Energiekosten besser zu verstehen.",
    privateProject: "Derzeit ein privates, nicht kommerzielles Projekt.",
    calculator: "Stromkosten-Rechner",
    devices: "Geräteübersicht",
    faq: "Häufige Fragen",
    legal: "Rechtliches",
    imprint: "Impressum",
    privacy: "Datenschutz",
  },

  en: {
    description:
      "Simple tools that help you understand electricity consumption and energy costs.",
    privateProject: "Currently a private, non-commercial project.",
    calculator: "Electricity cost calculator",
    devices: "Device overview",
    faq: "Frequently asked questions",
    legal: "Legal",
    imprint: "Imprint",
    privacy: "Privacy",
  },
} as const;

function getImprintHref(locale: Locale) {
  return locale === "de" ? "/impressum" : "/en/imprint";
}

function getPrivacyHref(locale: Locale) {
  return locale === "de" ? "/datenschutz" : "/en/privacy";
}

export default function Footer({ locale = "de" }: FooterProps) {
  const text = footerText[locale];

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="font-bold text-slate-900">
              ⚡ EAVESENCE Energy
            </p>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {text.description}
            </p>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              {text.privateProject}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              EAVESENCE
            </p>

            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500">
              <Link
                href={getCalculatorHref(locale)}
                className="transition hover:text-slate-900"
              >
                {text.calculator}
              </Link>

              <Link
                href={getDevicesHref(locale)}
                className="transition hover:text-slate-900"
              >
                {text.devices}
              </Link>

              <Link
                href={getFaqHref(locale)}
                className="transition hover:text-slate-900"
              >
                {text.faq}
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              {text.legal}
            </p>

            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500">
              <Link
                href={getImprintHref(locale)}
                className="transition hover:text-slate-900"
              >
                {text.imprint}
              </Link>

              <Link
                href={getPrivacyHref(locale)}
                className="transition hover:text-slate-900"
              >
                {text.privacy}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-400">
          © {new Date().getFullYear()} EAVESENCE Energy
        </div>
      </div>
    </footer>
  );
}