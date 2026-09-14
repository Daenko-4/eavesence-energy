import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTopOnMount from "@/components/ScrollToTopOnMount";

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
    <div
      lang="en"
      className="min-h-screen bg-[var(--brand-off-white)] text-[#17211f]"
    >
      <ScrollToTopOnMount />
      <Header locale="en" />

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-12">
        <div className="mt-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-green)]">
              Legal
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-[#17211f]">
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
                  <p>EAVESENCE Energy</p>
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
                    href="mailto:feedback@eavesence.com"
                    className="font-medium text-[var(--brand-green)] hover:text-[var(--brand-green-dark)]"
                  >
                    feedback@eavesence.com
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

        <div className="mt-12 border-t border-slate-200/80 pt-6">
          <Link
            href="/"
            scroll
            className="inline-flex text-sm font-semibold text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]"
          >
            ← Back to the EAVESENCE home page
          </Link>
        </div>
      </main>

      <Footer locale="en" />
    </div>
  );
}
