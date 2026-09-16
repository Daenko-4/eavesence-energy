import type { Metadata } from "next";

import HouseholdDashboard from "@/components/HouseholdDashboard";

export const metadata: Metadata = {
  title: "EAVESENCE Home – Your household energy overview",
  description:
    "Bring your saved devices, monthly energy costs and savings goals together in one private household dashboard.",
  alternates: {
    canonical: "/home",
    languages: { de: "/de/zuhause", en: "/home", "x-default": "/home" },
  },
};

export default function HouseholdPage() {
  return <HouseholdDashboard locale="en" />;
}
