import { describe, expect, it } from "vitest";
import type { PayslipResult } from "@/lib/types";
import { calculatePayslip } from "@/lib/calc";
import { getMemberPayoutSummaries } from "./payoutSummary";

const result: PayslipResult = {
  saleRevenue: 500_000,
  netProfit: 500_000,
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
      profitShare: 250_000,
      finalNet: 750_000,
    },
    {
      memberId: "player-2",
      handle: "Player 2",
      revenue: 0,
      investment: 0,
      expenses: 0,
      sharedExpenses: 0,
      individualExpenses: 0,
      profitShare: 250_000,
      finalNet: 250_000,
    },
  ],
  suggestedTransfers: [
    {
      fromMemberId: "player-1",
      toMemberId: "player-2",
      netAmount: 248_756,
      feeAmount: 1_244,
      grossAmount: 250_000,
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

    expect(getMemberPayoutSummaries(residualResult)).toEqual([
      {
        memberId: "d1", handle: "D1", grossPayout: 0,
        transferFeesDeducted: 0, netPayout: 1, unsettledAmount: -1,
      },
      {
        memberId: "d2", handle: "D2", grossPayout: 0,
        transferFeesDeducted: 0, netPayout: 0,
      },
      {
        memberId: "c1", handle: "C1", grossPayout: 1_000,
        transferFeesDeducted: 5, netPayout: 995,
      },
      {
        memberId: "c2", handle: "C2", grossPayout: 1,
        transferFeesDeducted: 0, netPayout: 0, unsettledAmount: 1,
      },
    ]);
  });

  it("deducts an in-budget transfer fee from the recipient payout", () => {
    expect(getMemberPayoutSummaries(result)).toEqual([
      {
        memberId: "player-1",
        handle: "Player 1",
        grossPayout: 750_000,
        transferFeesDeducted: 0,
        netPayout: 750_000,
      },
      {
        memberId: "player-2",
        handle: "Player 2",
        grossPayout: 250_000,
        transferFeesDeducted: 1_244,
        netPayout: 248_756,
      },
    ]);
  });
});
