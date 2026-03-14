import type { Metadata } from "next";

const placeholder = (label: string) => <span className="text-neon">{label}</span>;

export const metadata: Metadata = {
  title: "Datenschutz · SC Payslip",
  description:
    "Datenschutzerklärung für SC Payslip mit klaren Aussagen zum Einzelbetreiber, den verarbeiteten Daten und Deinen Rechten",
};

export default function DatenschutzPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-neon">Datenschutz</p>
        <h1 className="text-3xl font-semibold text-white">SC Payslip</h1>
        <p className="text-sm text-white/70">
          Diese Erklärung beschreibt, welche Daten SC Payslip erfassen darf, wie sie genutzt werden und welche
          Rechte Dir laut DSGVO und BDSG zustehen. SC Payslip ist ein privates Projekt, das Marco allein betreibt.
          Fehlende Details sind als Platzhalter markiert.
        </p>
      </header>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Verantwortliche Stelle & Kontakt</h2>
        <p>
          Verantwortlich ist Marco als Einzelperson {placeholder("(ggf. Berufsbezeichnung ergänzen)")} {placeholder(
            "[Straße] · [PLZ] [Ort] · Deutschland"
          )}.
        </p>
        <p>
          Datenschutzkontakt: {placeholder("datenschutz@pixelfrontier.de oder Wunschadresse")}
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Geltungsbereich & Rechtsgrundlagen</h2>
        <p>
          SC Payslip verarbeitet Daten, um Dir die Planungsoberfläche bereitzustellen, Eingaben zu speichern und
          wiederzugeben. Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b) DSGVO (Vertragserfüllung bzw. vorvertragliche
          Maßnahmen) sowie Art. 6 Abs. 1 lit. f), wenn es um die Stabilisierung des Tools oder Fehleranalysen geht.
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Welche Daten wir erfassen</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Eingabedaten (Crew, Umsätze, Ausgaben, Verteilungsschlüssel), die Du direkt im Interface hinterlegst.</li>
          <li>Technische Metadaten wie Browser-Infos, Zeitstempel und Statusmeldungen, die für die Anzeige nötig sind.</li>
          <li>Lokale Sessions (LocalStorage) und optionale Exporte (JSON/CSV/PDF), wenn Du sie aktiv nutzt.</li>
          <li>Optional manuell geteilte Sessions via Export/Import – diese bleiben bei Dir und werden nicht automatisch weitergegeben.</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Cookies & Tracking</h2>
        <p>
          Es kommen ausschließlich notwendige Cookies zum Einsatz (z. B. für die Session-Stabilität im Next.js-Stack).
          Drittanbieter-Tracking wird nicht betrieben. Ergänze bei Bedarf den konkreten Hosting-Provider oder die
          Plattform (z. B. {placeholder("Eigener Server / Vercel / Netlify")}).
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Hosting & Drittanbieter</h2>
        <p>
          Die App läuft auf einem Next.js-Stack und nutzt {placeholder("[Hosting-Provider eintragen]")} inklusive TLS.
          Weitere Dienste (z. B. Cloud-Speicher, Analytics o. Ä.) werden hier ergänzt, sobald sie eingebunden werden.
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Speicherdauer & Löschung</h2>
        <p>
          Lokale Sessions verbleiben im Browser, bis Du sie löschst oder der Cache bereinigt wird. Exportierte Dateien
          kannst Du jederzeit manuell entfernen. Ergänze konkrete Aufbewahrungsfristen oder Löschkonzepte,
          sobald sie feststehen ({placeholder("Fristen / Bedingungen eintragen")}).
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Datensicherheit</h2>
        <p>
          Die Übertragung erfolgt ausschließlich über HTTPS. Lokale Daten werden nicht an fremde Server übertragen.
          Weitere Sicherheitsmaßnahmen wie Backups oder Zugriffsbeschränkungen sind optional und sollten bei Bedarf
          ergänzt werden.
        </p>
      </section>

      <section className="space-y-1 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Deine Rechte</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Auskunft über gespeicherte personenbezogene Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Angaben (Art. 16 DSGVO)</li>
          <li>Löschung oder Sperrung, soweit keine gesetzlichen Aufbewahrungspflichten bestehen (Art. 17/18 DSGVO)</li>
          <li>Widerspruch gegen Verarbeitung oder Einschränkung (Art. 21 DSGVO)</li>
          <li>Datenübertragung (Art. 20 DSGVO)</li>
          <li>Beschwerde bei einer zuständigen Aufsichtsbehörde</li>
        </ul>
        <p>
          Nutze die oben genannten Kontaktdaten, um Deine Rechte geltend zu machen. Rückmeldungen beantworte ich in der
          Regel innerhalb eines Monats.
        </p>
      </section>

      <section className="text-xs text-white/60">
        <p>
          Diese Erklärung wird regelmäßig überarbeitet. Stand: {placeholder("Datum ergänzen")}.
        </p>
        <p>
          Bitte ergänze die markierten Platzhalter mit konkreten Ansprechpartnern, Fristen oder Dienstleistern, sobald
          sie verfügbar sind, damit die Erklärung zum Produktionsbetrieb passt.
        </p>
      </section>
    </main>
  );
}
