import type { Metadata } from "next";

import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Imprint",
  description: "Imprint of EAVESENCE Energy.",
  alternates: {
    canonical: "/en/imprint",
    languages: {
      de: "/impressum",
      en: "/en/imprint",
      "x-default": "/impressum",
    },
  },
};

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-[#f8faf8] text-slate-950">
      <Header locale="en" />

      <main className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.2)] sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
              Legal
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Imprint
            </h1>

            <p className="mt-5 leading-7 text-slate-600">
              EAVESENCE Energy is currently a private, non-commercial project.
            </p>

            <div className="mt-10 space-y-8">
              <section>
                <h2 className="text-xl font-bold text-slate-950">
                  Media owner
                </h2>

                <div className="mt-3 space-y-1 leading-7 text-slate-600">
                  <p>Dan Florian</p>
                  <p>Möllersdorf</p>
                  <p>Austria</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">
                  Contact
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  Email:{" "}
                  <a
                    href="mailto:parkwaydrive@gmx.at"
                    className="font-medium text-green-700 hover:text-green-800"
                  >
                    parkwaydrive@gmx.at
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">
                  Basic direction
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  EAVESENCE Energy provides simple information and tools related
                  to the electricity consumption and electricity costs of
                  household devices.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-950">
                  Notice
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  The calculations and information provided by EAVESENCE Energy
                  are intended as a guide. Actual electricity consumption and
                  costs may vary depending on the device, usage and electricity
                  tariff.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer locale="en" />
    </div>
  );
}