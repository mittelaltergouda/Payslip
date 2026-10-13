import { describe, it, expect, beforeEach } from "vitest";
import { calculatePayslip } from "./calc";
import { save, getAll, importAll, exportAll, duplicate } from "./storage/sessionStorage";
import type { SessionInput } from "./types";
let store: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; }, clear: () => { store = {}; } } });
const session: SessionInput = { name: "Funded", type: "TRADING", distributionMode: "EQUAL", members: [{ id: "a", handle: "A", revenue: 1000 }, { id: "b", handle: "B", investment: 200 }], paidTransfers: [{ id: "p", label: "Cargo funding", fromMemberId: "a", toMemberId: "b", kind: "COST_CONTRIBUTION", netAmount: 200, feeAmount: 1 }] };
describe("external cost funding and storage", () => {
 beforeEach(() => localStorage.clear());
 it("reimburses the actual external funder and their fee, not the buyer twice", () => {
  const result = calculatePayslip(session);
  expect(result.netProfit).toBe(799);
  expect(result.members.map(m => m.finalNet)).toEqual([600.5, 399.5]);
  expect(result.suggestedTransfers[0].grossAmount).toBe(399);
 });
 it("rejects contributions exceeding the recipient's recorded costs", () => {
  expect(() => calculatePayslip({ ...session, paidTransfers: [{ ...session.paidTransfers![0], netAmount: 201 }] })).toThrow();
 });
 it("round trips labelled rows and payment semantics and remaps copied payment references", () => {
  const input = { ...session, members: session.members.map(m => ({ ...m, revenues: [{ id: "r", label: "Sale", amount: m.revenue ?? 0 }] })) };
  const saved = save(input).data!;
  expect(getAll()[0].session.paidTransfers?.[0].label).toBe("Cargo funding");
  expect(importAll(exportAll()).success).toBe(true);
  const copy = duplicate(saved.id, true).data!.session;
  expect(copy.paidTransfers?.[0].fromMemberId).toBe(copy.members[0].id);
  expect(copy.paidTransfers?.[0].toMemberId).toBe(copy.members[1].id);
  expect(copy.members[0].revenues?.[0].id).not.toBe("r");
 });
});
