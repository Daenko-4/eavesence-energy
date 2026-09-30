"use client";

import { useEffect, useState } from "react";

import type { Locale } from "@/i18n/config";

const copy = {
  de: { navigation: "App-Navigation", overview: "Übersicht", costs: "Kosten", addDevice: "Neu", energy: "Energie", settings: "Einstellungen" },
  en: { navigation: "App navigation", overview: "Overview", costs: "Costs", addDevice: "Add", energy: "Energy", settings: "Settings" },
} as const;

function OverviewIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 9.2 10 3.8l6.5 5.4v6.5a.8.8 0 0 1-.8.8H4.3a.8.8 0 0 1-.8-.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M7.8 16.5v-4.8h4.4v4.8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}

function CostsIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 6.5h13v8.2a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M5.3 3.5h8.6a1.8 1.8 0 0 1 1.8 1.8v1.2H3.5V5.3a1.8 1.8 0 0 1 1.8-1.8ZM12.8 11.5h3.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

function PlanIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 3.5h12v13H4zM7 7h6M7 10h6M7 13h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

const itemClass = "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-semibold leading-4 text-[#65716d] transition active:scale-[0.97] active:bg-[#eefbf3] active:text-[var(--brand-green)]";
const activeItemClass = "bg-[#eefbf3] text-[var(--brand-green)]";

type AppDestination = "overview" | "costs" | "plan" | "settings";

export default function PwaMobileNavigation({ locale, settingsOpen, }: { locale: Locale; settingsOpen: boolean; }) {
  const text = copy[locale];
  const [activeDestination, setActiveDestination] = useState<AppDestination>("overview");

  useEffect(() => {
    let frame = 0;
    if (settingsOpen) {
      frame = window.requestAnimationFrame(() => setActiveDestination("settings"));
      return () => window.cancelAnimationFrame(frame);
    }

    const updateActiveDestination = () => {
      frame = 0;
      const activationPoint = window.scrollY + 150;
      const sections: Array<{ id: string; destination: AppDestination }> = [
        { id: "home-overview", destination: "overview" },
        { id: "household-costs", destination: "costs" },
        { id: "savings-plan", destination: "plan" },
      ];
      let nextDestination: AppDestination = "overview";

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (!element) continue;
        const top = element.getBoundingClientRect().top + window.scrollY;
        if (top <= activationPoint) nextDestination = section.destination;
      }
      setActiveDestination(nextDestination);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveDestination);
    };

    updateActiveDestination();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("hashchange", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
    };
  }, [settingsOpen]);

  const destinationClass = (destination: AppDestination) =>
    `${itemClass} ${activeDestination === destination ? activeItemClass : ""}`;

  return (
    <nav aria-label={text.navigation} data-pwa-mobile-nav className="pwa-mobile-navigation">
      <a href="#home-overview" onClick={() => setActiveDestination("overview")} aria-current={activeDestination === "overview" ? "location" : undefined} className={destinationClass("overview")}><span className="h-[18px] w-[18px]"><OverviewIcon /></span><span className="truncate">{text.overview}</span></a>
      <a href="#household-costs" onClick={() => setActiveDestination("costs")} aria-current={activeDestination === "costs" ? "location" : undefined} className={destinationClass("costs")}><span className="h-[18px] w-[18px]"><CostsIcon /></span><span className="truncate">{text.costs}</span></a>
      <a href="#savings-plan" onClick={() => setActiveDestination("plan")} aria-current={activeDestination === "plan" ? "location" : undefined} className={destinationClass("plan")}><span className="h-[18px] w-[18px]"><PlanIcon /></span><span className="truncate">{locale === "de" ? "Plan" : "Plan"}</span></a>
    </nav>
  );
}
