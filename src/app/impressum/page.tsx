import type { Metadata } from "next";

import Footer from "@/components/Footer";
import Header from "@/components/Header";

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
      className="min-h-screen bg-[#f8faf8] text-slate-950"
    >
      <Header />

      <main className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.2)] sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--brand-green)]">
              Rechtliches
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-slate-950 sm:text-5xl">
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
      </main>

      <Footer />
    </div>
  );
}
