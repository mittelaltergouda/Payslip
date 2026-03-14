import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum · SC Payslip",
  description: "Kompakte Impressumsseite für SC Payslip / PIXELFRONTIER. Pflichtangaben mit klaren Platzhaltern."
};

const placeholderHint = (hint: string) => (
  <span className="text-neon">{hint}</span>
);

export default function ImpressumPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-neon">Impressum</p>
        <h1 className="text-3xl font-semibold text-white">SC Payslip</h1>
        <p className="text-sm text-white/70">
          Minimalistische Pflichtangaben für SC Payslip. Alle Platzhalter sind deutlich gekennzeichnet und lassen
          sich mit echten Daten ersetzen.
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Anbieter</h2>
          <dl className="mt-2 space-y-2 text-sm text-white/70">
            <div className="flex flex-col">
              <dt className="text-xs uppercase tracking-[0.3em] text-muted">Firma</dt>
              <dd>SC Payslip / PIXELFRONTIER {placeholderHint("(Platzhalter ersetzen)")}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs uppercase tracking-[0.3em] text-muted">Vertretungsberechtigt</dt>
              <dd>Marco (CEO) {placeholderHint("(Name o. Position ggf. anpassen)")}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs uppercase tracking-[0.3em] text-muted">Adresse</dt>
              <dd>
                Musterstraße 1 · 12345 Musterstadt {placeholderHint("(Straße, PLZ, Ort eintragen)")}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white">Kontakt</h2>
          <dl className="mt-2 space-y-2 text-sm text-white/70">
            <div className="flex flex-col">
              <dt className="text-xs uppercase tracking-[0.3em] text-muted">E-Mail</dt>
              <dd>kontakt@pixelfrontier.de {placeholderHint("(echte Adresse eintragen)")}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs uppercase tracking-[0.3em] text-muted">Telefon</dt>
              <dd>+49 (0) 000 000000 {placeholderHint("(gültige Nummer einsetzen)")}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs uppercase tracking-[0.3em] text-muted">Web</dt>
              <dd>https://pixelfrontier.de</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white">Registrierung & Steuernummer</h2>
          <dl className="mt-2 space-y-2 text-sm text-white/70">
            <div className="flex flex-col">
              <dt className="text-xs uppercase tracking-[0.3em] text-muted">Handelsregister</dt>
              <dd>Keine Eintragung / {placeholderHint("(eintragen falls vorhanden)")}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs uppercase tracking-[0.3em] text-muted">USt-IdNr.</dt>
              <dd>DE[noch eintragen] {placeholderHint("(USt-IdNr. ergänzen)")}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="text-sm text-white/70 space-y-1">
        <h2 className="text-xl font-semibold text-white">Hinweis</h2>
        <p>
          Diese Seite stellt die rechtlich relevanten Pflichtdaten dar. Bitte aktualisiere die markierten Felder, sobald
          verbindliche Informationen vorliegen.
        </p>
      </section>
    </main>
  );
}
