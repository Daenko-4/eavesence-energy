"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import BrandLogo from "@/components/BrandLogo";

const subscribe=()=>()=>{};
function language() {
  const path=window.location.pathname;
  if (/^\/(de(?:\/|$)|geraete(?:\/|$)|datenschutz$|impressum$)/.test(path)) return "de";
  if(path !== "/offline") return "en";
  return navigator.language.startsWith("de") ? "de" : "en";
}

export default function OfflinePage() {
  const locale=useSyncExternalStore(subscribe,language,()=>"en");
  const de=locale === "de";
  return <main lang={locale} className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-12 text-[#17211f]">
    <section className="w-full max-w-lg rounded-[1.5rem] border border-[#dde2d8] bg-[#fbfcf8] p-6 sm:p-8">
      <BrandLogo markClassName="h-8 w-8" wordmarkClassName="text-[1.15rem]" />
      <p className="mt-8 text-[12px] font-bold uppercase tracking-[.12em] text-[var(--brand-green)]">Offline</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">{de ? "Keine Verbindung" : "No connection"}</h1>
      <p className="mt-4 text-[14px] leading-6 text-[#65716d]">{de ? "Diese Seite konnte nicht geladen werden. Bereits geöffnete Seiten und deine lokal gespeicherten Daten bleiben auf diesem Gerät." : "This page could not be loaded. Previously opened pages and your locally saved data remain on this device."}</p>
      <Link href={de ? "/de/zuhause" : "/home"} className="home-primary-action mt-6 inline-flex min-h-11 items-center justify-center rounded-full px-4">{de ? "Erneut versuchen" : "Try again"}</Link>
    </section>
  </main>;
}
