"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

import {
  getCalculatorHref,
  getDevicesHref,
  getFaqHref,
  getHomeHref,
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
    about: "Über EAVESENCE",
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
    about: "About EAVESENCE",
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
  const pathname = usePathname();

  function handleInternalNavigation(
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    const [targetPath, targetId] = href.split("#");

    if (pathname !== targetPath) {
      return;
    }

    event.preventDefault();

    if (!targetId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.history.replaceState(null, "", href);
  }

  const calculatorHref = getCalculatorHref(locale);
  const devicesHref = getDevicesHref(locale);
  const faqHref = getFaqHref(locale);
  const aboutHref = `${getHomeHref(locale)}#about`;
  const imprintHref = getImprintHref(locale);
  const privacyHref = getPrivacyHref(locale);

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Image
              src="/brand/eavesence-wordmark-balanced-v2.png"
              alt="EAVESENCE Energy"
              width={206}
              height={44}
              className="h-auto w-[205px]"
              unoptimized
            />

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
                href={calculatorHref}
                onClick={(event) =>
                  handleInternalNavigation(event, calculatorHref)
                }
                className="transition hover:text-slate-900"
              >
                {text.calculator}
              </Link>

              <Link
                href={devicesHref}
                onClick={(event) =>
                  handleInternalNavigation(event, devicesHref)
                }
                className="transition hover:text-slate-900"
              >
                {text.devices}
              </Link>

              <Link
                href={faqHref}
                onClick={(event) =>
                  handleInternalNavigation(event, faqHref)
                }
                className="transition hover:text-slate-900"
              >
                {text.faq}
              </Link>

              <Link
                href={aboutHref}
                onClick={(event) =>
                  handleInternalNavigation(event, aboutHref)
                }
                className="transition hover:text-slate-900"
              >
                {text.about}
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              {text.legal}
            </p>

            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500">
              <Link
                href={imprintHref}
                onClick={(event) =>
                  handleInternalNavigation(event, imprintHref)
                }
                className="transition hover:text-slate-900"
              >
                {text.imprint}
              </Link>

              <Link
                href={privacyHref}
                onClick={(event) =>
                  handleInternalNavigation(event, privacyHref)
                }
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
