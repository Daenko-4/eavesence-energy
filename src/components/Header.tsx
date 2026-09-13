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

const HEADER_INTRO_STORAGE_KEY = "eavesence-header-intro-seen-v3";

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
  onActivate,
  children,
}: {
  href: string;
  active: boolean;
  navigationKey: NavigationKey;
  onPreview: (navigationKey: NavigationKey) => void;
  onActivate?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={onActivate}
      onMouseEnter={() => onPreview(navigationKey)}
      onFocus={() => onPreview(navigationKey)}
      aria-current={active ? "location" : undefined}
      data-navigation-key={navigationKey}
      className="group relative flex h-full items-center whitespace-nowrap px-1 text-[13px] font-semibold text-[#33413d] transition-colors duration-150 hover:text-[var(--brand-green)]"
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
  const introOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (introOpenTimeoutRef.current) {
        clearTimeout(introOpenTimeoutRef.current);
      }
      if (introCloseTimeoutRef.current) {
        clearTimeout(introCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (!desktopQuery.matches || reducedMotionQuery.matches) return;

    let introSeen = false;
    try {
      introSeen = Boolean(
        window.localStorage.getItem(HEADER_INTRO_STORAGE_KEY),
      );
    } catch {
      // Show the preview even when browser storage is unavailable.
    }
    if (introSeen) return;

    let disposed = false;

    function scheduleIntro() {
      if (disposed || document.visibilityState !== "visible") return;

      introOpenTimeoutRef.current = setTimeout(() => {
        setDesktopNavigationOpen(true);
        introOpenTimeoutRef.current = null;
        introCloseTimeoutRef.current = setTimeout(() => {
          setDesktopNavigationOpen(false);
          introCloseTimeoutRef.current = null;
          try {
            window.localStorage.setItem(HEADER_INTRO_STORAGE_KEY, "true");
          } catch {
            // The preview still works when browser storage is unavailable.
          }
        }, 2400);
      }, 900);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        scheduleIntro();
      }
    }

    if (document.visibilityState === "visible") {
      scheduleIntro();
    } else {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (introOpenTimeoutRef.current) {
        clearTimeout(introOpenTimeoutRef.current);
        introOpenTimeoutRef.current = null;
      }
      if (introCloseTimeoutRef.current) {
        clearTimeout(introCloseTimeoutRef.current);
        introCloseTimeoutRef.current = null;
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
    if (introOpenTimeoutRef.current) {
      clearTimeout(introOpenTimeoutRef.current);
      introOpenTimeoutRef.current = null;
    }
    if (introCloseTimeoutRef.current) {
      clearTimeout(introCloseTimeoutRef.current);
      introCloseTimeoutRef.current = null;
    }
    try {
      window.localStorage.setItem(HEADER_INTRO_STORAGE_KEY, "true");
    } catch {
      // Manual navigation remains available when storage is unavailable.
    }
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
      280,
    );
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleFaqActivate(event: MouseEvent<HTMLAnchorElement>) {
    if (!isHomePage) return;

    event.preventDefault();
    const faqElement = document.getElementById("faq");
    if (!faqElement) return;

    if (window.location.hash !== "#faq") {
      window.history.pushState(null, "", faqHref);
    }
    const faqWasOpen =
      faqElement
        .querySelector<HTMLElement>("[aria-controls='faq-answers']")
        ?.getAttribute("aria-expanded") === "true";
    window.dispatchEvent(new Event("eavesence:open-faq"));

    window.setTimeout(
      () => {
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
      },
      faqWasOpen ? 0 : 340,
    );
  }

  function handleLogoClick(event: MouseEvent<HTMLAnchorElement>) {
    const navigationWasOpen = desktopNavigationOpen || menuOpen;

    suppressPointerOpenRef.current = true;
    if (introOpenTimeoutRef.current) {
      clearTimeout(introOpenTimeoutRef.current);
      introOpenTimeoutRef.current = null;
    }
    if (introCloseTimeoutRef.current) {
      clearTimeout(introCloseTimeoutRef.current);
      introCloseTimeoutRef.current = null;
    }
    try {
      window.localStorage.setItem(HEADER_INTRO_STORAGE_KEY, "true");
    } catch {
      // Clicking the logo must not depend on storage access.
    }
    if (logoInteractionTimeoutRef.current) {
      clearTimeout(logoInteractionTimeoutRef.current);
    }
    logoInteractionTimeoutRef.current = setTimeout(() => {
      suppressPointerOpenRef.current = false;
      logoInteractionTimeoutRef.current = null;
    }, 1450);
    closeMenu();
    setDesktopNavigationOpen(false);
    setPreviewNavigation(null);
    if (closeNavigationTimeoutRef.current) {
      clearTimeout(closeNavigationTimeoutRef.current);
      closeNavigationTimeoutRef.current = null;
    }
    if (pathname !== homeHref) return;

    event.preventDefault();
    if (navigationWasOpen) return;

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
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-green-200 hover:bg-green-50 hover:text-[var(--brand-green-dark)] lg:hidden"
            aria-label={menuOpen ? text.closeNavigation : text.openNavigation}
            aria-expanded={menuOpen}
          >
            <span className="text-xl leading-none">{menuOpen ? "×" : "☰"}</span>
          </button>

          <Link
            href={homeHref}
            onClick={handleLogoClick}
            className="absolute left-1/2 top-1/2 flex h-[68px] -translate-x-1/2 -translate-y-1/2 items-center lg:hidden"
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
            className="absolute left-1/2 top-1/2 hidden h-[68px] w-[760px] -translate-x-1/2 -translate-y-1/2 lg:block"
          >
            <Link
              href={homeHref}
              onClick={handleLogoClick}
              onMouseEnter={openDesktopNavigationFromPointer}
              onFocus={openDesktopNavigation}
              aria-expanded={desktopNavigationOpen}
              style={{
                transform: desktopNavigationOpen
                  ? "translate3d(0, -50%, 0)"
                  : "translate3d(285px, -50%, 0)",
                width: desktopNavigationOpen ? "2rem" : "205px",
              }}
              className={`absolute left-0 top-1/2 z-20 flex h-full items-center gap-2.5 overflow-visible transition-[transform,width] duration-[1000ms] ease-[cubic-bezier(.4,0,.2,1)] will-change-transform motion-reduce:transition-none ${
                desktopNavigationOpen
                  ? "delay-0"
                  : "delay-[250ms]"
              }`}
              aria-label={text.homeLabel}
            >
              <BrandMark className="h-8 w-8 shrink-0" />
              <span
                className={`shrink-0 whitespace-nowrap text-[1.25rem] font-extrabold leading-none tracking-[-0.065em] text-[#10283a] transition-opacity duration-[450ms] ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none ${
                  desktopNavigationOpen
                    ? "opacity-0"
                    : "opacity-100 delay-[650ms]"
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
              className={`absolute inset-y-0 left-10 right-10 flex items-center justify-center gap-5 transition-[opacity,visibility] duration-[450ms] ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none ${
                desktopNavigationOpen
                  ? "visible opacity-100 delay-[650ms]"
                  : "invisible pointer-events-none opacity-0 delay-0"
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
              <NavigationLink
                href={faqHref}
                active={activeNavigation === "faq"}
                navigationKey="faq"
                onPreview={setPreviewNavigation}
                onActivate={handleFaqActivate}
              >
                {text.faq}
              </NavigationLink>
              <span
                ref={activeIndicatorRef}
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[18px] left-0 h-[2px] rounded-full bg-[var(--brand-green-mint)] opacity-0 transition-[width,transform,opacity] duration-[360ms] ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none"
              />
            </nav>
          </div>

          <Link
            href={languageHref}
            scroll={false}
            onClick={closeMenu}
            className="group flex h-11 items-center gap-1.5 rounded-lg px-2 text-[10px] font-bold uppercase tracking-[0.04em] transition hover:bg-[#eaf8ef] active:scale-[0.98] lg:h-8"
            aria-label={
              locale === "de" ? "Switch to English" : "Zur deutschen Version wechseln"
            }
          >
            <span className={locale === "de" ? "text-[var(--brand-green)]" : "text-[#8a9591] group-hover:text-[#52605b]"}>
              DE
            </span>
            <span aria-hidden="true" className="font-medium text-[#bdc5c1]">/</span>
            <span className={locale === "en" ? "text-[var(--brand-green)]" : "text-[#8a9591] group-hover:text-[#52605b]"}>
              EN
            </span>
          </Link>
        </div>

        {menuOpen && (
          <nav className="absolute inset-x-0 top-full border-y border-slate-200 bg-white/98 px-5 py-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:px-6 lg:hidden">
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
                  onClick={(event) => {
                    closeMenu();
                    if (href === faqHref) {
                      handleFaqActivate(event);
                    }
                  }}
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
