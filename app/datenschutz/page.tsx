import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutz · SC Payslip",
  description: "Knappe Datenschutzerklärung für SC Payslip mit den wichtigsten Punkten & Platzhaltern."
};

const highlight = (text: string) => <span className="text-neon">{text}</span>;

export default function DatenschutzPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-neon">Datenschutz</p>
        <h1 className="text-3xl font-semibold text-white">SC Payslip</h1>
        <p className="text-sm text-white/70">
          Klar und auf das Wesentliche beschränkt: Diese Seite nennt Verantwortliche, Datenarten, Rechte und den
          Kontakt, den du für Datenschutzfragen brauchst.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Verantwortliche Stelle & Kontakt</h2>
        <dl className="space-y-2 text-sm text-white/70">
          <div className="flex flex-col">
            <dt className="text-xs uppercase tracking-[0.3em] text-muted">Firma</dt>
            <dd>SC Payslip / PIXELFRONTIER {highlight("(Platzhalter ersetzen)")}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs uppercase tracking-[0.3em] text-muted">Verantwortlich</dt>
            <dd>Marco (CEO) {highlight("(bei Bedarf ergänzen)")}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs uppercase tracking-[0.3em] text-muted">Datenschutzkontakt</dt>
            <dd>datenschutz@pixelfrontier.de {highlight("(echte Adresse einsetzen)")}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Welche Daten wir erfassen</h2>
        <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
          <li>Browser-Metadaten (IP, Zeitpunkt, User-Agent) zur stabilen Darstellung der App.</li>
          <li>Formulare oder Uploads, die du bewusst abschickst, werden nur zu dem angegebenen Zweck verarbeitet.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Cookies & Hosting</h2>
        <p className="text-sm text-white/70">
          Es kommen nur technisch notwendige Session-Cookies zum Einsatz. Hosting und Infrastruktur laufen über
          Next.js {highlight("(z. B. Vercel/Netlify/selbst gehostet, bitte ergänzen)")}, Tracking-Tools setzen wir aktuell
          nicht ein.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Deine Rechte</h2>
        <p className="text-sm text-white/70">
          Du kannst jederzeit Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung oder Datenübertragbarkeit
          verlangen. Nutze dafür die oben genannten Kontaktdaten. Zusätzlich steht dir das Beschwerderecht bei der
          zuständigen Aufsichtsbehörde zu.
        </p>
      </section>

      <section className="space-y-1 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Hinweis</h2>
        <p>
          Diese Erklärung ist auf das Minimum beschränkt. Ergänze konkrete Dienstleister, Auftragsverarbeiter und
          Ansprechpartner sowie das letzte Änderungsdatum, sobald sie feststehen.
        </p>
      </section>
    </main>
  );
}
