/**
 * Tax gross-up calculation module.
 *
 * This module handles tax gross-up calculations for transfers to ensure recipients
 * receive the exact intended net amount after platform/game fees are deducted.
 *
 * When tax is enabled, transfers use the gross-up formula:
 *   grossAmount = ceil(netAmount / (1 - taxRate))
 *   feeAmount = grossAmount - netAmount
 *
 * This ensures the receiver gets the full netAmount after the tax fee is deducted.
 * The sender pays slightly more to cover the tax burden.
 *
 * Example with 5% tax: To send 100 net, sender pays 106 gross, 6 fee deducted,
 * receiver gets exactly 100.
 *
 * @module lib/calc/tax
 */

import type { Transfer } from '../types';

// ============================================================================
// TAX GROSS-UP CALCULATION
// ============================================================================

/**
 * Applies tax gross-up to an array of transfers.
 *
 * Tax Gross-Up Formula:
 * When the sender pays a transfer with tax, the receiver must receive the exact
 * netAmount. To achieve this, we "gross up" the payment:
 *
 *   grossAmount = ceil(netAmount / (1 - taxRate))
 *   feeAmount = grossAmount - netAmount
 *
 * This ensures the receiver gets the full netAmount after the platform/game
 * deducts the tax fee from the gross payment.
 *
 * Example with 5% tax (taxRate = 0.05):
 *   netAmount = 100, grossAmount = ceil(100 / 0.95) = ceil(105.26) = 106
 *   feeAmount = 106 - 100 = 6
 *   Receiver gets: 106 - 6 = 100 (exact netAmount)
 *
 * Edge Cases:
 * - taxRate = 0: No gross-up, grossAmount = netAmount, feeAmount = 0
 * - taxRate >= 1: Would require infinite gross-up, returns unchanged transfers
 *   (this should be caught by validation, but we handle it defensively)
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
    // Gross-up formula: gross = ceil(net / (1 - taxRate))
    // Using Math.ceil ensures the sender covers the full tax amount.
    // This may result in slight overpayment (rounding up), which is preferable
    // to underpayment (receiver would get less than expected).
    const grossAmount = Math.ceil(transfer.netAmount / (1 - taxRate));
    const feeAmount = grossAmount - transfer.netAmount;

    return {
      ...transfer,
      grossAmount: Math.round(grossAmount * 100) / 100, // Round to 2 decimal places
      feeAmount: Math.round(feeAmount * 100) / 100,
    };
  });
}

/**
 * Calculates the gross amount needed to deliver a specific net amount after tax.
 * This is a helper function for individual gross-up calculations.
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
  return Math.ceil(netAmount / (1 - taxRate));
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
