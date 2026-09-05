import { describe, expect, it } from 'vitest';
import type { MemberBreakdown } from '../types';
import { settleBalancesDetailed } from './settlement';

function member(memberId: string, revenue: number, finalNet: number): MemberBreakdown {
  return {
    memberId,
    handle: memberId,
    revenue,
    investment: 0,
    expenses: 0,
    sharedExpenses: 0,
    individualExpenses: 0,
    profitShare: 0,
    finalNet,
  };
}

describe('settleBalancesDetailed', () => {
  it('keeps matching a funded debtor after a creditor remainder cannot cover a fee', () => {
    const result = settleBalancesDetailed(
      [
        member('debtor', 402, 0),
        member('creditor-202', 0, 202),
        member('creditor-100-a', 0, 100),
        member('creditor-100-b', 0, 100),
      ],
      0.005,
    );

    expect(result.transfers).toEqual([
      {
        fromMemberId: 'debtor',
        toMemberId: 'creditor-202',
        netAmount: 200,
        grossAmount: 201,
        feeAmount: 1,
      },
      {
        fromMemberId: 'debtor',
        toMemberId: 'creditor-100-a',
        netAmount: 99,
        grossAmount: 100,
        feeAmount: 1,
      },
      {
        fromMemberId: 'debtor',
        toMemberId: 'creditor-100-b',
        netAmount: 99,
        grossAmount: 100,
        feeAmount: 1,
      },
    ]);
    expect(result.unsettledBalances).toEqual([
      { memberId: 'debtor', amount: -1 },
      { memberId: 'creditor-202', amount: 1 },
    ]);
  });

  it('does not skip a creditor when sub-cent balances differ within epsilon', () => {
    const result = settleBalancesDetailed(
      [
        member('debtor-1', 99.999, 0),
        member('debtor-2', 2.001, 0),
        member('creditor-1', 0, 98),
        member('creditor-2', 0, 2.005),
        member('creditor-3', 0, 1.995),
      ],
      0.005,
    );

    expect(result.transfers).toEqual([
      {
        fromMemberId: 'debtor-1',
        toMemberId: 'creditor-1',
        netAmount: 97,
        grossAmount: 98,
        feeAmount: 1,
      },
      {
        fromMemberId: 'debtor-2',
        toMemberId: 'creditor-2',
        netAmount: 1,
        grossAmount: 2,
        feeAmount: 1,
      },
    ]);
  });

  it('does not skip a creditor when a sub-minimum budget differs within epsilon', () => {
    const result = settleBalancesDetailed(
      [
        member('debtor-1', 2.999, 0),
        member('debtor-2', 1.001, 0),
        member('creditor-1', 0, 2),
        member('creditor-2', 0, 1.005),
        member('creditor-3', 0, 0.995),
      ],
      0,
    );

    expect(result.transfers).toEqual([
      {
        fromMemberId: 'debtor-1',
        toMemberId: 'creditor-1',
        netAmount: 2,
        grossAmount: 2,
        feeAmount: 0,
      },
      {
        fromMemberId: 'debtor-2',
        toMemberId: 'creditor-2',
        netAmount: 1,
        grossAmount: 1,
        feeAmount: 0,
      },
    ]);
  });
});
