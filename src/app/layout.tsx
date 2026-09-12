import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://eavesence.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "EAVESENCE Energy – Stromkosten einfach verstehen",
    template: "%s | EAVESENCE Energy",
  },

  description:
    "Berechne kostenlos die Stromkosten deiner Haushaltsgeräte und finde heraus, was dein Stromverbrauch wirklich kostet – einfach, schnell und ohne Anmeldung.",

  keywords: [
    "Stromkosten Rechner",
    "Stromverbrauch berechnen",
    "Stromkosten Gerät",
    "Stromverbrauch Haushaltsgeräte",
    "Stromkosten pro Jahr",
    "kWh Kosten berechnen",
  ],

  openGraph: {
    type: "website",
    locale: "de_AT",
    url: siteUrl,
    siteName: "EAVESENCE Energy",

    title: "EAVESENCE Energy – Stromkosten einfach verstehen",

    description:
      "Berechne kostenlos die Stromkosten deiner Haushaltsgeräte – pro Nutzung, Woche, Monat und Jahr.",

    images: [
      {
        url: "/brand/eavesence-og-approved-final.png",
        width: 1200,
        height: 630,
        alt: "EAVESENCE Energy – Stromkosten einfach verstehen",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "EAVESENCE Energy – Stromkosten einfach verstehen",

    description:
      "Berechne kostenlos die Stromkosten deiner Haushaltsgeräte – einfach und ohne Anmeldung.",

    images: ["/brand/eavesence-og-approved-final.png"],
  },

  icons: {
    icon: "/brand/eavesence-modular-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
