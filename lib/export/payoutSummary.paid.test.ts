import { describe, expect, it } from "vitest";
import { calculatePayslip } from "../calc";
import { getMemberPayoutSummaries } from "./payoutSummary";
import type { SessionInput } from "../types";

// Export payouts (PDF, CSV, clipboard) must include transfers that already
// happened: SETTLEMENT and SESSION_CASH move cash (sender pays net + fee,
// recipient gets net; a SETTLEMENT fee is borne by the recipient), a
// COST_CONTRIBUTION is outside money and does not change session holdings.

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

  it("charges the recorded settlement fee to the recipient", () => {
    // paid 99 + 1, suggested 398 + 2: A 1000 - 100 - 400, B 99 + 398, B's fees 1 + 2
    expect(payouts(twoPlayers({
      taxEnabled: true,
      taxRate: 0.005,
      paidTransfers: [{ fromMemberId: "a", toMemberId: "b", netAmount: 99, feeAmount: 1 }],
    }))).toEqual([["a", 500, 0], ["b", 497, 3]]);
  });

  it("moves the cash of a session advance without charging its fee to the recipient", () => {
    // profit 1000 - 1 = 999 -> 499.5 each; A holds 900, B 99; suggested 398 + 2
    expect(payouts(twoPlayers({
      taxEnabled: true,
      taxRate: 0.005,
      paidTransfers: [{ fromMemberId: "a", toMemberId: "b", netAmount: 99, feeAmount: 1, kind: "SESSION_CASH" }],
    }))).toEqual([["a", 500, 0], ["b", 497, 2]]);
  });

  it("leaves session holdings untouched by an external cost contribution", () => {
    // A invested 300, B paid 100 + 1 of it: targets A 549.5, B 450.5; A sends B 450
    expect(payouts(twoPlayers({
      members: [
        { id: "a", handle: "A", active: true, revenue: 1_000, investment: 300 },
        { id: "b", handle: "B", active: true, revenue: 0 },
      ],
      paidTransfers: [{ fromMemberId: "b", toMemberId: "a", netAmount: 100, feeAmount: 1, kind: "COST_CONTRIBUTION" }],
    }))).toEqual([["a", 550, 0], ["b", 450, 0]]);
  });
});
