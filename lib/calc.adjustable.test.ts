import type { SessionInput } from './calc';
import { calculatePayslip } from './calc';

// Test cases for ADJUSTABLE distribution mode

describe('calculatePayslip - ADJUSTABLE mode', () => {
  it('should give fixedPayout members exactly their payout amount', () => {
    const input: SessionInput = {
      name: 'Fixed Payout Session',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, fixedPayout: 200 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300, fixedPayout: 150 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 200 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.members.length).toBe(3);
    expect(result.netProfit).toBe(1000);
    expect(result.saleRevenue).toBe(1000);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    // Alice and Bob get their fixed payouts
    expect(alice?.profitShare).toBe(200);
    expect(bob?.profitShare).toBe(150);

    // Charlie gets the remainder: 1000 - 200 - 150 = 650
    expect(charlie?.profitShare).toBe(650);

    // Final net = investment (0) + profitShare - expenses (0)
    expect(alice?.finalNet).toBe(200);
    expect(bob?.finalNet).toBe(150);
    expect(charlie?.finalNet).toBe(650);
  });

  it('should add fixedBonus on top of equal distribution for pool members', () => {
    const input: SessionInput = {
      name: 'Fixed Bonus Session',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, fixedBonus: 100 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.netProfit).toBe(1000);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Pool after bonuses: 1000 - 100 = 900
    // Equal share: 900 / 2 = 450
    // Alice: 450 + 100 (bonus) = 550
    // Bob: 450 + 0 (no bonus) = 450
    expect(alice?.profitShare).toBe(550);
    expect(bob?.profitShare).toBe(450);

    expect(alice?.finalNet).toBe(550);
    expect(bob?.finalNet).toBe(450);
  });

  it('should combine fixedPayout and fixedBonus correctly', () => {
    const input: SessionInput = {
      name: 'Mixed Fixed Session',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 400, fixedPayout: 300 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300, fixedBonus: 100 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 300 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.netProfit).toBe(1000);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    // Step 1: Alice gets fixed payout of 300
    // Remaining pool: 1000 - 300 = 700
    // Step 2: Bob has fixedBonus of 100, subtract from pool
    // Pool after bonuses: 700 - 100 = 600
    // Step 3: Distribute equally among pool members (Bob, Charlie)
    // Equal share: 600 / 2 = 300
    // Bob: 300 + 100 (bonus) = 400
    // Charlie: 300 + 0 = 300

    expect(alice?.profitShare).toBe(300);
    expect(bob?.profitShare).toBe(400);
    expect(charlie?.profitShare).toBe(300);

    expect(alice?.finalNet).toBe(300);
    expect(bob?.finalNet).toBe(400);
    expect(charlie?.finalNet).toBe(300);
  });

  it('should use percentShare for pool distribution when any pool member has it', () => {
    const input: SessionInput = {
      name: 'Adjustable with Percent',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 400, fixedPayout: 200 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300, percentShare: 60 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 300, percentShare: 40 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.netProfit).toBe(1000);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    // Alice gets fixed payout of 200
    // Remaining pool: 1000 - 200 = 800
    // Bob and Charlie have percentShares (60%, 40%)
    // Bob: 800 * 60 / 100 = 480
    // Charlie: 800 * 40 / 100 = 320

    expect(alice?.profitShare).toBe(200);
    expect(bob?.profitShare).toBe(480);
    expect(charlie?.profitShare).toBe(320);

    expect(alice?.finalNet).toBe(200);
    expect(bob?.finalNet).toBe(480);
    expect(charlie?.finalNet).toBe(320);
  });

  it('should exclude inactive members from ADJUSTABLE distribution', () => {
    const input: SessionInput = {
      name: 'Adjustable with Inactive',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: false, revenue: 200, fixedPayout: 100 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.members.length).toBe(3);
    expect(result.netProfit).toBe(1000);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    // Charlie is inactive, so his fixedPayout is ignored
    // Only Alice and Bob participate, equal split of 1000
    expect(alice?.profitShare).toBe(500);
    expect(bob?.profitShare).toBe(500);
    expect(charlie?.profitShare).toBe(0); // Inactive member gets no profit share
  });

  it('should handle investments before ADJUSTABLE distribution', () => {
    const input: SessionInput = {
      name: 'Adjustable with Investment',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1500,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, investment: 200, fixedPayout: 300 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 1000, investment: 300 }
      ]
    };

    const result = calculatePayslip(input);

    // Total investments: 200 + 300 = 500
    // saleRevenue = 1500 - 500 = 1000
    expect(result.saleRevenue).toBe(1000);
    expect(result.netProfit).toBe(1000);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Alice gets fixed payout of 300
    // Bob gets remainder: 1000 - 300 = 700
    expect(alice?.profitShare).toBe(300);
    expect(bob?.profitShare).toBe(700);

    // finalNet = investment + profitShare - expenses
    // Alice: 200 + 300 - 0 = 500
    // Bob: 300 + 700 - 0 = 1000
    expect(alice?.finalNet).toBe(500);
    expect(bob?.finalNet).toBe(1000);
  });

  it('should handle shared expenses in ADJUSTABLE mode', () => {
    const input: SessionInput = {
      name: 'Adjustable with Shared Expenses',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, fixedPayout: 200 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500 }
      ],
      sharedExpenses: [
        { label: 'Fuel', amount: 100 }
      ]
    };

    const result = calculatePayslip(input);

    // netProfit = saleRevenue - totalExpenses = 1000 - 100 = 900
    expect(result.netProfit).toBe(900);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Shared expenses split equally: 100 / 2 = 50 each
    expect(alice?.sharedExpenses).toBe(50);
    expect(bob?.sharedExpenses).toBe(50);

    // Alice gets fixed payout of 200
    // Bob gets remainder: 900 - 200 = 700
    expect(alice?.profitShare).toBe(200);
    expect(bob?.profitShare).toBe(700);

    // finalNet = investment + profitShare - expenses
    // Expenses are already deducted before adjustable distribution.
    expect(alice?.finalNet).toBe(200);
    expect(bob?.finalNet).toBe(700);
  });

  it('should handle individual expenses in ADJUSTABLE mode', () => {
    const input: SessionInput = {
      name: 'Adjustable with Individual Expenses',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, fixedBonus: 50 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500 }
      ],
      individualExpenses: [
        { label: 'Repair', amount: 100, memberId: 'member-1' }
      ]
    };

    const result = calculatePayslip(input);

    // netProfit = saleRevenue - totalExpenses = 1000 - 100 = 900
    expect(result.netProfit).toBe(900);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Individual expense assigned to Alice
    expect(alice?.individualExpenses).toBe(100);
    expect(bob?.individualExpenses).toBe(0);

    // Pool after bonuses: 900 - 50 = 850
    // Equal share: 850 / 2 = 425
    // Alice: 425 + 50 = 475
    // Bob: 425 + 0 = 425
    expect(alice?.profitShare).toBe(475);
    expect(bob?.profitShare).toBe(425);

    // finalNet = investment + profitShare - expenses
    // The expense is already reflected in the distributable pool.
    expect(alice?.finalNet).toBe(475);
    expect(bob?.finalNet).toBe(425);
  });

  it('should generate correct settlement transfers in ADJUSTABLE mode', () => {
    const input: SessionInput = {
      name: 'Adjustable Settlement Test',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 1000, fixedPayout: 200 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 0 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 1000 - 1000 = 0, netProfit = 0
    expect(result.saleRevenue).toBe(0);
    expect(result.netProfit).toBe(0);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Alice gets fixed payout of 200
    // Bob gets remainder: 0 - 200 = -200
    expect(alice?.profitShare).toBe(200);
    expect(bob?.profitShare).toBe(-200);

    // finalNet = investment + profitShare
    // Alice: 1000 + 200 = 1200
    // Bob: 0 + (-200) = -200
    expect(alice?.finalNet).toBe(1200);
    expect(bob?.finalNet).toBe(-200);

    // Transfers: Bob owes Alice (balance after investment)
    // Alice: finalNet - investment = 1200 - 1000 = 200 (creditor)
    // Bob: finalNet - investment = -200 - 0 = -200 (debtor)
    // Bob needs to transfer 200 to Alice
    expect(result.suggestedTransfers.length).toBe(1);
    expect(result.suggestedTransfers[0].fromMemberId).toBe('member-2');
    expect(result.suggestedTransfers[0].toMemberId).toBe('member-1');
    expect(result.suggestedTransfers[0].netAmount).toBe(200);
  });

  it('should handle single active member in ADJUSTABLE mode', () => {
    const input: SessionInput = {
      name: 'Solo Adjustable Session',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000, fixedBonus: 100 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.members.length).toBe(1);
    expect(result.netProfit).toBe(1000);

    // Single member gets all profit
    // Pool after bonus: 1000 - 100 = 900
    // Equal share: 900 / 1 = 900
    // Alice: 900 + 100 = 1000
    expect(result.members[0].profitShare).toBe(1000);
    expect(result.members[0].finalNet).toBe(1000);
  });
});
