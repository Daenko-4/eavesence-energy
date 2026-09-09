"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

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
    allDevices: "Alle Geräte",
    myDevices: "Meine Geräte",
    local: "Lokal",
    howItWorks: "So funktioniert's",
    faq: "FAQ",
    calculate: "Berechnen",
    homeLabel: "EAVESENCE Startseite",
    openNavigation: "Navigation öffnen",
    closeNavigation: "Navigation schließen",
    slogan: "Die versteckten Kosten des Alltags sichtbar machen.",
  },

  en: {
    calculator: "Calculator",
    devices: "Devices",
    allDevices: "All devices",
    myDevices: "My devices",
    local: "Local",
    howItWorks: "How it works",
    faq: "FAQ",
    calculate: "Calculate",
    homeLabel: "EAVESENCE home",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
    slogan: "Making the hidden costs of everyday living visible.",
  },
} as const;

function EAVESENCELogo() {
  return (
    <div className="flex items-center">
      <Image
        src="/brand/eavesence-wordmark-approved-final.png"
        alt="EAVESENCE Energy"
        width={187}
        height={40}
        className="h-[35px] w-auto sm:h-10"
        priority
        unoptimized
      />
    </div>
  );
}

export default function Header({
  locale = "de",
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sloganVisible, setSloganVisible] = useState(true);
  const devicesMenuRef = useRef<HTMLDetailsElement>(null);

  const pathname = usePathname();

  const text = navigation[locale];

  const homeHref = getHomeHref(locale);
  const isHomePage = pathname === homeHref;
  const calculatorHref = getCalculatorHref(locale);
  const devicesHref = getDevicesHref(locale);
  const isSloganPage = isHomePage || pathname === devicesHref;
  const myDevicesHref = homeHref + "#meine-geraete";
  const howItWorksHref = getHowItWorksHref(locale);
  const faqHref = getFaqHref(locale);

  const otherLocale: Locale =
    locale === "de" ? "en" : "de";

  const languageHref = getHomeHref(otherLocale);

  useEffect(() => {
    if (!isSloganPage) {
      return;
    }

    function handleScroll() {
      const scrollPosition = window.scrollY;

      setSloganVisible((currentlyVisible) => {
        if (scrollPosition > 64) {
          return false;
        }

        if (scrollPosition < 4) {
          return true;
        }

        return currentlyVisible;
      });
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSloganPage]);

  useEffect(() => {
    function closeDevicesMenuOnOutsideClick(
      event: PointerEvent,
    ) {
      const devicesMenu = devicesMenuRef.current;

      if (
        devicesMenu?.open &&
        event.target instanceof Node &&
        !devicesMenu.contains(event.target)
      ) {
        devicesMenu.removeAttribute("open");
      }
    }

    function closeDevicesMenuOnEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        devicesMenuRef.current?.removeAttribute("open");
      }
    }

    document.addEventListener(
      "pointerdown",
      closeDevicesMenuOnOutsideClick,
    );
    document.addEventListener(
      "keydown",
      closeDevicesMenuOnEscape,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        closeDevicesMenuOnOutsideClick,
      );
      document.removeEventListener(
        "keydown",
        closeDevicesMenuOnEscape,
      );
    };
  }, []);

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
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white">
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

          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center text-[15px] font-semibold text-slate-700 md:grid md:grid-cols-[92px_118px_128px_48px] md:gap-3">
            <a
              href={calculatorHref}
              className="flex justify-center whitespace-nowrap transition hover:text-green-700"
            >
              {text.calculator}
            </a>

            <details
              ref={devicesMenuRef}
              className="group relative mx-auto w-fit"
            >
              <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 transition hover:bg-green-50 hover:text-green-700 [&::-webkit-details-marker]:hidden">
                {text.devices}
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 7.5 5 5 5-5" />
                </svg>
              </summary>

              <div className="absolute left-0 top-full z-50 mt-3 flex w-28 flex-col items-stretch gap-0.5 rounded-xl border border-slate-200/80 bg-white p-1 shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
                <Link
                  href={devicesHref}
                  onClick={(event) =>
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open")
                  }
                  className="rounded-lg px-1 py-2 text-left text-xs font-normal whitespace-nowrap text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  {text.allDevices}
                </Link>

                <Link
                  href={myDevicesHref}
                  onClick={(event) =>
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open")
                  }
                  className="rounded-lg px-1 py-2 text-left text-xs font-normal whitespace-nowrap text-green-800 transition hover:bg-green-50 hover:text-green-950"
                >
                  {text.myDevices}
                </Link>
              </div>
            </details>

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
              className="hidden h-[34px] min-w-[96px] items-center justify-center rounded-full bg-green-700 px-4 text-sm font-semibold text-white shadow-[0_2px_6px_rgba(21,128,61,0.22)] transition duration-200 hover:-translate-y-px hover:bg-green-800 hover:shadow-[0_4px_10px_rgba(21,128,61,0.28)] active:translate-y-0 active:scale-[0.98] sm:inline-flex"
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

              <div className="rounded-xl bg-slate-50 p-2">
                <p className="flex items-center gap-1.5 px-2 pb-1 pt-1 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                  {text.devices}
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-3.5 w-3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 7.5 5 5 5-5" />
                  </svg>
                </p>

                <a
                  href={devicesHref}
                  onClick={closeMenu}
                  className="block rounded-lg px-3 py-2.5 text-base font-semibold text-slate-700 transition hover:bg-white hover:text-green-700"
                >
                  {text.allDevices}
                </a>

                <a
                  href={myDevicesHref}
                  onClick={closeMenu}
                  className="flex items-center justify-between gap-3 rounded-lg bg-green-50 px-3 py-2.5 text-base font-bold text-green-900 transition hover:bg-green-100"
                >
                  <span>{text.myDevices}</span>
                  <span className="rounded-full border border-green-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-green-700">
                    {text.local}
                  </span>
                </a>
              </div>

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

      {isSloganPage && (
        <div
          className={`grid bg-[#f8faf8] text-center transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${
            sloganVisible
              ? "grid-rows-[1fr] border-t border-slate-100 opacity-100"
              : "-translate-y-1 grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="mx-auto max-w-6xl px-5 sm:px-6">
              <p className="py-2 text-left text-xs font-semibold italic tracking-[0.01em] text-green-800 sm:text-[13px]">
                {text.slogan}
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
