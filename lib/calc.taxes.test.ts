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

    it('should reject tax rates of 1 or greater', () => {
      expect(() => calculateGrossAmount(100, 1)).toThrow(/less than 1/);
      expect(() => calculateGrossAmount(100, 1.5)).toThrow(/less than 1/);
    });

    it('should reject negative tax rates', () => {
      expect(() => calculateGrossAmount(100, -0.05)).toThrow(/non-negative/);
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

    it('should reject tax rates of 1 or greater', () => {
      const transfers: Transfer[] = [
        { fromMemberId: 'member-1', toMemberId: 'member-2', netAmount: 100, grossAmount: 0, feeAmount: 0 }
      ];

      expect(() => applyTransferTaxes(transfers, 1)).toThrow(/less than 1/);
    });

    it('should reject negative tax rates', () => {
      const transfers: Transfer[] = [
        { fromMemberId: 'member-1', toMemberId: 'member-2', netAmount: 100, grossAmount: 0, feeAmount: 0 }
      ];

      expect(() => applyTransferTaxes(transfers, -0.05)).toThrow(/non-negative/);
    });
  });

  describe('calculatePayslip with tax enabled', () => {
    it('should add the fee to settlement transfers when tax is enabled', () => {
      const input: SessionInput = {
        name: 'Tax Enabled Session',
        type: 'TRADING',
        distributionMode: 'ADJUSTABLE',
        totalRevenue: 1200,
        taxEnabled: true,
        taxRate: 0.005, // Fixed tax rate: always 0.5%
        members: [
          { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000, investment: 1000, fixedPayout: 200 },
          { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 200, investment: 0 }
        ]
      };

      const result = calculatePayslip(input);

      // saleRevenue = 1200 - 1000 = 200. The 1 aUEC service fee of the
      // settlement transfer is a session cost, so 199 profit remains and
      // Alice's fixed payout of 200 is scaled down to it.
      expect(result.saleRevenue).toBe(200);
      expect(result.netProfit).toBe(199);
      expect(result.suggestedTransferFees).toBe(1);
      expect(result.fixedAmountsStatus).toBe('SCALED_TO_PROFIT');
      expect(result.taxRateApplied).toBe(0.005); // Fixed tax rate: always 0.5%

      const alice = result.members.find(m => m.memberId === 'member-1');
      const bob = result.members.find(m => m.memberId === 'member-2');

      expect(alice?.profitShare).toBe(199);
      expect(bob?.profitShare).toBe(0);
      expect(alice?.finalNet).toBe(1199);
      expect(bob?.finalNet).toBe(0);

      // Bob holds 200 and keeps nothing: 199 reach Alice, 1 is the fee.
      expect(result.suggestedTransfers.length).toBe(1);
      expect(result.suggestedTransfers[0].fromMemberId).toBe('member-2');
      expect(result.suggestedTransfers[0].toMemberId).toBe('member-1');
      expect(result.suggestedTransfers[0].netAmount).toBe(199);
      expect(result.suggestedTransfers[0].grossAmount).toBe(200);
      expect(result.suggestedTransfers[0].feeAmount).toBe(1);
    });

    it('should not apply tax when taxEnabled is false', () => {
      const input: SessionInput = {
        name: 'Tax Disabled Session',
        type: 'TRADING',
        distributionMode: 'ADJUSTABLE',
        totalRevenue: 1200,
        taxEnabled: false,
        taxRate: 0.05, // Rate specified but should be ignored
        members: [
          { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 1000, investment: 1000, fixedPayout: 200 },
          { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 200, investment: 0 }
        ]
      };

      const result = calculatePayslip(input);

      expect(result.taxRateApplied).toBe(0);

      // Transfers should not have tax applied
      // Fixed payouts apply only when profit covers them, so Bob holds the
      // session cash instead of owing money that never existed.
      // saleRevenue = 1200 - 1000 = 200, netProfit = 200 = Alice's fixed payout
      // Alice: finalNet = 1000 + 200 = 1200, balance = 1200 - 1000 = 200 (creditor)
      // Bob: finalNet = 0 + 0 = 0, balance = 0 - 200 = -200 (debtor)
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

      // profit = 1000 − 2 fee = 998, split 70/30. Alice holds all the cash
      // and sends Bob his whole share; the fee is part of the shared cost.
      expect(result.netProfit).toBe(998);
      expect(alice?.profitShare).toBeCloseTo(698.6, 10);
      expect(bob?.profitShare).toBeCloseTo(299.4, 10);
      expect(alice?.serviceFeeShare).toBeCloseTo(1.4, 10);
      expect(bob?.serviceFeeShare).toBeCloseTo(0.6, 10);
      expect(result.suggestedTransfers).toEqual([
        { fromMemberId: 'member-1', toMemberId: 'member-2', netAmount: 299, feeAmount: 2, grossAmount: 301 },
      ]);
    });
  });
});
