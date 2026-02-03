import type { SessionInput} from './calc';
import { calculatePayslip, applyTransferTaxes, calculateGrossAmount, calculateFeeAmount } from './calc';
import type { Transfer } from './types';

// Edge case tests for the payslip calculation system

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

    // Should throw error because there are no active members
    expect(() => calculatePayslip(input)).toThrow('Session must have at least one active member to calculate payslip');
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

    // Should throw error because there are no active members (empty array = no active members)
    expect(() => calculatePayslip(input)).toThrow('Session must have at least one active member to calculate payslip');
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

    // finalNet = investment + profitShare - memberTotalExpenses
    // finalNet = 0 + (-250) - 750 = -1000
    expect(alice?.finalNet).toBe(-1000);
    expect(bob?.finalNet).toBe(-1000);
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

  it('should handle gross-up with fixed 0.5% tax rate on large amounts', () => {
    const gross = calculateGrossAmount(10000, 0.005);
    // gross = ceil(10000 / 0.995) = ceil(10050.25) = 10051
    expect(gross).toBe(10051);
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

describe('calculateFeeAmount - Edge Cases', () => {
  it('should handle zero gross amount', () => {
    const fee = calculateFeeAmount(0, 10);
    // fee = gross - net = 0 - 10 = -10
    expect(fee).toBe(-10);
  });

  it('should handle zero net amount', () => {
    const fee = calculateFeeAmount(100, 0);
    // fee = gross - net = 100 - 0 = 100
    expect(fee).toBe(100);
  });

  it('should handle negative gross amount', () => {
    const fee = calculateFeeAmount(-100, 10);
    // fee = gross - net = -100 - 10 = -110
    expect(fee).toBe(-110);
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

    const result = applyTransferTaxes(transfers, 0.005); // Fixed tax rate: always 0.5%

    // gross = ceil(0.01 / 0.995) = ceil(0.01005025...) = 1
    // But then it's rounded to 2 decimals: Math.round(1 * 100) / 100 = 1
    expect(result[0].grossAmount).toBe(1);
    // fee = 1 - 0.01 = 0.99
    expect(result[0].feeAmount).toBe(0.99);
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

    const result = applyTransferTaxes(transfers, 0.005); // Fixed tax rate: always 0.5%

    // Each transfer should have proper gross and fee calculated with 0.5% tax
    // gross = ceil(net / 0.995)
    expect(result[0].grossAmount).toBe(34); // ceil(33.33 / 0.995) = ceil(33.5) = 34
    expect(result[0].feeAmount).toBeCloseTo(0.67, 2);

    expect(result[1].grossAmount).toBe(34);
    expect(result[1].feeAmount).toBeCloseTo(0.67, 2);

    expect(result[2].grossAmount).toBe(34); // ceil(33.34 / 0.995) = ceil(33.51) = 34
    expect(result[2].feeAmount).toBeCloseTo(0.66, 2);
  });

  it('should handle edge case of tax rate >= 1 by returning unchanged transfers', () => {
    const transfers: Transfer[] = [
      {
        fromMemberId: 'member-1',
        toMemberId: 'member-2',
        netAmount: 100,
        grossAmount: 0,
        feeAmount: 0
      }
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
      {
        fromMemberId: 'member-1',
        toMemberId: 'member-2',
        netAmount: 100,
        grossAmount: 0,
        feeAmount: 0
      }
    ];
    const taxRate = -0.05;

    const result = applyTransferTaxes(transfers, taxRate);

    expect(result.length).toBe(1);
    expect(result[0].grossAmount).toBe(100);
    expect(result[0].feeAmount).toBe(0);
  });
});
