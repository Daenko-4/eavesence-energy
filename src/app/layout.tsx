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

const siteUrl = "https://tinytools-energy.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "TinyTools Energy – Stromkosten einfach verstehen",
    template: "%s | TinyTools Energy",
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
    siteName: "TinyTools Energy",

    title: "TinyTools Energy – Stromkosten einfach verstehen",

    description:
      "Berechne kostenlos die Stromkosten deiner Haushaltsgeräte – pro Nutzung, Woche, Monat und Jahr.",

    images: [
      {
        url: "/brand/tinytools-og-v2.png",
        width: 1200,
        height: 630,
        alt: "TinyTools Energy – Stromkosten einfach verstehen",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "TinyTools Energy – Stromkosten einfach verstehen",

    description:
      "Berechne kostenlos die Stromkosten deiner Haushaltsgeräte – einfach und ohne Anmeldung.",

    images: ["/brand/tinytools-og-v2.png"],
  },

  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}