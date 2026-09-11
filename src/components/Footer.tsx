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
  const howItWorksHref = `${getHomeHref(locale)}#so-funktionierts`;
  const aboutHref = `${getHomeHref(locale)}#about`;
  const imprintHref = getImprintHref(locale);
  const privacyHref = getPrivacyHref(locale);

  return (
    <footer className="border-t border-slate-200/80 bg-[#fafbf8]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Image
              src="/brand/eavesence-wordmark-approved-final.png"
              alt="EAVESENCE Energy"
              width={206}
              height={44}
              className="h-auto w-[164px]"
              unoptimized
            />

            <p className="max-w-md text-sm leading-6 text-slate-500">
              {text.description}
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-500">
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
                href={howItWorksHref}
                onClick={(event) =>
                  handleInternalNavigation(event, howItWorksHref)
                }
                className="transition hover:text-slate-900"
              >
                {locale === "de" ? "So funktioniert's" : "How it works"}
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
          </nav>
        </div>

        <div className="mt-7 flex flex-col gap-1 border-t border-slate-200/80 pt-5 text-xs leading-5 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} EAVESENCE Energy</span>
          <span>{text.privateProject}</span>
        </div>
      </div>
    </footer>
  );
}
