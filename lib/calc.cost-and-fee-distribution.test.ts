import { describe, expect, it } from "vitest";
import { calculatePayslip } from "./calc";
import type { SessionInput } from "./types";

describe("costs deducted before distribution", () => {
  it("deducts shared costs exactly once before equal distribution", () => {
    const input: SessionInput = {
      name: "Shared cost regression",
      type: "OTHER",
      distributionMode: "EQUAL",
      taxEnabled: false,
      members: [
        { id: "player-1", handle: "Player 1", revenue: 1_000_000, investment: 0, active: true },
        { id: "player-2", handle: "Player 2", revenue: 0, investment: 0, active: true },
      ],
      sharedExpenses: [{ id: "cost-1", label: "Cost", amount: 100_000 }],
      individualExpenses: [],
    };

    const result = calculatePayslip(input);

    // profit = 1,000,000 - 100,000 = 900,000 -> 450,000 each.
    // Without participantIds both active players are equal funders (50,000
    // each) and are reimbursed: 50,000 + 450,000 = 500,000 each.
    expect(result.netProfit).toBe(900_000);
    expect(result.members.map((member) => member.finalNet)).toEqual([500_000, 500_000]);
    expect(result.suggestedTransfers).toEqual([
      {
        fromMemberId: "player-1",
        toMemberId: "player-2",
        netAmount: 500_000,
        grossAmount: 500_000,
        feeAmount: 0,
      },
    ]);
  });
});

describe("transfer fees deducted before distribution", () => {
  it("shares the suggested transfer's service fee like any other session cost", () => {
    const input: SessionInput = {
      name: "Fee included in transfer budget",
      type: "OTHER",
      distributionMode: "EQUAL",
      taxEnabled: true,
      taxRate: 0.005,
      members: [
        { id: "player-1", handle: "Player 1", revenue: 1_000_000, investment: 500_000, active: true },
        { id: "player-2", handle: "Player 2", revenue: 0, investment: 0, active: true },
      ],
      sharedExpenses: [],
      individualExpenses: [],
    };

    const result = calculatePayslip(input);

    // profit = 500,000 − 1,247 fee = 498,753 → 249,376.5 each. Player 2
    // receives their whole share; Player 1 pays the amount plus the fee and
    // keeps 1,000,000 − 250,623 = 749,377 = 500,000 + 249,376.5 (+ 0.5 rounding).
    expect(result.netProfit).toBe(498_753);
    expect(result.suggestedTransferFees).toBe(1_247);
    expect(result.members.map((member) => member.serviceFeeShare)).toEqual([623.5, 623.5]);
    expect(result.suggestedTransfers).toEqual([
      {
        fromMemberId: "player-1",
        toMemberId: "player-2",
        netAmount: 249_376,
        feeAmount: 1_247,
        grossAmount: 250_623,
      },
    ]);
  });

  it("adds the service fee to the shared loss", () => {
    const input: SessionInput = {
      name: "Loss with fee inside transfer budget",
      type: "OTHER",
      distributionMode: "EQUAL",
      taxEnabled: true,
      taxRate: 0.005,
      members: [
        { id: "player-1", handle: "Player 1", revenue: 1_000_000, investment: 2_000_000, active: true },
        { id: "player-2", handle: "Player 2", revenue: 0, investment: 0, active: true },
      ],
      sharedExpenses: [],
      individualExpenses: [],
    };

    const result = calculatePayslip(input);

    // loss = 1,000,000 + 2,494 fee → −501,247 each. Player 2 pays exactly
    // their share of the loss: 498,753 + 2,494 fee = 501,247.
    expect(result.members.map((member) => member.profitShare)).toEqual([-501_247, -501_247]);
    expect(result.members.map((member) => member.finalNet)).toEqual([1_498_753, -501_247]);
    expect(result.suggestedTransfers).toEqual([
      {
        fromMemberId: "player-2",
        toMemberId: "player-1",
        netAmount: 498_753,
        feeAmount: 2_494,
        grossAmount: 501_247,
      },
    ]);
    expect(result.unsettledBalances).toEqual([]);
  });
});
