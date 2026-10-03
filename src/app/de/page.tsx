import type { Metadata } from "next";

import WelcomePage from "@/components/WelcomePage";
import WebApplicationStructuredData from "@/components/WebApplicationStructuredData";

export const metadata: Metadata = {
  title: {
    absolute: "EAVESENCE – Damit aus Überblick ein Plan wird.",
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
      <WelcomePage locale="de" />
    </>
  );
}
