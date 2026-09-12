import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for EAVESENCE Energy.",
  alternates: {
    canonical: "/en/privacy",
    languages: {
      de: "/datenschutz",
      en: "/en/privacy",
      "x-default": "/datenschutz",
    },
  },
};

export default function PrivacyPage() {
  return (
    <>
      <Header locale="en" />

      <main
        lang="en"
        className="mx-auto max-w-3xl px-5 py-16 sm:px-6"
      >
        <Link
          href="/en"
          className="text-sm font-semibold text-[var(--brand-green)] hover:text-[var(--brand-green-dark)]"
        >
          ← Back to EAVESENCE Energy
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-green)]">
            Legal
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            Privacy
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            Information about the processing of personal data when using
            EAVESENCE Energy.
          </p>
        </div>

        <div className="mt-12 space-y-10 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Controller
            </h2>

            <div className="mt-4 space-y-1 leading-7">
              <p>EAVESENCE Energy</p>
              <p>Austria</p>

              <p>
                Email:{" "}
                <a
                  href="mailto:parkwaydrive@gmx.at"
                  className="font-medium text-[var(--brand-green)] hover:text-[var(--brand-green-dark)]"
                >
                  parkwaydrive@gmx.at
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Use of the electricity cost calculator
            </h2>

            <p className="mt-4 leading-7">
              The values you enter in the electricity cost calculator are used
              to perform the calculation.
            </p>

            <p className="mt-3 leading-7">
              EAVESENCE Energy currently has no user accounts and no database
              of its own for permanently storing the values entered into the
              calculator.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Provision of the website
            </h2>

            <p className="mt-4 leading-7">
              When a website is accessed, technically necessary information is
              transmitted between your browser and the infrastructure used to
              provide the website. This may include, in particular, your IP
              address, the time of access, the requested page and technical
              information about the browser and device used.
            </p>

            <p className="mt-3 leading-7">
              This processing is used for the technical provision, security and
              stability of the website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Hosting
            </h2>

            <p className="mt-4 leading-7">
              EAVESENCE Energy is currently hosted via Vercel. As part of the
              technical provision of the website, connection and access data
              may be processed by the hosting provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Cookies and analytics
            </h2>

            <p className="mt-4 leading-7">
              EAVESENCE Energy currently does not use its own analytics or
              marketing services.
            </p>

            <p className="mt-3 leading-7">
              If EAVESENCE Energy uses analytics, marketing or other additional
              services in the future, this privacy information will be updated
              accordingly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Contact
            </h2>

            <p className="mt-4 leading-7">
              If you contact us by email, the information you provide will be
              processed to the extent necessary to handle your enquiry.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Your rights
            </h2>

            <p className="mt-4 leading-7">
              Where the legal requirements are met, you may in particular have
              rights of access, rectification, erasure, restriction of
              processing and, where applicable, the right to object to
              processing and the right to data portability.
            </p>

            <p className="mt-3 leading-7">
              You also have the right to lodge a complaint with the competent
              data protection supervisory authority.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Last updated
            </h2>

            <p className="mt-4 leading-7">
              September 2026
            </p>
          </section>
        </div>
      </main>

      <Footer locale="en" />
    </>
  );
}
