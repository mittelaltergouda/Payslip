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
        netAmount: 2_108_839.5,
        grossAmount: 2_119_437,
        feeAmount: 10_597.5,
      },
      {
        fromMemberId: "iri",
        toMemberId: "whitedragon",
        netAmount: 523_679,
        grossAmount: 526_311,
        feeAmount: 2_632,
      },
      {
        fromMemberId: "gouda",
        toMemberId: "whitedragon",
        netAmount: 238_160.5,
        grossAmount: 239_358,
        feeAmount: 1_197.5,
      },
    ]);
  });
});
