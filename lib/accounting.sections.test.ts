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
    expect(text).toContain("P2 → P1: Amount 3.850.282 + Service Fee 19.252 = Total Cost 3.869.534");
    expect(text).toContain("Budget 3.869.534,5 → ganzzahlig 3.869.534, Rest 0,5");
    expect(text).toContain("Service Fee = 0,5 % vom Amount (kommt beim Empfänger an), aufgerundet");
    // Sub-aUEC rounding is explained by the budget line, not listed per player.
    expect(text).not.toContain("Rest P1");
    expect(text).not.toContain("Rest P2");
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
    expect(text).toContain("B → A: Amount 300 + Service Fee 0 = Total Cost 300");
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
    expect(text).toContain("Vorschuss aus Session-Geld (Vorschuss): A → B: Amount 99 + Service Fee 1 = Total Cost 100");
    expect(text).not.toMatch(/SESSION_CASH|SETTLEMENT|COST_CONTRIBUTION/);
  });

  it("uses English titles and wording for English", () => {
    const { sections, text } = explain(reported, "en");

    expect(sections.map((s) => s.title)).toEqual(["1. Profit", "2. Distribution", "3. Target per player", "4. Transfers"]);
    expect(text).toContain("Profit = 7,786,069 − 2,822,000 − 2,869,000 = 2,095,069");
    expect(text).toContain("P2 → P1: Amount 3,850,282 + Service Fee 19,252 = Total Cost 3,869,534");
  });
});

describe("structured rows for tabular output", () => {
  const session: SessionInput = {
    name: "Rows", type: "TRADING", distributionMode: "PERCENT", taxEnabled: true, taxRate: 0.005,
    members: [
      { id: "a", handle: "A", percentShare: 50, revenue: 1_000_000 },
      { id: "b", handle: "B", percentShare: 50 },
    ],
    paidTransfers: [{ id: "t", fromMemberId: "a", toMemberId: "b", netAmount: 100_000, feeAmount: 500, feeIncluded: true, kind: "SETTLEMENT" }],
  };

  it("keeps the UI lines and the table rows identical", () => {
    for (const section of explain(session).sections) {
      expect(section.lines).toEqual(section.rows.map((row) => row.text));
    }
  });

  it("splits calculations into label, expression and result", () => {
    const rows = explain(session).sections.flatMap((s) => s.rows);
    expect(rows).toContainEqual({ text: "Gewinn = 1.000.000 − 0 − 0 = 1.000.000", label: "Gewinn", expression: "1.000.000 − 0 − 0", result: "1.000.000", emphasis: true });
    expect(rows).toContainEqual(expect.objectContaining({ label: "A", expression: "1.000.000 × 50 %", result: "500.000" }));
    expect(rows).toContainEqual(expect.objectContaining({ label: "A → B", expression: expect.stringMatching(/^Amount [\d.]+ \+ Service Fee [\d.]+$/), result: expect.stringMatching(/^Total Cost /) }));
  });

  it("marks outcomes and rounding with the right joiner and keeps notes label-free", () => {
    const rows = explain(session).sections.flatMap((s) => s.rows);
    const holds = rows.find((row) => row.expression?.startsWith("hält 1.000.000"));
    expect(holds).toMatchObject({ label: "A", joiner: "→", result: expect.stringMatching(/^gibt .* ab$/) });
    const notes = rows.filter((row) => !row.label);
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((row) => row.result === undefined)).toBe(true);
  });

  it("explains the fee rule before the transfers instead of after them", () => {
    const transfers = explain(session).sections.at(-1)!;
    const ruleIndex = transfers.lines.findIndex((line) => line.startsWith("Service Fee = 0,5 %"));
    const firstTransfer = transfers.rows.findIndex((row) => row.label === "A → B");
    expect(ruleIndex).toBeGreaterThanOrEqual(0);
    expect(ruleIndex).toBeLessThan(firstTransfer);
  });
});
