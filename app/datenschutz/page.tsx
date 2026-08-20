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
        <p className="text-sm text-white/70">Stand: 20. August 2026</p>
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
          Website-Daten im Browser entfernt ebenfalls die lokal gespeicherten Sitzungen.
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
          eingesetzt. Dabei verarbeitet Cloudflare Verbindungs- und HTTP-Metadaten. Eine Verarbeitung außerhalb der
          EU kann nicht ausgeschlossen werden. Weitere Informationen stehen in der
          <a
            className="ml-1 text-neon hover:underline"
            href="https://www.cloudflare.com/privacypolicy/"
            rel="noreferrer"
          >
            Datenschutzerklärung von Cloudflare
          </a>.
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Cookies und Tracking</h2>
        <p>
          SC Payslip setzt keine Analyse-, Werbe- oder Profiling-Dienste ein. Im öffentlichen Local-only-Betrieb sind
          keine Benutzerkonten und keine serverseitigen Sitzungs-Cookies erforderlich.
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
