import type { Metadata } from "next";

import WelcomePage from "@/components/WelcomePage";
import WebApplicationStructuredData from "@/components/WebApplicationStructuredData";

export const metadata: Metadata = {
  title: {
    absolute:
      "EAVESENCE – Turn clarity into a plan.",
  },

  description:
    "Keep your income, recurring household costs and upcoming payments in view. Use the free electricity calculator for your devices.",

  alternates: {
    canonical: "/",
    languages: {
      de: "/de",
      en: "/",
      "x-default": "/",
    },
  },

  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: "EAVESENCE",
    title:
      "EAVESENCE – Turn clarity into a plan.",
    description:
      "See your income, recurring household costs and upcoming payments in one place. Calculate electricity costs for your devices.",
    images: [
      {
        url: "/brand/eavesence-og-approved-final.png",
        width: 1200,
        height: 630,
        alt: "EAVESENCE",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "EAVESENCE – Turn clarity into a plan.",
    description:
      "See what your home costs and calculate electricity costs for your devices.",
    images: ["/brand/eavesence-og-approved-final.png"],
  },
};

export default function Page() {
  return (
    <>
      <WebApplicationStructuredData locale="en" />
      <WelcomePage locale="en" />
    </>
  );
}
