import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
export const metadata: Metadata = {
  title: "Stromkosten-Rechner",
  description: "Berechne kostenlos die Stromkosten deiner Geräte und übernimm sie bei Bedarf in My Home.",
  alternates: { canonical: "/de/rechner", languages: { de: "/de/rechner", en: "/calculator", "x-default": "/calculator" } },
};
export default function CalculatorPage() { return <HomePage locale="de" />; }
