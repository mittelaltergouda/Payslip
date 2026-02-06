import type { SessionInput } from './calc';
import { calculatePayslip } from './calc';

// Test cases for PERCENT distribution mode

describe('calculatePayslip - PERCENT mode', () => {
  it('should distribute profit according to percentShare values', () => {
    const input: SessionInput = {
      name: 'Percent Session',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, percentShare: 60 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300, percentShare: 40 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.members.length).toBe(2);
    expect(result.netProfit).toBe(1000);
    expect(result.saleRevenue).toBe(1000);
    expect(result.taxRateApplied).toBe(0);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Alice gets 60% of 1000 = 600
    // Bob gets 40% of 1000 = 400
    expect(alice?.profitShare).toBe(600);
    expect(bob?.profitShare).toBe(400);
    expect(alice?.finalNet).toBe(600);
    expect(bob?.finalNet).toBe(400);
  });

  it('should exclude inactive members from percent profit distribution', () => {
    const input: SessionInput = {
      name: 'Percent Session with Inactive',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, percentShare: 70 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300, percentShare: 30 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: false, revenue: 200, percentShare: 0 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.members.length).toBe(3);
    expect(result.netProfit).toBe(1000);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    // Alice gets 70% of 1000 = 700
    // Bob gets 30% of 1000 = 300
    // Charlie gets 0 (inactive)
    expect(alice?.profitShare).toBe(700);
    expect(bob?.profitShare).toBe(300);
    expect(charlie?.profitShare).toBe(0);
  });

  it('should throw error when percentShares do not sum to 100%', () => {
    const input: SessionInput = {
      name: 'Invalid Percent Session',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, percentShare: 50 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500, percentShare: 30 }
      ]
    };

    expect(() => calculatePayslip(input)).toThrow(
      'PERCENT mode requires percentShares to sum to 100%'
    );
  });

  it('should handle single active member with 100% share in PERCENT mode', () => {
    const input: SessionInput = {
      name: 'Solo Percent Session',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000, percentShare: 100 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.members.length).toBe(1);
    expect(result.netProfit).toBe(1000);
    expect(result.members[0].profitShare).toBe(1000);
    expect(result.members[0].finalNet).toBe(1000);
  });

  it('should return investments before percent distribution', () => {
    const input: SessionInput = {
      name: 'Percent with Investments',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      totalRevenue: 1500,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, investment: 200, percentShare: 60 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 1000, investment: 300, percentShare: 40 }
      ]
    };

    const result = calculatePayslip(input);

    // Total investments: 200 + 300 = 500
    // saleRevenue = totalRevenue - totalInvestments = 1500 - 500 = 1000
    expect(result.saleRevenue).toBe(1000);
    expect(result.netProfit).toBe(1000);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Alice gets 60% of 1000 = 600
    // Bob gets 40% of 1000 = 400
    expect(alice?.profitShare).toBe(600);
    expect(bob?.profitShare).toBe(400);

    // finalNet = investment + profitShare - expenses
    // Alice: 200 + 600 - 0 = 800
    // Bob: 300 + 400 - 0 = 700
    expect(alice?.finalNet).toBe(800);
    expect(bob?.finalNet).toBe(700);
  });

  it('should deduct shared expenses before percent distribution', () => {
    const input: SessionInput = {
      name: 'Percent with Shared Expenses',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, percentShare: 60 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500, percentShare: 40 }
      ],
      sharedExpenses: [
        { label: 'Fuel', amount: 100 }
      ]
    };

    const result = calculatePayslip(input);

    // netProfit = saleRevenue - totalExpenses = 1000 - 100 = 900
    expect(result.netProfit).toBe(900);

    // Each active member shares the expense equally: 100 / 2 = 50
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    expect(alice?.sharedExpenses).toBe(50);
    expect(bob?.sharedExpenses).toBe(50);

    // Alice gets 60% of 900 = 540
    // Bob gets 40% of 900 = 360
    expect(alice?.profitShare).toBe(540);
    expect(bob?.profitShare).toBe(360);

    // finalNet = investment + profitShare - expenses
    // Alice: 0 + 540 - 50 = 490
    // Bob: 0 + 360 - 50 = 310
    expect(alice?.finalNet).toBe(490);
    expect(bob?.finalNet).toBe(310);
  });

  it('should handle individual expenses in PERCENT mode', () => {
    const input: SessionInput = {
      name: 'Percent with Individual Expenses',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, percentShare: 50 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500, percentShare: 50 }
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

    // Individual expenses are assigned to specific members
    expect(alice?.individualExpenses).toBe(100);
    expect(bob?.individualExpenses).toBe(0);

    // Each gets 50% of 900 = 450
    expect(alice?.profitShare).toBe(450);
    expect(bob?.profitShare).toBe(450);

    // Alice: 0 + 450 - 100 = 350
    // Bob: 0 + 450 - 0 = 450
    expect(alice?.finalNet).toBe(350);
    expect(bob?.finalNet).toBe(450);
  });

  it('should handle unequal percent shares with three members', () => {
    const input: SessionInput = {
      name: 'Three Way Percent Split',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Leader', active: true, revenue: 400, percentShare: 50 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300, percentShare: 30 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 300, percentShare: 20 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.netProfit).toBe(1000);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    // Alice gets 50% of 1000 = 500
    // Bob gets 30% of 1000 = 300
    // Charlie gets 20% of 1000 = 200
    expect(alice?.profitShare).toBe(500);
    expect(bob?.profitShare).toBe(300);
    expect(charlie?.profitShare).toBe(200);

    expect(alice?.finalNet).toBe(500);
    expect(bob?.finalNet).toBe(300);
    expect(charlie?.finalNet).toBe(200);
  });

  it('should generate correct settlement transfers in PERCENT mode', () => {
    const input: SessionInput = {
      name: 'Percent Settlement Test',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 1000, percentShare: 50 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 0, percentShare: 50 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 1000 - 1000 = 0, netProfit = 0
    expect(result.saleRevenue).toBe(0);
    expect(result.netProfit).toBe(0);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Each gets 50% of 0 = 0 profit share
    expect(alice?.profitShare).toBe(0);
    expect(bob?.profitShare).toBe(0);

    // Alice: investment 1000 + profitShare 0 = finalNet 1000
    // Bob: investment 0 + profitShare 0 = finalNet 0
    expect(alice?.finalNet).toBe(1000);
    expect(bob?.finalNet).toBe(0);

    // No transfers needed since profit is 0 and Alice gets her investment back
    expect(result.suggestedTransfers.length).toBe(0);
  });

  it('should handle individual expense for a member in PERCENT mode', () => {
    const input: SessionInput = {
      name: 'Individual Expense Test',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 600, percentShare: 60 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 400, percentShare: 40 }
      ],
      individualExpenses: [
        { label: 'Alice Repair', amount: 200, memberId: 'member-1' }
      ]
    };

    const result = calculatePayslip(input);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    expect(alice?.individualExpenses).toBe(200);
    expect(bob?.individualExpenses).toBe(0);

    // netProfit = 1000 - 200 = 800
    expect(result.netProfit).toBe(800);

    // Revenue share: Alice 60%, Bob 40%
    expect(alice?.profitShare).toBe(480); // 800 * 0.6
    expect(bob?.profitShare).toBe(320); // 800 * 0.4

    // finalNet includes deduction for individual expense
    expect(alice?.finalNet).toBe(280); // 480 - 200
    expect(bob?.finalNet).toBe(320); // 320 - 0
  });
});

// Performance Tests

describe('calculatePayslip - Performance Tests', () => {
  it('should calculate payslip for 100 members with PERCENT mode in less than 1 second', () => {
    // Create a session with 100 members, each with equal percentShare (1%)
    const members = Array.from({ length: 100 }, (_, i) => ({
      id: `member-${i}`,
      handle: `Member${i}`,
      role: 'Member' as const,
      active: true,
      revenue: Math.floor(Math.random() * 10000) + 100,
      investment: Math.floor(Math.random() * 1000),
      percentShare: 1 // Each gets 1% (totaling 100%)
    }));

    const input: SessionInput = {
      name: 'Performance Test PERCENT',
      type: 'TRADING',
      distributionMode: 'PERCENT',
      totalRevenue: 1000000,
      taxEnabled: true,
      taxRate: 0.005, // Fixed tax rate: always 0.5%
      members
    };

    const startTime = performance.now();
    const result = calculatePayslip(input);
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(result.members.length).toBe(100);
    expect(executionTime).toBeLessThan(1000);
  });
});
