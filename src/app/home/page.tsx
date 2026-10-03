import type { Metadata } from "next";

import HouseholdDashboard from "@/components/HouseholdDashboard";

export const metadata: Metadata = {
  title: "My Home – Your costs and monthly overview",
  description:
    "Keep your income, recurring costs and next payments in view. Plan realistic changes with EAVESENCE.",
  alternates: {
    canonical: "/home",
    languages: { de: "/de/zuhause", en: "/home", "x-default": "/home" },
  },
};

export default function HouseholdPage() {
  return <HouseholdDashboard locale="en" />;
}
