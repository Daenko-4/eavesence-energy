"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import BrandLogo, { BrandMark } from "@/components/BrandLogo";
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

type NavigationKey =
  | "calculator"
  | "allDevices"
  | "myDevices"
  | "howItWorks"
  | "faq";

const navigation = {
  de: {
    calculator: "Rechner",
    allDevices: "Alle Geräte",
    myDevices: "Meine Geräte",
    howItWorks: "So funktioniert's",
    faq: "FAQ",
    homeLabel: "EAVESENCE Startseite",
    openNavigation: "Navigation öffnen",
    closeNavigation: "Navigation schließen",
  },
  en: {
    calculator: "Calculator",
    allDevices: "All devices",
    myDevices: "My devices",
    howItWorks: "How it works",
    faq: "FAQ",
    homeLabel: "EAVESENCE home",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
  },
} as const;

function NavigationLink({
  href,
  active,
  navigationKey,
  onPreview,
  children,
}: {
  href: string;
  active: boolean;
  navigationKey: NavigationKey;
  onPreview: (navigationKey: NavigationKey) => void;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      onMouseEnter={() => onPreview(navigationKey)}
      onFocus={() => onPreview(navigationKey)}
      aria-current={active ? "location" : undefined}
      data-navigation-key={navigationKey}
      className={`group relative flex h-10 items-center whitespace-nowrap px-1 text-[13px] font-semibold transition-colors duration-150 hover:text-[var(--brand-green)] ${
        active ? "text-[#07111f]" : "text-slate-600"
      }`}
    >
      {children}
    </a>
  );
}

export default function Header({
  locale = "de",
  calculatorHrefOverride,
  languageHrefOverride,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopNavigationOpen, setDesktopNavigationOpen] = useState(false);
  const [previewNavigation, setPreviewNavigation] =
    useState<NavigationKey | null>(null);
  const [activeHomeSection, setActiveHomeSection] =
    useState<NavigationKey>("calculator");
  const closeNavigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const logoInteractionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const suppressPointerOpenRef = useRef(false);
  const headerRef = useRef<HTMLElement>(null);
  const desktopNavigationRef = useRef<HTMLElement>(null);
  const activeIndicatorRef = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const text = navigation[locale];

  const homeHref = getHomeHref(locale);
  const isHomePage = pathname === homeHref;
  const calculatorHref = calculatorHrefOverride ?? getCalculatorHref(locale);
  const devicesHref = getDevicesHref(locale);
  const myDevicesHref = `${homeHref}#meine-geraete`;
  const howItWorksHref = getHowItWorksHref(locale);
  const faqHref = getFaqHref(locale);
  const isDevicesPage =
    pathname === devicesHref || pathname.startsWith(`${devicesHref}/`);
  const activeNavigation: NavigationKey | null = isDevicesPage
    ? "allDevices"
    : isHomePage
      ? activeHomeSection
      : null;
  const indicatedNavigation = previewNavigation ?? activeNavigation;

  const otherLocale: Locale = locale === "de" ? "en" : "de";
  const languageHref =
    languageHrefOverride ??
    (pathname === devicesHref
      ? getDevicesHref(otherLocale)
      : getHomeHref(otherLocale));

  useEffect(() => {
    return () => {
      if (closeNavigationTimeoutRef.current) {
        clearTimeout(closeNavigationTimeoutRef.current);
      }
      if (logoInteractionTimeoutRef.current) {
        clearTimeout(logoInteractionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isHomePage) return;

    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;

    function updateActiveSection() {
      animationFrame = 0;
      const headerHeight = headerRef.current?.offsetHeight ?? 68;
      const activationPoint =
        window.scrollY + headerHeight + Math.min(window.innerHeight * 0.18, 150);
      const sections: Array<{ id: string; navigation: NavigationKey }> = [
        { id: "rechner", navigation: "calculator" },
        { id: "meine-geraete", navigation: "myDevices" },
        { id: "so-funktionierts", navigation: "howItWorks" },
        { id: "faq", navigation: "faq" },
      ];

      let nextSection: NavigationKey = "calculator";
      for (const section of sections) {
        const element = document.getElementById(section.id);
        const sectionTop = element
          ? element.getBoundingClientRect().top + window.scrollY
          : Number.POSITIVE_INFINITY;
        if (sectionTop <= activationPoint) {
          nextSection = section.navigation;
        }
      }

      const atPageEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 12;
      if (atPageEnd && document.getElementById("faq")) {
        nextSection = "faq";
      }
      setActiveHomeSection(nextSection);
    }

    function scheduleUpdate() {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateActiveSection);
      }
    }

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);
    window.addEventListener("pageshow", scheduleUpdate);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(document.body);
    }

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
      window.removeEventListener("pageshow", scheduleUpdate);
    };
  }, [isHomePage]);

  useEffect(() => {
    function positionActiveIndicator() {
      const navigationElement = desktopNavigationRef.current;
      const indicatorElement = activeIndicatorRef.current;

      if (!navigationElement || !indicatorElement || !indicatedNavigation) {
        if (indicatorElement) indicatorElement.style.opacity = "0";
        return;
      }

      const activeLink = navigationElement.querySelector<HTMLElement>(
        `[data-navigation-key="${indicatedNavigation}"]`,
      );
      if (!activeLink) {
        indicatorElement.style.opacity = "0";
        return;
      }

      const navigationRect = navigationElement.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      indicatorElement.style.width = `${linkRect.width - 8}px`;
      indicatorElement.style.transform = `translateX(${linkRect.left - navigationRect.left + 4}px)`;
      indicatorElement.style.opacity = "1";
    }

    const frame = window.requestAnimationFrame(positionActiveIndicator);
    window.addEventListener("resize", positionActiveIndicator);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", positionActiveIndicator);
    };
  }, [indicatedNavigation, desktopNavigationOpen]);

  function openDesktopNavigation() {
    if (closeNavigationTimeoutRef.current) {
      clearTimeout(closeNavigationTimeoutRef.current);
      closeNavigationTimeoutRef.current = null;
    }
    setDesktopNavigationOpen(true);
  }

  function openDesktopNavigationFromPointer() {
    if (suppressPointerOpenRef.current) return;
    openDesktopNavigation();
  }

  function handleDesktopNavigationMouseLeave() {
    suppressPointerOpenRef.current = false;
    if (logoInteractionTimeoutRef.current) {
      clearTimeout(logoInteractionTimeoutRef.current);
      logoInteractionTimeoutRef.current = null;
    }
    scheduleDesktopNavigationClose();
  }

  function scheduleDesktopNavigationClose() {
    if (closeNavigationTimeoutRef.current) {
      clearTimeout(closeNavigationTimeoutRef.current);
    }
    closeNavigationTimeoutRef.current = setTimeout(
      () => setDesktopNavigationOpen(false),
      220,
    );
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogoClick(event: MouseEvent<HTMLAnchorElement>) {
    suppressPointerOpenRef.current = true;
    if (logoInteractionTimeoutRef.current) {
      clearTimeout(logoInteractionTimeoutRef.current);
    }
    logoInteractionTimeoutRef.current = setTimeout(() => {
      suppressPointerOpenRef.current = false;
      logoInteractionTimeoutRef.current = null;
    }, 560);
    closeMenu();
    setDesktopNavigationOpen(false);
    setPreviewNavigation(null);
    if (closeNavigationTimeoutRef.current) {
      clearTimeout(closeNavigationTimeoutRef.current);
      closeNavigationTimeoutRef.current = null;
    }
    if (pathname !== homeHref) return;

    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.location.hash) {
      window.history.replaceState(null, "", homeHref);
    }
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-[100] border-b border-slate-200/70 bg-white/92 backdrop-blur-xl"
    >
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <div className="relative flex min-h-[68px] items-center justify-between">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-green-200 hover:bg-green-50 hover:text-[var(--brand-green-dark)] lg:hidden"
            aria-label={menuOpen ? text.closeNavigation : text.openNavigation}
            aria-expanded={menuOpen}
          >
            <span className="text-xl leading-none">{menuOpen ? "×" : "☰"}</span>
          </button>

          <Link
            href={homeHref}
            onClick={handleLogoClick}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:hidden"
            aria-label={text.homeLabel}
          >
            <BrandLogo
              markClassName="h-8 w-8"
              wordmarkClassName="text-[1.05rem]"
              className="inline-flex items-center gap-2"
            />
          </Link>

          <div aria-hidden="true" className="hidden h-10 w-10 lg:block" />

          <div
            onMouseLeave={handleDesktopNavigationMouseLeave}
            onFocusCapture={openDesktopNavigation}
            onBlurCapture={(event) => {
              if (
                event.relatedTarget instanceof Node &&
                event.currentTarget.contains(event.relatedTarget)
              ) {
                return;
              }
              setDesktopNavigationOpen(false);
            }}
            className="absolute left-1/2 top-1/2 hidden h-11 w-[760px] -translate-x-1/2 -translate-y-1/2 lg:block"
          >
            <Link
              href={homeHref}
              onClick={handleLogoClick}
              onMouseEnter={openDesktopNavigationFromPointer}
              onFocus={openDesktopNavigation}
              className={`absolute top-1/2 z-20 flex -translate-y-1/2 items-center gap-2.5 transition-[left,transform] duration-[520ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
                desktopNavigationOpen
                  ? "left-0 translate-x-0"
                  : "left-1/2 -translate-x-1/2"
              }`}
              aria-label={text.homeLabel}
            >
              <BrandMark className="h-8 w-8 shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap text-[1.25rem] font-extrabold leading-none tracking-[-0.065em] text-[#10283a] transition-[max-width,opacity,transform,filter] duration-[520ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
                  desktopNavigationOpen
                    ? "max-w-0 -translate-x-3 scale-x-75 opacity-0 blur-[5px]"
                    : "max-w-[190px] translate-x-0 scale-x-100 opacity-100 blur-0"
                }`}
              >
                EAVESENCE
              </span>
            </Link>

            <nav
              ref={desktopNavigationRef}
              onMouseLeave={() => setPreviewNavigation(null)}
              onBlurCapture={(event) => {
                if (
                  event.relatedTarget instanceof Node &&
                  event.currentTarget.contains(event.relatedTarget)
                ) {
                  return;
                }
                setPreviewNavigation(null);
              }}
              aria-label={text.openNavigation}
              className={`absolute inset-y-0 left-10 right-10 flex items-center justify-center gap-5 transition-[opacity,transform,filter,visibility] duration-[340ms] ease-out motion-reduce:transition-none ${
                desktopNavigationOpen
                  ? "visible translate-x-0 opacity-100 blur-0 delay-100"
                  : "invisible pointer-events-none translate-x-4 opacity-0 blur-[3px] delay-0"
              }`}
            >
              <NavigationLink href={calculatorHref} active={activeNavigation === "calculator"} navigationKey="calculator" onPreview={setPreviewNavigation}>
                {text.calculator}
              </NavigationLink>
              <NavigationLink href={devicesHref} active={activeNavigation === "allDevices"} navigationKey="allDevices" onPreview={setPreviewNavigation}>
                {text.allDevices}
              </NavigationLink>
              <NavigationLink href={myDevicesHref} active={activeNavigation === "myDevices"} navigationKey="myDevices" onPreview={setPreviewNavigation}>
                {text.myDevices}
              </NavigationLink>
              <NavigationLink href={howItWorksHref} active={activeNavigation === "howItWorks"} navigationKey="howItWorks" onPreview={setPreviewNavigation}>
                {text.howItWorks}
              </NavigationLink>
              <NavigationLink href={faqHref} active={activeNavigation === "faq"} navigationKey="faq" onPreview={setPreviewNavigation}>
                {text.faq}
              </NavigationLink>
              <span
                ref={activeIndicatorRef}
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 h-[2px] rounded-full bg-[var(--brand-green-mint)] opacity-0 transition-[width,transform,opacity] duration-[220ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
              />
            </nav>
          </div>

          <Link
            href={languageHref}
            onClick={closeMenu}
            className="group relative flex h-[34px] w-[76px] items-center overflow-hidden rounded-full border border-slate-300/80 bg-white transition duration-200 hover:border-green-300 active:scale-[0.98]"
            aria-label={
              locale === "de" ? "Switch to English" : "Zur deutschen Version wechseln"
            }
          >
            <span
              aria-hidden="true"
              className={`absolute top-[2px] h-[28px] w-[34px] rounded-full bg-[#dcfce8] transition-all duration-200 ease-out ${
                locale === "de" ? "left-[2px]" : "left-[38px]"
              }`}
            />
            <span className={`relative z-10 flex w-1/2 items-center justify-center text-[10px] font-bold uppercase tracking-[0.03em] ${locale === "de" ? "text-[var(--brand-green)]" : "text-slate-400"}`}>
              DE
            </span>
            <span className={`relative z-10 flex w-1/2 items-center justify-center text-[10px] font-bold uppercase tracking-[0.03em] ${locale === "en" ? "text-[var(--brand-green)]" : "text-slate-400"}`}>
              EN
            </span>
          </Link>
        </div>

        {menuOpen && (
          <nav className="border-t border-slate-200 py-3 lg:hidden">
            <div className="grid gap-1">
              {[
                [calculatorHref, text.calculator],
                [devicesHref, text.allDevices],
                [myDevicesHref, text.myDevices],
                [howItWorksHref, text.howItWorks],
                [faqHref, text.faq],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-green-50 hover:text-[var(--brand-green-dark)]"
                >
                  {label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
