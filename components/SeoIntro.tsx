export function SeoIntro() {
  return (
    <section className="glass space-y-4 p-6 md:p-8" aria-labelledby="seo-intro-title">
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-neon/80">SC Payslip</p>
      <h1 id="seo-intro-title" className="max-w-4xl text-3xl font-semibold text-white md:text-5xl">
        Star Citizen Auszahlungsrechner für Crews
      </h1>
      <p className="max-w-4xl text-base leading-relaxed text-white/75 md:text-lg">
        Verteile eure aUEC-Einnahmen aus Mining, Salvage, Handel und gemeinsamen Missionen nachvollziehbar auf die
        gesamte Crew. SC Payslip berücksichtigt Investments, individuelle und gemeinsame Kosten sowie die
        Transfergebühr und berechnet daraus konkrete Überweisungen.
      </p>
      <p className="max-w-4xl text-sm leading-relaxed text-white/60">
        Deine Crew-, Finanz- und Sessiondaten bleiben ausschließlich lokal in deinem Browser. Es gibt kein Konto,
        keine öffentliche Session und kein Tracking.
      </p>
    </section>
  );
}
