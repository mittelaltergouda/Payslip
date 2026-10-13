import { describe, expect, it } from "vitest";
import { calculatePayslip } from "./calc";
import type { SessionInput } from "./types";

// Labelled revenue and investment positions add up to the member's revenue
// and investment. The sums enter profit, reimbursement and transfers exactly
// like a single amount would.

function session(members: SessionInput["members"], extra: Partial<SessionInput> = {}): SessionInput {
  return { name: "Itemized", type: "TRADING", distributionMode: "EQUAL", taxEnabled: false, members, ...extra };
}

function transferSet(result: ReturnType<typeof calculatePayslip>) {
  return result.suggestedTransfers
    .map((t) => `${t.fromMemberId}->${t.toMemberId}:${t.netAmount}`)
    .sort();
}

describe("itemized revenue and investment positions", () => {
  it("sums positions of several members into profit, targets and transfers", () => {
    const result = calculatePayslip(session([
      {
        id: "holder", handle: "Holder", active: true,
        revenues: [{ label: "Cargo", amount: 700 }, { label: "Bounty", amount: 300 }],
        investments: [{ label: "Cargo purchase", amount: 200 }, { label: "Fuel", amount: 100 }],
      },
      { id: "crew", handle: "Crew", active: true, revenues: [{ label: "Salvage", amount: 50 }], investments: [] },
      { id: "scout", handle: "Scout", active: true, revenue: 0 },
    ]));

    // profit = (700 + 300 + 50) - (200 + 100) = 750 -> 250 each
    expect(result.saleRevenue).toBe(750);
    expect(result.netProfit).toBe(750);
    expect(result.members.map((m) => [m.memberId, m.revenue, m.investment, m.finalNet])).toEqual([
      ["holder", 1_000, 300, 550],
      ["crew", 50, 0, 250],
      ["scout", 0, 0, 250],
    ]);
    // Holder keeps 550 of 1000: 250 to Scout, 200 to Crew (who already holds 50)
    expect(transferSet(result)).toEqual(["holder->crew:200", "holder->scout:250"]);
  });

  it("treats an emptied position list as 0, not as the old single amount", () => {
    const result = calculatePayslip(session([
      { id: "a", handle: "A", active: true, revenue: 999, investment: 500, revenues: [], investments: [] },
      { id: "b", handle: "B", active: true, revenue: 100 },
    ]));

    expect(result.netProfit).toBe(100);
    expect(result.members.map((m) => [m.memberId, m.revenue, m.investment])).toEqual([
      ["a", 0, 0],
      ["b", 100, 0],
    ]);
    expect(transferSet(result)).toEqual(["b->a:50"]);
  });

  it("gives the same result for positions and for the equivalent single amounts", () => {
    const itemized = calculatePayslip(session([
      {
        id: "p", handle: "Pilot", active: true,
        revenues: [{ label: "Run 1", amount: 400_000 }, { label: "Run 2", amount: 500_000 }],
        investments: [{ label: "Hull", amount: 60_000 }, { label: "Fuel", amount: 40_000 }],
      },
      { id: "e", handle: "Escort", active: true, revenue: 0 },
    ], { taxEnabled: true, taxRate: 0.005, individualExpenses: [{ id: "x", memberId: "e", label: "Ammo", amount: 20_000 }] }));
    const scalar = calculatePayslip(session([
      { id: "p", handle: "Pilot", active: true, revenue: 900_000, investment: 100_000 },
      { id: "e", handle: "Escort", active: true, revenue: 0 },
    ], { taxEnabled: true, taxRate: 0.005, individualExpenses: [{ id: "x", memberId: "e", label: "Ammo", amount: 20_000 }] }));

    // profit = 900k - 100k - 20k = 780k -> 390k each; Escort target 20k + 390k = 410k
    expect(itemized.netProfit).toBe(780_000);
    expect(itemized.members.map((m) => m.finalNet)).toEqual([490_000, 410_000]);
    expect(itemized.members).toEqual(scalar.members);
    expect(itemized.suggestedTransfers).toEqual(scalar.suggestedTransfers);
  });

  it("rejects negative and non-finite position amounts", () => {
    for (const amount of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => calculatePayslip(session([
        { id: "a", handle: "A", active: true, investments: [{ label: "Bad", amount }] },
        { id: "b", handle: "B", active: true, revenue: 10 },
      ]))).toThrow();
    }
  });
});
