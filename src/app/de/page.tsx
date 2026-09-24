import type { Metadata } from "next";

import HomePage from "@/components/HomePage";
import WebApplicationStructuredData from "@/components/WebApplicationStructuredData";

export const metadata: Metadata = {
  title: {
    absolute: "EAVESENCE – Ein klarer Blick auf deine Haushaltskosten",
  },
  description:
    "Behalte Einkommen, laufende Haushaltskosten und anstehende Zahlungen im Blick. Mit kostenlosem Stromkosten-Rechner für deine Geräte.",
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
  return (
    <>
      <WebApplicationStructuredData locale="de" />
      <HomePage locale="de" />
    </>
  );
}
