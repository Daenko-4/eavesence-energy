"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getDevicesHref, getHomeHref, type Locale } from "@/i18n/config";

const content = {
  de: {
    eyebrow: "Seite nicht gefunden",
    title: "Hier ist leider nichts.",
    text: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    home: "Zur Startseite",
    devices: "Geräte ansehen",
  },
  en: {
    eyebrow: "Page not found",
    title: "There is nothing here.",
    text: "The page you are looking for does not exist or has been moved.",
    home: "Go to the home page",
    devices: "Browse devices",
  },
} as const;

function getLocale(pathname: string): Locale {
  const germanPath =
    pathname === "/de" ||
    pathname.startsWith("/de/") ||
    pathname === "/geraete" ||
    pathname.startsWith("/geraete/") ||
    pathname === "/datenschutz" ||
    pathname === "/impressum";

  return germanPath ? "de" : "en";
}

export default function NotFound() {
  const pathname = usePathname();
  const locale = getLocale(pathname);
  const text = content[locale];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--brand-off-white)] text-[#17211f]">
      <Header locale={locale} />

      <main className="flex flex-1 items-center px-5 py-16 sm:px-6">
        <div className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-[#dfe5dd] bg-white px-6 py-12 text-center shadow-[0_24px_70px_-50px_rgba(18,35,30,0.45)] sm:px-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-green)]">
            404 · {text.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.045em] text-[#17211f] sm:text-5xl">
            {text.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
            {text.text}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={getHomeHref(locale)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand-green)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--brand-green-dark)]"
            >
              {text.home}
            </Link>
            <Link
              href={getDevicesHref(locale)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-[var(--brand-green)] transition hover:border-green-300 hover:bg-green-50"
            >
              {text.devices}
            </Link>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
