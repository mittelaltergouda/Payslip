import type { SessionInput} from './calc';
import { calculatePayslip } from './calc';

// Test cases for EQUAL distribution mode

describe('calculatePayslip - EQUAL mode', () => {
  it('should distribute profit equally among active members in EQUAL mode', () => {
    const input: SessionInput = {
      name: 'Test Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 200 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.members.length).toBe(3);
    expect(result.netProfit).toBe(1000);
    expect(result.saleRevenue).toBe(1000);
    expect(result.taxRateApplied).toBe(0);

    result.members.forEach(member => {
      expect(member.finalNet).toBeCloseTo(1000 / 3, 2);
    });
  });

  it('should exclude inactive members from equal profit distribution', () => {
    const input: SessionInput = {
      name: 'Test Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 300 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: false, revenue: 200 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.members.length).toBe(3);
    expect(result.netProfit).toBe(1000);

    // Active members should each get 500 (1000 / 2)
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    expect(alice?.profitShare).toBe(500);
    expect(bob?.profitShare).toBe(500);
    expect(charlie?.profitShare).toBe(0); // Inactive member gets no profit share
  });

  it('should handle single active member in EQUAL mode', () => {
    const input: SessionInput = {
      name: 'Solo Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.members.length).toBe(1);
    expect(result.netProfit).toBe(1000);
    expect(result.members[0].finalNet).toBe(1000);
    expect(result.members[0].profitShare).toBe(1000);
  });

  it('should return investments to members before equal distribution', () => {
    const input: SessionInput = {
      name: 'Investment Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1500,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, investment: 200 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 1000, investment: 300 }
      ]
    };

    const result = calculatePayslip(input);

    // Total investments: 200 + 300 = 500
    // saleRevenue = totalRevenue - totalInvestments = 1500 - 500 = 1000
    expect(result.saleRevenue).toBe(1000);
    expect(result.netProfit).toBe(1000);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Each gets equal profit share of 500 (1000 / 2)
    expect(alice?.profitShare).toBe(500);
    expect(bob?.profitShare).toBe(500);

    // finalNet = investment + profitShare - expenses
    // Alice: 200 + 500 - 0 = 700
    // Bob: 300 + 500 - 0 = 800
    expect(alice?.finalNet).toBe(700);
    expect(bob?.finalNet).toBe(800);
  });

  it('should deduct shared expenses equally among active members in EQUAL mode', () => {
    const input: SessionInput = {
      name: 'Session with Shared Expenses',
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

    // Each gets equal profit share: 900 / 2 = 450
    expect(alice?.profitShare).toBe(450);
    expect(bob?.profitShare).toBe(450);

    // finalNet = investment + profitShare - expenses = 0 + 450 - 50 = 400
    expect(alice?.finalNet).toBe(400);
    expect(bob?.finalNet).toBe(400);
  });

  it('should handle individual expenses in EQUAL mode', () => {
    const input: SessionInput = {
      name: 'Session with Individual Expenses',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
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

    // Individual expenses are assigned to specific members
    expect(alice?.individualExpenses).toBe(100);
    expect(bob?.individualExpenses).toBe(0);

    // Each gets equal profit share: 900 / 2 = 450
    expect(alice?.profitShare).toBe(450);
    expect(bob?.profitShare).toBe(450);

    // Alice: 0 + 450 - 100 = 350
    // Bob: 0 + 450 - 0 = 450
    expect(alice?.finalNet).toBe(350);
    expect(bob?.finalNet).toBe(450);
  });

  it('should generate correct settlement transfers in EQUAL mode', () => {
    const input: SessionInput = {
      name: 'Settlement Test',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 1000 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 0 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 1000 - 1000 = 0, netProfit = 0
    expect(result.saleRevenue).toBe(0);
    expect(result.netProfit).toBe(0);

    // Each gets equal profit share of 0
    // Alice: investment 1000 + profitShare 0 = finalNet 1000
    // Bob: investment 0 + profitShare 0 = finalNet 0
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    expect(alice?.finalNet).toBe(1000);
    expect(bob?.finalNet).toBe(0);

    // No transfers needed since Bob owes nothing and Alice just gets her investment back
    // But since the total pool is 1000 (from totalRevenue), and Alice invested 1000,
    // the saleRevenue is 0, so no profit to distribute
    // Alice's balance = finalNet - investment = 1000 - 1000 = 0 (no one owes her)
    // Bob's balance = finalNet - investment = 0 - 0 = 0 (he owes nothing)
    expect(result.suggestedTransfers.length).toBe(0);
  });

  it('should properly distribute when investments differ in EQUAL mode', () => {
    const input: SessionInput = {
      name: 'Different Investments',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1200,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 600, investment: 400 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 600, investment: 200 }
      ]
    };

    const result = calculatePayslip(input);

    // Total investments: 400 + 200 = 600
    // saleRevenue = 1200 - 600 = 600
    // netProfit = 600 - 0 (no expenses) = 600
    expect(result.saleRevenue).toBe(600);
    expect(result.netProfit).toBe(600);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Each gets equal profit share: 600 / 2 = 300
    expect(alice?.profitShare).toBe(300);
    expect(bob?.profitShare).toBe(300);

    // finalNet = investment + profitShare - expenses
    // Alice: 400 + 300 - 0 = 700
    // Bob: 200 + 300 - 0 = 500
    expect(alice?.finalNet).toBe(700);
    expect(bob?.finalNet).toBe(500);
  });
});
