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
    expect(text).not.toMatch(/Platzhalter|\[Straße\]|Datum ergänzen|§ 5 TMG|§ 55 RStV|consumers\/odr/i);
  });

  it("accurately explains local-only storage and infrastructure processing", () => {
    const { container } = render(<DatenschutzPage />);
    const text = renderedText(container);

    expect(text).toContain("localStorage");
    expect(text).toContain("nicht auf dem SC-Payslip-Server gespeichert");
    expect(text).toContain("Cloudflare");
    expect(text).toContain("Server-Logdaten");
    expect(text).toContain("Stand: 20. August 2026");
    expect(text).not.toMatch(/Platzhalter|eintragen|ergänze|ergänzt werden/i);
  });
});
