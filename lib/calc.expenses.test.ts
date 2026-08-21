import type { SessionInput } from './calc';
import { calculatePayslip } from './calc';

// Test cases for Expense Allocation

describe('calculatePayslip - Expense Allocation', () => {
  it('should distribute shared expenses equally among all active members by default', () => {
    const input: SessionInput = {
      name: 'Shared Expense Default Distribution',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 400 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 300 }
      ],
      sharedExpenses: [
        { label: 'Fuel', amount: 150 }
      ]
    };

    const result = calculatePayslip(input);

    // 3 active members, so each pays 150 / 3 = 50
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    expect(alice?.sharedExpenses).toBeCloseTo(50, 2);
    expect(bob?.sharedExpenses).toBeCloseTo(50, 2);
    expect(charlie?.sharedExpenses).toBeCloseTo(50, 2);

    // Individual expenses should be 0
    expect(alice?.individualExpenses).toBe(0);
    expect(bob?.individualExpenses).toBe(0);
    expect(charlie?.individualExpenses).toBe(0);

    // Total expenses should equal total shared expenses
    expect(alice?.expenses).toBeCloseTo(50, 2);
    expect(bob?.expenses).toBeCloseTo(50, 2);
    expect(charlie?.expenses).toBeCloseTo(50, 2);
  });

  it('should distribute shared expenses only to specified participantIds', () => {
    const input: SessionInput = {
      name: 'Shared Expense with Participants',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 400 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 300 }
      ],
      sharedExpenses: [
        { label: 'Fuel', amount: 100, participantIds: ['member-1', 'member-2'] }
      ]
    };

    const result = calculatePayslip(input);

    // Only Alice and Bob share the expense: 100 / 2 = 50 each
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    expect(alice?.sharedExpenses).toBe(50);
    expect(bob?.sharedExpenses).toBe(50);
    expect(charlie?.sharedExpenses).toBe(0); // Charlie not included

    // Net profit = 1000 - 100 = 900
    expect(result.netProfit).toBe(900);
  });

  it('should accumulate multiple shared expenses correctly', () => {
    const input: SessionInput = {
      name: 'Multiple Shared Expenses',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500 }
      ],
      sharedExpenses: [
        { label: 'Fuel', amount: 100 },
        { label: 'Maintenance', amount: 60 },
        { label: 'Parking', amount: 40 }
      ]
    };

    const result = calculatePayslip(input);

    // Total shared expenses: 100 + 60 + 40 = 200
    // Each member pays: 200 / 2 = 100
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    expect(alice?.sharedExpenses).toBe(100);
    expect(bob?.sharedExpenses).toBe(100);

    // Net profit = 1000 - 200 = 800
    expect(result.netProfit).toBe(800);
  });

  it('should assign individual expenses only to the specified member', () => {
    const input: SessionInput = {
      name: 'Individual Expense Allocation',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 200 }
      ],
      individualExpenses: [
        { label: 'Repair', amount: 150, memberId: 'member-2' }
      ]
    };

    const result = calculatePayslip(input);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    // Only Bob has the individual expense
    expect(alice?.individualExpenses).toBe(0);
    expect(bob?.individualExpenses).toBe(150);
    expect(charlie?.individualExpenses).toBe(0);

    // Shared expenses should be 0 for all
    expect(alice?.sharedExpenses).toBe(0);
    expect(bob?.sharedExpenses).toBe(0);
    expect(charlie?.sharedExpenses).toBe(0);

    // Net profit = 1000 - 150 = 850
    expect(result.netProfit).toBe(850);
  });

  it('should accumulate multiple individual expenses for the same member', () => {
    const input: SessionInput = {
      name: 'Multiple Individual Expenses Same Member',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500 }
      ],
      individualExpenses: [
        { label: 'Repair', amount: 50, memberId: 'member-1' },
        { label: 'Equipment', amount: 75, memberId: 'member-1' },
        { label: 'Supplies', amount: 25, memberId: 'member-2' }
      ]
    };

    const result = calculatePayslip(input);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Alice has 50 + 75 = 125 individual expenses
    expect(alice?.individualExpenses).toBe(125);
    // Bob has 25 individual expenses
    expect(bob?.individualExpenses).toBe(25);

    // Total expenses = 125 + 25 = 150
    // Net profit = 1000 - 150 = 850
    expect(result.netProfit).toBe(850);
  });

  it('should correctly combine shared and individual expenses', () => {
    const input: SessionInput = {
      name: 'Combined Expenses',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500 }
      ],
      sharedExpenses: [
        { label: 'Fuel', amount: 100 }
      ],
      individualExpenses: [
        { label: 'Repair', amount: 80, memberId: 'member-1' }
      ]
    };

    const result = calculatePayslip(input);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Shared: 100 / 2 = 50 each
    expect(alice?.sharedExpenses).toBe(50);
    expect(bob?.sharedExpenses).toBe(50);

    // Individual: Alice 80, Bob 0
    expect(alice?.individualExpenses).toBe(80);
    expect(bob?.individualExpenses).toBe(0);

    // Total expenses per member
    expect(alice?.expenses).toBe(130); // 50 + 80
    expect(bob?.expenses).toBe(50);    // 50 + 0

    // Total expenses: 100 (shared) + 80 (individual) = 180
    // Net profit = 1000 - 180 = 820
    expect(result.netProfit).toBe(820);

    // Equal profit share: 820 / 2 = 410 each
    expect(alice?.profitShare).toBe(410);
    expect(bob?.profitShare).toBe(410);

    // finalNet = investment + profitShare - expenses
    // All expenses are already deducted before equal distribution.
    expect(alice?.finalNet).toBe(410);
    expect(bob?.finalNet).toBe(410);
  });

  it('should exclude inactive members from shared expense allocation by default', () => {
    const input: SessionInput = {
      name: 'Shared Expense with Inactive Member',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: false, revenue: 200 }
      ],
      sharedExpenses: [
        { label: 'Fuel', amount: 100 }
      ]
    };

    const result = calculatePayslip(input);

    // Only 2 active members, so each pays 100 / 2 = 50
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    expect(alice?.sharedExpenses).toBe(50);
    expect(bob?.sharedExpenses).toBe(50);
    expect(charlie?.sharedExpenses).toBe(0); // Inactive member not charged
  });

  it('should handle expenses with zero total revenue', () => {
    const input: SessionInput = {
      name: 'Expenses with Zero Revenue',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 0,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0 }
      ],
      sharedExpenses: [
        { label: 'Fuel', amount: 100 }
      ],
      individualExpenses: [
        { label: 'Repair', amount: 50, memberId: 'member-1' }
      ]
    };

    const result = calculatePayslip(input);

    // Net profit = 0 - 150 = -150
    expect(result.netProfit).toBe(-150);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Expenses still allocated
    expect(alice?.sharedExpenses).toBe(50);
    expect(bob?.sharedExpenses).toBe(50);
    expect(alice?.individualExpenses).toBe(50);
    expect(bob?.individualExpenses).toBe(0);

    // Equal profit share of negative profit: -150 / 2 = -75 each
    expect(alice?.profitShare).toBe(-75);
    expect(bob?.profitShare).toBe(-75);

    // finalNet = investment + profitShare - expenses
    // The total expense of 150 is shared through the equal distribution.
    expect(alice?.finalNet).toBe(-75);
    expect(bob?.finalNet).toBe(-75);
  });
});
