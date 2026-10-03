import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
export const metadata: Metadata = {
  title: "Electricity cost calculator",
  description: "Calculate device electricity costs for free and optionally add them to My Home.",
  alternates: { canonical: "/calculator", languages: { de: "/de/rechner", en: "/calculator", "x-default": "/calculator" } },
};
export default function CalculatorPage() { return <HomePage locale="en" />; }
