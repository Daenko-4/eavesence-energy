import type { Metadata } from "next";

import HomePage from "@/components/HomePage";
import WebApplicationStructuredData from "@/components/WebApplicationStructuredData";

export const metadata: Metadata = {
  title: {
    absolute:
      "EAVESENCE Energy – Calculate electricity costs easily",
  },

  description:
    "Calculate the electricity costs of household devices for free. See costs per use, week, month and year – simple and without signing up.",

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
      "EAVESENCE Energy – Calculate electricity costs easily",
    description:
      "Calculate the electricity costs of everyday household devices – per use, week, month and year.",
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
      "EAVESENCE Energy – Calculate electricity costs easily",
    description:
      "Calculate the electricity costs of household devices for free.",
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
