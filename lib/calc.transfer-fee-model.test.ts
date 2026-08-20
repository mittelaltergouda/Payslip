import { describe, expect, it } from "vitest";
import { calculatePayslip } from "./calc";
import type { SessionInput } from "./types";

describe("Star Citizen transfer fee model", () => {
  it("fits the sender-paid fee inside the gross transfer budget", () => {
    const input: SessionInput = {
      name: "Loss split with transfer fee",
      type: "TRADING",
      distributionMode: "EQUAL",
      taxEnabled: true,
      taxRate: 0.005,
      members: [
        {
          id: "player-1",
          handle: "Player 1",
          role: "Member",
          active: true,
          revenue: 1_000_000,
          investment: 2_000_000,
        },
        {
          id: "player-2",
          handle: "Player 2",
          role: "Member",
          active: true,
          revenue: 0,
          investment: 0,
        },
      ],
    };

    const result = calculatePayslip(input);

    expect(result.suggestedTransfers).toEqual([
      {
        fromMemberId: "player-2",
        toMemberId: "player-1",
        netAmount: 497_512,
        feeAmount: 2_488,
        grossAmount: 500_000,
      },
    ]);
    expect(
      result.suggestedTransfers.reduce((sum, transfer) => sum + transfer.feeAmount, 0)
    ).toBe(2_488);
  });
});
