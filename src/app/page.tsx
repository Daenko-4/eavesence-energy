import type { Metadata } from "next";

import HomePage from "@/components/HomePage";
import WebApplicationStructuredData from "@/components/WebApplicationStructuredData";

export const metadata: Metadata = {
  title: {
    absolute:
      "EAVESENCE – A clearer view of what your home costs",
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
    siteName: "EAVESENCE Energy",
    title:
      "EAVESENCE – A clearer view of what your home costs",
    description:
      "See your income, recurring household costs and upcoming payments in one place. Calculate electricity costs for your devices.",
    images: [
      {
        url: "/brand/eavesence-og-approved-final.png",
        width: 1200,
        height: 630,
        alt: "EAVESENCE Energy",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "EAVESENCE – A clearer view of what your home costs",
    description:
      "See what your home costs and calculate electricity costs for your devices.",
    images: ["/brand/eavesence-og-approved-final.png"],
  },
};

export default function Page() {
  return (
    <>
      <WebApplicationStructuredData locale="en" />
      <HomePage locale="en" />
    </>
  );
}
