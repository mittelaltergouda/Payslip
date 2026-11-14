import { describe, expect, it } from "vitest";
import { calculatePayslip } from "./calc";
import type { SessionInput } from "./types";

// Agreed ADJUSTABLE rule (variant B):
// - profit >= all fixed amounts: fixed payouts and fixed bonuses first (unchanged)
// - 0 <= profit < fixed amounts: fixed amounts are cut proportionally to the
//   available profit; pool members get 0, never a negative share
// - loss: fixed amounts are suspended; the loss follows the same key as profit
//   (pool percentages if set, otherwise equal among pool members). Fixed-payout
//   members get 0 (no payout, no loss). If every active member has a fixed
//   payout, all of them share the loss equally. Funders are still reimbursed
//   their investments and costs first.

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
  it("suspends a fixed payout on a loss: the fixed member gets 0, the pool bears the loss", () => {
    const result = calculatePayslip(adjustable([
      { id: "alice", handle: "Alice", active: true, revenue: 0, fixedPayout: 200 },
      { id: "bob", handle: "Bob", active: true, revenue: 0, investment: 600 },
    ]));

    expect(result.netProfit).toBe(-600);
    expect(shares(result)).toEqual([["alice", 0], ["bob", -600]]);
    // Bob is reimbursed 600 and bears the whole 600 loss; Alice neither gains nor pays.
    expect(result.members.map((m) => m.finalNet)).toEqual([0, 0]);
    expect(transfers(result)).toEqual([]);
    expect(result.fixedAmountsStatus).toBe("SUSPENDED_FOR_LOSS");
  });

  it("shares a loss by pool percentages, ignoring fixed bonuses", () => {
    const result = calculatePayslip(adjustable([
      { id: "a", handle: "A", active: true, revenue: 0, investment: 1_000, percentShare: 70, fixedBonus: 100 },
      { id: "b", handle: "B", active: true, revenue: 0, percentShare: 30 },
      { id: "c", handle: "C", active: true, revenue: 0, fixedPayout: 50 },
    ]));

    expect(result.netProfit).toBe(-1_000);
    expect(shares(result)).toEqual([["a", -700], ["b", -300], ["c", 0]]);
    // A is reimbursed 1000 and bears 700; B pays A her 300.
    expect(result.members.map((m) => m.finalNet)).toEqual([300, -300, 0]);
    expect(transfers(result)).toEqual([["b", "a", 300]]);
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
    expect(shares(result)).toEqual([["a", 0], ["b", -450], ["c", -450], ["x", 0]]);
  });

  it("does not let a tiny fixed bonus change how a loss is split", () => {
    const base = [
      { id: "a", handle: "A", active: true, revenue: 0, investment: 1_000, percentShare: 70 },
      { id: "b", handle: "B", active: true, revenue: 0, percentShare: 30 },
    ];
    const withoutBonus = calculatePayslip(adjustable(base));
    const withBonus = calculatePayslip(adjustable([{ ...base[0], fixedBonus: 1 }, base[1]]));

    expect(shares(withoutBonus)).toEqual([["a", -700], ["b", -300]]);
    expect(shares(withBonus)).toEqual([["a", -700], ["b", -300]]);
    expect(withBonus.fixedAmountsStatus).toBe("SUSPENDED_FOR_LOSS");
  });

  it("splits a loss equally when every active member has a fixed payout", () => {
    const result = calculatePayslip(adjustable([
      { id: "a", handle: "A", active: true, revenue: 0, investment: 600, fixedPayout: 100 },
      { id: "b", handle: "B", active: true, revenue: 0, fixedPayout: 100 },
    ]));

    expect(result.netProfit).toBe(-600);
    expect(shares(result)).toEqual([["a", -300], ["b", -300]]);
    expect(transfers(result)).toEqual([["b", "a", 300]]);
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

  it("splits profit equally when percentages are set but all of them are 0", () => {
    const result = calculatePayslip(adjustable([
      { id: "a", handle: "A", active: true, revenue: 1_000, percentShare: 0 },
      { id: "b", handle: "B", active: true, revenue: 0 },
    ]));

    // No usable percentages: nothing may vanish, the pool splits equally.
    expect(shares(result)).toEqual([["a", 500], ["b", 500]]);
    expect(transfers(result)).toEqual([["a", "b", 500]]);
  });

  it("shares profit left over after fixed payouts equally when nobody is in the pool", () => {
    const result = calculatePayslip(adjustable([
      { id: "a", handle: "A", active: true, revenue: 1_000, fixedPayout: 100 },
      { id: "b", handle: "B", active: true, revenue: 0, fixedPayout: 100 },
    ]));

    // 1000 - 200 fixed = 800 left, nobody in the pool: 400 each on top
    expect(shares(result)).toEqual([["a", 500], ["b", 500]]);
    expect(transfers(result)).toEqual([["a", "b", 500]]);
    expect(result.fixedAmountsStatus).toBe("APPLIED");
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

    // net = 300 - 400 - 120 = -220 -> loss, fixed amounts suspended;
    // A (fixed payout) gets 0, B and C share equally: -110 each
    expect(result.netProfit).toBe(-220);
    expect(shares(result)).toEqual([["a", 0], ["b", -110], ["c", -110]]);
    expect(result.fixedAmountsStatus).toBe("SUSPENDED_FOR_LOSS");
    const targets = result.members.reduce((sum, m) => sum + m.finalNet, 0);
    expect(targets).toBeCloseTo(300, 9);
  });
});
