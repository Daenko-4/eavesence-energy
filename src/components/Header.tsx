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
  calculatorHrefOverride?: string;
  languageHrefOverride?: string;
};

const navigation = {
  de: {
    calculator: "Rechner",
    devices: "Geräte",
    allDevices: "Alle Geräte",
    allDevicesDescription: "Übersicht und Suche",
    myDevices: "Meine Geräte",
    myDevicesDescription: "Gespeicherte Berechnungen",
    local: "Lokal",
    howItWorks: "So funktioniert's",
    faq: "FAQ",
    homeLabel: "EAVESENCE Startseite",
    openNavigation: "Navigation öffnen",
    closeNavigation: "Navigation schließen",
    closeDevices: "Geräteauswahl schließen",
    slogan: "Die versteckten Kosten des Alltags sichtbar machen.",
  },

  en: {
    calculator: "Calculator",
    devices: "Devices",
    allDevices: "All devices",
    allDevicesDescription: "Browse and search",
    myDevices: "My devices",
    myDevicesDescription: "Saved calculations",
    local: "Local",
    howItWorks: "How it works",
    faq: "FAQ",
    homeLabel: "EAVESENCE home",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
    closeDevices: "Close device links",
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
  calculatorHrefOverride,
  languageHrefOverride,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [devicesMenuOpen, setDevicesMenuOpen] = useState(false);
  const devicesMenuRef = useRef<HTMLDivElement>(null);
  const devicesMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const devicesHoverTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const pathname = usePathname();

  const text = navigation[locale];

  const homeHref = getHomeHref(locale);
  const isHomePage = pathname === homeHref;
  const calculatorHref =
    calculatorHrefOverride ?? getCalculatorHref(locale);
  const devicesHref = getDevicesHref(locale);
  const myDevicesHref = homeHref + "#meine-geraete";
  const howItWorksHref = getHowItWorksHref(locale);
  const faqHref = getFaqHref(locale);

  const otherLocale: Locale =
    locale === "de" ? "en" : "de";

  const languageHref =
    languageHrefOverride ??
    (pathname === devicesHref
      ? getDevicesHref(otherLocale)
      : getHomeHref(otherLocale));

  useEffect(() => {
    function closeDevicesMenuOnOutsideClick(
      event: PointerEvent,
    ) {
      const devicesMenu = devicesMenuRef.current;

      if (
        event.target instanceof Node &&
        devicesMenu &&
        !devicesMenu.contains(event.target)
      ) {
        setDevicesMenuOpen(false);
      }
    }

    function closeDevicesMenuOnEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setDevicesMenuOpen(false);
        devicesMenuTriggerRef.current?.focus();
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

  useEffect(
    () => () => {
      if (devicesHoverTimeoutRef.current) {
        clearTimeout(devicesHoverTimeoutRef.current);
      }
    },
    [],
  );

  function openDevicesMenu() {
    if (devicesHoverTimeoutRef.current) {
      clearTimeout(devicesHoverTimeoutRef.current);
      devicesHoverTimeoutRef.current = null;
    }

    setDevicesMenuOpen(true);
  }

  function closeDevicesMenu() {
    if (devicesHoverTimeoutRef.current) {
      clearTimeout(devicesHoverTimeoutRef.current);
      devicesHoverTimeoutRef.current = null;
    }

    setDevicesMenuOpen(false);
  }

  function scheduleDevicesMenuClose() {
    if (devicesHoverTimeoutRef.current) {
      clearTimeout(devicesHoverTimeoutRef.current);
    }

    devicesHoverTimeoutRef.current = setTimeout(
      closeDevicesMenu,
      50,
    );
  }

  function closeMenu() {
    setMenuOpen(false);
    closeDevicesMenu();
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

  function handleDevicesOverviewClick(
    event: MouseEvent<HTMLAnchorElement>,
  ) {
    closeDevicesMenu();

    if (pathname !== devicesHref) {
      return;
    }

    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="flex min-h-[68px] items-center justify-between gap-4">
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
          <nav className="hidden items-center text-[15px] font-semibold text-slate-700 md:grid md:grid-cols-[92px_104px_128px_48px] md:gap-3">
            <a
              href={calculatorHref}
              className={`relative flex justify-center whitespace-nowrap py-2 transition hover:text-green-700 ${
                isHomePage ? "text-[#07111f]" : ""
              }`}
            >
              {text.calculator}
              {isHomePage && (
                <span className="absolute inset-x-4 -bottom-[14px] h-0.5 rounded-full bg-[#00a557]" />
              )}
            </a>

            <div
              ref={devicesMenuRef}
              className="relative mx-auto flex h-full w-[104px] items-center justify-center"
              onMouseEnter={openDevicesMenu}
              onMouseLeave={scheduleDevicesMenuClose}
              onFocusCapture={openDevicesMenu}
              onBlurCapture={(event) => {
                if (
                  event.relatedTarget instanceof Node &&
                  event.currentTarget.contains(event.relatedTarget)
                ) {
                  return;
                }

                scheduleDevicesMenuClose();
              }}
            >
              <button
                ref={devicesMenuTriggerRef}
                type="button"
                aria-expanded={devicesMenuOpen}
                aria-controls="devices-navigation-menu"
                onClick={() =>
                  devicesMenuOpen
                    ? closeDevicesMenu()
                    : openDevicesMenu()
                }
                className="group flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 transition-colors duration-150 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/30"
              >
                <span>{text.devices}</span>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-[90ms] ease-out motion-reduce:transition-none group-hover:text-green-700 ${
                    devicesMenuOpen ? "rotate-180" : ""
                  }`}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 7.5 5 5 5-5" />
                </svg>
              </button>

              <div
                id="devices-navigation-menu"
                aria-hidden={!devicesMenuOpen}
                className="absolute left-1/2 top-full z-50 w-[196px] -translate-x-1/2 pt-2"
              >
                <div
                  className={`origin-top rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.06)] transition-[opacity,transform,visibility] ease-out motion-reduce:transition-none ${
                    devicesMenuOpen
                      ? "visible translate-y-0 opacity-100 duration-[90ms]"
                      : "invisible pointer-events-none -translate-y-0.5 opacity-0 duration-[70ms]"
                  }`}
                >
                  <Link
                    href={devicesHref}
                    onClick={handleDevicesOverviewClick}
                    className="group/item flex flex-col items-center rounded-xl px-2 py-2 text-center transition-colors duration-100 hover:bg-green-50 focus-visible:bg-green-50 focus-visible:outline-none"
                  >
                    <span className="relative -left-[10px] block text-sm font-bold text-slate-800 transition-colors group-hover/item:text-green-800">
                      {text.allDevices}
                    </span>
                    <span className="relative -left-[10px] mt-0.5 block text-xs font-medium text-slate-500">
                      {text.allDevicesDescription}
                    </span>
                  </Link>

                  <Link
                    href={myDevicesHref}
                    onClick={closeDevicesMenu}
                    className="group/item flex flex-col items-center rounded-xl px-2 py-2 text-center transition-colors duration-100 hover:bg-green-50 focus-visible:bg-green-50 focus-visible:outline-none"
                  >
                    <span className="relative -left-[10px] block text-sm font-bold text-slate-800 transition-colors group-hover/item:text-green-800">
                      {text.myDevices}
                    </span>
                    <span className="relative -left-[10px] mt-0.5 block text-xs font-medium text-slate-500">
                      {text.myDevicesDescription}
                    </span>
                  </Link>
                </div>
              </div>
            </div>

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
          <div className="flex shrink-0 items-center gap-2 md:w-[187px] md:justify-end">
            {/* Language switch */}
            <Link
              href={languageHref}
              onClick={closeMenu}
              className="group relative flex h-[34px] w-[82px] items-center overflow-hidden rounded-full border border-slate-300/80 bg-white transition duration-200 hover:border-green-300 active:scale-[0.98]"
              aria-label={
                locale === "de"
                  ? "Switch to English"
                  : "Zur deutschen Version wechseln"
              }
            >
              {/* Active language knob */}
              <span
                aria-hidden="true"
                className={`absolute top-[2px] h-[28px] w-[38px] rounded-full bg-[#dcfce8] transition-all duration-200 ease-out ${
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

            </div>
          </nav>
        )}
      </div>

    </header>
  );
}
