import type { Metadata } from "next";

import HouseholdDashboard from "@/components/HouseholdDashboard";

export const metadata: Metadata = {
  title: "My Home – Deine Kosten und Monatsübersicht",
  description:
    "Behalte Einkommen, laufende Kosten und nächste Zahlungen im Blick. Plane mit EAVESENCE realistische Veränderungen.",
  alternates: {
    canonical: "/de/zuhause",
    languages: { de: "/de/zuhause", en: "/home", "x-default": "/home" },
  },
};

export default function GermanHouseholdPage() {
  return <HouseholdDashboard locale="de" />;
}
