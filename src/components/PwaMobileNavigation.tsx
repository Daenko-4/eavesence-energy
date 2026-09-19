"use client";

import Link from "next/link";

import type { Locale } from "@/i18n/config";

const copy = {
  de: { navigation: "App-Navigation", overview: "Übersicht", addDevice: "Gerät", checkIn: "Monatswert", settings: "Einstellungen" },
  en: { navigation: "App navigation", overview: "Overview", addDevice: "Device", checkIn: "Monthly value", settings: "Settings" },
} as const;

function OverviewIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 9.2 10 3.8l6.5 5.4v6.5a.8.8 0 0 1-.8.8H4.3a.8.8 0 0 1-.8-.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M7.8 16.5v-4.8h4.4v4.8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}

function DeviceIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="4" y="3" width="12" height="14" rx="2.2" stroke="currentColor" strokeWidth="1.6" /><path d="M7 7.2h6M10 12v3M8.5 13.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

function CheckInIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M6.5 2.8v3.4M13.5 2.8v3.4M3 8h14M6.2 11.2h2.2M11.6 11.2h2.2M6.2 14h2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

function SettingsIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 5h13M6.5 10h10M3.5 15h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="5" cy="10" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.4" /><circle cx="13" cy="5" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.4" /><circle cx="10" cy="15" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.4" /></svg>;
}

const itemClass = "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-semibold leading-4 text-[#65716d] transition active:scale-[0.97] active:bg-[#eefbf3] active:text-[var(--brand-green)]";

export default function PwaMobileNavigation({ locale, calculatorHref, onOpenSettings }: { locale: Locale; calculatorHref: string; onOpenSettings: () => void }) {
  const text = copy[locale];

  return (
    <nav aria-label={text.navigation} data-pwa-mobile-nav className="pwa-mobile-navigation">
      <a href="#home-overview" className={itemClass}><span className="h-[18px] w-[18px]"><OverviewIcon /></span><span className="truncate">{text.overview}</span></a>
      <Link href={calculatorHref} className={itemClass}><span className="h-[18px] w-[18px]"><DeviceIcon /></span><span className="truncate">{text.addDevice}</span></Link>
      <a href="#monthly-check-in" className={itemClass}><span className="h-[18px] w-[18px]"><CheckInIcon /></span><span className="truncate">{text.checkIn}</span></a>
      <button type="button" onClick={onOpenSettings} className={itemClass}><span className="h-[18px] w-[18px]"><SettingsIcon /></span><span className="truncate">{text.settings}</span></button>
    </nav>
  );
}
