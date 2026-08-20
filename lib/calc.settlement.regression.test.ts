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
        netAmount: 2_105_259,
        grossAmount: 2_115_786,
        feeAmount: 10_527,
      },
      {
        fromMemberId: "iri",
        toMemberId: "whitedragon",
        netAmount: 517_723,
        grossAmount: 520_312,
        feeAmount: 2_589,
      },
      {
        fromMemberId: "gouda",
        toMemberId: "whitedragon",
        netAmount: 240_536,
        grossAmount: 241_739,
        feeAmount: 1_203,
      },
    ]);
  });
});
