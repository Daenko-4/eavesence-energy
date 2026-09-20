import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTopOnMount from "@/components/ScrollToTopOnMount";

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
    <div
      lang="en"
      className="min-h-screen bg-[var(--brand-off-white)] text-[#17211f]"
    >
      <ScrollToTopOnMount />
      <Header locale="en" />

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-12">
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-green)]">
            Legal
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-[#17211f]">
            Privacy
          </h1>

          <p className="mt-5 leading-7 text-slate-600">
            Information about the processing of personal data when using
            EAVESENCE Energy.
          </p>
        </div>

        <div className="mt-10 space-y-8 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Controller
            </h2>

            <div className="mt-3 space-y-1 leading-7">
              <p>EAVESENCE Energy</p>
              <p>Austria</p>

              <p>
                Email:{" "}
                <a
                  href="mailto:feedback@eavesence.com"
                  className="font-medium text-[var(--brand-green)] hover:text-[var(--brand-green-dark)]"
                >
                  feedback@eavesence.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Use of the electricity cost calculator
            </h2>

            <p className="mt-3 leading-7">
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
            <h2 className="text-xl font-bold text-slate-950">
              Provision of the website
            </h2>

            <p className="mt-3 leading-7">
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
            <h2 className="text-xl font-bold text-slate-950">
              Local browser storage
            </h2>

            <p className="mt-3 leading-7">
              When you use “My devices” or “My home”, your saved calculations,
              rooms, savings goals and optional monthly entries are stored
              exclusively in your browser&apos;s local storage. Your selected
              currency, recently used devices and voluntary beta interest may
              also be stored there. This locally saved household and
              calculation data is not sent to EAVESENCE Energy.
            </p>

            <p className="mt-3 leading-7">
              You can delete local devices from the home page at any time or
              export them as a backup file. Clearing your browser data may also
              remove locally saved information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Hosting
            </h2>

            <p className="mt-3 leading-7">
              EAVESENCE Energy is currently hosted via Vercel. As part of the
              technical provision of the website, connection and access data
              may be processed by the hosting provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Cookies and analytics
            </h2>

            <p className="mt-3 leading-7">
              EAVESENCE Energy uses Vercel Web Analytics to understand which
              pages and product functions are used. According to Vercel, this
              service works without cookies and records usage in anonymised
              form.
            </p>

            <p className="mt-3 leading-7">
              We record a small number of interactions, such as selecting a
              device category, switching calculation mode, saving a device,
              completing Home onboarding, reaching activation milestones or
              expressing voluntary beta interest. Device names you
              create, calculation values, email addresses and other free-text
              entries are not sent as analytics events. The information is used
              solely to improve EAVESENCE and assess interest in future product
              features. No marketing tracking is used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Contact
            </h2>

            <p className="mt-3 leading-7">
              If you contact us by email, the information you provide will be
              processed to the extent necessary to handle your enquiry.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Your rights
            </h2>

            <p className="mt-3 leading-7">
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
            <h2 className="text-xl font-bold text-slate-950">
              Last updated
            </h2>

            <p className="mt-3 leading-7">
              September 2026
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-slate-200/80 pt-6">
          <Link
            href="/"
            scroll
            className="eavesence-pill-link"
          >
            Back to the EAVESENCE home page
          </Link>
        </div>
      </main>

      <Footer locale="en" />
    </div>
  );
}
