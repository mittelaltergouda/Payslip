/**
 * Balance settlement module.
 *
 * This module calculates the minimum set of transfers needed to settle all
 * balances between members using a greedy matching algorithm.
 *
 * The algorithm:
 * 1. Calculates each member's balance (finalNet - investment)
 * 2. Separates members into debtors (owe money) and creditors (owed money)
 * 3. Greedily matches largest debtor with largest creditor
 * 4. Continues until all balances are settled
 *
 * This approach minimizes the number of transfers required. Tax gross-up is
 * applied to each transfer if tax is enabled, ensuring recipients receive the
 * exact amount owed after fees.
 *
 * @module lib/calc/settlement
 */

import type { MemberBreakdown, Transfer } from '../types';

// ============================================================================
// BALANCE SETTLEMENT (Greedy Matching Algorithm)
// ============================================================================

/**
 * Internal type for tracking member balance during settlement.
 */
type MemberBalance = {
  memberId: string;
  balance: number; // positive = owed money (creditor), negative = owes money (debtor)
};

/**
 * Settles balances between members using a greedy matching algorithm.
 *
 * The algorithm:
 * 1. Calculates each member's balance (finalNet - investment)
 * 2. Separates members into debtors (owe money) and creditors (owed money)
 * 3. Greedily matches largest debtor with largest creditor
 * 4. Continues until all balances are settled
 *
 * This approach minimizes the number of transfers needed.
 *
 * @param memberBreakdowns - Array of member breakdowns with finalNet calculated
 * @param taxRate - Tax rate for gross-up calculation (0-1), 0 if tax disabled
 * @returns Array of transfers needed to settle all balances
 */
export function settleBalances(
  memberBreakdowns: MemberBreakdown[],
  taxRate: number = 0
): Transfer[] {
  // Small epsilon for floating point comparisons
  const EPSILON = 0.01;

  // Calculate balance for each member: finalNet - investment
  // positive balance = creditor (owed money)
  // negative balance = debtor (owes money)
  const balances: MemberBalance[] = memberBreakdowns.map((m) => ({
    memberId: m.memberId,
    balance: m.finalNet - m.investment,
  }));

  // Separate into debtors and creditors, filtering out zero balances
  const debtors = balances
    .filter((b) => b.balance < -EPSILON)
    .map((b) => ({ ...b, balance: -b.balance })) // Convert to positive for easier math
    .sort((a, b) => b.balance - a.balance); // Sort descending by amount owed

  const creditors = balances
    .filter((b) => b.balance > EPSILON)
    .sort((a, b) => b.balance - a.balance); // Sort descending by amount owed

  const transfers: Transfer[] = [];

  // Greedy matching: pair largest debtor with largest creditor
  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const debtor = debtors[debtorIdx];
    const creditor = creditors[creditorIdx];

    // Transfer amount is the minimum of what debtor owes and what creditor is owed
    const netAmount = Math.min(debtor.balance, creditor.balance);

    if (netAmount > EPSILON) {
      // Calculate gross amount with tax gross-up if applicable
      let grossAmount: number;
      let feeAmount: number;

      if (taxRate > 0 && taxRate < 1) {
        // Gross-up formula: gross = ceil(net / (1 - taxRate))
        // This ensures the recipient gets the full netAmount after tax
        grossAmount = Math.ceil(netAmount / (1 - taxRate));
        feeAmount = grossAmount - netAmount;
      } else {
        // No tax - gross equals net
        grossAmount = netAmount;
        feeAmount = 0;
      }

      transfers.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        netAmount: Math.round(netAmount * 100) / 100, // Round to 2 decimal places
        grossAmount: Math.round(grossAmount * 100) / 100,
        feeAmount: Math.round(feeAmount * 100) / 100,
      });

      // Update remaining balances
      debtor.balance -= netAmount;
      creditor.balance -= netAmount;
    }

    // Move to next debtor or creditor if their balance is settled
    if (debtor.balance <= EPSILON) {
      debtorIdx++;
    }
    if (creditor.balance <= EPSILON) {
      creditorIdx++;
    }
  }

  return transfers;
}
