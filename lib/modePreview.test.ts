import { calculateModePreviews, ModePreviewResult, ModePreviews } from './modePreview';
import { SessionInput } from './types';

describe('calculateModePreviews', () => {
  it('should calculate previews for all three distribution modes', () => {
    const input: SessionInput = {
      name: 'Test Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 600, percentShare: 60 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 400, percentShare: 40 }
      ]
    };

    const previews = calculateModePreviews(input);

    // Should have results for all three modes
    expect(previews.EQUAL).toBeDefined();
    expect(previews.PERCENT).toBeDefined();
    expect(previews.ADJUSTABLE).toBeDefined();

    // EQUAL mode should succeed
    expect(previews.EQUAL.mode).toBe('EQUAL');
    expect(previews.EQUAL.error).toBeNull();
    expect(previews.EQUAL.result).not.toBeNull();
    expect(previews.EQUAL.result?.netProfit).toBe(1000);

    // PERCENT mode should succeed (percentShares are set)
    expect(previews.PERCENT.mode).toBe('PERCENT');
    expect(previews.PERCENT.error).toBeNull();
    expect(previews.PERCENT.result).not.toBeNull();
    expect(previews.PERCENT.result?.netProfit).toBe(1000);

    // ADJUSTABLE mode should succeed (percentShares are set, used as fallback)
    expect(previews.ADJUSTABLE.mode).toBe('ADJUSTABLE');
    expect(previews.ADJUSTABLE.error).toBeNull();
    expect(previews.ADJUSTABLE.result).not.toBeNull();
    expect(previews.ADJUSTABLE.result?.netProfit).toBe(1000);
  });

  it('should capture error when PERCENT mode is missing percentShares', () => {
    const input: SessionInput = {
      name: 'Test Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 600 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 400 }
      ]
    };

    const previews = calculateModePreviews(input);

    // EQUAL mode should succeed
    expect(previews.EQUAL.error).toBeNull();
    expect(previews.EQUAL.result).not.toBeNull();

    // PERCENT mode should fail
    expect(previews.PERCENT.error).not.toBeNull();
    expect(previews.PERCENT.result).toBeNull();
    expect(previews.PERCENT.error).toContain('PERCENT');

    // ADJUSTABLE mode should succeed (falls back to equal distribution)
    expect(previews.ADJUSTABLE.error).toBeNull();
    expect(previews.ADJUSTABLE.result).not.toBeNull();
  });

  it('should handle sessions with expenses correctly in all modes', () => {
    const input: SessionInput = {
      name: 'Session with Expenses',
      type: 'MINING',
      distributionMode: 'EQUAL',
      totalRevenue: 2000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1200, percentShare: 60 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 800, percentShare: 40 }
      ],
      sharedExpenses: [
        { label: 'Fuel', amount: 200 }
      ],
      individualExpenses: [
        { label: 'Repair', amount: 100, memberId: 'member-1' }
      ]
    };

    const previews = calculateModePreviews(input);

    // All modes should succeed
    expect(previews.EQUAL.error).toBeNull();
    expect(previews.PERCENT.error).toBeNull();
    expect(previews.ADJUSTABLE.error).toBeNull();

    // Total expenses = 200 + 100 = 300
    // Net profit = 2000 - 300 = 1700
    expect(previews.EQUAL.result?.netProfit).toBe(1700);
    expect(previews.PERCENT.result?.netProfit).toBe(1700);
    expect(previews.ADJUSTABLE.result?.netProfit).toBe(1700);

    // EQUAL: each member gets equal share of 850 (1700 / 2)
    const equalAlice = previews.EQUAL.result?.members.find(m => m.memberId === 'member-1');
    const equalBob = previews.EQUAL.result?.members.find(m => m.memberId === 'member-2');
    expect(equalAlice?.profitShare).toBe(850);
    expect(equalBob?.profitShare).toBe(850);

    // PERCENT: Alice gets 60% = 1020, Bob gets 40% = 680
    const percentAlice = previews.PERCENT.result?.members.find(m => m.memberId === 'member-1');
    const percentBob = previews.PERCENT.result?.members.find(m => m.memberId === 'member-2');
    expect(percentAlice?.profitShare).toBe(1020);
    expect(percentBob?.profitShare).toBe(680);
  });

  it('should handle sessions with investments correctly in all modes', () => {
    const input: SessionInput = {
      name: 'Session with Investments',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 2000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000, investment: 300, percentShare: 50 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 1000, investment: 200, percentShare: 50 }
      ]
    };

    const previews = calculateModePreviews(input);

    // All modes should succeed
    expect(previews.EQUAL.error).toBeNull();
    expect(previews.PERCENT.error).toBeNull();
    expect(previews.ADJUSTABLE.error).toBeNull();

    // Total investments: 300 + 200 = 500
    // Sale revenue: 2000 - 500 = 1500
    // Net profit: 1500 (no expenses)
    expect(previews.EQUAL.result?.saleRevenue).toBe(1500);
    expect(previews.EQUAL.result?.netProfit).toBe(1500);
    expect(previews.PERCENT.result?.saleRevenue).toBe(1500);
    expect(previews.PERCENT.result?.netProfit).toBe(1500);

    // EQUAL: each gets 750 (1500 / 2)
    const equalAlice = previews.EQUAL.result?.members.find(m => m.memberId === 'member-1');
    const equalBob = previews.EQUAL.result?.members.find(m => m.memberId === 'member-2');
    expect(equalAlice?.profitShare).toBe(750);
    expect(equalBob?.profitShare).toBe(750);
    // finalNet = investment + profitShare
    expect(equalAlice?.finalNet).toBe(1050); // 300 + 750
    expect(equalBob?.finalNet).toBe(950); // 200 + 750

    // PERCENT: each gets 50% of 1500 = 750
    const percentAlice = previews.PERCENT.result?.members.find(m => m.memberId === 'member-1');
    const percentBob = previews.PERCENT.result?.members.find(m => m.memberId === 'member-2');
    expect(percentAlice?.profitShare).toBe(750);
    expect(percentBob?.profitShare).toBe(750);
    expect(percentAlice?.finalNet).toBe(1050);
    expect(percentBob?.finalNet).toBe(950);
  });

  it('should handle sessions with tax enabled in all modes', () => {
    const input: SessionInput = {
      name: 'Taxed Session',
      type: 'PIRACY',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: true,
      taxRate: 0.15, // Tax rate is decimal: 0.15 = 15%
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 600, percentShare: 60 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 400, percentShare: 40 }
      ]
    };

    const previews = calculateModePreviews(input);

    // All modes should succeed
    expect(previews.EQUAL.error).toBeNull();
    expect(previews.PERCENT.error).toBeNull();
    expect(previews.ADJUSTABLE.error).toBeNull();

    // All modes should have tax rate applied
    expect(previews.EQUAL.result?.taxRateApplied).toBe(0.15);
    expect(previews.PERCENT.result?.taxRateApplied).toBe(0.15);
    expect(previews.ADJUSTABLE.result?.taxRateApplied).toBe(0.15);

    // Net profit should be the same for all modes
    expect(previews.EQUAL.result?.netProfit).toBe(1000);
    expect(previews.PERCENT.result?.netProfit).toBe(1000);
    expect(previews.ADJUSTABLE.result?.netProfit).toBe(1000);

    // Transfers should be calculated with tax gross-up
    expect(previews.EQUAL.result?.suggestedTransfers).toBeDefined();
    expect(previews.PERCENT.result?.suggestedTransfers).toBeDefined();
    expect(previews.ADJUSTABLE.result?.suggestedTransfers).toBeDefined();
  });

  it('should handle ADJUSTABLE mode with fixedPayouts', () => {
    const input: SessionInput = {
      name: 'Adjustable Session',
      type: 'BOUNTY',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 2000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Leader', active: true, revenue: 0, fixedPayout: 800 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 2000, percentShare: 100 }
      ]
    };

    const previews = calculateModePreviews(input);

    // ADJUSTABLE mode should succeed with fixedPayouts
    expect(previews.ADJUSTABLE.error).toBeNull();
    expect(previews.ADJUSTABLE.result).not.toBeNull();

    const adjustableAlice = previews.ADJUSTABLE.result?.members.find(m => m.memberId === 'member-1');
    const adjustableBob = previews.ADJUSTABLE.result?.members.find(m => m.memberId === 'member-2');

    // Alice gets fixed payout of 800
    expect(adjustableAlice?.profitShare).toBe(800);
    // Bob gets remainder: 2000 - 800 = 1200
    expect(adjustableBob?.profitShare).toBe(1200);
  });

  it('should handle single member sessions in all modes', () => {
    const input: SessionInput = {
      name: 'Solo Session',
      type: 'SALVAGE',
      distributionMode: 'EQUAL',
      totalRevenue: 1500,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Solo', active: true, revenue: 1500, percentShare: 100 }
      ]
    };

    const previews = calculateModePreviews(input);

    // All modes should succeed
    expect(previews.EQUAL.error).toBeNull();
    expect(previews.PERCENT.error).toBeNull();
    expect(previews.ADJUSTABLE.error).toBeNull();

    // Single member gets all profit in all modes
    expect(previews.EQUAL.result?.members[0].profitShare).toBe(1500);
    expect(previews.EQUAL.result?.members[0].finalNet).toBe(1500);

    expect(previews.PERCENT.result?.members[0].profitShare).toBe(1500);
    expect(previews.PERCENT.result?.members[0].finalNet).toBe(1500);

    expect(previews.ADJUSTABLE.result?.members[0].profitShare).toBe(1500);
    expect(previews.ADJUSTABLE.result?.members[0].finalNet).toBe(1500);

    // No transfers needed in solo session
    expect(previews.EQUAL.result?.suggestedTransfers).toHaveLength(0);
    expect(previews.PERCENT.result?.suggestedTransfers).toHaveLength(0);
    expect(previews.ADJUSTABLE.result?.suggestedTransfers).toHaveLength(0);
  });

  it('should handle sessions with inactive members correctly', () => {
    const input: SessionInput = {
      name: 'Mixed Activity Session',
      type: 'MINING',
      distributionMode: 'EQUAL',
      totalRevenue: 1200,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 600, percentShare: 60 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 400, percentShare: 40 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: false, revenue: 200, percentShare: 0 }
      ]
    };

    const previews = calculateModePreviews(input);

    // All modes should succeed (active members' percentShares sum to 100%)
    expect(previews.EQUAL.error).toBeNull();
    expect(previews.PERCENT.error).toBeNull();

    // EQUAL: only active members share profit (2 active members)
    const equalCharlie = previews.EQUAL.result?.members.find(m => m.memberId === 'member-3');
    expect(equalCharlie?.profitShare).toBe(0); // Inactive member gets no profit share

    // PERCENT: only active members with percentShares (Alice 50%, Bob 30%, Charlie inactive)
    // With Charlie inactive, shares should be redistributed or Charlie gets 0
    const percentCharlie = previews.PERCENT.result?.members.find(m => m.memberId === 'member-3');
    expect(percentCharlie?.profitShare).toBe(0); // Inactive member gets no profit share
  });

  it('should preserve original session distributionMode', () => {
    const input: SessionInput = {
      name: 'Test Session',
      type: 'TRADING',
      distributionMode: 'PERCENT', // Original mode is PERCENT
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 600, percentShare: 60 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 400, percentShare: 40 }
      ]
    };

    const originalMode = input.distributionMode;
    const previews = calculateModePreviews(input);

    // Original session should be unchanged
    expect(input.distributionMode).toBe(originalMode);
    expect(input.distributionMode).toBe('PERCENT');

    // All modes should still be previewed
    expect(previews.EQUAL.mode).toBe('EQUAL');
    expect(previews.PERCENT.mode).toBe('PERCENT');
    expect(previews.ADJUSTABLE.mode).toBe('ADJUSTABLE');
  });

  it('should handle empty revenue correctly in all modes', () => {
    const input: SessionInput = {
      name: 'Zero Revenue Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 0,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, percentShare: 50 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, percentShare: 50 }
      ]
    };

    const previews = calculateModePreviews(input);

    // All modes should succeed even with zero revenue
    expect(previews.EQUAL.error).toBeNull();
    expect(previews.PERCENT.error).toBeNull();
    expect(previews.ADJUSTABLE.error).toBeNull();

    // Net profit should be 0 for all modes
    expect(previews.EQUAL.result?.netProfit).toBe(0);
    expect(previews.PERCENT.result?.netProfit).toBe(0);
    expect(previews.ADJUSTABLE.result?.netProfit).toBe(0);

    // All members should have zero profit share
    expect(previews.EQUAL.result?.members[0].profitShare).toBe(0);
    expect(previews.EQUAL.result?.members[1].profitShare).toBe(0);
    expect(previews.PERCENT.result?.members[0].profitShare).toBe(0);
    expect(previews.PERCENT.result?.members[1].profitShare).toBe(0);
  });

  it('should return different results for each mode with same input', () => {
    const input: SessionInput = {
      name: 'Multi-Mode Comparison',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Leader', active: true, revenue: 100, percentShare: 70, fixedPayout: 600 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 900, percentShare: 30, fixedBonus: 100 }
      ]
    };

    const previews = calculateModePreviews(input);

    // All modes should succeed
    expect(previews.EQUAL.error).toBeNull();
    expect(previews.PERCENT.error).toBeNull();
    expect(previews.ADJUSTABLE.error).toBeNull();

    // Get Alice's profit share in each mode
    const equalAlice = previews.EQUAL.result?.members.find(m => m.memberId === 'member-1');
    const percentAlice = previews.PERCENT.result?.members.find(m => m.memberId === 'member-1');
    const adjustableAlice = previews.ADJUSTABLE.result?.members.find(m => m.memberId === 'member-1');

    // EQUAL: 500 each (1000 / 2)
    expect(equalAlice?.profitShare).toBe(500);

    // PERCENT: Alice 70% = 700, Bob 30% = 300
    expect(percentAlice?.profitShare).toBe(700);

    // ADJUSTABLE: Alice gets fixedPayout of 600, Bob gets 400 + fixedBonus 100 = 500
    expect(adjustableAlice?.profitShare).toBe(600);

    // Ensure the three modes produce different results
    expect(equalAlice?.profitShare).not.toBe(percentAlice?.profitShare);
    expect(percentAlice?.profitShare).not.toBe(adjustableAlice?.profitShare);
    expect(equalAlice?.profitShare).not.toBe(adjustableAlice?.profitShare);
  });

  it('should handle errors independently for each mode', () => {
    const input: SessionInput = {
      name: 'Partial Error Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 600 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 400 }
      ]
    };

    const previews = calculateModePreviews(input);

    // EQUAL mode should succeed (no dependencies on percentShares)
    expect(previews.EQUAL.error).toBeNull();
    expect(previews.EQUAL.result).not.toBeNull();
    expect(previews.EQUAL.result?.netProfit).toBe(1000);

    // PERCENT mode should fail (missing percentShares)
    expect(previews.PERCENT.error).not.toBeNull();
    expect(previews.PERCENT.result).toBeNull();

    // ADJUSTABLE mode should succeed (falls back to equal distribution when no percentShares)
    expect(previews.ADJUSTABLE.error).toBeNull();
    expect(previews.ADJUSTABLE.result).not.toBeNull();
    expect(previews.ADJUSTABLE.result?.netProfit).toBe(1000);

    // Verify that EQUAL mode success doesn't affect PERCENT error
    expect(previews.EQUAL.result?.members).toHaveLength(2);
    expect(previews.ADJUSTABLE.result?.members).toHaveLength(2);
  });
});
