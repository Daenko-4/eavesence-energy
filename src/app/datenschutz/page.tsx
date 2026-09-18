import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTopOnMount from "@/components/ScrollToTopOnMount";

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
    <div
      lang="de"
      className="min-h-screen bg-[var(--brand-off-white)] text-[#17211f]"
    >
      <ScrollToTopOnMount />
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-12">
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-green)]">
            Rechtliches
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-[#17211f]">
            Datenschutz
          </h1>

          <p className="mt-5 leading-7 text-slate-600">
            Informationen zur Verarbeitung personenbezogener Daten bei der
            Nutzung von EAVESENCE Energy.
          </p>
        </div>

        <div className="mt-10 space-y-8 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Verantwortlicher
            </h2>

            <div className="mt-3 space-y-1 leading-7">
              <p>EAVESENCE Energy</p>
              <p>Österreich</p>

              <p>
                E-Mail:{" "}
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
              Nutzung des Stromkosten-Rechners
            </h2>

            <p className="mt-3 leading-7">
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
            <h2 className="text-xl font-bold text-slate-950">
              Bereitstellung der Website
            </h2>

            <p className="mt-3 leading-7">
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
            <h2 className="text-xl font-bold text-slate-950">
              Lokale Speicherung im Browser
            </h2>

            <p className="mt-3 leading-7">
              Wenn du „Meine Geräte“ oder „Mein Zuhause“ verwendest, werden
              deine gespeicherten Berechnungen, Räume, Sparziele und freiwillig
              eingetragenen Monatswerte ausschließlich im lokalen Speicher
              deines Browsers abgelegt. Dort können außerdem deine gewählte
              Währung, zuletzt verwendete Geräte und dein freiwilliges
              Beta-Interesse gespeichert werden. Diese lokal gespeicherten
              Haushalts- und Berechnungsdaten werden nicht an EAVESENCE Energy
              übertragen.
            </p>

            <p className="mt-3 leading-7">
              Du kannst lokale Geräte jederzeit auf der Startseite löschen oder
              als Sicherungsdatei exportieren. Beim Löschen der Browserdaten
              können lokal gespeicherte Angaben ebenfalls verloren gehen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Hosting
            </h2>

            <p className="mt-3 leading-7">
              EAVESENCE Energy wird derzeit über Vercel bereitgestellt. Im
              Rahmen der technischen Bereitstellung der Website können
              Verbindungs- und Zugriffsdaten durch den Hosting-Anbieter
              verarbeitet werden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Cookies und Analyse
            </h2>

            <p className="mt-3 leading-7">
              EAVESENCE Energy nutzt Vercel Web Analytics, um zu verstehen,
              welche Seiten und Produktfunktionen verwendet werden. Laut
              Vercel arbeitet dieser Dienst ohne Cookies und erfasst die Nutzung
              in anonymisierter Form.
            </p>

            <p className="mt-3 leading-7">
              Erfasst werden wenige Interaktionen, etwa die Auswahl einer
              Gerätekategorie, der Wechsel des Berechnungsmodus, das Speichern
              eines Geräts, der Abschluss des Home-Onboardings, das Erreichen
              von Aktivierungsschritten oder freiwilliges Beta-Interesse.
              Selbst vergebene Gerätenamen, Berechnungswerte, E-Mail-Adressen
              und andere Freitexte werden nicht als Analyseereignisse
              übertragen. Die Informationen dienen ausschließlich dazu,
              EAVESENCE zu verbessern und das Interesse an künftigen
              Produktfunktionen einzuschätzen. Marketing-Tracking wird nicht
              eingesetzt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Kontaktaufnahme
            </h2>

            <p className="mt-3 leading-7">
              Wenn du per E-Mail Kontakt aufnimmst, werden die von dir
              übermittelten Angaben verarbeitet, soweit dies zur Bearbeitung
              deiner Anfrage erforderlich ist.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Deine Rechte
            </h2>

            <p className="mt-3 leading-7">
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
            <h2 className="text-xl font-bold text-slate-950">
              Stand
            </h2>

            <p className="mt-3 leading-7">
              September 2026
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-slate-200/80 pt-6">
          <Link
            href="/de"
            scroll
            className="inline-flex text-sm font-semibold text-[var(--brand-green)] transition hover:text-[var(--brand-green-dark)]"
          >
            {"<"} Zur EAVESENCE Startseite
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
