import { describe, expect, it } from "vitest";
import { calculatePayslip } from "./calc";
import type { SessionInput } from "./types";

describe("settlement regression", () => {
  it("makes every revenue holder pay their surplus after investment reimbursements", () => {
    const session: SessionInput = {
      name: "Gouda crew payout",
      type: "TRADING",
      distributionMode: "EQUAL",
      taxEnabled: true,
      taxRate: 0.005,
      members: [
        { id: "gouda", handle: "Gouda", active: true, revenue: 1_000_000, investment: 0 },
        { id: "iri", handle: "Iri", active: true, revenue: 6_974_358, investment: 3_580_000 },
        { id: "avi", handle: "Avi", active: true, revenue: 0, investment: 1_347_000 },
        { id: "whitedragon", handle: "Whitedragon", active: true, revenue: 0, investment: 0 },
      ],
    };

    const result = calculatePayslip(session);

    expect(result.suggestedTransfers).toEqual([
      {
        fromMemberId: "iri",
        toMemberId: "avi",
        netAmount: 2_098_347,
        grossAmount: 2_108_839,
        feeAmount: 10_492,
      },
      {
        fromMemberId: "iri",
        toMemberId: "whitedragon",
        netAmount: 521_073,
        grossAmount: 523_679,
        feeAmount: 2_606,
      },
      {
        fromMemberId: "gouda",
        toMemberId: "whitedragon",
        netAmount: 236_975,
        grossAmount: 238_160,
        feeAmount: 1_185,
      },
    ]);
  });
});
