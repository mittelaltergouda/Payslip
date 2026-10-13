import { describe, expect, it } from "vitest";
import { calculatePayslip } from "./calc";
import type { PayslipResult, SessionInput } from "./types";

// Expected values are derived by hand from the accounting rules:
// profit = revenue - investments - expenses - historical session-cash fees;
// target = own investments + own expenses + funding adjustment + profit share;
// suggested transfers fit net + fee inside an integer sender budget.

const base = { name: "Paid transfers", type: "TRADING", taxEnabled: false } as const;

/**
 * Cash conservation invariant, independent of the implementation:
 * held cash after recorded transfers, plus suggested gross received, minus
 * suggested gross sent, plus the disclosed residual must equal the target.
 * SETTLEMENT moves the sender's gross entitlement, SESSION_CASH moves net cash
 * (the fee leaves the session), COST_CONTRIBUTION is external money.
 */
function expectCashConserved(session: SessionInput, result: PayslipResult): void {
  const held = new Map(result.members.map((m) => [m.memberId, m.revenue]));
  for (const t of session.paidTransfers ?? []) {
    if (t.kind === "COST_CONTRIBUTION") {continue;}
    const gross = t.netAmount + t.feeAmount;
    held.set(t.fromMemberId, held.get(t.fromMemberId)! - gross);
    held.set(t.toMemberId, held.get(t.toMemberId)! + (t.kind === "SESSION_CASH" ? t.netAmount : gross));
  }
  for (const t of result.suggestedTransfers) {
    held.set(t.fromMemberId, held.get(t.fromMemberId)! - t.grossAmount);
    held.set(t.toMemberId, held.get(t.toMemberId)! + t.grossAmount);
  }
  for (const r of result.unsettledBalances ?? []) {
    // Senders never pay more than they owe, so a debtor's residual stays below 1.
    if (r.amount < 0) {expect(r.amount).toBeGreaterThan(-1);}
    held.set(r.memberId, held.get(r.memberId)! + r.amount);
  }
  for (const m of result.members) {
    expect(held.get(m.memberId)).toBeCloseTo(m.finalNet, 9);
  }
}

const targets = (result: PayslipResult) => result.members.map((m) => [m.memberId, m.finalNet]);
const transfers = (result: PayslipResult) =>
  result.suggestedTransfers.map((t) => [t.fromMemberId, t.toMemberId, t.netAmount, t.feeAmount, t.grossAmount]);

describe("funder reimbursement (900k revenue, 100k funded by one player)", () => {
  // profit = 900,000 - 100,000 = 800,000; share 400,000 each
  it("reimburses an individual expense to the player who paid it", () => {
    const session: SessionInput = {
      ...base, distributionMode: "EQUAL",
      members: [
        { id: "pilot", handle: "Pilot", revenue: 900_000 },
        { id: "escort", handle: "Escort", revenue: 0 },
      ],
      individualExpenses: [{ memberId: "pilot", label: "Fuel", amount: 100_000 }],
    };
    const result = calculatePayslip(session);
    expect(result.netProfit).toBe(800_000);
    expect(targets(result)).toEqual([["pilot", 500_000], ["escort", 400_000]]);
    expect(transfers(result)).toEqual([["pilot", "escort", 400_000, 0, 400_000]]);
    expectCashConserved(session, result);
  });

  it("reimburses an investment exactly like an expense", () => {
    const session: SessionInput = {
      ...base, distributionMode: "EQUAL",
      members: [
        { id: "pilot", handle: "Pilot", revenue: 900_000, investment: 100_000 },
        { id: "escort", handle: "Escort", revenue: 0 },
      ],
    };
    const result = calculatePayslip(session);
    expect(result.netProfit).toBe(800_000);
    expect(targets(result)).toEqual([["pilot", 500_000], ["escort", 400_000]]);
    expectCashConserved(session, result);
  });

  it("pays the funder back when another player holds the revenue", () => {
    const session: SessionInput = {
      ...base, distributionMode: "EQUAL",
      members: [
        { id: "pilot", handle: "Pilot", revenue: 900_000 },
        { id: "escort", handle: "Escort", revenue: 0, investment: 100_000 },
      ],
    };
    const result = calculatePayslip(session);
    expect(targets(result)).toEqual([["pilot", 400_000], ["escort", 500_000]]);
    expect(transfers(result)).toEqual([["pilot", "escort", 500_000, 0, 500_000]]);
    expectCashConserved(session, result);
  });

  it("treats shared-expense participants as equal funders (legacy data)", () => {
    // profit = 1,000 - 200 = 800 -> 200 each; B and C each funded 100
    const session: SessionInput = {
      ...base, distributionMode: "EQUAL",
      members: [
        { id: "a", handle: "A", revenue: 1_000 },
        { id: "b", handle: "B" },
        { id: "c", handle: "C" },
        { id: "d", handle: "D" },
      ],
      sharedExpenses: [{ label: "Repairs", amount: 200, participantIds: ["b", "c"] }],
    };
    const result = calculatePayslip(session);
    expect(result.netProfit).toBe(800);
    expect(targets(result)).toEqual([["a", 200], ["b", 300], ["c", 300], ["d", 200]]);
    expectCashConserved(session, result);
  });
});

describe("SESSION_CASH advances", () => {
  // A advances session cash to B, who buys fuel with it.
  // profit = 1,000 - 99 (fuel) - 1 (historical fee) = 900 -> 450 each
  // targets: A 450, B 99 + 450 = 549; held: A 1,000 - 100 = 900, B 99
  const session: SessionInput = {
    ...base, distributionMode: "EQUAL",
    members: [
      { id: "a", handle: "A", revenue: 1_000 },
      { id: "b", handle: "B" },
    ],
    individualExpenses: [{ memberId: "b", label: "Fuel", amount: 99 }],
    paidTransfers: [{ fromMemberId: "a", toMemberId: "b", netAmount: 99, feeAmount: 1, kind: "SESSION_CASH" }],
  };

  it("deducts the historical fee exactly once and settles the remainder", () => {
    const result = calculatePayslip(session);
    expect(result.netProfit).toBe(900);
    expect(targets(result)).toEqual([["a", 450], ["b", 549]]);
    expect(transfers(result)).toEqual([["a", "b", 450, 0, 450]]);
    expect(result.unsettledBalances).toEqual([]);
    expectCashConserved(session, result);
  });

  it("fits the suggested fee into the 450 sender budget when the fee is enabled", () => {
    // net 447 + ceil(447 * 0.005 = 2.235) = 3 -> 450; net 448 would cost 451
    const taxed = { ...session, taxEnabled: true, taxRate: 0.005 };
    const result = calculatePayslip(taxed);
    expect(result.netProfit).toBe(900);
    expect(transfers(result)).toEqual([["a", "b", 447, 3, 450]]);
    expectCashConserved(taxed, result);
  });

  it("handles several senders and receivers with explicit rounding residuals", () => {
    // profit = 1,000 - 2 - 1 = 997 -> 249.25 each
    // held: A 600 - 200 = 400, B 400 - 100 = 300, C 198, D 99
    // balances: A -150.75, B -50.75, C +51.25, D +150.25
    const multi: SessionInput = {
      ...base, distributionMode: "EQUAL",
      members: [
        { id: "a", handle: "A", revenue: 600 },
        { id: "b", handle: "B", revenue: 400 },
        { id: "c", handle: "C" },
        { id: "d", handle: "D" },
      ],
      paidTransfers: [
        { fromMemberId: "a", toMemberId: "c", netAmount: 198, feeAmount: 2, kind: "SESSION_CASH" },
        { fromMemberId: "b", toMemberId: "d", netAmount: 99, feeAmount: 1, kind: "SESSION_CASH" },
      ],
    };
    const result = calculatePayslip(multi);
    expect(result.netProfit).toBe(997);
    expect(result.members.every((m) => m.finalNet === 249.25)).toBe(true);
    expect(transfers(result)).toEqual([
      ["a", "d", 150, 0, 150],
      ["b", "c", 50, 0, 50],
    ]);
    // A -> D: budget floor(150.25) = 150 leaves A -0.75, D +0.25
    // B -> C: budget floor(50.75) = 50 leaves B -0.75, C +1.25
    // Creditor residuals can add up across pairings; they stay disclosed.
    expect(result.unsettledBalances).toEqual([
      { memberId: "a", amount: -0.75 },
      { memberId: "b", amount: -0.75 },
      { memberId: "d", amount: 0.25 },
      { memberId: "c", amount: 1.25 },
    ]);
    expectCashConserved(multi, result);
  });
});

describe("COST_CONTRIBUTION (external money toward another player's costs)", () => {
  it("moves the reimbursement from the buyer to the funder, fee included", () => {
    // profit = 1,201 - 300 - 1 = 900 -> 300 each
    // A 300; B 300 (investment) - 100 (funded by C) + 300 = 500; C 100 + 1 + 300 = 401
    const session: SessionInput = {
      ...base, distributionMode: "EQUAL",
      members: [
        { id: "a", handle: "A", revenue: 1_201 },
        { id: "b", handle: "B", investment: 300 },
        { id: "c", handle: "C" },
      ],
      paidTransfers: [{ fromMemberId: "c", toMemberId: "b", netAmount: 100, feeAmount: 1, kind: "COST_CONTRIBUTION" }],
    };
    const result = calculatePayslip(session);
    expect(result.netProfit).toBe(900);
    expect(targets(result)).toEqual([["a", 300], ["b", 500], ["c", 401]]);
    expect(result.members.reduce((sum, m) => sum + m.finalNet, 0)).toBe(1_201);
    expect(transfers(result)).toEqual([
      ["a", "b", 500, 0, 500],
      ["a", "c", 401, 0, 401],
    ]);
    expectCashConserved(session, result);
  });

  it("splits a loss when the funder financed everything", () => {
    // profit = 100 - 300 - 2 = -202 -> -101 each
    // A 302 - 101 = 201; B 300 - 300 - 101 = -101 -> B pays A 101
    const session: SessionInput = {
      ...base, distributionMode: "EQUAL",
      members: [
        { id: "a", handle: "A", revenue: 100 },
        { id: "b", handle: "B", investment: 300 },
      ],
      paidTransfers: [{ fromMemberId: "a", toMemberId: "b", netAmount: 300, feeAmount: 2, kind: "COST_CONTRIBUTION" }],
    };
    const result = calculatePayslip(session);
    expect(result.netProfit).toBe(-202);
    expect(targets(result)).toEqual([["a", 201], ["b", -101]]);
    expect(transfers(result)).toEqual([["b", "a", 101, 0, 101]]);
    expectCashConserved(session, result);
  });

  it("can fund individual expenses, not only investments", () => {
    // profit = 1,000 - 100 - 1 = 899 -> 449.5 each
    // A 101 + 449.5 = 550.5; B 100 - 100 + 449.5 = 449.5
    const session: SessionInput = {
      ...base, distributionMode: "EQUAL",
      members: [
        { id: "a", handle: "A" },
        { id: "b", handle: "B", revenue: 1_000 },
      ],
      individualExpenses: [{ memberId: "b", label: "Ammo", amount: 100 }],
      paidTransfers: [{ fromMemberId: "a", toMemberId: "b", netAmount: 100, feeAmount: 1, kind: "COST_CONTRIBUTION" }],
    };
    const result = calculatePayslip(session);
    expect(result.netProfit).toBe(899);
    expect(targets(result)).toEqual([["a", 550.5], ["b", 449.5]]);
    expectCashConserved(session, result);
  });

  it("rejects a contribution larger than the recipient's recorded costs", () => {
    const session: SessionInput = {
      ...base, distributionMode: "EQUAL",
      members: [
        { id: "a", handle: "A", revenue: 1_000 },
        { id: "b", handle: "B", investment: 50 },
      ],
      individualExpenses: [{ memberId: "b", label: "Ammo", amount: 50 }],
      paidTransfers: [{ fromMemberId: "a", toMemberId: "b", netAmount: 101, feeAmount: 1, kind: "COST_CONTRIBUTION" }],
    };
    expect(() => calculatePayslip(session)).toThrow();
  });
});

describe("recorded SETTLEMENT payouts", () => {
  it("continues the reported fixture after a partial payout without deducting its fee twice", () => {
    // P2 already sent P1 1,000,000 + 5,000 fee. Remaining budget:
    // 3,869,534.5 - 1,005,000 = 2,864,534.5 -> integer budget 2,864,534
    // net 2,850,282 + ceil(14,251.41) = 14,252 -> 2,864,534
    const session: SessionInput = {
      ...base, distributionMode: "EQUAL", taxEnabled: true, taxRate: 0.005,
      members: [
        { id: "p1", handle: "P1", revenue: 0 },
        { id: "p2", handle: "P2", revenue: 7_786_069, investment: 2_822_000 },
      ],
      individualExpenses: [
        { memberId: "p1", label: "Funded cost", amount: 2_822_000 },
        { memberId: "p2", label: "Funded cost", amount: 47_000 },
      ],
      paidTransfers: [{ fromMemberId: "p2", toMemberId: "p1", netAmount: 1_000_000, feeAmount: 5_000 }],
    };
    const result = calculatePayslip(session);
    expect(result.netProfit).toBe(2_095_069);
    expect(targets(result)).toEqual([["p1", 3_869_534.5], ["p2", 3_916_534.5]]);
    expect(transfers(result)).toEqual([["p2", "p1", 2_850_282, 14_252, 2_864_534]]);
    expect(result.unsettledBalances).toEqual([
      { memberId: "p2", amount: -0.5 },
      { memberId: "p1", amount: 0.5 },
    ]);
    expectCashConserved(session, result);
  });
});
