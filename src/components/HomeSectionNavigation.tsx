"use client";

import type {ReactNode} from "react";
import { memoGroups, readMemos } from "@eavesence/core/memos";
import { localToday } from "@eavesence/core/homeValue";
import type { Locale } from "@/i18n/config";

export type HomeSection = "budget" | "upcoming" | "costs" | "notes";

type Props = {
  locale: Locale;
  active: HomeSection | null;
  onChange: (section: HomeSection | null) => void;
  memos?: unknown;
  addCost?:ReactNode; additionalIncome?:ReactNode;
};

export default function HomeSectionNavigation({ locale, active, onChange, memos,addCost,additionalIncome }: Props) {
  const de = locale === "de";
  const due = memoGroups(readMemos(memos), localToday()).due.length;
  const items: { id: HomeSection; label: string; due?: number }[] = [
    { id: "costs", label: de ? "Kosten verwalten" : "Manage costs" },
    { id: "notes", label: de ? "Notizen" : "Notes", due },
  ];

  function action(item:typeof items[number]) { return <button key={item.id} id={`home-section-${item.id}`} type="button" aria-expanded={active === item.id} aria-controls={`home-detail-${item.id}`} data-home-section={item.id} onClick={() => onChange(active === item.id ? null : item.id)}>
    <span>{item.label}{!!item.due && <span className="home-section-due" aria-label={de ? `${item.due} fällige Notizen` : `${item.due} notes due`}>{item.due}</span>}</span>
  </button>; }
  return <nav role={addCost?'group':undefined} aria-label={addCost ? de ? 'Aktionen für dein Zuhause' : 'Home actions' : de ? 'Dein Zuhause im Detail' : 'Your home in detail'} className={`home-section-navigation home-secondary-actions ${addCost?'home-entry-actions home-actions-toolbar':''}`} data-home-section-navigation>
    {addCost}{action(items[0])}{additionalIncome}{action(items[1])}
  </nav>;
}
