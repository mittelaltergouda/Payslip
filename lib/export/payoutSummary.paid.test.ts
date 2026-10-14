import { describe, expect, it } from "vitest";
import { calculatePayslip } from "../calc";
import { getMemberPayoutSummaries } from "./payoutSummary";
import type { SessionInput } from "../types";

// Export payouts (PDF, CSV, clipboard) must include transfers that already
// happened: SETTLEMENT and SESSION_CASH move cash (sender pays net + fee,
// recipient gets net; every fee is a shared cost), a COST_CONTRIBUTION is
// outside money and does not change session holdings.

const twoPlayers = (extra: Partial<SessionInput>): SessionInput => ({
  name: "Paid",
  type: "TRADING",
  distributionMode: "EQUAL",
  taxEnabled: false,
  members: [
    { id: "a", handle: "A", active: true, revenue: 1_000 },
    { id: "b", handle: "B", active: true, revenue: 0 },
  ],
  ...extra,
});

function payouts(session: SessionInput) {
  return getMemberPayoutSummaries(calculatePayslip(session)).map((s) => [s.memberId, s.netPayout, s.transferFeesDeducted]);
}

describe("payout summaries with recorded transfers", () => {
  it("counts a recorded settlement payout", () => {
    expect(payouts(twoPlayers({
      paidTransfers: [{ fromMemberId: "a", toMemberId: "b", netAmount: 300, feeAmount: 0 }],
    }))).toEqual([["a", 500, 0], ["b", 500, 0]]);
  });

  it("shares the recorded settlement fee instead of charging it to the recipient", () => {
    // fees 1 paid + 2 suggested -> profit 997 -> 498.5 each, 1.5 fees each;
    // paid 99 + 1, suggested 399 + 2: A 1000 - 100 - 401 = 499, B 99 + 399 = 498
    expect(payouts(twoPlayers({
      taxEnabled: true,
      taxRate: 0.005,
      paidTransfers: [{ fromMemberId: "a", toMemberId: "b", netAmount: 99, feeAmount: 1 }],
    }))).toEqual([["a", 499, 1.5], ["b", 498, 1.5]]);
  });

  it("treats the fee of a session advance the same way", () => {
    expect(payouts(twoPlayers({
      taxEnabled: true,
      taxRate: 0.005,
      paidTransfers: [{ fromMemberId: "a", toMemberId: "b", netAmount: 99, feeAmount: 1, kind: "SESSION_CASH" }],
    }))).toEqual([["a", 499, 1.5], ["b", 498, 1.5]]);
  });

  it("leaves session holdings untouched by an external cost contribution", () => {
    // A invested 300, B paid 100 + 1 of it: targets A 549.5, B 450.5; A sends B 450.
    // The contribution fee is shared too: 0.5 each.
    expect(payouts(twoPlayers({
      members: [
        { id: "a", handle: "A", active: true, revenue: 1_000, investment: 300 },
        { id: "b", handle: "B", active: true, revenue: 0 },
      ],
      paidTransfers: [{ fromMemberId: "b", toMemberId: "a", netAmount: 100, feeAmount: 1, kind: "COST_CONTRIBUTION" }],
    }))).toEqual([["a", 550, 0.5], ["b", 450, 0.5]]);
  });
});
