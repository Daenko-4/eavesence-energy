"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCalculatorHref, getHouseholdHref, type Locale } from "@/i18n/config";
import { HOUSEHOLD_PROFILE_STORAGE_KEY, readHouseholdProfile } from "@/lib/household";

export default function WelcomePage({ locale }: { locale: Locale }) {
  const router = useRouter();
  const de = locale === "de";
  const home = getHouseholdHref(locale);
  const calculator = getCalculatorHref(locale);
  useEffect(() => {
    function enter() {
      // Keep old calculator/FAQ bookmarks useful, even for returning users.
      const hash = window.location.hash;
      if (["#rechner", "#faq", "#so-funktionierts"].includes(hash)) {
        router.replace(`${calculator}${hash}`);
        return;
      }
      try {
        if (readHouseholdProfile(window.localStorage.getItem(HOUSEHOLD_PROFILE_STORAGE_KEY))) router.replace(home);
      } catch { /* The public welcome remains usable when storage is unavailable. */ }
    }
    enter();
    window.addEventListener("hashchange", enter);
    return () => window.removeEventListener("hashchange", enter);
  }, [router, home, calculator]);
  return <div lang={locale} className="min-h-screen bg-[var(--background)] text-[#17211f]">
    <Header locale={locale} />
    <main className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 sm:px-6 sm:py-16 lg:min-h-[calc(100vh-230px)] lg:grid-cols-2 lg:gap-16">
      <section aria-labelledby="welcome-title">
        <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[var(--brand-green)]">EAVESENCE</p>
        <h1 id="welcome-title" className="mt-3 text-balance text-[clamp(2rem,4.2vw,3.4rem)] font-extrabold leading-[1.08] tracking-[-.045em]">{de ? "Damit aus Überblick ein Plan wird." : "Turn clarity into a plan."}</h1>
        <p className="mt-5 max-w-lg text-[15px] leading-6 text-[#52605b]">{de ? "Einkommen, laufende Kosten und nächste Zahlungen an einem Ort. Starte mit deinem Einkommen und den ersten Kosten. Deinen Überblick kannst du Schritt für Schritt ergänzen." : "Income, recurring costs and upcoming payments in one place. Start with your income and first costs, then build your overview step by step."}</p>
        <Link href={home} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-[#b9e8ce] bg-[#ddf8e9] px-6 py-3 text-[14px] font-bold text-[#087a45] transition hover:bg-[#c9f2da] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#087a45]">{de ? "Meinen Überblick starten" : "Start my overview"}</Link>
        <p className="mt-3 text-[11px] text-[#65716d]">{de ? "Kostenlos starten · ohne Konto · lokal gespeichert" : "Start for free · no account · stored locally"}</p>
        <Link href={`${calculator}#rechner`} className="mt-6 inline-flex min-h-11 items-center text-[12px] font-semibold text-[#52605b] underline decoration-[#b9c8bf] underline-offset-4">{de ? "Zum kostenlosen Stromrechner" : "Open the free electricity calculator"}</Link>
      </section>
      <Link href={home} aria-label={de ? "Beispiel einer Monatsübersicht — My Home öffnen" : "Example monthly overview — open My Home"} className="block rounded-[1.45rem] border border-[#32363b] bg-[#24272c] p-5 text-white shadow-[0_20px_60px_-40px_#17211f] transition hover:border-[#72dca3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#72dca3] sm:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#72dca3]">{de ? "DEIN MONAT · BEISPIEL" : "YOUR MONTH · EXAMPLE"}</p>
        <h2 className="mt-3 text-xl font-extrabold">{de ? "Mein Zuhause" : "My home"}</h2>
        <dl className="mt-6 space-y-4 text-[13px] text-[#d1d7d4]">
          <div className="flex justify-between gap-3"><dt>{de ? "Nettoeinkommen" : "Net income"}</dt><dd className="font-bold text-white">{de ? "2.400 €" : "€2,400"}</dd></div>
          <div className="flex justify-between gap-3"><dt>{de ? "Feste Kosten pro Monat" : "Fixed costs per month"}</dt><dd className="font-bold text-white">{de ? "860 €" : "€860"}</dd></div>
        </dl>
        <div className="mt-5 border-t border-white/15 pt-5"><p className="text-[12px] text-[#d1d7d4]">{de ? "Rest nach Fixkosten" : "Left after fixed costs"}</p><p className="mt-1 text-[28px] font-extrabold text-[#72dca3]">{de ? "1.540 €" : "€1,540"}</p></div>
        <p className="mt-3 text-[11px] leading-5 text-[#d1d7d4]">{de ? "Beispiel mit Monatsdurchschnitten. Lebensmittel, Freizeit und andere Alltagsausgaben gehen davon noch ab." : "Example using monthly averages. Groceries, leisure and other everyday spending still come out of this amount."}</p>
        <span className="mt-5 inline-flex items-center text-[12px] font-bold text-[#72dca3]">{de ? "Deinen eigenen Überblick erstellen" : "Create your own overview"} →</span>
      </Link>
    </main>
    <Footer locale={locale} />
  </div>;
}
