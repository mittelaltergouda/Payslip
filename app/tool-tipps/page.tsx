import type { Metadata } from "next";

const tipSections = [
  {
    title: "Zeilenweise Eingabe",
    summary:
      "Die Tabelle folgt einer festen Schlagfolge: Enter wechselt immer in dieselbe Spalte der nächsten Zeile. Das hilft, einen klaren Flow zu behalten.",
    bullets: [
      "Ein Druck auf Enter verschiebt den Fokus stets in die identische Spalte der darunterliegenden Zeile.",
      "So arbeitest Du eine Spalte komplett durch, bevor Du zur nächsten wechselst oder neue Zeilen ergänzt.",
      "Die Summen in der Kopfzeile reagieren live; sie zeigen Dir sofort, wenn eine Zeile unerwartet aus dem Takt fällt."
    ]
  },
  {
    title: "Crew & Zahlen",
    summary:
      "Stelle Crew-Handles, Rollen und Umsätze strukturiert zusammen und überprüfe anschließend die Verteilung auf den ersten Blick.",
    bullets: [
      "Beginne mit Handles und Rollen, fülle erst danach Umsätze, Investments und Bonuswerte ein.",
      "Wähle den passenden Verteilmodus (z. B. Gleich, Anpassbar) und sichte die Summen oberhalb: rote oder überschießende Werte weisen auf Abweichungen hin.",
      "Die AMP-Anteile im Statusbereich zeigen Dir, wie viel Prozent jeder Eintrag vom Gesamtbetrag erhält – überprüfe sie vor dem Abschluss."
    ]
  },
  {
    title: "Session-Management",
    summary:
      "Alle Eingaben werden automatisch gespeichert; trotzdem solltest Du vor dem Teilen Export-Funktionen nutzen.",
    bullets: [
      "Exportiere Sessions als JSON, CSV oder PDF, damit Teamkolleg:innen exakt dieselben Zahlen laden können.",
      "Doppelte Sessions, Kopien oder neue Releases lassen sich über die Aktionsleiste oben rechts erzeugen – so behältst Du Versionen im Blick.",
      "Nutze die klare Bezeichnung jeder Session, dann findest Du später schnell die richtige Historie wieder."
    ]
  },
  {
    title: "Feinschliff",
    summary:
      "Beende Berechnungen mit einer zusätzlichen Kontrolle der verteilten Prozentsätze, bevor Du Ergebnisse weitergibst.",
    bullets: [
      "Im ADJUSTABLE-Modus können Summen über 100 % rutschen; halte deshalb Ausschau nach den Live-Warnungen oben.",
      "Korrigiere unplausible Werte früh, anstatt sie später manuell zurücksetzen zu müssen – die Live-Summen machen das sichtbar.",
      "Wenn Du mit Bonus oder Investitionssummen jonglierst, kannst Du die Statusleiste beobachten: Dort finden sich Hinweise auf Grenzwerte."
    ]
  }
];

export const metadata: Metadata = {
  title: "Tool-Tipps · SC Payslip",
  description: "Komprimierte Operationstipps für SC Payslip: schneller Crew-Aufbau, präzise Navigation und verlässliches Teilen."
};

export default function ToolTippsPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 text-sm text-white/80">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.5em] text-neon">Tool-Tipps</p>
        <h1 className="text-3xl font-semibold text-white">SC Payslip effizient nutzen</h1>
        <p className="text-base text-white/70">
          Diese Sammlung konzentriert sich auf wiederkehrende Abläufe: Navigation, Eingabe und Teile-Workflows. Kurze
          Hinweise halten Dich im Flow, ohne Dich mit langen Anleitungen aufzuhalten.
        </p>
      </header>

      <section className="space-y-6">
        {tipSections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border border-white/10 bg-night/40 p-5 shadow-lg shadow-black/20"
          >
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <p className="mt-2 leading-relaxed text-white/75">{section.summary}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-white/70">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-5 text-sm text-white/70">
        <h2 className="text-base font-semibold uppercase tracking-[0.4em] text-white/60">Quick-Win</h2>
        <p className="mt-2">
          Für schnelle Checks gilt: Einnahmen zuerst, dann Fixkosten, zuletzt Bonus- oder Verteilungswerte. Sobald die
          Summen logisch aufgehen, kannst Du Deine Session mit einer kurzen Übersicht teilen – das reduziert Nachfragen.
        </p>
      </section>
    </main>
  );
}
