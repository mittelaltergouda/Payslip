/**
 * Balance settlement module.
 *
 * This module calculates the minimum set of transfers needed to settle all
 * balances between members using a greedy matching algorithm.
 *
 * The algorithm:
 * 1. Calculates each member's balance (finalNet - revenue held)
 *    because finalNet already includes investment reimbursement and expenses
 * 2. Separates members into debtors (owe money) and creditors (owed money)
 * 3. Greedily matches largest debtor with largest creditor
 * 4. Continues until all balances are settled
 *
 * This approach minimizes the number of transfers required. If tax is enabled,
 * Star Citizen's sender-paid transfer fee is added on top of the amount owed.
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
 * 1. Calculates each member's balance (finalNet - revenue held)
 *    because finalNet already includes investment reimbursement and expenses
 * 2. Separates members into debtors (owe money) and creditors (owed money)
 * 3. Greedily matches largest debtor with largest creditor
 * 4. Continues until all balances are settled
 *
 * This approach minimizes the number of transfers needed.
 *
 * @param memberBreakdowns - Array of member breakdowns with finalNet calculated
 * @param taxRate - Sender-paid transfer-fee rate (0-1), 0 if disabled
 * @returns Array of transfers needed to settle all balances
 */
export function settleBalances(
  memberBreakdowns: MemberBreakdown[],
  taxRate: number = 0
): Transfer[] {
  // Small epsilon for floating point comparisons
  const EPSILON = 0.01;

  // A member's revenue is the session cash currently in their hands.
  // finalNet is what they should keep after investment reimbursement, expenses,
  // and profit distribution. Investments must not be added to cash-on-hand here:
  // they are historical outflows already represented in finalNet.
  // positive balance = creditor (owed money, has less than they should)
  // negative balance = debtor (owes money, has more than they should)
  const balances: MemberBalance[] = memberBreakdowns.map((m) => ({
    memberId: m.memberId,
    balance: m.finalNet - m.revenue,
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

    // aUEC transfers are whole numbers. Always round down so the sender never
    // pays an extra unit merely because an equal split produced a fraction.
    const exactNetAmount = Math.min(debtor.balance, creditor.balance);
    const netAmount = Math.floor(exactNetAmount + Number.EPSILON);

    if (netAmount < 1) {
      // The remaining fractional imbalance cannot be transferred. Advance the
      // side(s) represented by the smaller remainder to avoid an endless loop.
      if (debtor.balance <= creditor.balance + EPSILON) {
        debtorIdx++;
      }
      if (creditor.balance <= debtor.balance + EPSILON) {
        creditorIdx++;
      }
      continue;
    }

    if (netAmount > EPSILON) {
      // Calculate the sender's total charge if a transfer fee applies.
      let grossAmount: number;
      let feeAmount: number;

      if (taxRate > 0 && taxRate < 1) {
        // Star Citizen charges the fee on top of the amount entered: the
        // recipient receives netAmount, while the sender pays netAmount + fee.
        feeAmount = Math.ceil(netAmount * taxRate);
        grossAmount = netAmount + feeAmount;
      } else {
        // No tax - gross equals net
        grossAmount = netAmount;
        feeAmount = 0;
      }

      transfers.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        netAmount,
        grossAmount,
        feeAmount,
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
