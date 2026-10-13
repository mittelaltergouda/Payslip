import { describe, expect, it } from 'vitest';
import { calculatePayslip } from './calc';
import { savedSessionSchema, type SessionInput } from './types';

const base: SessionInput = { name: 'Test', type: 'TRADING', distributionMode: 'EQUAL', members: [{ id: 'a', handle: 'A', revenue: 1000 }, { id: 'b', handle: 'B' }] };
describe('accounting validation and explanation', () => {
  for (const amount of [-1, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    it(`rejects unsafe item amount ${amount}`, () => {
      expect(() => calculatePayslip({ ...base, members: [{ ...base.members[0], revenues: [{ label: 'Bad', amount }] }, base.members[1]] })).toThrow();
      expect(savedSessionSchema.safeParse({ id: 's', session: { ...base, members: [{ ...base.members[0], investments: [{ label: 'Bad', amount }] }] }, createdAt: '', updatedAt: '' }).success).toBe(false);
    });
  }
  for (const transfer of [
    { fromMemberId: 'missing', toMemberId: 'b', netAmount: 10, feeAmount: 0 },
    { fromMemberId: 'a', toMemberId: 'a', netAmount: 10, feeAmount: 0 },
    { fromMemberId: 'a', toMemberId: 'b', netAmount: -1, feeAmount: 0 },
    { fromMemberId: 'a', toMemberId: 'b', netAmount: 10, feeAmount: Infinity },
  ]) {
    it('rejects malformed paid transfers in calculation and persistence', () => {
      const session = { ...base, paidTransfers: [transfer] };
      expect(() => calculatePayslip(session)).toThrow();
      expect(savedSessionSchema.safeParse({ id: 's', session, createdAt: '', updatedAt: '' }).success).toBe(false);
    });
  }
  it('accounts session-funded advances by net cash and shares historical fees once', () => {
    const session: SessionInput = { ...base, paidTransfers: [{ fromMemberId: 'a', toMemberId: 'b', netAmount: 99, feeAmount: 1, kind: 'SESSION_CASH' }] };
    const result = calculatePayslip(session);
    expect(result.netProfit).toBe(999);
    expect(result.members.map(m => m.finalNet)).toEqual([499.5, 499.5]);
    expect(result.suggestedTransfers[0].grossAmount).toBe(400);
    expect(result.unsettledBalances?.map(b => b.amount)).toEqual([-0.5, 0.5]);
  });
  it('explains original holdings, profit, targets, paid and suggested arithmetic and residuals', async () => {
    const modulePath = './accounting';
    const { buildArithmeticExplanation } = await import(modulePath);
    const session = { ...base, taxEnabled: true, taxRate: 0.005, paidTransfers: [{ fromMemberId: 'a', toMemberId: 'b', netAmount: 99, feeAmount: 1 }] };
    const lines = buildArithmeticExplanation(session, calculatePayslip(session), 'en');
    expect(lines.join('\n')).toContain('1000 - 0 - 0 - 0 = 1000');
    expect(lines.join('\n')).toContain('99 + 1 = 100');
    expect(lines.join('\n')).toContain('398 + 2 = 400');
    expect(lines.join('\n')).toContain('before recorded transfers');
    expect(lines.join('\n')).toContain('External capital');
  });
});
