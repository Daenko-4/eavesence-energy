import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTopOnMount from "@/components/ScrollToTopOnMount";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum von EAVESENCE Energy.",
  alternates: {
    canonical: "/impressum",
    languages: {
      de: "/impressum",
      en: "/en/imprint",
      "x-default": "/impressum",
    },
  },
};

export default function ImpressumPage() {
  return (
    <div
      lang="de"
      className="min-h-screen bg-[var(--brand-off-white)] text-[#17211f]"
    >
      <ScrollToTopOnMount />
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-12">
        <Link
          href="/de"
          scroll
          className="inline-flex text-sm font-semibold text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]"
        >
          ← Zur EAVESENCE Startseite
        </Link>

        <div className="mt-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-green)]">
              Rechtliches
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-[#17211f]">
              Impressum
            </h1>

            <p className="mt-5 leading-7 text-slate-600">
              EAVESENCE Energy ist derzeit ein privates, nicht
              kommerzielles Projekt.
            </p>

            <div className="mt-10 space-y-8">
              <section>
                <h2 className="text-xl font-bold text-slate-950">
                  Medieninhaber
                </h2>

                <div className="mt-3 space-y-1 leading-7 text-slate-600">
                  <p>EAVESENCE Energy</p>
                  <p>Österreich</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">
                  Kontakt
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  E-Mail:{" "}
                  <a
                    href="mailto:parkwaydrive@gmx.at"
                    className="font-medium text-[var(--brand-green)] hover:text-[var(--brand-green-dark)]"
                  >
                    parkwaydrive@gmx.at
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">
                  Grundlegende Richtung
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  EAVESENCE Energy stellt einfache Informationen und
                  Werkzeuge rund um Stromverbrauch und Stromkosten von
                  Haushaltsgeräten bereit.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">
                  Hinweis
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  Die auf EAVESENCE Energy bereitgestellten Berechnungen
                  und Informationen dienen der Orientierung. Tatsächliche
                  Verbrauchswerte und Stromkosten können je nach Gerät,
                  Nutzung und Stromtarif abweichen.
                </p>
              </section>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200/80 pt-6">
          <Link
            href="/de"
            scroll
            className="inline-flex text-sm font-semibold text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]"
          >
            ← Zur EAVESENCE Startseite
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
