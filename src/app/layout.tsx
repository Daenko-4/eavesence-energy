import type { Metadata, Viewport } from "next";

import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
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

const uiSans = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-ui-sans",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

const siteUrl = "https://eavesence.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  applicationName: "EAVESENCE",
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
    template: "%s | EAVESENCE",
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
    siteName: "EAVESENCE",

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
        url: "/brand/eavesence-mark-96.png",
        type: "image/png",
        sizes: "96x96",
      },
    ],
    shortcut: "/favicon.ico",
    apple: [
      {
        url: "/brand/eavesence-mark-180.png",
        type: "image/png",
        sizes: "180x180",
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
        className={`${uiSans.variable} ${geistSans.variable} ${geistMono.variable}`}
      >
        <BrandStructuredData />
        {children}
        <PwaLifecycle />
        <Analytics />
      </body>
    </html>
  );
}
