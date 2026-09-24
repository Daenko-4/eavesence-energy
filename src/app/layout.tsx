import type { Metadata, Viewport } from "next";

import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import BrandStructuredData from "@/components/BrandStructuredData";
import PwaLifecycle from "@/components/PwaLifecycle";

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

  applicationName: "EAVESENCE Energy",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EAVESENCE",
  },
  formatDetection: {
    telephone: false,
  },

  title: {
    default: "EAVESENCE – Mein Zuhause und meine Kosten im Blick",
    template: "%s | EAVESENCE Energy",
  },

  description:
    "Behalte Einkommen, laufende Haushaltskosten und anstehende Zahlungen im Blick. Mit kostenlosem Stromkosten-Rechner für deine Geräte.",

  keywords: [
    "Haushaltsbuch",
    "Haushaltskosten",
    "Monatsbudget",
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

    title: "EAVESENCE – Mein Zuhause und meine Kosten im Blick",

    description:
      "Einkommen, laufende Kosten und anstehende Zahlungen an einem Ort. Stromkosten für Geräte einfach berechnen.",

    images: [
      {
        url: "/brand/eavesence-og-approved-final.png",
        width: 1200,
        height: 630,
        alt: "EAVESENCE – Mein Zuhause und meine Kosten im Blick",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "EAVESENCE – Mein Zuhause und meine Kosten im Blick",

    description:
      "Ein klarer Blick auf Einkommen, laufende Kosten und anstehende Zahlungen.",

    images: ["/brand/eavesence-og-approved-final.png"],
  },

  icons: {
    icon: [
      {
        url: "/icon.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: "/icon.png",
    apple: [
      {
        url: "/brand/eavesence-icon-approved-final-192.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#087a45",
  colorScheme: "light",
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
        <BrandStructuredData />
        {children}
        <PwaLifecycle />
        <Analytics />
      </body>
    </html>
  );
}
