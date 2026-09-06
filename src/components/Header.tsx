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
    homeLabel: "TinyTools Startseite",
    openNavigation: "Navigation öffnen",
    closeNavigation: "Navigation schließen",
  },

  en: {
    calculator: "Calculator",
    devices: "Devices",
    howItWorks: "How it works",
    faq: "FAQ",
    calculate: "Calculate",
    homeLabel: "TinyTools home",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
  },
} as const;

function TinyToolsLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="h-10 w-10 shrink-0"
      >
        <defs>
          <linearGradient
            id="tinytools-leaf"
            x1="12"
            y1="52"
            x2="52"
            y2="10"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#15803d" />
            <stop offset="1" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        <path
          d="M54 8
             C42 10 29 13 20 20
             C11 27 8 37 12 47
             C20 52 31 50 39 44
             C48 37 53 24 54 8Z"
          fill="url(#tinytools-leaf)"
        />

        <path
          d="M13 48
             C21 38 30 29 45 17
             C33 24 23 32 15 42
             C13 44 12 46 13 48Z"
          fill="white"
        />

        <path
          d="M14 45
             C11 50 9 54 7 58"
          fill="none"
          stroke="#15803d"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>

      <span className="text-xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-[1.35rem]">
        TinyTools
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
              <TinyToolsLogo />
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