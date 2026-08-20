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

    expect(result.netProfit).toBe(900_000);
    expect(result.members.map((member) => member.finalNet)).toEqual([450_000, 450_000]);
    expect(result.suggestedTransfers).toEqual([
      {
        fromMemberId: "player-1",
        toMemberId: "player-2",
        netAmount: 450_000,
        grossAmount: 450_000,
        feeAmount: 0,
      },
    ]);
  });
});

describe("transfer fees deducted before distribution", () => {
  it("fits the largest possible recipient amount into the sender's transfer budget", () => {
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

    expect(result.suggestedTransfers).toEqual([
      {
        fromMemberId: "player-1",
        toMemberId: "player-2",
        netAmount: 248_756,
        feeAmount: 1_244,
        grossAmount: 250_000,
      },
    ]);
  });

  it("deducts the sender-paid fee inside the gross transfer budget", () => {
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

    expect(result.members.map((member) => member.profitShare)).toEqual([-500_000, -500_000]);
    expect(result.members.map((member) => member.finalNet)).toEqual([1_500_000, -500_000]);
    expect(result.suggestedTransfers).toEqual([
      {
        fromMemberId: "player-2",
        toMemberId: "player-1",
        netAmount: 497_512,
        feeAmount: 2_488,
        grossAmount: 500_000,
      },
    ]);
  });
});
