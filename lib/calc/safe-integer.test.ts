import { describe, expect, it } from 'vitest';
import type { SessionInput } from '../types';
import { fitTransferToBudget } from './tax';
import { validateSessionInput } from './validation';

function sessionWithRevenue(revenue: number): SessionInput {
  return {
    name: 'Safe integer validation',
    type: 'OTHER',
    distributionMode: 'EQUAL',
    members: [
      {
        id: 'member-1',
        handle: 'Pilot',
        active: true,
        revenue,
      },
    ],
  };
}

describe('safe aUEC bounds', () => {
  it('rejects unsafe aUEC values before calculation', () => {
    expect(() =>
      validateSessionInput(sessionWithRevenue(Number.MAX_SAFE_INTEGER + 1)),
    ).toThrow(/safe integer/i);
  });

  it('rejects individually safe values whose aggregate can overflow', () => {
    const session = sessionWithRevenue(Number.MAX_SAFE_INTEGER);
    session.members.push({
      id: 'member-2',
      handle: 'Wingman',
      active: true,
      revenue: 2,
    });

    expect(() => validateSessionInput(session)).toThrow(/aggregate.*safe integer/i);
  });

  it('rejects unsafe transfer budgets without entering the binary search', () => {
    expect(() =>
      fitTransferToBudget(Number.MAX_SAFE_INTEGER + 1, 0.005),
    ).toThrow(/safe integer/i);
  });

  it('handles the largest safe transfer budget', () => {
    const result = fitTransferToBudget(Number.MAX_SAFE_INTEGER, 0.005);

    expect(result.grossAmount).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
    expect(result.netAmount).toBeGreaterThan(0);
  });
});
