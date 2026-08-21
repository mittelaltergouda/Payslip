import type { Metadata } from "next";
import { BackToToolLink } from "@/components/BackToToolLink";

export const metadata: Metadata = {
  title: "Impressum · SC Payslip",
  description: "Impressum und Anbieterangaben für SC Payslip",
};

export default function ImpressumPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-neon">SC Payslip</p>
        <h1 className="text-3xl font-semibold text-white">Impressum</h1>
      </header>

      <section className="space-y-3 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Angaben gemäß § 5 DDG</h2>
        <address className="not-italic leading-7">
          Marco Niedheidt
          <br />
          Plittersdorfer Str. 224
          <br />
          53173 Bonn
          <br />
          Deutschland
        </address>
      </section>

      <section className="space-y-3 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Kontakt</h2>
        <p>
          E-Mail:{" "}
          <a className="text-neon hover:underline" href="mailto:impressum@pixelfrontier.de">
            impressum@pixelfrontier.de
          </a>
          <br />
          Telefon: <a className="text-neon hover:underline" href="tel:+4922828031258">0228 2803 1258</a>
        </p>
      </section>

      <section className="space-y-3 text-sm text-white/70">
        <h2 className="text-xl font-semibold text-white">Hinweis zum Projekt</h2>
        <p>
          SC Payslip ist ein unabhängiges, nicht offizielles Fan-Werkzeug. Es besteht keine Verbindung zu oder
          Beauftragung durch Cloud Imperium Games. Star Citizen und zugehörige Bezeichnungen sind Marken ihrer
          jeweiligen Rechteinhaber.
        </p>
      </section>

      <div className="flex justify-center">
        <BackToToolLink />
      </div>
    </main>
  );
}
