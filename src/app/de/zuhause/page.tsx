import type { Metadata } from "next";

import HouseholdDashboard from "@/components/HouseholdDashboard";

export const metadata: Metadata = {
  title: "EAVESENCE Home – Deine Energieübersicht",
  description:
    "Führe gespeicherte Geräte, monatliche Energiekosten und Sparziele in einer privaten Haushaltsübersicht zusammen.",
  alternates: {
    canonical: "/de/zuhause",
    languages: { de: "/de/zuhause", en: "/home", "x-default": "/home" },
  },
};

export default function GermanHouseholdPage() {
  return <HouseholdDashboard locale="de" />;
}
