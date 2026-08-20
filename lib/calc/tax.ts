/**
 * Star Citizen transfer-fee calculation module.
 *
 * The amount entered in Star Citizen is what the recipient receives. The sender
 * pays that amount plus the 0.5% transfer fee.
 *
 * When tax is enabled:
 *   feeAmount = ceil(netAmount * taxRate)
 *   grossAmount = netAmount + feeAmount
 *
 * netAmount remains the value entered in the Wallet app and received by the other
 * player. grossAmount is the sender's total balance reduction.
 *
 * Example with 5% tax: enter 100, the recipient gets 100, and the sender pays
 * 105 in total.
 *
 * @module lib/calc/tax
 */

import type { Transfer } from '../types';

// ============================================================================
// TRANSFER-FEE CALCULATION
// ============================================================================

/**
 * Adds the transfer fee paid by the sender to an array of transfers.
 *
 * Star Citizen Fee Formula:
 * The recipient receives the amount entered, and the fee is charged on top:
 *
 *   feeAmount = ceil(netAmount * taxRate)
 *   grossAmount = netAmount + feeAmount
 *
 * Whole aUEC are used, so the fee is rounded up to avoid understating the
 * sender's required balance.
 *
 * Example with 5% tax (taxRate = 0.05):
 *   netAmount = 100, feeAmount = 5, grossAmount = 105
 *   Receiver gets 100; sender's balance decreases by 105.
 *
 * Edge Cases:
 * - taxRate = 0: grossAmount = netAmount, feeAmount = 0
 * - invalid tax rates (>= 1): returns unchanged transfers defensively
 *
 * @param transfers - Array of transfers with netAmount set
 * @param taxRate - Tax rate as decimal (0-1), e.g., 0.05 for 5%
 * @returns Array of transfers with grossAmount and feeAmount calculated
 */
export function applyTransferTaxes(
  transfers: Transfer[],
  taxRate: number
): Transfer[] {
  // No tax applied if rate is 0 or negative
  if (taxRate <= 0) {
    return transfers.map((t) => ({
      ...t,
      grossAmount: t.netAmount,
      feeAmount: 0,
    }));
  }

  // Edge case: taxRate >= 1 would require infinite payment (invalid)
  // Return transfers unchanged - validation should prevent this
  if (taxRate >= 1) {
    return transfers.map((t) => ({
      ...t,
      grossAmount: t.netAmount,
      feeAmount: 0,
    }));
  }

  return transfers.map((transfer) => {
    const feeAmount = Math.ceil(transfer.netAmount * taxRate);
    const grossAmount = transfer.netAmount + feeAmount;

    return {
      ...transfer,
      grossAmount: Math.round(grossAmount * 100) / 100, // Round to 2 decimal places
      feeAmount: Math.round(feeAmount * 100) / 100,
    };
  });
}

/**
 * Calculates the sender's total balance reduction for a transfer.
 *
 * @param netAmount - The amount the receiver should receive
 * @param taxRate - Tax rate as decimal (0-1)
 * @returns The gross amount the sender must pay
 */
export function calculateGrossAmount(
  netAmount: number,
  taxRate: number
): number {
  if (taxRate <= 0 || taxRate >= 1) {
    return netAmount;
  }
  return netAmount + Math.ceil(netAmount * taxRate);
}

/**
 * Finds the largest whole-aUEC recipient amount whose sender-paid fee still
 * fits inside a fixed total transfer budget.
 */
export function fitTransferToBudget(
  budget: number,
  taxRate: number
): { netAmount: number; feeAmount: number; grossAmount: number } {
  const wholeBudget = Math.max(0, Math.floor(budget));

  if (taxRate <= 0 || taxRate >= 1) {
    return { netAmount: wholeBudget, feeAmount: 0, grossAmount: wholeBudget };
  }

  let low = 0;
  let high = wholeBudget;
  let netAmount = 0;

  while (low <= high) {
    const candidate = Math.floor((low + high) / 2);
    const candidateGross = calculateGrossAmount(candidate, taxRate);

    if (candidateGross <= wholeBudget) {
      netAmount = candidate;
      low = candidate + 1;
    } else {
      high = candidate - 1;
    }
  }

  const feeAmount = Math.ceil(netAmount * taxRate);
  return {
    netAmount,
    feeAmount,
    grossAmount: netAmount + feeAmount,
  };
}

/**
 * Calculates the fee amount for a given gross and net amount.
 *
 * @param grossAmount - The total amount paid by sender
 * @param netAmount - The amount received by recipient
 * @returns The fee/tax deducted
 */
export function calculateFeeAmount(
  grossAmount: number,
  netAmount: number
): number {
  return grossAmount - netAmount;
}
