import { describe, expect, it } from "vitest";
import { calculatePayslip } from "./calc";
import type { SessionInput } from "./types";

// Agreed ADJUSTABLE rule (variant B):
// - profit >= all fixed amounts: fixed payouts and fixed bonuses first (unchanged)
// - 0 <= profit < fixed amounts: fixed amounts are cut proportionally to the
//   available profit; pool members get 0, never a negative share
// - loss: fixed amounts are suspended, every active member bears the loss
//   equally; funders are still reimbursed their investments and costs first

function adjustable(members: SessionInput["members"], extra: Partial<SessionInput> = {}): SessionInput {
  return {
    name: "Adjustable fixed amounts",
    type: "TRADING",
    distributionMode: "ADJUSTABLE",
    taxEnabled: false,
    members,
    ...extra,
  };
}

function shares(result: ReturnType<typeof calculatePayslip>) {
  return result.members.map((m) => [m.memberId, m.profitShare]);
}

function transfers(result: ReturnType<typeof calculatePayslip>) {
  return result.suggestedTransfers.map((t) => [t.fromMemberId, t.toMemberId, t.netAmount]);
}

describe("ADJUSTABLE fixed amounts on loss and low profit", () => {
  it("suspends a fixed payout on a loss and splits the loss equally", () => {
    const result = calculatePayslip(adjustable([
      { id: "alice", handle: "Alice", active: true, revenue: 0, fixedPayout: 200 },
      { id: "bob", handle: "Bob", active: true, revenue: 0, investment: 600 },
    ]));

    expect(result.netProfit).toBe(-600);
    expect(shares(result)).toEqual([["alice", -300], ["bob", -300]]);
    // Bob is reimbursed 600 and bears 300 of the loss; Alice pays her 300.
    expect(result.members.map((m) => m.finalNet)).toEqual([-300, 300]);
    expect(transfers(result)).toEqual([["alice", "bob", 300]]);
    expect(result.fixedAmountsStatus).toBe("SUSPENDED_FOR_LOSS");
  });

  it("ignores fixed bonuses and percentages on a loss: every active member bears the same", () => {
    const result = calculatePayslip(adjustable([
      { id: "a", handle: "A", active: true, revenue: 0, investment: 1_000, percentShare: 70, fixedBonus: 100 },
      { id: "b", handle: "B", active: true, revenue: 0, percentShare: 30 },
      { id: "c", handle: "C", active: true, revenue: 0, fixedPayout: 50 },
    ]));

    expect(result.netProfit).toBe(-1_000);
    expect(result.members.map((m) => m.profitShare)).toEqual([-1_000 / 3, -1_000 / 3, -1_000 / 3]);
    expect(result.members[0].finalNet).toBeCloseTo(2_000 / 3, 9);
    expect(result.fixedAmountsStatus).toBe("SUSPENDED_FOR_LOSS");
  });

  it("shares a loss only among active members", () => {
    const result = calculatePayslip(adjustable([
      { id: "a", handle: "A", active: true, revenue: 0, investment: 900, fixedPayout: 100 },
      { id: "b", handle: "B", active: true, revenue: 0 },
      { id: "c", handle: "C", active: true, revenue: 0 },
      { id: "x", handle: "X", active: false, revenue: 0, fixedPayout: 500 },
    ]));

    expect(result.netProfit).toBe(-900);
    expect(shares(result)).toEqual([["a", -300], ["b", -300], ["c", -300], ["x", 0]]);
  });

  it("cuts fixed payouts and bonuses proportionally when profit cannot cover them", () => {
    const result = calculatePayslip(adjustable([
      { id: "alice", handle: "Alice", active: true, revenue: 0, fixedPayout: 400 },
      { id: "carol", handle: "Carol", active: true, revenue: 0, fixedBonus: 200 },
      { id: "bob", handle: "Bob", active: true, revenue: 300 },
    ]));

    // 300 available for 600 fixed: factor 0.5
    expect(result.netProfit).toBe(300);
    expect(shares(result)).toEqual([["alice", 200], ["carol", 100], ["bob", 0]]);
    expect(result.fixedAmountsStatus).toBe("SCALED_TO_PROFIT");
  });

  it("pays nothing when there is exactly zero profit", () => {
    const result = calculatePayslip(adjustable([
      { id: "alice", handle: "Alice", active: true, revenue: 0, fixedPayout: 200 },
      { id: "bob", handle: "Bob", active: true, revenue: 100, investment: 100 },
    ]));

    expect(result.netProfit).toBe(0);
    expect(shares(result)).toEqual([["alice", 0], ["bob", 0]]);
    expect(result.members.map((m) => m.finalNet)).toEqual([0, 100]);
    expect(result.suggestedTransfers).toEqual([]);
    expect(result.fixedAmountsStatus).toBe("SCALED_TO_PROFIT");
  });

  it("applies fixed amounts in full when profit exactly covers them", () => {
    const result = calculatePayslip(adjustable([
      { id: "alice", handle: "Alice", active: true, revenue: 600, fixedPayout: 400 },
      { id: "carol", handle: "Carol", active: true, revenue: 0, fixedBonus: 200 },
      { id: "bob", handle: "Bob", active: true, revenue: 0 },
    ]));

    expect(shares(result)).toEqual([["alice", 400], ["carol", 200], ["bob", 0]]);
    expect(result.fixedAmountsStatus).toBe("APPLIED");
  });

  it("keeps the normal profit order when profit exceeds the fixed amounts", () => {
    const result = calculatePayslip(adjustable([
      { id: "alice", handle: "Alice", active: true, revenue: 1_000, fixedPayout: 200 },
      { id: "carol", handle: "Carol", active: true, revenue: 0, fixedBonus: 100 },
      { id: "bob", handle: "Bob", active: true, revenue: 0 },
    ]));

    // pool 1000 - 200 - 100 = 700, split equally; Carol adds her bonus
    expect(shares(result)).toEqual([["alice", 200], ["carol", 450], ["bob", 350]]);
    expect(result.fixedAmountsStatus).toBe("APPLIED");
  });

  it("leaves losses without fixed amounts unchanged and sets no status", () => {
    const result = calculatePayslip(adjustable([
      { id: "a", handle: "A", active: true, revenue: 0, investment: 1_000, percentShare: 75 },
      { id: "b", handle: "B", active: true, revenue: 0, percentShare: 25 },
    ]));

    expect(shares(result)).toEqual([["a", -750], ["b", -250]]);
    expect(result.fixedAmountsStatus).toBeUndefined();
  });

  it("sets no status outside ADJUSTABLE mode", () => {
    const result = calculatePayslip({
      ...adjustable([
        { id: "a", handle: "A", active: true, revenue: 0, investment: 100 },
        { id: "b", handle: "B", active: true, revenue: 0 },
      ]),
      distributionMode: "EQUAL",
    });

    expect(result.fixedAmountsStatus).toBeUndefined();
  });

  it("conserves cash in every case: targets add up to the money held", () => {
    const result = calculatePayslip(adjustable([
      { id: "a", handle: "A", active: true, revenue: 250, investment: 400, fixedPayout: 300 },
      { id: "b", handle: "B", active: true, revenue: 50, fixedBonus: 80 },
      { id: "c", handle: "C", active: true, revenue: 0 },
    ], {
      individualExpenses: [{ id: "e", memberId: "c", label: "Fuel", amount: 120 }],
    }));

    // net = 300 - 400 - 120 = -220 -> loss, fixed amounts suspended
    expect(result.netProfit).toBe(-220);
    expect(result.fixedAmountsStatus).toBe("SUSPENDED_FOR_LOSS");
    const targets = result.members.reduce((sum, m) => sum + m.finalNet, 0);
    expect(targets).toBeCloseTo(300, 9);
  });
});
