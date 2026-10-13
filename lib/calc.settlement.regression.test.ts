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
    expect(result.unsettledBalances).toEqual([
      { memberId: "d1", amount: -1 },
      { memberId: "c2", amount: 1 },
    ]);
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

    expect(result.netProfit).toBe(2_095_069);
    expect(result.members.map((member) => [member.memberId, member.profitShare, member.finalNet])).toEqual([
      ["p1", 1_047_534.5, 3_869_534.5],
      ["p2", 1_047_534.5, 3_916_534.5],
    ]);
    expect(result.settlementDetails).toMatchObject([
      {
        fromMemberId: "p2",
        toMemberId: "p1",
        netAmount: 3_850_282,
        grossAmount: 3_869_534,
        feeAmount: 19_252,
        budgetAmount: 3_869_534,
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

  it("applies already-paid transfers as settlement progress without changing profit", () => {
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

    expect(result.netProfit).toBe(1_000);
    expect(result.paidTransferFees).toBe(1);
    expect(result.settlementDetails).toMatchObject([
      {
        fromMemberId: "holder",
        toMemberId: "crew",
        netAmount: 398,
        grossAmount: 400,
        feeAmount: 2,
        budgetAmount: 400,
        roundingRemainder: 0,
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
