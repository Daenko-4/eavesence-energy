import type { Metadata } from "next";

import DevicesPage from "@/components/DevicesPage";

export const metadata: Metadata = {
  title: "Stromverbrauch von Haushaltsgeräten",

  description:
    "Entdecke typische Haushaltsgeräte und berechne ihre Stromkosten. Von Küche und Wäschepflege bis Raumklima, Büro und Unterhaltung.",

  alternates: {
    canonical: "/geraete",
    languages: {
      de: "/geraete",
      en: "/en/devices",
      "x-default": "/geraete",
    },
  },
};

export default function DevicesPageRoute() {
  return <DevicesPage locale="de" />;
}
