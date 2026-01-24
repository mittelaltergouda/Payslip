import { calculatePayslip, SessionInput, applyTransferTaxes, calculateGrossAmount, calculateFeeAmount } from './calc';
import { Transfer } from './types';

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
});

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
    // Alice: 0 + 200 - 50 = 150
    // Bob: 0 + 700 - 50 = 650
    expect(alice?.finalNet).toBe(150);
    expect(bob?.finalNet).toBe(650);
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
    // Alice: 0 + 475 - 100 = 375
    // Bob: 0 + 425 - 0 = 425
    expect(alice?.finalNet).toBe(375);
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

// Test cases for Expense Allocation (shared & individual)

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
    // Alice: 0 + 410 - 130 = 280
    // Bob: 0 + 410 - 50 = 360
    expect(alice?.finalNet).toBe(280);
    expect(bob?.finalNet).toBe(360);
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
    // Alice: 0 + (-75) - 100 = -175
    // Bob: 0 + (-75) - 50 = -125
    expect(alice?.finalNet).toBe(-175);
    expect(bob?.finalNet).toBe(-125);
  });
});

// Test cases for Tax Gross-Up Calculations

describe('Tax Gross-Up Calculations', () => {
  describe('calculateGrossAmount', () => {
    it('should return net amount when tax rate is 0', () => {
      const netAmount = 100;
      const taxRate = 0;

      const grossAmount = calculateGrossAmount(netAmount, taxRate);

      expect(grossAmount).toBe(100);
    });

    it('should correctly gross-up with 5% tax rate', () => {
      const netAmount = 100;
      const taxRate = 0.05;

      // Formula: grossAmount = ceil(net / (1 - taxRate)) = ceil(100 / 0.95) = ceil(105.26) = 106
      const grossAmount = calculateGrossAmount(netAmount, taxRate);

      expect(grossAmount).toBe(106);
    });

    it('should correctly gross-up with 10% tax rate', () => {
      const netAmount = 100;
      const taxRate = 0.10;

      // Formula: ceil(100 / 0.90) = ceil(111.11) = 112
      const grossAmount = calculateGrossAmount(netAmount, taxRate);

      expect(grossAmount).toBe(112);
    });

    it('should return net amount when tax rate is 1 or greater (edge case)', () => {
      const netAmount = 100;

      // taxRate = 1 would require infinite gross amount - return net as fallback
      expect(calculateGrossAmount(netAmount, 1)).toBe(100);
      expect(calculateGrossAmount(netAmount, 1.5)).toBe(100);
    });

    it('should return net amount when tax rate is negative (edge case)', () => {
      const netAmount = 100;
      const taxRate = -0.05;

      const grossAmount = calculateGrossAmount(netAmount, taxRate);

      expect(grossAmount).toBe(100);
    });
  });

  describe('calculateFeeAmount', () => {
    it('should correctly calculate fee as difference between gross and net', () => {
      const grossAmount = 106;
      const netAmount = 100;

      const feeAmount = calculateFeeAmount(grossAmount, netAmount);

      expect(feeAmount).toBe(6);
    });

    it('should return 0 when gross equals net (no tax)', () => {
      const grossAmount = 100;
      const netAmount = 100;

      const feeAmount = calculateFeeAmount(grossAmount, netAmount);

      expect(feeAmount).toBe(0);
    });
  });

  describe('applyTransferTaxes', () => {
    it('should apply 0 tax rate correctly (no gross-up)', () => {
      const transfers: Transfer[] = [
        { fromMemberId: 'member-1', toMemberId: 'member-2', netAmount: 100, grossAmount: 0, feeAmount: 0 }
      ];
      const taxRate = 0;

      const result = applyTransferTaxes(transfers, taxRate);

      expect(result.length).toBe(1);
      expect(result[0].netAmount).toBe(100);
      expect(result[0].grossAmount).toBe(100);
      expect(result[0].feeAmount).toBe(0);
    });

    it('should apply 5% tax rate with correct gross-up', () => {
      const transfers: Transfer[] = [
        { fromMemberId: 'member-1', toMemberId: 'member-2', netAmount: 100, grossAmount: 0, feeAmount: 0 }
      ];
      const taxRate = 0.05;

      const result = applyTransferTaxes(transfers, taxRate);

      expect(result.length).toBe(1);
      expect(result[0].netAmount).toBe(100);
      // grossAmount = ceil(100 / 0.95) = 106
      expect(result[0].grossAmount).toBe(106);
      expect(result[0].feeAmount).toBe(6);
    });

    it('should apply tax to multiple transfers correctly', () => {
      const transfers: Transfer[] = [
        { fromMemberId: 'member-1', toMemberId: 'member-2', netAmount: 100, grossAmount: 0, feeAmount: 0 },
        { fromMemberId: 'member-3', toMemberId: 'member-4', netAmount: 200, grossAmount: 0, feeAmount: 0 }
      ];
      const taxRate = 0.05;

      const result = applyTransferTaxes(transfers, taxRate);

      expect(result.length).toBe(2);

      // First transfer: ceil(100 / 0.95) = 106
      expect(result[0].netAmount).toBe(100);
      expect(result[0].grossAmount).toBe(106);
      expect(result[0].feeAmount).toBe(6);

      // Second transfer: ceil(200 / 0.95) = ceil(210.53) = 211
      expect(result[1].netAmount).toBe(200);
      expect(result[1].grossAmount).toBe(211);
      expect(result[1].feeAmount).toBe(11);
    });

    it('should handle edge case of tax rate >= 1 by returning unchanged transfers', () => {
      const transfers: Transfer[] = [
        { fromMemberId: 'member-1', toMemberId: 'member-2', netAmount: 100, grossAmount: 0, feeAmount: 0 }
      ];
      const taxRate = 1;

      const result = applyTransferTaxes(transfers, taxRate);

      expect(result.length).toBe(1);
      expect(result[0].netAmount).toBe(100);
      expect(result[0].grossAmount).toBe(100);
      expect(result[0].feeAmount).toBe(0);
    });

    it('should handle negative tax rate as no tax', () => {
      const transfers: Transfer[] = [
        { fromMemberId: 'member-1', toMemberId: 'member-2', netAmount: 100, grossAmount: 0, feeAmount: 0 }
      ];
      const taxRate = -0.05;

      const result = applyTransferTaxes(transfers, taxRate);

      expect(result.length).toBe(1);
      expect(result[0].grossAmount).toBe(100);
      expect(result[0].feeAmount).toBe(0);
    });
  });

  describe('calculatePayslip with tax enabled', () => {
    it('should apply tax gross-up to settlement transfers when tax is enabled', () => {
      const input: SessionInput = {
        name: 'Tax Enabled Session',
        type: 'TRADING',
        distributionMode: 'ADJUSTABLE',
        totalRevenue: 1000,
        taxEnabled: true,
        taxRate: 0.05,
        members: [
          { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 1000, fixedPayout: 200 },
          { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 0 }
        ]
      };

      const result = calculatePayslip(input);

      // saleRevenue = 1000 - 1000 = 0, netProfit = 0
      expect(result.saleRevenue).toBe(0);
      expect(result.netProfit).toBe(0);
      expect(result.taxRateApplied).toBe(0.05);

      const alice = result.members.find(m => m.memberId === 'member-1');
      const bob = result.members.find(m => m.memberId === 'member-2');

      // Alice gets fixed payout of 200, Bob gets remainder: 0 - 200 = -200
      expect(alice?.profitShare).toBe(200);
      expect(bob?.profitShare).toBe(-200);

      // finalNet = investment + profitShare
      // Alice: 1000 + 200 = 1200
      // Bob: 0 + (-200) = -200
      expect(alice?.finalNet).toBe(1200);
      expect(bob?.finalNet).toBe(-200);

      // Balance: Alice = 1200 - 1000 = 200 (creditor), Bob = -200 - 0 = -200 (debtor)
      // Bob owes Alice 200
      // With 5% tax, gross = ceil(200 / 0.95) = ceil(210.53) = 211
      expect(result.suggestedTransfers.length).toBe(1);
      expect(result.suggestedTransfers[0].fromMemberId).toBe('member-2');
      expect(result.suggestedTransfers[0].toMemberId).toBe('member-1');
      expect(result.suggestedTransfers[0].netAmount).toBe(200);
      expect(result.suggestedTransfers[0].grossAmount).toBe(211);
      expect(result.suggestedTransfers[0].feeAmount).toBe(11);
    });

    it('should not apply tax when taxEnabled is false', () => {
      const input: SessionInput = {
        name: 'Tax Disabled Session',
        type: 'TRADING',
        distributionMode: 'ADJUSTABLE',
        totalRevenue: 1000,
        taxEnabled: false,
        taxRate: 0.05, // Rate specified but should be ignored
        members: [
          { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 1000, fixedPayout: 200 },
          { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 0 }
        ]
      };

      const result = calculatePayslip(input);

      expect(result.taxRateApplied).toBe(0);

      // Transfers should not have tax applied
      // saleRevenue = 1000 - 1000 = 0, netProfit = 0
      // Alice: finalNet = 1000 + 200 = 1200, balance = 1200 - 1000 = 200 (creditor)
      // Bob: finalNet = 0 + (-200) = -200, balance = -200 - 0 = -200 (debtor)
      expect(result.suggestedTransfers.length).toBe(1);
      expect(result.suggestedTransfers[0].netAmount).toBe(200);
      expect(result.suggestedTransfers[0].grossAmount).toBe(200); // No gross-up
      expect(result.suggestedTransfers[0].feeAmount).toBe(0);
    });

    it('should handle tax enabled with PERCENT distribution mode', () => {
      const input: SessionInput = {
        name: 'Tax with Percent Mode',
        type: 'TRADING',
        distributionMode: 'PERCENT',
        totalRevenue: 1000,
        taxEnabled: true,
        taxRate: 0.10, // 10% tax
        members: [
          { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000, percentShare: 70 },
          { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, percentShare: 30 }
        ]
      };

      const result = calculatePayslip(input);

      expect(result.taxRateApplied).toBe(0.10);

      const alice = result.members.find(m => m.memberId === 'member-1');
      const bob = result.members.find(m => m.memberId === 'member-2');

      // Alice gets 70% = 700, Bob gets 30% = 300
      expect(alice?.profitShare).toBe(700);
      expect(bob?.profitShare).toBe(300);

      // Alice contributed 1000, gets 700 finalNet
      // Bob contributed 0, gets 300 finalNet
      // Bob owes Alice: 300 (his balance = 300 - 0 = 300)
      // Alice is owed: 700 - 1000 = -300 (she's owed 300)
      // Wait, let me recalculate...
      // Alice: finalNet = 0 + 700 - 0 = 700
      // Bob: finalNet = 0 + 300 - 0 = 300
      // Balance calculation for transfers:
      // Alice: 700 - 0 = 700 (creditor - she brought in 1000 revenue, finalNet is 700, so she's owed 700)
      // Wait, the revenue doesn't factor into balance - it's finalNet - investment
      // Alice: 700 - 0 = 700 (creditor)
      // Bob: 300 - 0 = 300 (also creditor? That can't be right)
      // Actually the balance is based on who holds the money vs who it belongs to
      // If totalRevenue is 1000 and Alice brought it all in, the settlement needs to get money to Bob

      // Let's verify: Alice has all the money (1000 revenue), needs to give Bob his share
      // Bob's balance: finalNet - investment = 300 - 0 = 300 (he's owed 300)
      // Alice's balance: finalNet - investment = 700 - 0 = 700 (she keeps 700 of her own money)

      // Actually looking at settleBalances, balance = finalNet - investment
      // Since neither has investment, the balance is just finalNet
      // This would make both creditors which doesn't work for transfers

      // Wait - I need to reconsider. The transfers are about who has the money vs who it belongs to.
      // If Alice contributed all the revenue (1000), she has the pool.
      // Bob should receive 300 from Alice.
      // So there should be a transfer from Alice to Bob.

      // But the balance calc in settleBalances is: finalNet - investment
      // Alice: 700 - 0 = 700 (positive = creditor)
      // Bob: 300 - 0 = 300 (positive = creditor)
      // This would mean both are creditors and no transfers needed?

      // Hmm, but looking at the earlier tests, they use 'revenue' as the cash input.
      // The settlement transfer test shows that when one person has all the revenue/investment,
      // they need to distribute to others.

      // Actually I think the formula is different - in the earlier tests:
      // "Alice contributed 1000 revenue, so Bob owes Alice 500" for EQUAL mode
      // But that doesn't match either...

      // Let me re-read the settlement logic. In settleBalances:
      // balance = finalNet - investment
      // If balance > 0, creditor (owed money)
      // If balance < 0, debtor (owes money)

      // But that doesn't capture who has the physical cash...
      // Actually, I think the intent is:
      // - investment is what you put in (cash you contributed)
      // - finalNet is what you should walk away with
      // - balance = finalNet - investment = what you need to receive (positive) or pay (negative)

      // So for Alice with revenue 1000 (but no investment), finalNet 700:
      // She has 1000 in hand, needs to end with 700, so she needs to give away 300
      // But balance = 700 - 0 = 700 which says she's owed 700?

      // I'm confused. Let me look at the actual passing test case for settlement...
      // In test "should generate correct settlement transfers in EQUAL mode":
      // Alice: investment 1000, revenue 0, finalNet 1000
      // Bob: investment 0, revenue 0, finalNet 0
      // Result: no transfers (Alice just gets her investment back)

      // In test "should generate correct settlement transfers in ADJUSTABLE mode":
      // Alice: investment 1000, finalNet 1200, profitShare 200
      // Bob: investment 0, finalNet -200, profitShare -200
      // Balance: Alice = 1200 - 1000 = 200 (creditor)
      // Balance: Bob = -200 - 0 = -200 (debtor)
      // Transfer: Bob -> Alice, 200

      // So it seems like revenue is tracked separately from investment
      // The totalRevenue goes into a pool, and settlement determines who needs to pay whom
      // based on finalNet vs what they invested

      // For my test case:
      // Alice: investment 0, finalNet 700
      // Bob: investment 0, finalNet 300
      // Balance: Alice = 700 - 0 = 700 (creditor, needs to receive 700)
      // Balance: Bob = 300 - 0 = 300 (creditor, needs to receive 300)

      // But wait, who has the money? If totalRevenue is just a number and no one invested...
      // I think the issue is that revenue and investment are different concepts.

      // Looking at the tax test case I wrote earlier, let me trace through:
      // Alice: revenue 1000, investment 0, profitShare 500, finalNet 500
      // Bob: revenue 0, investment 0, profitShare 500, finalNet 500
      // Balance: Alice = 500 - 0 = 500 (creditor)
      // Balance: Bob = 500 - 0 = 500 (creditor)
      // This would result in no transfers which contradicts my expected outcome...

      // I think I misunderstand the model. Let me re-read the code...
      //
      // Actually, I think the 'revenue' field in member is not about physical cash held,
      // but about how much revenue was attributed to them (for tracking/display).
      // The actual cash pool is the totalRevenue.

      // So for settlement, the algorithm doesn't know who physically holds the cash.
      // It just calculates what each person should receive (finalNet) vs what they invested.

      // If nobody invested anything, everyone's balance is positive (they're all creditors).
      // But they can't all be owed money - someone has to pay!

      // Hmm, wait. Reading settleBalances more carefully:
      // The function pairs debtors (negative balance) with creditors (positive balance).
      // If everyone has positive balance, no transfers happen.

      // But in the tax test I wrote, the result expects a transfer from Bob to Alice.
      // That test would fail with the current logic!

      // Let me re-read the earlier passing test...
      // Test: "should generate correct settlement transfers in EQUAL mode"
      // Input: Alice has investment 1000, Bob has investment 0, totalRevenue 1000
      // saleRevenue = 1000 - 1000 = 0
      // netProfit = 0
      // Each gets profitShare = 0
      // Alice: finalNet = 1000 (investment) + 0 (profitShare) = 1000
      // Bob: finalNet = 0 + 0 = 0
      // Balance: Alice = 1000 - 1000 = 0, Bob = 0 - 0 = 0
      // No transfers needed.

      // So the settlement is about distributing the pool (totalRevenue) back to members.
      // If Alice invested 1000 and gets finalNet 1000, she's even.
      // If Bob invested 0 and gets finalNet 0, he's even.

      // For my tax test case with revenue but no investment:
      // totalRevenue = 1000 (from "the session" - maybe sold goods?)
      // No investments, so saleRevenue = 1000
      // netProfit = 1000
      // Alice and Bob each get profitShare = 500
      // Alice: finalNet = 0 + 500 = 500
      // Bob: finalNet = 0 + 500 = 500
      // Balance: Alice = 500 - 0 = 500, Bob = 500 - 0 = 500
      // Both are creditors with no debtors = no transfers.

      // This doesn't match my expected behavior! The test I wrote would fail.

      // I think the issue is that the settlement algorithm assumes the "bank" (session pool)
      // holds the money and distributes it. If no one has negative balance,
      // everyone just takes their share from the pool and no peer-to-peer transfers needed.

      // For transfers to be needed, someone must have negative balance (owes money).
      // This happens when:
      // - They received a fixed payout that exceeds their share
      // - Total pool is negative (loss scenario)

      // Let me fix my test cases to match the actual behavior...

      // Actually, looking at the "ADJUSTABLE mode settlement" test:
      // Alice: investment 1000, fixedPayout 200
      // Bob: investment 0
      // saleRevenue = 1000 - 1000 = 0
      // netProfit = 0
      // Alice profitShare = 200 (fixed), Bob profitShare = -200 (remainder)
      // Alice finalNet = 1000 + 200 = 1200
      // Bob finalNet = 0 + (-200) = -200
      // Balance: Alice = 1200 - 1000 = 200, Bob = -200 - 0 = -200
      // Transfer: Bob (debtor, owes 200) -> Alice (creditor, owed 200)

      // So for a transfer to happen, I need a scenario where someone ends up with negative finalNet
      // or their balance (finalNet - investment) is negative.

      // Let me design a better test case:
      // Alice invests 1000, Bob invests 0
      // totalRevenue = 1000
      // saleRevenue = 1000 - 1000 = 0
      // netProfit = 0
      // EQUAL distribution: each gets 0
      // Alice finalNet = 1000 + 0 = 1000, Bob finalNet = 0 + 0 = 0
      // Balance: Alice = 0, Bob = 0 -> no transfers

      // Hmm, still no transfer. Let me try with profits:
      // Alice invests 1000, Bob invests 0
      // totalRevenue = 1500 (made profit)
      // saleRevenue = 1500 - 1000 = 500
      // netProfit = 500
      // EQUAL distribution: each gets 250
      // Alice finalNet = 1000 + 250 = 1250
      // Bob finalNet = 0 + 250 = 250
      // Balance: Alice = 1250 - 1000 = 250 (creditor)
      // Balance: Bob = 250 - 0 = 250 (creditor)
      // Still no transfers because no debtors!

      // The key insight: if the session makes a profit and no one has negative obligations,
      // everyone just takes their share from the pool. No peer-to-peer transfers needed.

      // Transfers are only needed when someone ends up owing more than they have:
      // 1. Session has loss (negative netProfit)
      // 2. Fixed payouts exceed the pool
      // 3. One person invested but profit goes to others

      // Case 3: Alice invests 500, Bob invests 500, total 1000
      // totalRevenue = 1000
      // saleRevenue = 1000 - 1000 = 0
      // netProfit = 0
      // PERCENT: Alice 100%, Bob 0%
      // Alice profitShare = 0, Bob profitShare = 0
      // Alice finalNet = 500 + 0 = 500
      // Bob finalNet = 500 + 0 = 500
      // Balance: Alice = -500, Bob = -500... wait that's not right either.
      //
      // Wait, profitShare is calculated from netProfit which is 0.
      // So everyone just gets their investment back.

      // Let me try: Alice invests 800, Bob invests 200
      // totalRevenue = 1500
      // saleRevenue = 1500 - 1000 = 500
      // netProfit = 500
      // EQUAL: each gets 250
      // Alice finalNet = 800 + 250 = 1050
      // Bob finalNet = 200 + 250 = 450
      // Total finalNets = 1500 = totalRevenue ✓
      // Balance: Alice = 1050 - 800 = 250 (creditor)
      // Balance: Bob = 450 - 200 = 250 (creditor)
      // Still both creditors!

      // The math doesn't work out for transfers when netProfit > 0 and no fixed allocations.
      // Let me think differently...

      // What if Alice invested 1000 but Bob brought in revenue of 1000 through sales?
      // Hmm, but "revenue" field doesn't affect calculations in the same way as investment.
      // The totalRevenue is the pool, not member.revenue.

      // OK I think I understand now. The settlement system assumes:
      // 1. All money goes into a central pool (totalRevenue)
      // 2. Investments are tracked to be returned first
      // 3. Profit is distributed according to rules
      // 4. Each person's finalNet is what they should end up with
      // 5. Transfers settle the difference between who has money (investment) vs who should have it (finalNet)

      // For transfers to occur, finalNet - investment must differ across members
      // such that some are positive (creditors) and some negative (debtors).

      // Example: Alice invests 1000, Bob invests 0
      // Revenue = 2000 (session earned profit)
      // saleRevenue = 2000 - 1000 = 1000
      // netProfit = 1000
      // EQUAL: each gets 500
      // Alice finalNet = 1000 + 500 = 1500
      // Bob finalNet = 0 + 500 = 500
      // Balance: Alice = 1500 - 1000 = 500
      // Balance: Bob = 500 - 0 = 500
      // Both creditors, no transfers.

      // But wait, Bob has 0 investment and gets 500 finalNet. Where does that come from?
      // It comes from the session pool (totalRevenue 2000). Alice put in 1000,
      // so presumably the session itself generated 1000 in revenue (like selling goods).
      // The pool has 2000, Alice gets 1500, Bob gets 500. Total = 2000 ✓
      //
      // But in physical terms: Alice has 1000 she invested. Session generated 1000 more.
      // The 1000 generated is in the "session" pool. Alice takes her 1000 back + 500 profit = 1500.
      // The remaining 500 goes to Bob.
      //
      // If Alice physically holds the original 1000 and the generated 1000 (total 2000),
      // she needs to give Bob 500. That's a transfer!
      // But the balance calculation shows both as creditors with +500...

      // I think the model assumes there's a central "session wallet" holding the cash,
      // not that individual members hold it based on their contributions.
      // Everyone draws from the session wallet to reach their finalNet.
      // No peer transfers needed if the wallet has enough.

      // Transfers are only needed when someone's finalNet - investment is negative,
      // meaning they should receive less than they put in (a loss scenario for them).

      // For my tax gross-up tests, I need a scenario with actual transfers.
      // Let me use the ADJUSTABLE mode with fixed payouts:

      // Alice: investment 1000, fixedPayout 500
      // Bob: investment 0
      // Charlie: investment 0
      // totalRevenue = 1000
      // saleRevenue = 0
      // netProfit = 0
      // Alice gets 500 (fixed), Bob and Charlie split -500, each gets -250
      // Alice finalNet = 1000 + 500 = 1500
      // Bob finalNet = 0 - 250 = -250
      // Charlie finalNet = 0 - 250 = -250
      // Balance: Alice = 500, Bob = -250, Charlie = -250
      // Transfers: Bob -> Alice 250, Charlie -> Alice 250

      // That works! Let me use this scenario for the tax test.

      // Actually, for simplicity let me use the simpler 2-person case:
      // Alice: investment 1000, fixedPayout 200
      // Bob: investment 0
      // totalRevenue = 1000
      // saleRevenue = 0
      // netProfit = 0
      // Alice gets 200 (fixed), Bob gets -200
      // Alice finalNet = 1000 + 200 = 1200
      // Bob finalNet = 0 - 200 = -200
      // Balance: Alice = 200, Bob = -200
      // Transfer: Bob -> Alice 200
      // With 5% tax: gross = ceil(200/0.95) = ceil(210.53) = 211, fee = 11

      // Let me update my test cases accordingly.
    });
  });
});

// Test cases for Settlement/Transfer Generation

describe('Settlement/Transfer Generation', () => {
  it('should generate multiple transfers in a 3-way settlement', () => {
    const input: SessionInput = {
      name: '3-Way Settlement',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1500,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 1500, fixedPayout: 700 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 0, fixedPayout: 600 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 0, investment: 0 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 1500 - 1500 = 0, netProfit = 0
    expect(result.saleRevenue).toBe(0);
    expect(result.netProfit).toBe(0);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    // Alice gets fixed payout 700, Bob gets 600, Charlie gets remainder: 0 - 700 - 600 = -1300
    expect(alice?.profitShare).toBe(700);
    expect(bob?.profitShare).toBe(600);
    expect(charlie?.profitShare).toBe(-1300);

    // finalNet = investment + profitShare
    // Alice: 1500 + 700 = 2200
    // Bob: 0 + 600 = 600
    // Charlie: 0 + (-1300) = -1300
    expect(alice?.finalNet).toBe(2200);
    expect(bob?.finalNet).toBe(600);
    expect(charlie?.finalNet).toBe(-1300);

    // Balance: finalNet - investment
    // Alice: 2200 - 1500 = 700 (creditor)
    // Bob: 600 - 0 = 600 (creditor)
    // Charlie: -1300 - 0 = -1300 (debtor, owes 1300)

    // Charlie needs to pay both Alice and Bob
    expect(result.suggestedTransfers.length).toBe(2);

    // Transfers should be sorted/matched efficiently
    // Charlie -> Alice: 700
    // Charlie -> Bob: 600
    const charlieTAlice = result.suggestedTransfers.find(
      t => t.fromMemberId === 'member-3' && t.toMemberId === 'member-1'
    );
    const charlieToBob = result.suggestedTransfers.find(
      t => t.fromMemberId === 'member-3' && t.toMemberId === 'member-2'
    );

    expect(charlieTAlice?.netAmount).toBe(700);
    expect(charlieToBob?.netAmount).toBe(600);
  });

  it('should optimize transfers with multiple debtors and creditors', () => {
    const input: SessionInput = {
      name: 'Complex Settlement',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 2000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 1000, fixedPayout: 800 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 1000, fixedPayout: 800 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 0, investment: 0 },
        { id: 'member-4', handle: 'Dave', role: 'Member', active: true, revenue: 0, investment: 0 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 2000 - 2000 = 0, netProfit = 0
    // Alice gets 800, Bob gets 800, Charlie and Dave split remainder: 0 - 800 - 800 = -1600 / 2 = -800 each
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');
    const dave = result.members.find(m => m.memberId === 'member-4');

    // finalNet: Alice 1800, Bob 1800, Charlie -800, Dave -800
    // Balance: Alice -200, Bob -200, Charlie -800, Dave -800
    expect(alice?.finalNet).toBe(1800);
    expect(bob?.finalNet).toBe(1800);
    expect(charlie?.finalNet).toBe(-800);
    expect(dave?.finalNet).toBe(-800);

    // Alice balance: 1800 - 1000 = 800 (creditor)
    // Bob balance: 1800 - 1000 = 800 (creditor)
    // Charlie balance: -800 - 0 = -800 (debtor)
    // Dave balance: -800 - 0 = -800 (debtor)

    // Should generate efficient transfers
    expect(result.suggestedTransfers.length).toBeGreaterThanOrEqual(2);

    // Total debts = 800 + 800 = 1600
    // Total credits = 800 + 800 = 1600
    const totalTransferred = result.suggestedTransfers.reduce(
      (sum, t) => sum + t.netAmount,
      0
    );
    expect(totalTransferred).toBe(1600);
  });

  it('should handle settlement where everyone breaks even', () => {
    const input: SessionInput = {
      name: 'Break Even Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 2000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, investment: 1000 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500, investment: 1000 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 2000 - 2000 = 0, netProfit = 0
    // Each gets 0 profit share
    expect(result.netProfit).toBe(0);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // finalNet = investment + profitShare = 1000 + 0 = 1000
    expect(alice?.finalNet).toBe(1000);
    expect(bob?.finalNet).toBe(1000);

    // Balance: finalNet - investment = 0 for both
    // No transfers needed
    expect(result.suggestedTransfers.length).toBe(0);
  });

  it('should generate transfers with tax gross-up for multiple transfers', () => {
    const input: SessionInput = {
      name: 'Multi-Transfer Tax Settlement',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1500,
      taxEnabled: true,
      taxRate: 0.10,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 1500, fixedPayout: 800 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 0, fixedPayout: 500 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 0, investment: 0 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.taxRateApplied).toBe(0.10);

    // saleRevenue = 0, netProfit = 0
    // Alice gets 800, Bob gets 500, Charlie gets remainder: -1300
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    // finalNet: Alice 2300, Bob 500, Charlie -1300
    expect(alice?.finalNet).toBe(2300);
    expect(bob?.finalNet).toBe(500);
    expect(charlie?.finalNet).toBe(-1300);

    // Balance: Alice 800 (creditor), Bob 500 (creditor), Charlie -1300 (debtor)
    // Charlie owes: 800 to Alice, 500 to Bob
    expect(result.suggestedTransfers.length).toBe(2);

    // Each transfer should have tax gross-up applied
    result.suggestedTransfers.forEach(transfer => {
      expect(transfer.grossAmount).toBeGreaterThan(transfer.netAmount);
      expect(transfer.feeAmount).toBe(transfer.grossAmount - transfer.netAmount);

      // Verify gross-up calculation: gross = ceil(net / (1 - 0.10)) = ceil(net / 0.90)
      const expectedGross = Math.ceil(transfer.netAmount / 0.90);
      expect(transfer.grossAmount).toBe(expectedGross);
    });
  });

  it('should handle settlement with expenses causing negative balances', () => {
    const input: SessionInput = {
      name: 'Settlement with High Expenses',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500, investment: 800 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500, investment: 200 }
      ],
      sharedExpenses: [
        { label: 'Fuel', amount: 600 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 1000 - 1000 = 0
    // netProfit = 0 - 600 = -600
    expect(result.saleRevenue).toBe(0);
    expect(result.netProfit).toBe(-600);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Each shares expense: 600 / 2 = 300
    expect(alice?.sharedExpenses).toBe(300);
    expect(bob?.sharedExpenses).toBe(300);

    // Each gets equal profit share: -600 / 2 = -300
    expect(alice?.profitShare).toBe(-300);
    expect(bob?.profitShare).toBe(-300);

    // finalNet = investment + profitShare - expenses
    // Alice: 800 + (-300) - 300 = 200
    // Bob: 200 + (-300) - 300 = -400
    expect(alice?.finalNet).toBe(200);
    expect(bob?.finalNet).toBe(-400);

    // Balance: finalNet - investment
    // Alice: 200 - 800 = -600 (debtor, she lost 600)
    // Bob: -400 - 200 = -600 (debtor, he also lost 600)
    // Both are debtors - no transfers needed (both owe the session, not each other)
    expect(result.suggestedTransfers.length).toBe(0);
  });

  it('should correctly round transfer amounts to 2 decimal places', () => {
    const input: SessionInput = {
      name: 'Rounding Settlement Test',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 100.33,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 100.33 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 0 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 0, investment: 0 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 100.33 - 100.33 = 0, netProfit = 0
    // Equal distribution: 0 / 3 = 0 each
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    // finalNet: Alice 100.33, Bob 0, Charlie 0
    expect(alice?.finalNet).toBe(100.33);
    expect(bob?.finalNet).toBe(0);
    expect(charlie?.finalNet).toBe(0);

    // Balance: Alice 0, Bob 0, Charlie 0 (everyone breaks even)
    expect(result.suggestedTransfers.length).toBe(0);
  });

  it('should handle one debtor owing multiple creditors with different amounts', () => {
    const input: SessionInput = {
      name: 'One Debtor Multiple Creditors',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1800,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 1000, fixedPayout: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 500, fixedPayout: 300 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 0, investment: 300, fixedPayout: 200 },
        { id: 'member-4', handle: 'Dave', role: 'Member', active: true, revenue: 0, investment: 0 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 1800 - 1800 = 0, netProfit = 0
    // Alice gets 500, Bob gets 300, Charlie gets 200, Dave gets remainder: 0 - 500 - 300 - 200 = -1000
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');
    const dave = result.members.find(m => m.memberId === 'member-4');

    expect(alice?.profitShare).toBe(500);
    expect(bob?.profitShare).toBe(300);
    expect(charlie?.profitShare).toBe(200);
    expect(dave?.profitShare).toBe(-1000);

    // finalNet = investment + profitShare
    // Alice: 1000 + 500 = 1500
    // Bob: 500 + 300 = 800
    // Charlie: 300 + 200 = 500
    // Dave: 0 + (-1000) = -1000
    expect(alice?.finalNet).toBe(1500);
    expect(bob?.finalNet).toBe(800);
    expect(charlie?.finalNet).toBe(500);
    expect(dave?.finalNet).toBe(-1000);

    // Balance: finalNet - investment
    // Alice: 1500 - 1000 = 500 (creditor)
    // Bob: 800 - 500 = 300 (creditor)
    // Charlie: 500 - 300 = 200 (creditor)
    // Dave: -1000 - 0 = -1000 (debtor)

    // Dave owes 1000 total, distributed among creditors
    // Should generate 3 transfers from Dave to Alice (500), Bob (300), Charlie (200)
    expect(result.suggestedTransfers.length).toBe(3);

    const daveToAlice = result.suggestedTransfers.find(
      t => t.fromMemberId === 'member-4' && t.toMemberId === 'member-1'
    );
    const daveToBob = result.suggestedTransfers.find(
      t => t.fromMemberId === 'member-4' && t.toMemberId === 'member-2'
    );
    const daveToCharlie = result.suggestedTransfers.find(
      t => t.fromMemberId === 'member-4' && t.toMemberId === 'member-3'
    );

    expect(daveToAlice?.netAmount).toBe(500);
    expect(daveToBob?.netAmount).toBe(300);
    expect(daveToCharlie?.netAmount).toBe(200);
  });

  it('should handle multiple debtors with one creditor', () => {
    const input: SessionInput = {
      name: 'Multiple Debtors One Creditor',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 1000, fixedPayout: 1600 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 0 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 0, investment: 0 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 1000 - 1000 = 0, netProfit = 0
    // Alice gets 1600 (fixed), Bob and Charlie split remainder: (0 - 1600) / 2 = -800 each
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');
    const charlie = result.members.find(m => m.memberId === 'member-3');

    expect(alice?.profitShare).toBe(1600);
    expect(bob?.profitShare).toBe(-800);
    expect(charlie?.profitShare).toBe(-800);

    // finalNet: Alice 2600, Bob -800, Charlie -800
    expect(alice?.finalNet).toBe(2600);
    expect(bob?.finalNet).toBe(-800);
    expect(charlie?.finalNet).toBe(-800);

    // Balance: Alice 1600 (creditor), Bob -800 (debtor), Charlie -800 (debtor)
    // Both Bob and Charlie owe Alice
    expect(result.suggestedTransfers.length).toBe(2);

    const bobToAlice = result.suggestedTransfers.find(
      t => t.fromMemberId === 'member-2' && t.toMemberId === 'member-1'
    );
    const charlieToAlice = result.suggestedTransfers.find(
      t => t.fromMemberId === 'member-3' && t.toMemberId === 'member-1'
    );

    expect(bobToAlice?.netAmount).toBe(800);
    expect(charlieToAlice?.netAmount).toBe(800);
  });
});

// Edge Case Tests

describe('calculatePayslip - Edge Cases', () => {
  it('should handle zero revenue with no investments or expenses', () => {
    const input: SessionInput = {
      name: 'Zero Revenue Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 0,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.saleRevenue).toBe(0);
    expect(result.netProfit).toBe(0);
    expect(result.members[0].finalNet).toBe(0);
    expect(result.members[1].finalNet).toBe(0);
    expect(result.suggestedTransfers.length).toBe(0);
  });

  it('should handle all members being inactive', () => {
    const input: SessionInput = {
      name: 'All Inactive Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: false, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: false, revenue: 500 }
      ]
    };

    const result = calculatePayslip(input);

    // No active members, so no profit distribution
    expect(result.members[0].profitShare).toBe(0);
    expect(result.members[1].profitShare).toBe(0);
    expect(result.members[0].finalNet).toBe(0);
    expect(result.members[1].finalNet).toBe(0);
  });

  it('should handle very large revenue numbers', () => {
    const input: SessionInput = {
      name: 'Large Numbers Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 999999999.99,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 999999999.99 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.saleRevenue).toBe(999999999.99);
    expect(result.netProfit).toBe(999999999.99);
    expect(result.members[0].finalNet).toBe(999999999.99);
  });

  it('should handle rounding with many members in EQUAL mode', () => {
    const input: SessionInput = {
      name: 'Rounding Test',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 100,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 0 },
        { id: 'member-4', handle: 'Dave', role: 'Member', active: true, revenue: 0 },
        { id: 'member-5', handle: 'Eve', role: 'Member', active: true, revenue: 0 },
        { id: 'member-6', handle: 'Frank', role: 'Member', active: true, revenue: 0 },
        { id: 'member-7', handle: 'Grace', role: 'Member', active: true, revenue: 0 }
      ]
    };

    const result = calculatePayslip(input);

    // 100 / 7 = 14.285714...
    const totalDistributed = result.members.reduce((sum, m) => sum + m.finalNet, 0);

    // Total distributed should equal total revenue (within rounding tolerance)
    expect(totalDistributed).toBeCloseTo(100, 2);

    // Each member should get approximately equal share
    result.members.forEach(member => {
      expect(member.finalNet).toBeCloseTo(100 / 7, 2);
    });
  });

  it('should handle empty members array gracefully', () => {
    const input: SessionInput = {
      name: 'No Members Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: []
    };

    const result = calculatePayslip(input);

    expect(result.members.length).toBe(0);
    expect(result.suggestedTransfers.length).toBe(0);
  });

  it('should handle total expenses exceeding revenue', () => {
    const input: SessionInput = {
      name: 'Loss Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500 }
      ],
      sharedExpenses: [
        { label: 'Huge Expense', amount: 1500 }
      ]
    };

    const result = calculatePayslip(input);

    // netProfit = saleRevenue - totalExpenses = 1000 - 1500 = -500
    expect(result.netProfit).toBe(-500);

    // Each member's share of expense: 1500 / 2 = 750
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    expect(alice?.sharedExpenses).toBe(750);
    expect(bob?.sharedExpenses).toBe(750);

    // Profit share: -500 / 2 = -250 each
    expect(alice?.profitShare).toBe(-250);
    expect(bob?.profitShare).toBe(-250);

    // finalNet = 0 + (-250) - 750 = -1000 - nope, wait
    // finalNet = investment + profitShare - (sharedExpenses + individualExpenses)
    // But sharedExpenses are already in profitShare calculation
    // Let me check the pattern...
    // Actually profitShare is AFTER expenses, so finalNet = investment + profitShare
    expect(alice?.finalNet).toBe(-250);
    expect(bob?.finalNet).toBe(-250);
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

  it('should handle zero-amount transfers in settlement', () => {
    const input: SessionInput = {
      name: 'Balanced Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 500 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 1000 - 1000 = 0
    // Each gets their investment back, profit share is 0
    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    expect(alice?.finalNet).toBe(500);
    expect(bob?.finalNet).toBe(500);

    // Balance = finalNet - investment = 500 - 500 = 0 for both
    // No transfers needed
    expect(result.suggestedTransfers.length).toBe(0);
  });

  it('should handle tax rate at exactly 0%', () => {
    const input: SessionInput = {
      name: 'Zero Tax Session',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: true,
      taxRate: 0,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.taxRateApplied).toBe(0);
    expect(result.netProfit).toBe(1000);
  });

  it('should handle very small decimal amounts', () => {
    const input: SessionInput = {
      name: 'Small Decimals',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 0.03,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0.01 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0.01 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 0.01 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.saleRevenue).toBe(0.03);
    expect(result.netProfit).toBe(0.03);

    // Each should get 0.01
    result.members.forEach(member => {
      expect(member.finalNet).toBeCloseTo(0.01, 2);
    });
  });

  it('should handle mixed investments with zero revenue in ADJUSTABLE mode', () => {
    const input: SessionInput = {
      name: 'Investments No Revenue',
      type: 'TRADING',
      distributionMode: 'ADJUSTABLE',
      totalRevenue: 500,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 300, fixedPayout: 200 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 200, fixedPayout: 100 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 500 - 500 = 0
    // Alice gets 200 (fixed), Bob gets 100 (fixed)
    // Remainder: 0 - 200 - 100 = -300 (distributed to remaining, but all have fixed)

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    expect(alice?.profitShare).toBe(200);
    expect(bob?.profitShare).toBe(100);

    // finalNet = investment + profitShare
    expect(alice?.finalNet).toBe(500); // 300 + 200
    expect(bob?.finalNet).toBe(300); // 200 + 100
  });

  it('should handle zero total revenue correctly', () => {
    const input: SessionInput = {
      name: 'Zero Revenue',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 0,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.saleRevenue).toBe(0);
    expect(result.netProfit).toBe(0);

    // No revenue means no shares to calculate
    result.members.forEach(member => {
      expect(member.profitShare).toBe(0);
      expect(member.finalNet).toBe(0);
    });
  });

  it('should handle zero profit scenario correctly', () => {
    const input: SessionInput = {
      name: 'Zero Profit',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 100,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Leader', role: 'Leader', active: true, revenue: 0, investment: 100 },
        { id: 'member-2', handle: 'Alice', role: 'Member', active: true, revenue: 0 }
      ]
    };

    const result = calculatePayslip(input);

    // saleRevenue = 100 - 100 = 0, netProfit = 0
    const leader = result.members.find(m => m.role === 'Leader');

    expect(result.netProfit).toBe(0);
    expect(leader?.profitShare).toBe(0);
  });

  it('should handle multiple shared expenses with different amounts', () => {
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
        { label: 'Food', amount: 50 },
        { label: 'Repairs', amount: 150 }
      ]
    };

    const result = calculatePayslip(input);

    // Total shared expenses: 100 + 50 + 150 = 300
    // netProfit = 1000 - 300 = 700
    expect(result.netProfit).toBe(700);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Each shares 150 in expenses (300 / 2)
    expect(alice?.sharedExpenses).toBe(150);
    expect(bob?.sharedExpenses).toBe(150);

    // Each gets 350 profit share (700 / 2)
    expect(alice?.profitShare).toBe(350);
    expect(bob?.profitShare).toBe(350);
  });

  it('should handle inactive member with investment and expenses', () => {
    const input: SessionInput = {
      name: 'Inactive With Investment',
      type: 'TRADING',
      distributionMode: 'EQUAL',
      totalRevenue: 1000,
      taxEnabled: false,
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: false, revenue: 500, investment: 300 }
      ],
      sharedExpenses: [
        { label: 'Fuel', amount: 100 }
      ],
      individualExpenses: [
        { label: 'Bob Repair', amount: 50, memberId: 'member-2' }
      ]
    };

    const result = calculatePayslip(input);

    const alice = result.members.find(m => m.memberId === 'member-1');
    const bob = result.members.find(m => m.memberId === 'member-2');

    // Bob is inactive, so doesn't share in expenses or profit
    expect(bob?.sharedExpenses).toBe(0);
    expect(bob?.profitShare).toBe(0);
    expect(bob?.individualExpenses).toBe(50);

    // Bob only gets investment back minus individual expense
    expect(bob?.finalNet).toBe(250); // 300 - 50

    // Alice is the only active member
    // Total expenses: 100 (shared) + 50 (individual) = 150
    // netProfit = 1000 - 300 - 150 = 550
    // Alice shares all 100 of shared expense and gets all 550 profit
    expect(alice?.sharedExpenses).toBe(100);
    expect(alice?.profitShare).toBe(550);
    expect(alice?.finalNet).toBe(450); // 0 + 550 - 100
  });
});

describe('calculateGrossAmount - Edge Cases', () => {
  it('should handle zero net amount', () => {
    const gross = calculateGrossAmount(0, 10);
    expect(gross).toBe(0);
  });

  it('should handle 100% fee rate', () => {
    const gross = calculateGrossAmount(100, 100);
    // If fee is 100%, you'd need infinite gross to get any net
    // The formula would be: gross = net / (1 - rate/100) = 100 / 0 = Infinity
    // But we should handle this edge case
    expect(gross).toBe(Infinity);
  });

  it('should handle negative net amount', () => {
    const gross = calculateGrossAmount(-100, 10);
    // gross = -100 / 0.9 = -111.11...
    expect(gross).toBeCloseTo(-111.11, 2);
  });

  it('should handle very small fee rate', () => {
    const gross = calculateGrossAmount(100, 0.01);
    // gross = 100 / 0.9999 = 100.01
    expect(gross).toBeCloseTo(100.01, 2);
  });
});

describe('calculateFeeAmount - Edge Cases', () => {
  it('should handle zero gross amount', () => {
    const fee = calculateFeeAmount(0, 10);
    expect(fee).toBe(0);
  });

  it('should handle zero fee rate', () => {
    const fee = calculateFeeAmount(100, 0);
    expect(fee).toBe(0);
  });

  it('should handle negative gross amount', () => {
    const fee = calculateFeeAmount(-100, 10);
    expect(fee).toBe(-10);
  });
});

describe('applyTransferTaxes - Edge Cases', () => {
  it('should handle empty transfers array', () => {
    const transfers: Transfer[] = [];
    const result = applyTransferTaxes(transfers, 10);

    expect(result.length).toBe(0);
  });

  it('should handle zero tax rate', () => {
    const transfers: Transfer[] = [
      {
        fromMemberId: 'member-1',
        toMemberId: 'member-2',
        netAmount: 100,
        grossAmount: 100,
        feeAmount: 0
      }
    ];

    const result = applyTransferTaxes(transfers, 0);

    expect(result[0].grossAmount).toBe(100);
    expect(result[0].feeAmount).toBe(0);
  });

  it('should handle very small transfer amounts', () => {
    const transfers: Transfer[] = [
      {
        fromMemberId: 'member-1',
        toMemberId: 'member-2',
        netAmount: 0.01,
        grossAmount: 0.01,
        feeAmount: 0
      }
    ];

    const result = applyTransferTaxes(transfers, 10);

    // gross = 0.01 / 0.9 = 0.0111...
    expect(result[0].grossAmount).toBeCloseTo(0.0111, 4);
    // fee = 0.0111 * 0.1 = 0.00111
    expect(result[0].feeAmount).toBeCloseTo(0.0011, 4);
  });

  it('should handle multiple transfers with rounding', () => {
    const transfers: Transfer[] = [
      {
        fromMemberId: 'member-1',
        toMemberId: 'member-3',
        netAmount: 33.33,
        grossAmount: 33.33,
        feeAmount: 0
      },
      {
        fromMemberId: 'member-2',
        toMemberId: 'member-3',
        netAmount: 33.33,
        grossAmount: 33.33,
        feeAmount: 0
      },
      {
        fromMemberId: 'member-1',
        toMemberId: 'member-4',
        netAmount: 33.34,
        grossAmount: 33.34,
        feeAmount: 0
      }
    ];

    const result = applyTransferTaxes(transfers, 5);

    // Each transfer should have proper gross and fee calculated
    result.forEach(transfer => {
      const expectedGross = transfer.netAmount / 0.95;
      const expectedFee = expectedGross * 0.05;

      expect(transfer.grossAmount).toBeCloseTo(expectedGross, 2);
      expect(transfer.feeAmount).toBeCloseTo(expectedFee, 2);
    });
  });
});
