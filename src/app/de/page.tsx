import type { Metadata } from "next";

import HomePage from "@/components/HomePage";

export const metadata: Metadata = {
  title: {
    absolute: "EAVESENCE Energy – Stromkosten einfach verstehen",
  },
  description:
    "Berechne kostenlos die Stromkosten deiner Haushaltsgeräte und finde heraus, was dein Stromverbrauch wirklich kostet – einfach, schnell und ohne Anmeldung.",
  alternates: {
    canonical: "/de",
    languages: {
      de: "/de",
      en: "/",
      "x-default": "/",
    },
  },
};

export default function GermanPage() {
  return <HomePage locale="de" />;
}
