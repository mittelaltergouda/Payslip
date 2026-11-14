import type { Metadata } from "next";
import { BackToToolLink } from "@/components/BackToToolLink";

export const metadata: Metadata = {
  title: "Datenschutz · SC Payslip",
  description: "Datenschutzerklärung für SC Payslip",
};

export default function DatenschutzPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-neon">SC Payslip</p>
        <h1 className="text-3xl font-semibold text-white">Datenschutz</h1>
        <p className="text-sm text-white/70">Stand: 21. August 2026</p>
      </header>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Verantwortlicher</h2>
        <p>
          Marco Niedheidt · Plittersdorfer Str. 224 · 53173 Bonn · Deutschland
          <br />
          E-Mail:{" "}
          <a className="text-neon hover:underline" href="mailto:impressum@pixelfrontier.de">
            impressum@pixelfrontier.de
          </a>
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Berechnungs- und Sitzungsdaten</h2>
        <p>
          Namen, Rollen, Einnahmen, Ausgaben und Verteilungsergebnisse werden ausschließlich im
          <code className="mx-1 text-neon">localStorage</code>
          Deines Browsers gespeichert. Diese Inhalte werden nicht auf dem SC-Payslip-Server gespeichert. Du kannst
          lokale Sitzungen im Tool löschen sowie als JSON-Datei exportieren und wieder importieren. Das Löschen der
          Website-Daten im Browser entfernt ebenfalls die lokal gespeicherten Sitzungen. Die lokale Speicherung ist
          für die ausdrücklich gewünschte Local-only-Sitzungsverwaltung erforderlich und erfolgt gemäß § 25 Abs. 2
          Nr. 2 TDDDG ohne Einwilligung.
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Hosting und Server-Logdaten</h2>
        <p>
          Die Website läuft auf einem Server der Hetzner Online GmbH in Deutschland. Beim Aufruf werden technisch
          notwendige Server-Logdaten verarbeitet, insbesondere IP-Adresse, Zeitpunkt, angeforderte Adresse,
          übertragene Datenmenge, Referrer sowie Browser- und Betriebssystemangaben. Die Verarbeitung dient dem
          sicheren und störungsfreien Betrieb auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. SC Payslip legt keine
          eigenen dauerhaften Zugriffsprofile an.
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Cloudflare</h2>
        <p>
          Für verschlüsselte Übertragung, DNS und Schutz vor Angriffen wird Cloudflare (Cloudflare, Inc., USA)
          eingesetzt. Dabei verarbeitet Cloudflare insbesondere IP-Adressen sowie Verbindungs- und HTTP-Metadaten.
          Die Verarbeitung dient der sicheren, belastbaren Bereitstellung des Tools auf Grundlage von Art. 6 Abs. 1
          lit. f DSGVO; unser berechtigtes Interesse liegt im Schutz vor Angriffen und technischen Ausfällen. Eine
          Verarbeitung außerhalb der EU kann nicht ausgeschlossen werden. Cloudflare stützt Übermittlungen in die
          USA nach eigenen Angaben auf das EU-US Data Privacy Framework und ergänzend auf
          Standardvertragsklauseln. Weitere Informationen stehen in der
          <a
            className="ml-1 text-neon hover:underline"
            href="https://www.cloudflare.com/privacypolicy/"
            rel="noreferrer"
          >
            Datenschutzerklärung von Cloudflare
          </a>{" "}
          sowie in den
          <a
            className="ml-1 text-neon hover:underline"
            href="https://www.cloudflare.com/cloudflare-customer-dpa/"
            rel="noreferrer"
          >
            Datenschutzinformationen für Cloudflare-Kunden
          </a>.
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Lokale Speicherung und Tracking</h2>
        <p>
          SC Payslip setzt keine Cookies. Wenn Du den eingeblendeten Speicherhinweis mit „Verstanden“ schließt, merkt
          sich <code className="mx-1 text-neon">sessionStorage</code> diese Auswahl bis zum Schließen des Browser-Tabs.
          Die eigentlichen Sitzungsdaten bleiben wie oben beschrieben im <code className="mx-1 text-neon">localStorage</code>
          Deines Browsers. SC Payslip setzt keine Analyse-, Werbe- oder Profiling-Dienste ein.
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Kontaktanfragen</h2>
        <p>
          Wenn Du uns per E-Mail kontaktierst, verarbeiten wir Deine E-Mail-Adresse, technische Metadaten sowie den
          Inhalt Deiner Nachricht, um Dein Anliegen zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO,
          wenn die Kommunikation der Anbahnung oder Durchführung eines Vertrags dient, andernfalls Art. 6 Abs. 1
          lit. f DSGVO aufgrund unseres berechtigten Interesses an einer sachgerechten Kommunikation. Das
          E-Mail-Postfach wird bei der Alfahosting GmbH als Auftragsverarbeiter betrieben. Wir löschen Anfragen, sobald
          sie abschließend bearbeitet sind und keine gesetzlichen Aufbewahrungs- oder Nachweispflichten mehr bestehen.
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Deine Rechte</h2>
        <p>
          Du hast im gesetzlichen Umfang Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit und Widerspruch. Außerdem kannst Du Dich bei einer Datenschutzaufsichtsbehörde
          beschweren, insbesondere bei der Landesbeauftragten für Datenschutz und Informationsfreiheit
          Nordrhein-Westfalen.
        </p>
      </section>

      <div className="flex justify-center">
        <BackToToolLink />
      </div>
    </main>
  );
}
