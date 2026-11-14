import { describe, expect, it } from "vitest";
import { calculatePayslip } from "./calc";
import type { SessionInput } from "./types";

// aUEC only move in whole units, but shares and targets stay exact so every
// player can recompute them by hand. Only the actual transfers are rounded
// down; what cannot be transferred is reported as unsettled, never dropped.

function session(overrides: Partial<SessionInput>): SessionInput {
  return {
    name: "Whole aUEC transfers",
    type: "TRADING",
    distributionMode: "EQUAL",
    taxEnabled: false,
    members: [],
    ...overrides,
  };
}

function expectUnsettledSumsToZero(result: ReturnType<typeof calculatePayslip>) {
  const sum = (result.unsettledBalances ?? []).reduce((total, b) => total + b.amount, 0);
  expect(sum).toBeCloseTo(0, 9);
}

describe("exact shares, whole-aUEC transfers", () => {
  it("keeps an uneven equal split exact and floors only the transfers", () => {
    const result = calculatePayslip(session({
      members: [
        { id: "a", handle: "A", active: true, revenue: 1_000 },
        { id: "b", handle: "B", active: true, revenue: 0 },
        { id: "c", handle: "C", active: true, revenue: 0 },
      ],
    }));

    expect(result.members.map((m) => m.profitShare)).toEqual([1_000 / 3, 1_000 / 3, 1_000 / 3]);
    expect(result.settlementDetails?.map((d) => [d.fromMemberId, d.toMemberId, d.netAmount])).toEqual([
      ["a", "b", 333],
      ["a", "c", 333],
    ]);
    const unsettled = new Map((result.unsettledBalances ?? []).map((b) => [b.memberId, b.amount]));
    expect(unsettled.get("a")).toBeCloseTo(-2 / 3, 9);
    expect(unsettled.get("b")).toBeCloseTo(1 / 3, 9);
    expect(unsettled.get("c")).toBeCloseTo(1 / 3, 9);
    expectUnsettledSumsToZero(result);
  });

  it("keeps loss shares exact as well", () => {
    const result = calculatePayslip(session({
      members: [
        { id: "a", handle: "A", active: true, revenue: 0, investment: 1_000 },
        { id: "b", handle: "B", active: true, revenue: 0 },
        { id: "c", handle: "C", active: true, revenue: 0 },
      ],
    }));

    expect(result.netProfit).toBe(-1_000);
    expect(result.members.map((m) => m.profitShare)).toEqual([-1_000 / 3, -1_000 / 3, -1_000 / 3]);
    // A is reimbursed 1000 and bears a third of the loss: target 666.67, holds 0.
    expect(result.members[0].finalNet).toBeCloseTo(2_000 / 3, 9);
    expectUnsettledSumsToZero(result);
  });

  it("moves only whole aUEC in every suggested transfer, fees included", () => {
    const result = calculatePayslip(session({
      distributionMode: "PERCENT",
      taxEnabled: true,
      taxRate: 0.005,
      members: [
        { id: "a", handle: "A", active: true, revenue: 98_765, investment: 1_234, percentShare: 41 },
        { id: "b", handle: "B", active: true, revenue: 12_345, percentShare: 29 },
        { id: "c", handle: "C", active: true, revenue: 0, percentShare: 17 },
        { id: "d", handle: "D", active: true, revenue: 7, percentShare: 13 },
      ],
      individualExpenses: [{ id: "e", memberId: "c", label: "Fuel", amount: 3_333 }],
    }));

    const totalShares = result.members.reduce((sum, m) => sum + m.profitShare, 0);
    expect(totalShares).toBeCloseTo(result.netProfit, 9);
    expect(result.settlementDetails?.length).toBeGreaterThan(0);
    for (const detail of result.settlementDetails ?? []) {
      expect(Number.isInteger(detail.netAmount)).toBe(true);
      expect(Number.isInteger(detail.feeAmount)).toBe(true);
      expect(Number.isInteger(detail.grossAmount)).toBe(true);
      expect(detail.grossAmount).toBe(detail.netAmount + detail.feeAmount);
      expect(detail.budgetAmount).toBe(detail.netAmount);
    }
    for (const transfer of result.suggestedTransfers) {
      expect(Number.isInteger(transfer.netAmount)).toBe(true);
      expect(Number.isInteger(transfer.feeAmount)).toBe(true);
      expect(Number.isInteger(transfer.grossAmount)).toBe(true);
    }
  });
});
