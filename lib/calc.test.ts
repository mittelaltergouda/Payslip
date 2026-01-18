import { calculatePayslip, SessionInput } from './calc';

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
