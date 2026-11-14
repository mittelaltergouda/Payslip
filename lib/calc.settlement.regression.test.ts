import { describe, expect, it } from "vitest";
import { calculatePayslip } from "./calc";
import type { SessionInput } from "./types";

describe("settlement regression", () => {
  it("reports balances that cannot be transferred with the minimum sender-paid fee", () => {
    const session: SessionInput = {
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
    };

    const result = calculatePayslip(session);

    expect(result.settlementDetails).toMatchObject([
      { fromMemberId: "d2", toMemberId: "c1", netAmount: 796, grossAmount: 800, feeAmount: 4 },
      { fromMemberId: "d1", toMemberId: "c1", netAmount: 199, grossAmount: 200, feeAmount: 1 },
    ]);
    // The 5 aUEC of fees reduce profit to 996, so the fixed payouts are scaled.
    expect(result.netProfit).toBe(996);
    // D1 keeps 1 aUEC: sending it would cost a fee of 1 on top.
    expect(result.unsettledBalances?.map((b) => b.memberId)).toEqual(["d1", "c2"]);
    expect(result.unsettledBalances?.[0].amount).toBe(-1);
    expect(result.unsettledBalances?.[1].amount).toBeCloseTo(0.995, 3);
  });

  it("settles only the revenue actually held by members when a stale total override differs", () => {
    const session: SessionInput = {
      name: "Imported legacy session",
      type: "TRADING",
      distributionMode: "EQUAL",
      taxEnabled: false,
      taxRate: 0.005,
      totalRevenue: 1_500,
      members: [
        { id: "holder", handle: "Holder", active: true, revenue: 1_000, investment: 0 },
        { id: "receiver", handle: "Receiver", active: true, revenue: 0, investment: 0 },
      ],
    };

    const result = calculatePayslip(session);

    expect(result.saleRevenue).toBe(1_000);
    expect(result.netProfit).toBe(1_000);
    expect(result.settlementDetails).toMatchObject([
      {
        fromMemberId: "holder",
        toMemberId: "receiver",
        netAmount: 500,
        grossAmount: 500,
        feeAmount: 0,
      },
    ]);
  });

  it("reimburses individual expenses once before splitting profit", () => {
    const session: SessionInput = {
      name: "Reported reimbursement fixture",
      type: "TRADING",
      distributionMode: "EQUAL",
      taxEnabled: true,
      taxRate: 0.005,
      members: [
        { id: "p1", handle: "P1", active: true, revenue: 0, investment: 0 },
        { id: "p2", handle: "P2", active: true, revenue: 7_786_069, investment: 2_822_000 },
      ],
      individualExpenses: [
        { id: "e1", memberId: "p1", label: "Funded cost", amount: 2_822_000 },
        { id: "e2", memberId: "p2", label: "Funded cost", amount: 47_000 },
      ],
    };

    const result = calculatePayslip(session);

    // 2,095,069 profit before fees − 19,300 service fee, shared equally.
    expect(result.netProfit).toBe(2_075_769);
    expect(result.members.map((member) => [member.memberId, member.profitShare, member.finalNet, member.serviceFeeShare])).toEqual([
      ["p1", 1_037_884.5, 3_859_884.5, 9_650],
      ["p2", 1_037_884.5, 3_906_884.5, 9_650],
    ]);
    expect(result.settlementDetails).toMatchObject([
      {
        fromMemberId: "p2",
        toMemberId: "p1",
        netAmount: 3_859_884,
        grossAmount: 3_879_184,
        feeAmount: 19_300,
        budgetAmount: 3_859_884,
        roundingRemainder: 0.5,
      },
    ]);
    expect(result.unsettledBalances).toEqual([
      { memberId: "p2", amount: -0.5 },
      { memberId: "p1", amount: 0.5 },
    ]);
  });

  it("uses itemized revenue and investment instead of adding legacy scalar fallbacks", () => {
    const result = calculatePayslip({
      name: "Itemized inputs",
      type: "TRADING",
      distributionMode: "EQUAL",
      taxEnabled: false,
      members: [
        {
          id: "holder",
          handle: "Holder",
          active: true,
          revenue: 999_999,
          investment: 999_999,
          revenues: [
            { id: "r1", label: "Cargo", amount: 700 },
            { id: "r2", label: "Bonus", amount: 300 },
          ],
          investments: [
            { id: "i1", label: "Cargo purchase", amount: 200 },
            { id: "i2", label: "Fuel", amount: 100 },
          ],
        },
        { id: "crew", handle: "Crew", active: true, revenue: 0, investment: 0 },
      ],
    });

    expect(result.saleRevenue).toBe(700);
    expect(result.netProfit).toBe(700);
    expect(result.members[0]).toMatchObject({ revenue: 1_000, investment: 300, finalNet: 650 });
  });

  it("applies already-paid transfers as settlement progress and shares their fee", () => {
    const result = calculatePayslip({
      name: "Partial settlement",
      type: "TRADING",
      distributionMode: "EQUAL",
      taxEnabled: true,
      taxRate: 0.005,
      members: [
        { id: "holder", handle: "Holder", active: true, revenue: 1_000, investment: 0 },
        { id: "crew", handle: "Crew", active: true, revenue: 0, investment: 0 },
      ],
      paidTransfers: [
        { id: "paid-1", fromMemberId: "holder", toMemberId: "crew", netAmount: 99, feeAmount: 1 },
      ],
    });

    // 1,000 − 1 paid fee − 2 suggested fee = 997 → 498.5 each. Crew got 99
    // and still receives 399; Holder keeps 1,000 − 100 − 401 = 499.
    expect(result.netProfit).toBe(997);
    expect(result.paidTransferFees).toBe(1);
    expect(result.suggestedTransferFees).toBe(2);
    expect(result.settlementDetails).toMatchObject([
      {
        fromMemberId: "holder",
        toMemberId: "crew",
        netAmount: 399,
        grossAmount: 401,
        feeAmount: 2,
        budgetAmount: 399,
        roundingRemainder: 0.5,
      },
    ]);
  });

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

    expect(result.settlementDetails).toMatchObject([
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
    // All 14,319 aUEC of fees are shared: everyone bears a quarter.
    expect(result.suggestedTransferFees).toBe(14_319);
    expect(result.members.map((member) => member.serviceFeeShare)).toEqual([3_579.75, 3_579.75, 3_579.75, 3_579.75]);
    // Avi and Whitedragon receive their whole target (whole aUEC).
    expect(result.members.find((m) => m.memberId === "avi")?.finalNet).toBe(2_105_259.75);
    expect(result.members.find((m) => m.memberId === "whitedragon")?.finalNet).toBe(758_259.75);
  });
});
