import Link from "next/link";

import BrandLogo from "@/components/BrandLogo";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-12 text-[#17211f]">
      <section className="w-full max-w-lg rounded-[1.5rem] border border-[#dde2d8] bg-[#fbfcf8] p-6 shadow-[0_24px_60px_-42px_rgba(35,48,44,0.5)] sm:p-8">
        <BrandLogo markClassName="h-8 w-8" wordmarkClassName="text-[1.15rem]" />
        <p className="mt-8 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-green)]">
          Offline
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">
          Keine Verbindung
        </h1>
        <p className="mt-4 text-[13px] leading-6 text-[#65716d]">
          EAVESENCE konnte diese Seite gerade nicht laden. Bereits geöffnete
          Seiten und deine lokal gespeicherten Daten bleiben auf diesem Gerät.
        </p>
        <p className="mt-3 text-[13px] leading-6 text-[#65716d]">
          EAVESENCE could not load this page. Previously opened pages and your
          locally stored data remain on this device.
        </p>
        <Link
          href="/home"
          className="home-primary-action mt-6 inline-flex min-h-10 items-center justify-center rounded-full border border-[#b8efcc] bg-[#dcfce8] px-4 text-[var(--brand-green)] transition hover:border-[#98e9b7] hover:bg-[#c9f7d9]"
        >
          Erneut versuchen · Try again
        </Link>
      </section>
    </main>
  );
}
