/**
 * Focused coverage tests for the core distribution / settlement / validation math.
 *
 * These complement the scenario-driven suites (calc.equal/percent/adjustable/
 * transfers/taxes/edge-cases) by exercising the lower-level domain functions
 * directly and by pinning down the defensive branches that the high-level
 * `calculatePayslip` flow does not normally reach:
 *
 * - empty active-member guards in each distribution strategy
 * - the exhaustiveness guard for an unknown distribution mode
 * - greedy settlement with no balances to settle
 * - the negative-input and tax-bound validation branches
 * - normalization defaults (auto-generated ids, applied field defaults)
 *
 * Scope is deliberately the pure calculator only (no game integration).
 */

import { describe, it, expect } from 'vitest';
import { distributeProfit } from './calc/distribution';
import { settleBalances } from './calc/settlement';
import {
  normalizeMember,
  normalizeSessionInput,
} from './calc/normalization';
import { calculatePayslip } from './calc';
import type { SessionInput } from './calc';
import type { NormalizedMember } from './calc/types';
import type { DistributionMode, MemberBreakdown } from './types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function member(overrides: Partial<NormalizedMember> = {}): NormalizedMember {
  return {
    id: 'm',
    handle: 'Member',
    role: '',
    active: true,
    revenue: 0,
    investment: 0,
    percentShare: null,
    fixedBonus: null,
    fixedPayout: null,
    ...overrides,
  };
}

function breakdown(overrides: Partial<MemberBreakdown> = {}): MemberBreakdown {
  return {
    memberId: 'm',
    handle: 'Member',
    revenue: 0,
    investment: 0,
    expenses: 0,
    sharedExpenses: 0,
    individualExpenses: 0,
    profitShare: 0,
    finalNet: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// distributeProfit — direct unit tests
// ---------------------------------------------------------------------------

describe('distributeProfit - empty active members', () => {
  it.each<DistributionMode>(['EQUAL', 'PERCENT', 'ADJUSTABLE'])(
    'returns an empty map for %s mode when there are no active members',
    (mode) => {
      const result = distributeProfit(1000, [], mode);
      expect(result.size).toBe(0);
    }
  );

  it('throws on an unknown distribution mode (exhaustiveness guard)', () => {
    expect(() =>
      distributeProfit(1000, [member()], 'WEIGHTED' as unknown as DistributionMode)
    ).toThrow(/Unknown distribution mode/);
  });
});

describe('distributeProfit - uneven splits and rounding', () => {
  it('EQUAL keeps full precision; the sum of shares equals net profit', () => {
    const members = [member({ id: 'a' }), member({ id: 'b' }), member({ id: 'c' })];
    const result = distributeProfit(100, members, 'EQUAL');

    // 100 / 3 is not representable exactly; the engine keeps raw precision and
    // only rounds at the settlement/transfer boundary.
    const shares = [...result.values()];
    expect(shares).toEqual([100 / 3, 100 / 3, 100 / 3]);
    expect(shares.reduce((s, v) => s + v, 0)).toBeCloseTo(100, 10);
  });

  it('PERCENT distributes proportionally to each member percentShare', () => {
    const members = [
      member({ id: 'a', percentShare: 70 }),
      member({ id: 'b', percentShare: 30 }),
    ];
    const result = distributeProfit(1000, members, 'PERCENT');
    expect(result.get('a')).toBe(700);
    expect(result.get('b')).toBe(300);
  });

  it('PERCENT treats a null percentShare as 0%', () => {
    const members = [
      member({ id: 'a', percentShare: 100 }),
      member({ id: 'b', percentShare: null }),
    ];
    const result = distributeProfit(500, members, 'PERCENT');
    expect(result.get('a')).toBe(500);
    expect(result.get('b')).toBe(0);
  });

  it('ADJUSTABLE pays fixedPayout exactly and splits the remainder by percent', () => {
    // Alice takes a fixed 200; Bob and Carol split the remaining 800 by 3:1.
    const members = [
      member({ id: 'a', fixedPayout: 200 }),
      member({ id: 'b', percentShare: 75 }),
      member({ id: 'c', percentShare: 25 }),
    ];
    const result = distributeProfit(1000, members, 'ADJUSTABLE');
    expect(result.get('a')).toBe(200);
    expect(result.get('b')).toBe(600);
    expect(result.get('c')).toBe(200);
  });

  it('ADJUSTABLE applies fixed bonuses on top of an equal split of the remainder', () => {
    // No percentShares -> equal split of (1000 - 100 bonus) = 900 across two,
    // then Bob receives his 100 bonus on top.
    const members = [
      member({ id: 'a' }),
      member({ id: 'b', fixedBonus: 100 }),
    ];
    const result = distributeProfit(1000, members, 'ADJUSTABLE');
    expect(result.get('a')).toBe(450);
    expect(result.get('b')).toBe(550);
    expect((result.get('a') ?? 0) + (result.get('b') ?? 0)).toBe(1000);
  });

  it('ADJUSTABLE with all members on fixedPayout leaves no pool to split', () => {
    const members = [
      member({ id: 'a', fixedPayout: 300 }),
      member({ id: 'b', fixedPayout: 400 }),
    ];
    const result = distributeProfit(1000, members, 'ADJUSTABLE');
    expect(result.get('a')).toBe(300);
    expect(result.get('b')).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// settleBalances — direct unit tests
// ---------------------------------------------------------------------------

describe('settleBalances - direct', () => {
  it('returns no transfers when every member is already settled', () => {
    // finalNet equals the cash position (revenue - expenses + investment) -> balance 0.
    const transfers = settleBalances([
      breakdown({ memberId: 'a', revenue: 100, finalNet: 100 }),
      breakdown({ memberId: 'b', revenue: 50, finalNet: 50 }),
    ]);
    expect(transfers).toHaveLength(0);
  });

  it('ignores sub-cent imbalances within the settlement epsilon', () => {
    // A 0.005 imbalance is below the 0.01 epsilon and must not create a transfer.
    const transfers = settleBalances([
      breakdown({ memberId: 'a', revenue: 100, finalNet: 100.005 }),
      breakdown({ memberId: 'b', revenue: 100, finalNet: 99.995 }),
    ]);
    expect(transfers).toHaveLength(0);
  });

  it('moves money from the debtor to the creditor without tax', () => {
    // a holds 0 but is owed 100 (creditor); b holds 100 but should hold 0 (debtor).
    const transfers = settleBalances([
      breakdown({ memberId: 'a', revenue: 0, finalNet: 100 }),
      breakdown({ memberId: 'b', revenue: 100, finalNet: 0 }),
    ]);
    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toMatchObject({
      fromMemberId: 'b',
      toMemberId: 'a',
      netAmount: 100,
      grossAmount: 100,
      feeAmount: 0,
    });
  });

  it('grosses up transfers with tax so the recipient nets the owed amount', () => {
    // 5% transfer tax: to deliver 100 net the sender pays ceil(100/0.95)=106.
    const transfers = settleBalances(
      [
        breakdown({ memberId: 'a', revenue: 0, finalNet: 100 }),
        breakdown({ memberId: 'b', revenue: 100, finalNet: 0 }),
      ],
      0.05
    );
    expect(transfers).toHaveLength(1);
    expect(transfers[0].netAmount).toBe(100);
    expect(transfers[0].grossAmount).toBe(106);
    expect(transfers[0].feeAmount).toBe(6);
  });

  it('minimizes transfer count by greedily matching the largest debtor/creditor', () => {
    // a owed 150, b owes 100, c owes 50 -> two transfers, not three.
    const transfers = settleBalances([
      breakdown({ memberId: 'a', revenue: 0, finalNet: 150 }),
      breakdown({ memberId: 'b', revenue: 100, finalNet: 0 }),
      breakdown({ memberId: 'c', revenue: 50, finalNet: 0 }),
    ]);
    expect(transfers).toHaveLength(2);
    const total = transfers.reduce((s, t) => s + t.netAmount, 0);
    expect(total).toBeCloseTo(150, 2);
    expect(transfers.every((t) => t.toMemberId === 'a')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validation — negative / out-of-range inputs (via calculatePayslip)
// ---------------------------------------------------------------------------

describe('calculatePayslip - input validation guards', () => {
  const base: SessionInput = {
    name: 'Validation Session',
    type: 'TRADING',
    distributionMode: 'EQUAL',
    taxEnabled: false,
    members: [
      { id: 'a', handle: 'Alice', active: true, revenue: 100 },
      { id: 'b', handle: 'Bob', active: true, revenue: 100 },
    ],
  };

  it('rejects a negative member revenue', () => {
    expect(() =>
      calculatePayslip({
        ...base,
        members: [{ id: 'a', handle: 'Alice', active: true, revenue: -1 }],
      })
    ).toThrow(/negative revenue/);
  });

  it('rejects a negative member investment', () => {
    expect(() =>
      calculatePayslip({
        ...base,
        members: [
          { id: 'a', handle: 'Alice', active: true, revenue: 100, investment: -50 },
        ],
      })
    ).toThrow(/negative investment/);
  });

  it('rejects a negative shared expense amount', () => {
    expect(() =>
      calculatePayslip({
        ...base,
        sharedExpenses: [{ label: 'Fuel', amount: -10 }],
      })
    ).toThrow(/negative amount/);
  });

  it('rejects a negative individual expense amount', () => {
    expect(() =>
      calculatePayslip({
        ...base,
        individualExpenses: [{ memberId: 'a', label: 'Repair', amount: -10 }],
      })
    ).toThrow(/negative amount/);
  });

  it('rejects a tax rate above 1 (100%)', () => {
    expect(() =>
      calculatePayslip({ ...base, taxEnabled: true, taxRate: 1.5 })
    ).toThrow(/Tax rate must be between 0 and 1/);
  });

  it('rejects a negative tax rate', () => {
    expect(() =>
      calculatePayslip({ ...base, taxEnabled: true, taxRate: -0.1 })
    ).toThrow(/Tax rate must be between 0 and 1/);
  });

  it('rejects an empty member handle', () => {
    expect(() =>
      calculatePayslip({
        ...base,
        members: [{ id: 'a', handle: '   ', active: true, revenue: 100 }],
      })
    ).toThrow(/empty or whitespace-only handle/);
  });

  it('rejects a session with no active members', () => {
    expect(() =>
      calculatePayslip({
        ...base,
        members: [{ id: 'a', handle: 'Alice', active: false, revenue: 100 }],
      })
    ).toThrow(/at least one active member/);
  });

  it('rejects PERCENT mode whose shares do not sum to 100%', () => {
    expect(() =>
      calculatePayslip({
        ...base,
        distributionMode: 'PERCENT',
        members: [
          { id: 'a', handle: 'Alice', active: true, revenue: 100, percentShare: 60 },
          { id: 'b', handle: 'Bob', active: true, revenue: 100, percentShare: 30 },
        ],
      })
    ).toThrow(/sum to 100%/);
  });
});

// ---------------------------------------------------------------------------
// normalization — defaults and auto-generated ids
// ---------------------------------------------------------------------------

describe('normalization defaults', () => {
  it('applies defaults to a sparse member input', () => {
    const normalized = normalizeMember({ handle: '  Trimmed  ' }, 0);
    expect(normalized).toEqual({
      id: 'member-1',
      handle: 'Trimmed',
      role: '',
      active: true,
      revenue: 0,
      investment: 0,
      percentShare: null,
      fixedBonus: null,
      fixedPayout: null,
    });
  });

  it('auto-generates ids by 1-based index when omitted', () => {
    const session: SessionInput = {
      name: 'Auto IDs',
      type: 'MINING',
      distributionMode: 'EQUAL',
      members: [
        { handle: 'First', revenue: 600 },
        { handle: 'Second', revenue: 0 },
      ],
    };
    const normalized = normalizeSessionInput(session);
    expect(normalized.members.map((m) => m.id)).toEqual(['member-1', 'member-2']);

    // ...and those ids flow through to the calculated breakdown.
    const result = calculatePayslip(session);
    expect(result.members.map((m) => m.memberId)).toEqual(['member-1', 'member-2']);
    expect(result.netProfit).toBe(600);
    expect(result.members[0].profitShare).toBe(300);
    expect(result.members[1].profitShare).toBe(300);
  });

  it('applies session-level defaults (currency, tax disabled, empty expenses)', () => {
    const normalized = normalizeSessionInput({
      name: 'Defaults',
      type: 'OTHER',
      distributionMode: 'EQUAL',
      members: [{ id: 'a', handle: 'Alice' }],
    });
    expect(normalized.currency).toBe('aUEC');
    expect(normalized.taxEnabled).toBe(false);
    expect(normalized.taxRate).toBe(0);
    expect(normalized.totalRevenue).toBeNull();
    expect(normalized.sharedExpenses).toEqual([]);
    expect(normalized.individualExpenses).toEqual([]);
  });
});
