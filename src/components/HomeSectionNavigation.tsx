"use client";

import { memoGroups, readMemos } from "@eavesence/core/memos";
import { localToday } from "@eavesence/core/homeValue";
import type { Locale } from "@/i18n/config";

export type HomeSection = "budget" | "upcoming" | "extras" | "costs" | "notes";

type Props = {
  locale: Locale;
  active: HomeSection | null;
  onChange: (section: HomeSection | null) => void;
  hasExtras: boolean;
  memos?: unknown;
};

export default function HomeSectionNavigation({ locale, active, onChange, hasExtras, memos }: Props) {
  const de = locale === "de";
  const due = memoGroups(readMemos(memos), localToday()).due.length;
  const items: { id: HomeSection; label: string; due?: number }[] = [
    { id: "budget", label: de ? "Monatsbudget" : "Monthly budget" },
    { id: "upcoming", label: de ? "Nächster Monat" : "Next month" },
    ...(hasExtras ? [{ id: "extras" as const, label: de ? "Sonderzahlungen" : "Extra income" }] : []),
    { id: "costs", label: de ? "Kosten verwalten" : "Manage costs" },
    { id: "notes", label: de ? "Notizen" : "Notes", due },
  ];

  return <nav aria-label={de ? "Dein Zuhause im Detail" : "Your home in detail"} className="home-section-navigation" data-home-section-navigation>
    {items.map(item => <button key={item.id} id={`home-section-${item.id}`} type="button" aria-expanded={active === item.id} aria-controls={`home-detail-${item.id}`} data-home-section={item.id} onClick={() => onChange(active === item.id ? null : item.id)}>
      <span>{item.label}{!!item.due && <span className="home-section-due" aria-label={de ? `${item.due} fällige Notizen` : `${item.due} notes due`}>{item.due}</span>}</span>
      <span aria-hidden="true" className="site-disclosure-icon">+</span>
    </button>)}
  </nav>;
}
