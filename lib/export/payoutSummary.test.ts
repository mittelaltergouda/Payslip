import { describe, expect, it } from "vitest";
import type { PayslipResult } from "@/lib/types";
import { calculatePayslip } from "@/lib/calc";
import { getMemberPayoutSummaries } from "./payoutSummary";

const result: PayslipResult = {
  saleRevenue: 500_000,
  netProfit: 498_753,
  taxRateApplied: 0.005,
  members: [
    {
      memberId: "player-1",
      handle: "Player 1",
      revenue: 1_000_000,
      investment: 500_000,
      expenses: 0,
      sharedExpenses: 0,
      individualExpenses: 0,
      profitShare: 249_376.5,
      serviceFeeShare: 623.5,
      finalNet: 749_376.5,
    },
    {
      memberId: "player-2",
      handle: "Player 2",
      revenue: 0,
      investment: 0,
      expenses: 0,
      sharedExpenses: 0,
      individualExpenses: 0,
      profitShare: 249_376.5,
      serviceFeeShare: 623.5,
      finalNet: 249_376.5,
    },
  ],
  suggestedTransfers: [
    {
      fromMemberId: "player-1",
      toMemberId: "player-2",
      netAmount: 249_376,
      feeAmount: 1_247,
      grossAmount: 250_623,
    },
  ],
};

describe("getMemberPayoutSummaries", () => {
  it("reports projected holdings and unavoidable unsettled balances", () => {
    const residualResult = calculatePayslip({
      name: "Minimum fee residual",
      type: "TRADING",
      distributionMode: "ADJUSTABLE",
      taxEnabled: true,
      taxRate: 0.005,
      members: [
        { id: "d1", handle: "D1", active: true, revenue: 201, fixedPayout: 0 },
        { id: "d2", handle: "D2", active: true, revenue: 800, fixedPayout: 0 },
        { id: "c1", handle: "C1", active: true, revenue: 0, fixedPayout: 1_000 },
        { id: "c2", handle: "C2", active: true, revenue: 0, fixedPayout: 1 },
      ],
    });

    // The 5 aUEC of fees reduce profit to 996 and scale the fixed payouts;
    // C1 and C2 bear them in proportion (4.995 and 0.005).
    const rows = getMemberPayoutSummaries(residualResult);
    expect(rows.map((r) => [r.memberId, r.netPayout, r.unsettledAmount])).toEqual([
      ["d1", 1, -1],
      ["d2", 0, undefined],
      ["c1", 995, undefined],
      ["c2", 0, rows[3].unsettledAmount],
    ]);
    expect(rows[3].unsettledAmount).toBeCloseTo(0.995, 3);
    expect(rows[2].grossPayout).toBeCloseTo(1_000, 9);
    expect(rows[2].transferFeesDeducted).toBeCloseTo(4.995, 3);
    expect(rows[3].transferFeesDeducted).toBeCloseTo(0.005, 3);
    expect(rows[0].transferFeesDeducted).toBe(0);
  });

  it("pays the recipient the whole amount and reports the member's fee share", () => {
    expect(getMemberPayoutSummaries(result)).toEqual([
      {
        memberId: "player-1",
        handle: "Player 1",
        grossPayout: 750_000,
        transferFeesDeducted: 623.5,
        netPayout: 749_377,
      },
      {
        memberId: "player-2",
        handle: "Player 2",
        grossPayout: 250_000,
        transferFeesDeducted: 623.5,
        netPayout: 249_376,
      },
    ]);
  });
});
