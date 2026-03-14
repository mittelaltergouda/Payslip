import type { Metadata } from "next";

const placeholder = (label: string) => <span className="text-neon">{label}</span>;

export const metadata: Metadata = {
  title: "Impressum · SC Payslip",
  description:
    "Impressum für SC Payslip mit klaren Angaben zum privaten Betreiber, den Kontaktdaten und den Pflichtinformationen",
};

export default function ImpressumPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-neon">Impressum</p>
        <h1 className="text-3xl font-semibold text-white">SC Payslip</h1>
        <p className="text-sm text-white/70">
          SC Payslip ist ein privat entwickeltes Werkzeug, das Marco als Einzelperson betreibt. Dieses
          Impressum bündelt die gesetzlich relevanten Pflichtangaben. Fehlende Details sind als
          Platzhalter markiert und sollten vor einem öffentlichen Launch ergänzt werden.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Angaben gemäß § 5 TMG</h2>
        <dl className="space-y-4 text-sm text-white/70">
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-[0.3em] text-muted">Betreiber</dt>
            <dd>
              Marco (freier Entwickler) {placeholder("(ggf. Beruf, Tätigkeitsfeld oder Zusatz ergänzen)")}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-[0.3em] text-muted">Anschrift</dt>
            <dd>{placeholder("[Straße] · [PLZ] [Ort] · Deutschland")}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-[0.3em] text-muted">Kontakt</dt>
            <dd className="space-y-1">
              {placeholder("Telefon: +49 (0)... (Nummer eintragen)")}
              {placeholder("E-Mail: marco@... oder Wunschadresse")}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-[0.3em] text-muted">Umsatzsteuer-Identifikationsnummer</dt>
            <dd>{placeholder("DE... (nur bei Vorhandensein) / keine Angabe nötig")}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-[0.3em] text-muted">Register & Kammer</dt>
            <dd>
              {placeholder("Keine Eintragung im Handelsregister / Kammerpflicht nur bei Eintragung ergänzen")}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Verantwortlich im Sinne des § 55 RStV</h2>
        <p className="text-sm text-white/70">
          Marco {placeholder("(ggf. Kontaktdaten oder zusätzliche Stelle wiederholen)")}.
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Haftung für Inhalte</h2>
        <p>
          Ich übernehme keinerlei Gewähr für die Aktualität, Vollständigkeit oder Richtigkeit der bereitgestellten
          Inhalte. Diese Seite dient der Orientierung und stellt keine verbindliche Beratung dar.
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Haftung für Links</h2>
        <p>
          Verweise auf fremde Webseiten wurden zum Zeitpunkt der Verlinkung geprüft. Für deren Inhalte kann ich
          keine Verantwortung übernehmen. Sollten mir Rechtsverletzungen bekannt werden, entferne ich betroffene Links
          umgehend.
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur außergerichtlichen Online-Streitbeilegung (OS)
          bereit: https://ec.europa.eu/consumers/odr. Ich nehme nicht an einem Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teil.
        </p>
      </section>

      <section className="space-y-2 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Urheberrecht & Inhalte</h2>
        <p>
          Die durch mich erstellten Inhalte und Werke auf dieser Seite unterliegen dem deutschen Urheberrecht. Beiträge
          Dritter sind als solche gekennzeichnet. Die Vervielfältigung, Bearbeitung oder Veröffentlichung bedarf einer
          vorherigen schriftlichen Zustimmung meinerseits.
        </p>
      </section>

      <section className="text-xs text-white/60">
        <p>
          Dieses Impressum ist dynamisch gepflegt. Bitte aktualisiere alle oben markierten Platzhalter sowie das Datum
          ({placeholder("Datum ergänzen")}), bevor SC Payslip öffentlich ausgerollt wird.
        </p>
      </section>
    </main>
  );
}
