import type { SessionInput } from './calc';
import { calculatePayslip } from './calc';

// Settlement/Transfer Generation Tests

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
      taxRate: 0.005, // Fixed tax rate: always 0.5%
      members: [
        { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 1500, fixedPayout: 800 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 0, fixedPayout: 500 },
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 0, investment: 0 }
      ]
    };

    const result = calculatePayslip(input);

    expect(result.taxRateApplied).toBe(0.005); // Fixed tax rate: always 0.5%

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

      // Verify gross-up calculation: gross = ceil(net / (1 - 0.005)) = ceil(net / 0.995)
      const expectedGross = Math.ceil(transfer.netAmount / 0.995);
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
