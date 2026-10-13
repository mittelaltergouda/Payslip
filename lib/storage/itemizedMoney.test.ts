import { beforeEach, describe, expect, it } from "vitest";
import { exportAll, getAll, importAll, save } from "./sessionStorage";
import { calculatePayslip } from "../calc";
import type { SessionInput } from "../types";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock, writable: true });

const itemized: SessionInput = {
  name: "Itemized storage",
  type: "TRADING",
  distributionMode: "EQUAL",
  taxEnabled: true,
  taxRate: 0.005,
  members: [
    {
      id: "m1", handle: "Holder", active: true, revenue: 1_000, investment: 300,
      revenues: [{ id: "r1", label: "Cargo", amount: 700 }, { id: "r2", label: "Bounty", amount: 300 }],
      investments: [{ id: "i1", label: "Cargo purchase", amount: 200 }, { id: "i2", label: "Fuel", amount: 100 }],
    },
    { id: "m2", handle: "Crew", active: true, revenue: 0 },
  ],
};

describe("itemized positions in browser storage and JSON import", () => {
  beforeEach(() => localStorage.clear());

  it("keeps labelled positions when saving and loading", () => {
    expect(save(itemized).success).toBe(true);

    const [loaded] = getAll();
    expect(loaded.session.members[0].revenues).toEqual(itemized.members[0].revenues);
    expect(loaded.session.members[0].investments).toEqual(itemized.members[0].investments);
  });

  it("round-trips positions through JSON export and import without changing the result", () => {
    save(itemized);
    const json = exportAll();
    localStorage.clear();

    const imported = importAll(json);
    expect(imported).toMatchObject({ success: true, data: { count: 1 } });
    const [loaded] = getAll();
    expect(loaded.session.members[0].revenues?.map((r) => [r.label, r.amount])).toEqual([["Cargo", 700], ["Bounty", 300]]);
    expect(calculatePayslip(loaded.session).suggestedTransfers).toEqual(calculatePayslip(itemized).suggestedTransfers);
  });

  it("imports a legacy session without positions and calculates from the single amounts", () => {
    const legacy = [{
      id: "old",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      session: {
        id: "old",
        name: "Legacy",
        type: "TRADING",
        distributionMode: "EQUAL",
        taxEnabled: false,
        totalRevenue: 1_000,
        members: [
          { id: "a", handle: "A", active: true, revenue: 1_000, investment: 300 },
          { id: "b", handle: "B", active: true, revenue: 0 },
        ],
      },
    }];

    expect(importAll(JSON.stringify(legacy))).toMatchObject({ success: true, data: { count: 1 } });
    const [loaded] = getAll();
    expect(loaded.session.members[0].revenues).toBeUndefined();
    // profit 700 -> 350 each; A keeps 300 + 350 = 650 and sends B 350
    const result = calculatePayslip(loaded.session);
    expect(result.netProfit).toBe(700);
    expect(result.suggestedTransfers).toMatchObject([{ fromMemberId: "a", toMemberId: "b", netAmount: 350 }]);
  });

  it("refuses to import positions with negative amounts", () => {
    const bad = [{
      id: "bad",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      session: { ...itemized, id: "bad", members: [{ ...itemized.members[0], investments: [{ label: "Bad", amount: -5 }] }, itemized.members[1]] },
    }];

    expect(importAll(JSON.stringify(bad)).success).toBe(false);
    expect(getAll()).toEqual([]);
  });
});
