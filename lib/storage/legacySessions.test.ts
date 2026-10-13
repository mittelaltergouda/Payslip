import { beforeEach, describe, expect, it } from "vitest";
import { getAll, importAll, save } from "./sessionStorage";
import type { SessionInput } from "../types";

// Old sessions must survive the update. The live version accepted sessions
// whose members share an ID (e.g. hand-edited JSON imports); loading drops
// anything the schema rejects and the next save writes that loss back.

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

const HISTORY_KEY = "sc-payslip-sessions";

const legacyWithDuplicateIds = {
  id: "legacy-dup",
  createdAt: "2025-06-01T00:00:00.000Z",
  updatedAt: "2025-06-01T00:00:00.000Z",
  session: {
    id: "legacy-dup",
    name: "Old crew night",
    type: "MINING",
    distributionMode: "EQUAL",
    taxEnabled: false,
    members: [
      { id: "m", handle: "A", active: true, revenue: 600 },
      { id: "m", handle: "B", active: true, revenue: 0 },
    ],
  },
};

const other: SessionInput = {
  name: "New session",
  type: "TRADING",
  distributionMode: "EQUAL",
  members: [{ id: "x", handle: "X", revenue: 10 }, { id: "y", handle: "Y" }],
};

describe("legacy sessions stay loadable", () => {
  beforeEach(() => localStorage.clear());

  it("keeps a stored legacy session with duplicate member IDs", () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([legacyWithDuplicateIds]));

    expect(getAll().map((s) => s.id)).toEqual(["legacy-dup"]);
  });

  it("does not delete that legacy session when another session is saved", () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([legacyWithDuplicateIds]));

    expect(save(other).success).toBe(true);

    const names = getAll().map((s) => s.session.name).sort();
    expect(names).toEqual(["New session", "Old crew night"]);
  });

  it("still imports such a legacy JSON export", () => {
    expect(importAll(JSON.stringify([legacyWithDuplicateIds]))).toMatchObject({ success: true, data: { count: 1 } });
  });

  it("still rejects recorded transfers when member IDs are ambiguous", () => {
    const ambiguous = {
      ...legacyWithDuplicateIds,
      session: {
        ...legacyWithDuplicateIds.session,
        members: [...legacyWithDuplicateIds.session.members, { id: "z", handle: "C", active: true }],
        paidTransfers: [{ fromMemberId: "m", toMemberId: "z", netAmount: 10, feeAmount: 0 }],
      },
    };

    expect(importAll(JSON.stringify([ambiguous])).success).toBe(false);
  });
});
