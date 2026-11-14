import { describe, expect, it } from "vitest";
import { calculatePayslip } from "./calc";
import { getMemberPayoutSummaries } from "./export/payoutSummary";
import type { PayslipResult, SessionInput } from "./types";

// Service fees of every transfer (already made and suggested) are a shared
// session cost: they reduce profit before the split, the recipient always gets
// the full amount and the sender pays the fee on top.

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const allFees = (session: SessionInput, result: PayslipResult) =>
  sum((session.paidTransfers ?? []).map((t) => t.feeAmount)) + sum(result.suggestedTransfers.map((t) => t.feeAmount));

/** Everyone ends up within a few aUEC of their target (whole-aUEC rounding only). */
function expectEveryoneAtTarget(result: PayslipResult, tolerance = 2): void {
  for (const payout of getMemberPayoutSummaries(result)) {
    const member = result.members.find((m) => m.memberId === payout.memberId)!;
    expect(Math.abs(payout.netPayout - member.finalNet)).toBeLessThanOrEqual(tolerance);
  }
}

/** The money that leaves the crew is exactly the fees; nothing else disappears. */
function expectCashConserved(session: SessionInput, result: PayslipResult): void {
  const finalCash = sum(getMemberPayoutSummaries(result).map((p) => p.netPayout));
  expect(finalCash).toBe(sum(result.members.map((m) => m.revenue)) - allFees(session, result));
}

const crew = (extra: Partial<SessionInput> = {}): SessionInput => ({
  name: "Shared fees",
  type: "TRADING",
  distributionMode: "EQUAL",
  taxEnabled: true,
  taxRate: 0.005,
  members: [
    { id: "a", handle: "A", revenue: 1_000_000 },
    { id: "b", handle: "B", revenue: 300_000, investment: 100_000 },
    { id: "c", handle: "C" },
    { id: "d", handle: "D" },
  ],
  ...extra,
});

describe("service fees shared by the crew", () => {
  it("deducts every fee from profit and spreads it like the profit", () => {
    const session = crew();
    const result = calculatePayslip(session);
    const fees = allFees(session, result);

    expect(fees).toBeGreaterThan(0);
    expect(result.suggestedTransferFees).toBe(fees);
    expect(result.netProfit).toBe(1_300_000 - 100_000 - fees);
    expect(result.members.map((m) => m.serviceFeeShare)).toEqual([fees / 4, fees / 4, fees / 4, fees / 4]);
    expectEveryoneAtTarget(result);
    expectCashConserved(session, result);
  });

  it("pays each recipient the full amount; only senders pay fees", () => {
    const result = calculatePayslip(crew());
    for (const transfer of result.suggestedTransfers) {
      expect(transfer.grossAmount).toBe(transfer.netAmount + transfer.feeAmount);
      expect(transfer.feeAmount).toBe(Math.ceil(transfer.netAmount * 0.005));
    }
    const payouts = getMemberPayoutSummaries(result);
    for (const id of ["c", "d"]) {
      const member = result.members.find((m) => m.memberId === id)!;
      const received = sum(result.suggestedTransfers.filter((t) => t.toMemberId === id).map((t) => t.netAmount));
      expect(payouts.find((p) => p.memberId === id)?.netPayout).toBe(received);
      expect(received).toBe(Math.floor(member.finalNet));
    }
  });

  it("shares recorded settlement, advance and contribution fees the same way", () => {
    for (const kind of ["SETTLEMENT", "SESSION_CASH"] as const) {
      const session = crew({ paidTransfers: [{ fromMemberId: "a", toMemberId: "c", netAmount: 200_000, feeAmount: 1_000, kind }] });
      const result = calculatePayslip(session);
      const fees = allFees(session, result);
      expect(result.paidTransferFees).toBe(1_000);
      expect(result.netProfit).toBe(1_200_000 - fees);
      expect(result.members.map((m) => m.serviceFeeShare)).toEqual([fees / 4, fees / 4, fees / 4, fees / 4]);
      expectEveryoneAtTarget(result);
      expectCashConserved(session, result);
    }
  });

  it("gives the same result whether a settlement was already paid or is still suggested", () => {
    // Paying part of the settlement early must not shift who bears which fee.
    const open = calculatePayslip(crew());
    const first = open.suggestedTransfers[0];
    const partial = { ...first, netAmount: 100_000, feeAmount: Math.ceil(100_000 * 0.005) };
    const paidEarly = calculatePayslip(crew({ paidTransfers: [{ ...partial, kind: "SETTLEMENT" }] }));
    const shares = (r: PayslipResult) => r.members.map((m) => m.profitShare);
    for (const [early, later] of shares(paidEarly).map((share, i) => [share, shares(open)[i]])) {
      expect(Math.abs(early - later)).toBeLessThanOrEqual(1);
    }
  });

  it("splits the fees by percentage in PERCENT mode", () => {
    const session = crew({
      distributionMode: "PERCENT",
      members: [
        { id: "a", handle: "A", revenue: 1_000_000, percentShare: 50 },
        { id: "b", handle: "B", percentShare: 30 },
        { id: "c", handle: "C", percentShare: 20 },
      ],
    });
    const result = calculatePayslip(session);
    const fees = allFees(session, result);
    const [a, b, c] = result.members.map((m) => m.serviceFeeShare ?? 0);
    expect(a).toBeCloseTo(fees * 0.5, 9);
    expect(b).toBeCloseTo(fees * 0.3, 9);
    expect(c).toBeCloseTo(fees * 0.2, 9);
    expectEveryoneAtTarget(result);
    expectCashConserved(session, result);
  });

  it("gives inactive members no part of the fees", () => {
    const session = crew({
      members: [
        { id: "a", handle: "A", revenue: 1_000_000 },
        { id: "b", handle: "B" },
        { id: "z", handle: "Z", active: false, investment: 50_000 },
      ],
    });
    const result = calculatePayslip(session);
    const fees = allFees(session, result);
    expect(result.members.map((m) => m.serviceFeeShare)).toEqual([fees / 2, fees / 2, 0]);
    expectEveryoneAtTarget(result);
    expectCashConserved(session, result);
  });

  it("scales fixed payouts when the fees eat into a profit they fully used", () => {
    const session = crew({
      distributionMode: "ADJUSTABLE",
      members: [
        { id: "a", handle: "A", revenue: 1_000, fixedPayout: 0 },
        { id: "b", handle: "B", fixedPayout: 600 },
        { id: "c", handle: "C", fixedPayout: 400 },
      ],
    });
    const result = calculatePayslip(session);
    const fees = allFees(session, result);
    expect(result.fixedAmountsStatus).toBe("SCALED_TO_PROFIT");
    expect(result.netProfit).toBe(1_000 - fees);
    expect(sum(result.members.map((m) => m.serviceFeeShare ?? 0))).toBeCloseTo(fees, 9);
    expectEveryoneAtTarget(result);
    expectCashConserved(session, result);
  });

  it("charges nothing and changes nothing when the service fee is off", () => {
    const result = calculatePayslip(crew({ taxEnabled: false }));
    expect(result.suggestedTransferFees).toBe(0);
    expect(result.netProfit).toBe(1_200_000);
    expect(result.members.map((m) => m.serviceFeeShare)).toEqual([0, 0, 0, 0]);
    expect(result.members.map((m) => m.finalNet)).toEqual([300_000, 400_000, 300_000, 300_000]);
    expectEveryoneAtTarget(result, 0);
  });

  it.each([0.05, 0.2, 0.5, 0.9])("settles to the targets at a high fee rate of %s", (taxRate) => {
    const session = crew({ taxRate });
    const result = calculatePayslip(session);
    expect(result.netProfit).toBe(1_200_000 - allFees(session, result));
    expectEveryoneAtTarget(result, 3);
    expectCashConserved(session, result);
  });

  it("shares the fees of a loss session too", () => {
    const session = crew({
      members: [
        { id: "a", handle: "A", revenue: 100_000, investment: 500_000 },
        { id: "b", handle: "B", revenue: 50_000 },
      ],
    });
    const result = calculatePayslip(session);
    const fees = allFees(session, result);
    expect(result.netProfit).toBe(-350_000 - fees);
    expect(result.members.map((m) => m.serviceFeeShare)).toEqual([fees / 2, fees / 2]);
    expectEveryoneAtTarget(result);
    expectCashConserved(session, result);
  });
});
