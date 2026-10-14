import { describe, expect, it } from 'vitest';
import { calculateServiceFee, SERVICE_FEE_RATE, calculateGrossAmount } from './calc/tax';
import { distributionColumns, isServiceFeeIncluded, withServiceFee } from './accounting';
import { savedSessionSchema, type SessionInput } from './types';

describe('service fee on recorded transfers', () => {
  it('uses the in-game 0.5 % rate', () => {
    expect(SERVICE_FEE_RATE).toBe(0.005);
  });

  it('charges the same fee as suggested transfers: rate of the amount, rounded up', () => {
    expect(calculateServiceFee(100_000, SERVICE_FEE_RATE)).toBe(500);
    expect(calculateServiceFee(248_656, SERVICE_FEE_RATE)).toBe(1244);
    expect(calculateServiceFee(1, SERVICE_FEE_RATE)).toBe(1);
    expect(calculateServiceFee(0, SERVICE_FEE_RATE)).toBe(0);
    for (const amount of [0, 1, 199, 200, 201, 99_999, 3_850_282]) {
      expect(amount + calculateServiceFee(amount, SERVICE_FEE_RATE)).toBe(calculateGrossAmount(amount, SERVICE_FEE_RATE));
    }
  });

  it('is zero for a zero rate and rejects invalid rates', () => {
    expect(calculateServiceFee(100_000, 0)).toBe(0);
    expect(() => calculateServiceFee(100, 1)).toThrow(RangeError);
    expect(() => calculateServiceFee(100, -0.1)).toThrow(RangeError);
  });

  it('derives the fee from the checkbox: on adds the fee, off records none', () => {
    expect(withServiceFee(100_000, true, SERVICE_FEE_RATE)).toEqual({ netAmount: 100_000, feeAmount: 500, feeIncluded: true });
    expect(withServiceFee(100_000, false, SERVICE_FEE_RATE)).toEqual({ netAmount: 100_000, feeAmount: 0, feeIncluded: false });
  });

  it('treats older transfers without the flag as paid when a fee was recorded', () => {
    expect(isServiceFeeIncluded({ feeAmount: 100 })).toBe(true);
    expect(isServiceFeeIncluded({ feeAmount: 0 })).toBe(false);
    expect(isServiceFeeIncluded({ feeAmount: 0, feeIncluded: true })).toBe(true);
    expect(isServiceFeeIncluded({ feeAmount: 100, feeIncluded: false })).toBe(false);
  });

  it('keeps the checkbox state when sessions are stored and loaded', () => {
    const session: SessionInput = {
      name: 'Fee', type: 'TRADING', distributionMode: 'EQUAL',
      members: [{ id: 'a', handle: 'A' }, { id: 'b', handle: 'B' }],
      paidTransfers: [{ id: 't', fromMemberId: 'a', toMemberId: 'b', netAmount: 0, feeAmount: 0, feeIncluded: true }],
    };
    const parsed = savedSessionSchema.parse({ id: 's', session, createdAt: '', updatedAt: '' });
    expect(parsed.session.paidTransfers?.[0].feeIncluded).toBe(true);
    const legacy = savedSessionSchema.parse({ id: 's', session: { ...session, paidTransfers: [{ fromMemberId: 'a', toMemberId: 'b', netAmount: 100_000, feeAmount: 100 }] }, createdAt: '', updatedAt: '' });
    expect(legacy.session.paidTransfers?.[0]).toMatchObject({ netAmount: 100_000, feeAmount: 100 });
    expect(legacy.session.paidTransfers?.[0].feeIncluded).toBeUndefined();
  });
});

describe('distribution columns per mode', () => {
  it('shows only the inputs each mode uses', () => {
    expect(distributionColumns('EQUAL')).toEqual({ percentShare: false, fixedAmounts: false });
    expect(distributionColumns('PERCENT')).toEqual({ percentShare: true, fixedAmounts: false });
    expect(distributionColumns('ADJUSTABLE')).toEqual({ percentShare: true, fixedAmounts: true });
  });
});
