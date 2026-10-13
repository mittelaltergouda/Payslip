import { describe, expect, it } from "vitest";
import { calculatePayslip } from "./calc";
import { buildArithmeticSections } from "./accounting";
import { translations } from "./i18n/translations";
import type { SessionInput } from "./types";

// The arithmetic explanation must let every player recompute the payout by
// hand: exact numbers (no rounded shares), profit, distribution, targets and
// transfers in separate sections, plain language instead of internal codes.

function explain(session: SessionInput, lang: "de" | "en" = "de") {
  const sections = buildArithmeticSections(session, calculatePayslip(session), lang);
  return { sections, text: sections.flatMap((s) => [s.title, ...s.lines]).join("\n") };
}

const reported: SessionInput = {
  name: "Reported",
  type: "TRADING",
  distributionMode: "EQUAL",
  taxEnabled: true,
  taxRate: 0.005,
  members: [
    { id: "p1", handle: "P1", active: true, revenue: 0, investment: 0 },
    { id: "p2", handle: "P2", active: true, revenue: 7_786_069, investment: 2_822_000 },
  ],
  individualExpenses: [
    { id: "e1", memberId: "p1", label: "Funded cost", amount: 2_822_000 },
    { id: "e2", memberId: "p2", label: "Funded cost", amount: 47_000 },
  ],
};

describe("arithmetic explanation sections", () => {
  it("walks through the reported case with exact numbers in four sections", () => {
    const { sections, text } = explain(reported);

    expect(sections.map((s) => s.title)).toEqual(["1. Gewinn", "2. Verteilung", "3. Ziel je Spieler", "4. Überweisungen"]);
    expect(text).toContain("Umsatz: P1 0 + P2 7.786.069 = 7.786.069");
    expect(text).toContain("Investments: P1 0 + P2 2.822.000 = 2.822.000");
    expect(text).toContain("Kosten: P1 2.822.000 + P2 47.000 = 2.869.000");
    expect(text).toContain("Gewinn = 7.786.069 − 2.822.000 − 2.869.000 = 2.095.069");
    expect(text).toContain("Gleich verteilt auf 2 aktive Spieler: 2.095.069 ÷ 2 = 1.047.534,5");
    expect(text).toContain("P1: 0 Investment + 2.822.000 Kosten + 1.047.534,5 Anteil = 3.869.534,5");
    expect(text).toContain("P2: 2.822.000 Investment + 47.000 Kosten + 1.047.534,5 Anteil = 3.916.534,5");
    expect(text).toContain("P1 hält 0 → bekommt noch 3.869.534,5");
    expect(text).toContain("P2 hält 7.786.069 → gibt 3.869.534,5 ab");
    expect(text).toContain("P2 → P1: 3.850.282 kommen an + 19.252 Gebühr = 3.869.534 Belastung");
    expect(text).toContain("Budget 3.869.534,5 → ganzzahlig 3.869.534, Rest 0,5");
    expect(text).toContain("Gebühr = 0,5 % vom ankommenden Betrag, aufgerundet, mindestens 1");
    expect(text).toContain("Rest P1: noch zu erhalten 0,5");
    expect(text).toContain("Rest P2: Überschuss verblieben 0,5");
  });

  it("explains a loss and who pays from their own pocket", () => {
    const { text } = explain({
      name: "Loss",
      type: "TRADING",
      distributionMode: "EQUAL",
      taxEnabled: false,
      members: [
        { id: "a", handle: "A", active: true, revenue: 0, investment: 600 },
        { id: "b", handle: "B", active: true, revenue: 0 },
      ],
    });

    expect(text).toContain("Ergebnis (Verlust) = 0 − 600 − 0 = -600");
    expect(text).toContain("Gleich verteilt auf 2 aktive Spieler: -600 ÷ 2 = -300");
    expect(text).toContain("Bei Verlust ist der Anteil negativ");
    expect(text).toContain("A: 600 Investment + 0 Kosten − 300 Anteil = 300");
    expect(text).toContain("B: 0 Investment + 0 Kosten − 300 Anteil = -300");
    expect(text).toContain("B zahlt 300 aus eigener Tasche");
    expect(text).toContain("B → A: 300 kommen an + 0 Gebühr = 300 Belastung");
  });

  it("explains suspended and proportionally cut fixed amounts", () => {
    const suspended = explain({
      name: "Adjustable loss",
      type: "TRADING",
      distributionMode: "ADJUSTABLE",
      taxEnabled: false,
      members: [
        { id: "alice", handle: "Alice", active: true, revenue: 0, fixedPayout: 200 },
        { id: "bob", handle: "Bob", active: true, revenue: 0, investment: 600 },
      ],
    }).text;
    expect(suspended).toContain(translations.de.fixedAmountsSuspended);
    expect(suspended).toContain("Alice: Fixauszahlung 200 ausgesetzt → 0");

    const scaled = explain({
      name: "Adjustable low profit",
      type: "TRADING",
      distributionMode: "ADJUSTABLE",
      taxEnabled: false,
      members: [
        { id: "alice", handle: "Alice", active: true, revenue: 0, fixedPayout: 400 },
        { id: "carol", handle: "Carol", active: true, revenue: 0, fixedBonus: 200 },
        { id: "bob", handle: "Bob", active: true, revenue: 300 },
      ],
    }).text;
    expect(scaled).toContain(translations.de.fixedAmountsScaled);
    expect(scaled).toContain("Kürzung: 300 ÷ 600 = 50 % jedes Fixbetrags");
    expect(scaled).toContain("Alice: Fixauszahlung 400 × 50 % = 200");
    expect(scaled).toContain("Carol: Fixbonus 200 × 50 % = 100");
  });

  it("lists labelled revenue and investment positions", () => {
    const { text } = explain({
      name: "Positions",
      type: "TRADING",
      distributionMode: "EQUAL",
      taxEnabled: false,
      members: [
        {
          id: "h", handle: "Holder", active: true,
          revenues: [{ label: "Cargo", amount: 700 }, { label: "Bounty", amount: 300 }],
          investments: [{ label: "Hull", amount: 200 }, { label: "Fuel", amount: 100 }],
        },
        { id: "c", handle: "Crew", active: true, revenue: 0 },
      ],
    });

    expect(text).toContain("Holder Umsatz: Cargo 700 + Bounty 300 = 1.000");
    expect(text).toContain("Holder Investments: Hull 200 + Fuel 100 = 300");
  });

  it("describes already recorded transfers in plain language", () => {
    const { sections, text } = explain({
      name: "Recorded",
      type: "TRADING",
      distributionMode: "EQUAL",
      taxEnabled: true,
      taxRate: 0.005,
      members: [
        { id: "a", handle: "A", active: true, revenue: 1_000 },
        { id: "b", handle: "B", active: true, revenue: 0 },
      ],
      paidTransfers: [{ id: "t", label: "Vorschuss", fromMemberId: "a", toMemberId: "b", netAmount: 99, feeAmount: 1, kind: "SESSION_CASH" }],
    });

    expect(sections.map((s) => s.title)).toContain("Bereits erfolgte Überweisungen");
    expect(text).toContain("Vorschuss aus Session-Geld (Vorschuss): A → B 99 + 1 Gebühr = 100");
    expect(text).not.toMatch(/SESSION_CASH|SETTLEMENT|COST_CONTRIBUTION/);
  });

  it("uses English titles and wording for English", () => {
    const { sections, text } = explain(reported, "en");

    expect(sections.map((s) => s.title)).toEqual(["1. Profit", "2. Distribution", "3. Target per player", "4. Transfers"]);
    expect(text).toContain("Profit = 7,786,069 − 2,822,000 − 2,869,000 = 2,095,069");
    expect(text).toContain("P2 → P1: 3,850,282 arrives + 19,252 fee = 3,869,534 charged");
  });
});
