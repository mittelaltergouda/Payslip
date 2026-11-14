import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ImpressumPage from "@/app/impressum/page";
import DatenschutzPage from "@/app/datenschutz/page";

function renderedText(container: HTMLElement) {
  return container.textContent ?? "";
}

describe("production legal pages", () => {
  it("publishes a complete compact imprint without placeholders or stale laws", () => {
    const { container } = render(<ImpressumPage />);
    const text = renderedText(container);

    expect(screen.getByRole("heading", { name: "Impressum" })).toBeInTheDocument();
    expect(text).toContain("§ 5 DDG");
    expect(text).toContain("Marco Niedheidt");
    expect(text).toContain("53173 Bonn");
    expect(text).toContain("impressum@pixelfrontier.de");
    expect(screen.getByRole("link", { name: "0228 2803 1258" })).toHaveAttribute("href", "tel:+4922828031258");
    expect(text).not.toMatch(/Platzhalter|\[Straße\]|Datum ergänzen|§ 5 TMG|§ 55 RStV|consumers\/odr/i);
  });

  it("accurately explains local-only storage and infrastructure processing", () => {
    const { container } = render(<DatenschutzPage />);
    const text = renderedText(container);

    expect(text).toContain("localStorage");
    expect(text).toContain("nicht auf dem SC-Payslip-Server gespeichert");
    expect(text).toContain("setzt keine Cookies");
    expect(text).not.toContain("csrf-token");
    expect(text).toContain("§ 25 Abs. 2 Nr. 2 TDDDG");
    expect(text).toContain("Cloudflare");
    expect(text).toContain("Art. 6 Abs. 1 lit. f DSGVO");
    expect(text).toContain("EU-US Data Privacy Framework");
    expect(text).toContain("Standardvertragsklauseln");
    expect(text).toContain("Kontaktanfragen");
    expect(text).toContain("Alfahosting GmbH");
    expect(text).toContain("Server-Logdaten");
    expect(text).toContain("Stand: 21. August 2026");
    expect(text).not.toMatch(/\bPlatzhalter\b|\beintragen\b|\bergänze\b|\bergänzt werden\b/i);
  });
});
