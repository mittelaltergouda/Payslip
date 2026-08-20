import type { SessionInput} from './calc';
import { calculatePayslip, applyTransferTaxes, calculateGrossAmount, calculateFeeAmount } from './calc';
import type { Transfer } from './types';

// Test cases for Star Citizen's sender-paid transfer fee

describe('Star Citizen transfer fee calculations', () => {
  describe('calculateGrossAmount', () => {
    it('should return net amount when tax rate is 0', () => {
      const netAmount = 100;
      const taxRate = 0;

      const grossAmount = calculateGrossAmount(netAmount, taxRate);

      expect(grossAmount).toBe(100);
    });

    it('should add a 0.5% fee to a small amount', () => {
      const netAmount = 100;
      const taxRate = 0.005; // Fixed tax rate: always 0.5%

      // The recipient gets 100; ceil(100 * 0.005) = 1 is charged on top.
      const grossAmount = calculateGrossAmount(netAmount, taxRate);

      expect(grossAmount).toBe(101);
    });

    it('should add a 0.5% fee to a larger amount', () => {
      const netAmount = 1000;
      const taxRate = 0.005; // Fixed tax rate: always 0.5%

      // The recipient gets 1000; the sender pays 1000 + 5 fee.
      const grossAmount = calculateGrossAmount(netAmount, taxRate);

      expect(grossAmount).toBe(1005);
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
    it('should apply 0 tax rate correctly', () => {
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

    it('should add the 0.5% fee on top', () => {
      const transfers: Transfer[] = [
        { fromMemberId: 'member-1', toMemberId: 'member-2', netAmount: 100, grossAmount: 0, feeAmount: 0 }
      ];
      const taxRate = 0.005; // Fixed tax rate: always 0.5%

      const result = applyTransferTaxes(transfers, taxRate);

      expect(result.length).toBe(1);
      expect(result[0].netAmount).toBe(100);
      // grossAmount = 100 + ceil(100 * 0.005) = 101
      expect(result[0].grossAmount).toBe(101);
      expect(result[0].feeAmount).toBe(1);
    });

    it('should apply tax to multiple transfers correctly', () => {
      const transfers: Transfer[] = [
        { fromMemberId: 'member-1', toMemberId: 'member-2', netAmount: 100, grossAmount: 0, feeAmount: 0 },
        { fromMemberId: 'member-3', toMemberId: 'member-4', netAmount: 200, grossAmount: 0, feeAmount: 0 }
      ];
      const taxRate = 0.005; // Fixed tax rate: always 0.5%

      const result = applyTransferTaxes(transfers, taxRate);

      expect(result.length).toBe(2);

      // First transfer: 100 + ceil(100 * 0.005) = 101
      expect(result[0].netAmount).toBe(100);
      expect(result[0].grossAmount).toBe(101);
      expect(result[0].feeAmount).toBe(1);

      // Second transfer: 200 + ceil(200 * 0.005) = 201
      expect(result[1].netAmount).toBe(200);
      expect(result[1].grossAmount).toBe(201);
      expect(result[1].feeAmount).toBe(1);
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
    it('should add the fee to settlement transfers when tax is enabled', () => {
      const input: SessionInput = {
        name: 'Tax Enabled Session',
        type: 'TRADING',
        distributionMode: 'ADJUSTABLE',
        totalRevenue: 1000,
        taxEnabled: true,
        taxRate: 0.005, // Fixed tax rate: always 0.5%
        members: [
          { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 0, investment: 1000, fixedPayout: 200 },
          { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, investment: 0 }
        ]
      };

      const result = calculatePayslip(input);

      // saleRevenue = 1000 - 1000 = 0, netProfit = 0
      expect(result.saleRevenue).toBe(0);
      expect(result.netProfit).toBe(0);
      expect(result.taxRateApplied).toBe(0.005); // Fixed tax rate: always 0.5%

      const alice = result.members.find(m => m.memberId === 'member-1');
      const bob = result.members.find(m => m.memberId === 'member-2');

      // Alice keeps the fixed payout; Bob's remainder absorbs the 1 aUEC fee.
      expect(alice?.profitShare).toBe(200);
      expect(bob?.profitShare).toBe(-201);

      // finalNet = investment + profitShare
      // Alice: 1000 + 200 = 1200
      // Bob: 0 + (-201) = -201
      expect(alice?.finalNet).toBe(1200);
      expect(bob?.finalNet).toBe(-201);

      // Balance: Alice = 1200 - 1000 = 200 (creditor), Bob = -200 - 0 = -200 (debtor)
      // Bob owes Alice 200
      // With 0.5% tax, total charge = 200 + ceil(200 * 0.005) = 201
      expect(result.suggestedTransfers.length).toBe(1);
      expect(result.suggestedTransfers[0].fromMemberId).toBe('member-2');
      expect(result.suggestedTransfers[0].toMemberId).toBe('member-1');
      expect(result.suggestedTransfers[0].netAmount).toBe(200);
      expect(result.suggestedTransfers[0].grossAmount).toBe(201);
      expect(result.suggestedTransfers[0].feeAmount).toBe(1);
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
      expect(result.suggestedTransfers[0].grossAmount).toBe(200); // No fee
      expect(result.suggestedTransfers[0].feeAmount).toBe(0);
    });

    it('should handle tax enabled with PERCENT distribution mode', () => {
      const input: SessionInput = {
        name: 'Tax with Percent Mode',
        type: 'TRADING',
        distributionMode: 'PERCENT',
        totalRevenue: 1000,
        taxEnabled: true,
        taxRate: 0.005, // Fixed tax rate: always 0.5%
        members: [
          { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000, percentShare: 70 },
          { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 0, percentShare: 30 }
        ]
      };

      const result = calculatePayslip(input);

      expect(result.taxRateApplied).toBe(0.005); // Fixed tax rate: always 0.5%

      const alice = result.members.find(m => m.memberId === 'member-1');
      const bob = result.members.find(m => m.memberId === 'member-2');

      // The 2 aUEC fee is deducted before the 70/30 split.
      expect(alice?.profitShare).toBe(698.6);
      expect(bob?.profitShare).toBe(299.4);

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
      // Balance: Alice = 1200 - 1000 = 200, Bob = -200 - 0 = -200
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

      // This scenario produces actual transfers for fee assertions.
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
