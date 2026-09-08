import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzerklärung von EAVESENCE Energy.",
  alternates: {
    canonical: "/datenschutz",
    languages: {
      de: "/datenschutz",
      en: "/en/privacy",
      "x-default": "/datenschutz",
    },
  },
};

export default function DatenschutzPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold text-green-600 hover:text-green-700"
        >
          ← Zurück zu EAVESENCE Energy
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
            Rechtliches
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            Datenschutz
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            Informationen zur Verarbeitung personenbezogener Daten bei der
            Nutzung von EAVESENCE Energy.
          </p>
        </div>

        <div className="mt-12 space-y-10 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Verantwortlicher
            </h2>

            <div className="mt-4 space-y-1 leading-7">
              <p>EAVESENCE Energy</p>
              <p>Österreich</p>

              <p>
                E-Mail:{" "}
                <a
                  href="mailto:parkwaydrive@gmx.at"
                  className="font-medium text-green-600 hover:text-green-700"
                >
                  parkwaydrive@gmx.at
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Nutzung des Stromkosten-Rechners
            </h2>

            <p className="mt-4 leading-7">
              Die von dir im Stromkosten-Rechner eingegebenen Werte werden zur
              Durchführung der Berechnung verwendet.
            </p>

            <p className="mt-3 leading-7">
              EAVESENCE Energy verfügt derzeit über kein Benutzerkonto und
              keine eigene Datenbank zur dauerhaften Speicherung dieser
              Rechner-Eingaben.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Bereitstellung der Website
            </h2>

            <p className="mt-4 leading-7">
              Beim Aufruf einer Website werden technisch notwendige
              Informationen zwischen deinem Browser und der Infrastruktur, über
              die die Website bereitgestellt wird, übertragen. Dazu können
              insbesondere IP-Adresse, Zeitpunkt des Zugriffs, angeforderte
              Seite sowie technische Informationen zum verwendeten Browser und
              Gerät gehören.
            </p>

            <p className="mt-3 leading-7">
              Diese Verarbeitung dient der technischen Bereitstellung,
              Sicherheit und Stabilität der Website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Hosting
            </h2>

            <p className="mt-4 leading-7">
              EAVESENCE Energy wird derzeit über Vercel bereitgestellt. Im
              Rahmen der technischen Bereitstellung der Website können
              Verbindungs- und Zugriffsdaten durch den Hosting-Anbieter
              verarbeitet werden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Cookies und Analyse
            </h2>

            <p className="mt-4 leading-7">
              EAVESENCE Energy setzt derzeit keine eigenen Analyse- oder
              Marketingdienste ein.
            </p>

            <p className="mt-3 leading-7">
              Sollte EAVESENCE Energy künftig Analyse-, Marketing- oder andere
              zusätzliche Dienste einsetzen, wird diese Datenschutzerklärung
              entsprechend aktualisiert.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Kontaktaufnahme
            </h2>

            <p className="mt-4 leading-7">
              Wenn du per E-Mail Kontakt aufnimmst, werden die von dir
              übermittelten Angaben verarbeitet, soweit dies zur Bearbeitung
              deiner Anfrage erforderlich ist.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Deine Rechte
            </h2>

            <p className="mt-4 leading-7">
              Soweit die gesetzlichen Voraussetzungen erfüllt sind, stehen dir
              insbesondere Rechte auf Auskunft, Berichtigung, Löschung,
              Einschränkung der Verarbeitung und gegebenenfalls Widerspruch
              gegen die Verarbeitung sowie Datenübertragbarkeit zu.
            </p>

            <p className="mt-3 leading-7">
              Außerdem besteht das Recht, sich bei der zuständigen
              Datenschutzaufsichtsbehörde zu beschweren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Stand
            </h2>

            <p className="mt-4 leading-7">
              September 2026
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
