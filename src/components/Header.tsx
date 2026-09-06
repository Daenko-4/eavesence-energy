"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";

import {
  getCalculatorHref,
  getDevicesHref,
  getFaqHref,
  getHomeHref,
  getHowItWorksHref,
  type Locale,
} from "@/i18n/config";

type HeaderProps = {
  locale?: Locale;
};

const navigation = {
  de: {
    calculator: "Rechner",
    devices: "Geräte",
    howItWorks: "So funktioniert's",
    faq: "FAQ",
    calculate: "Berechnen",
    homeLabel: "EAVESENCE Startseite",
    openNavigation: "Navigation öffnen",
    closeNavigation: "Navigation schließen",
  },

  en: {
    calculator: "Calculator",
    devices: "Devices",
    howItWorks: "How it works",
    faq: "FAQ",
    calculate: "Calculate",
    homeLabel: "EAVESENCE home",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
  },
} as const;

function EAVESENCELogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 256 256"
        aria-hidden="true"
        className="h-10 w-10 shrink-0"
      >
        <defs>
          <linearGradient
            id="eavesence-leaf"
            x1="70"
            y1="190"
            x2="198"
            y2="70"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#079b8d" />
            <stop offset="1" stopColor="#66c72f" />
          </linearGradient>
        </defs>

        <path
          d="M205 58A91 91 0 1 0 210 186"
          fill="none"
          stroke="#062638"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <path
          d="M50 164C81 96 141 75 207 88C180 147 131 183 56 181C51 181 47 176 50 164Z"
          fill="url(#eavesence-leaf)"
        />
        <path
          d="M62 169C101 146 135 123 184 99"
          fill="none"
          stroke="white"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </svg>

      <span className="text-xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-[1.35rem]">
        EAVESENCE
      </span>
    </div>
  );
}

export default function Header({
  locale = "de",
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const pathname = usePathname();

  const text = navigation[locale];

  const homeHref = getHomeHref(locale);
  const calculatorHref = getCalculatorHref(locale);
  const devicesHref = getDevicesHref(locale);
  const howItWorksHref = getHowItWorksHref(locale);
  const faqHref = getFaqHref(locale);

  const otherLocale: Locale =
    locale === "de" ? "en" : "de";

  const languageHref = getHomeHref(otherLocale);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogoClick(
    event: MouseEvent<HTMLAnchorElement>,
  ) {
    closeMenu();

    const isAlreadyOnHomePage =
      pathname === homeHref;

    if (!isAlreadyOnHomePage) {
      return;
    }

    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        homeHref,
      );
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex min-h-[72px] items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex shrink-0 items-center">
            <Link
              href={homeHref}
              onClick={handleLogoClick}
              className="transition-opacity hover:opacity-80"
              aria-label={text.homeLabel}
            >
              <EAVESENCELogo />
            </Link>

            <span className="ml-1.5 mt-[10px] inline-flex text-[8px] font-extrabold uppercase leading-none tracking-[0.12em] text-green-700 sm:ml-2 sm:text-[9px] sm:tracking-[0.14em]">
              Energy
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center text-[15px] font-semibold text-slate-700 md:grid md:grid-cols-[92px_78px_128px_48px] md:gap-3">
            <a
              href={calculatorHref}
              className="flex justify-center whitespace-nowrap transition hover:text-green-700"
            >
              {text.calculator}
            </a>

            <a
              href={devicesHref}
              className="flex justify-center whitespace-nowrap transition hover:text-green-700"
            >
              {text.devices}
            </a>

            <a
              href={howItWorksHref}
              className="flex justify-center whitespace-nowrap transition hover:text-green-700"
            >
              {text.howItWorks}
            </a>

            <a
              href={faqHref}
              className="flex justify-center whitespace-nowrap transition hover:text-green-700"
            >
              {text.faq}
            </a>
          </nav>

          {/* Right Side */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Language switch */}
            <Link
              href={languageHref}
              onClick={closeMenu}
              className="group relative -left-2 flex h-[34px] w-[82px] items-center overflow-hidden rounded-full border border-slate-300 bg-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.05),0_2px_6px_rgba(15,23,42,0.08)] transition duration-200 hover:border-green-300 hover:shadow-[inset_0_1px_2px_rgba(15,23,42,0.05),0_3px_8px_rgba(15,23,42,0.12)] active:scale-[0.98]"
              aria-label={
                locale === "de"
                  ? "Switch to English"
                  : "Zur deutschen Version wechseln"
              }
            >
              {/* Active language knob */}
              <span
                aria-hidden="true"
                className={`absolute top-[2px] h-[28px] w-[38px] rounded-full border border-green-200 bg-green-50 shadow-[0_2px_5px_rgba(15,23,42,0.15),inset_0_1px_1px_rgba(255,255,255,0.95)] transition-all duration-300 ease-out ${
                  locale === "de"
                    ? "left-[2px]"
                    : "left-[41px]"
                }`}
              />

              {/* DE */}
              <span
                className={`relative z-10 flex w-1/2 items-center justify-center text-[11px] font-bold uppercase tracking-[0.03em] transition-colors duration-200 ${
                  locale === "de"
                    ? "text-green-700"
                    : "text-slate-400"
                }`}
              >
                DE
              </span>

              {/* EN */}
              <span
                className={`relative z-10 flex w-1/2 items-center justify-center text-[11px] font-bold uppercase tracking-[0.03em] transition-colors duration-200 ${
                  locale === "en"
                    ? "text-green-700"
                    : "text-slate-400"
                }`}
              >
                EN
              </span>
            </Link>

            <a
              href={calculatorHref}
              onClick={closeMenu}
              className="hidden w-[108px] items-center justify-center rounded-xl bg-green-700 px-4 py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-green-800 hover:shadow-md sm:inline-flex"
            >
              {text.calculate}
            </a>

            <button
              type="button"
              onClick={() =>
                setMenuOpen((current) => !current)
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 md:hidden"
              aria-label={
                menuOpen
                  ? text.closeNavigation
                  : text.openNavigation
              }
              aria-expanded={menuOpen}
            >
              <span className="text-xl leading-none">
                {menuOpen ? "×" : "☰"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="border-t border-slate-200 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              <a
                href={calculatorHref}
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-base font-semibold text-slate-700 transition hover:bg-green-50 hover:text-green-700"
              >
                {text.calculator}
              </a>

              <a
                href={devicesHref}
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-base font-semibold text-slate-700 transition hover:bg-green-50 hover:text-green-700"
              >
                {text.devices}
              </a>

              <a
                href={howItWorksHref}
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-base font-semibold text-slate-700 transition hover:bg-green-50 hover:text-green-700"
              >
                {text.howItWorks}
              </a>

              <a
                href={faqHref}
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-base font-semibold text-slate-700 transition hover:bg-green-50 hover:text-green-700"
              >
                {text.faq}
              </a>

              <a
                href={calculatorHref}
                onClick={closeMenu}
                className="mt-2 rounded-xl bg-green-700 px-3 py-3 text-center text-base font-semibold text-white transition hover:bg-green-800"
              >
                {text.calculate}
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
