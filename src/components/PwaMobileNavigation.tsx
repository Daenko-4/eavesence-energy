"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Locale } from "@/i18n/config";

const copy = {
  de: { navigation: "App-Navigation", overview: "Übersicht", devices: "Geräte", addDevice: "Neu", checkIn: "Monat", settings: "Einstellungen" },
  en: { navigation: "App navigation", overview: "Overview", devices: "Devices", addDevice: "Add", checkIn: "Month", settings: "Settings" },
} as const;

function OverviewIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 9.2 10 3.8l6.5 5.4v6.5a.8.8 0 0 1-.8.8H4.3a.8.8 0 0 1-.8-.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M7.8 16.5v-4.8h4.4v4.8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}

function DeviceIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="4" y="3" width="12" height="14" rx="2.2" stroke="currentColor" strokeWidth="1.6" /><path d="M7 7.2h6M10 12v3M8.5 13.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

function AddIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="currentColor" /><path d="M10 6.5v7M6.5 10h7" stroke="white" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

function CheckInIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M6.5 2.8v3.4M13.5 2.8v3.4M3 8h14M6.2 11.2h2.2M11.6 11.2h2.2M6.2 14h2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

function SettingsIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 5h13M6.5 10h10M3.5 15h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="5" cy="10" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.4" /><circle cx="13" cy="5" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.4" /><circle cx="10" cy="15" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.4" /></svg>;
}

const itemClass = "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-semibold leading-4 text-[#65716d] transition active:scale-[0.97] active:bg-[#eefbf3] active:text-[var(--brand-green)]";
const activeItemClass = "bg-[#eefbf3] text-[var(--brand-green)]";

type AppDestination = "overview" | "devices" | "check-in" | "settings";

export default function PwaMobileNavigation({ locale, calculatorHref, settingsOpen, onOpenSettings }: { locale: Locale; calculatorHref: string; settingsOpen: boolean; onOpenSettings: () => void }) {
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
        { id: "home-devices", destination: "devices" },
        { id: "monthly-check-in", destination: "check-in" },
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
      <a href="#home-devices" onClick={() => setActiveDestination("devices")} aria-current={activeDestination === "devices" ? "location" : undefined} className={destinationClass("devices")}><span className="h-[18px] w-[18px]"><DeviceIcon /></span><span className="truncate">{text.devices}</span></a>
      <Link href={calculatorHref} className={`${itemClass} text-[var(--brand-green)]`}><span className="h-5 w-5"><AddIcon /></span><span className="truncate">{text.addDevice}</span></Link>
      <a href="#monthly-check-in" onClick={() => setActiveDestination("check-in")} aria-current={activeDestination === "check-in" ? "location" : undefined} className={destinationClass("check-in")}><span className="h-[18px] w-[18px]"><CheckInIcon /></span><span className="truncate">{text.checkIn}</span></a>
      <button type="button" onClick={onOpenSettings} aria-current={activeDestination === "settings" ? "location" : undefined} className={destinationClass("settings")}><span className="h-[18px] w-[18px]"><SettingsIcon /></span><span className="truncate">{text.settings}</span></button>
    </nav>
  );
}
