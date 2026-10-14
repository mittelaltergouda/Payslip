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
 * Star Citizen's sender-paid service fee is added on top of the amount: the
 * recipient gets the full amount, the sender pays amount + fee. The fees are a
 * shared session cost the caller has already deducted from the targets.
 *
 * @module lib/calc/settlement
 */

import type { MemberBreakdown, PaidTransferInput, SettlementDetail, Transfer, UnsettledBalance } from '../types';
import { calculateGrossAmount, fitTransferToBudget } from './tax';

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
export type SettlementResult = {
  transfers: Transfer[];
  details: SettlementDetail[];
  unsettledBalances: UnsettledBalance[];
};

export function settleBalancesDetailed(
  memberBreakdowns: MemberBreakdown[],
  taxRate: number = 0,
  paidTransfers: PaidTransferInput[] = []
): SettlementResult {
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

  // Service fees are a shared session cost (already deducted from profit), so
  // a transfer moves the sender's total cost out and only the amount in.
  const balanceByMember = new Map(balances.map((balance) => [balance.memberId, balance]));
  for (const transfer of paidTransfers) {
    if (transfer.kind === "COST_CONTRIBUTION") {continue;}
    const sender = balanceByMember.get(transfer.fromMemberId);
    const recipient = balanceByMember.get(transfer.toMemberId);
    if (sender && recipient) {
      sender.balance += transfer.netAmount + transfer.feeAmount;
      recipient.balance -= transfer.netAmount;
    }
  }

  // Separate into debtors and creditors, filtering out zero balances.
  // A debtor's balance is their total budget (amounts plus fees), a
  // creditor's balance is the amount that still has to arrive.
  const debtors = balances
    .filter((b) => b.balance < -EPSILON)
    .map((b) => ({ ...b, balance: -b.balance })) // Convert to positive for easier math
    .sort((a, b) => b.balance - a.balance); // Sort descending by amount owed

  const creditors = balances
    .filter((b) => b.balance > EPSILON)
    .sort((a, b) => b.balance - a.balance); // Sort descending by amount owed

  const transfers: Transfer[] = [];
  const details: SettlementDetail[] = [];

  // Greedy matching: pair largest debtor with largest creditor
  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const debtor = debtors[debtorIdx];
    const creditor = creditors[creditorIdx];

    // The largest whole amount the debtor can send with its fee on top ...
    const debtorBudget = Math.floor(debtor.balance + Number.EPSILON);
    const affordable = debtorBudget >= 1 ? fitTransferToBudget(debtorBudget, taxRate).netAmount : 0;
    // ... and what the creditor still needs, in whole aUEC.
    const needed = Math.floor(creditor.balance + Number.EPSILON);
    const creditorLimited = needed <= affordable;
    const netAmount = Math.min(needed, affordable);

    if (netAmount < 1) {
      // A sub-minimum remainder on one side must not discard the still-funded
      // opposite side; it may continue matching the next balance.
      if (affordable < 1) {
        debtorIdx++;
      }
      if (needed < 1) {
        creditorIdx++;
      }
      continue;
    }

    const grossAmount = calculateGrossAmount(netAmount, taxRate);
    const feeAmount = grossAmount - netAmount;
    const exactBudget = creditorLimited ? creditor.balance : netAmount;

    transfers.push({
      fromMemberId: debtor.memberId,
      toMemberId: creditor.memberId,
      netAmount,
      grossAmount,
      feeAmount,
    });
    details.push({
      fromMemberId: debtor.memberId,
      toMemberId: creditor.memberId,
      netAmount,
      grossAmount,
      feeAmount,
      exactBudget,
      budgetAmount: netAmount,
      roundingRemainder: exactBudget - netAmount,
    });

    debtor.balance -= grossAmount;
    creditor.balance -= netAmount;

    // Move to next debtor or creditor if their balance is settled
    if (debtor.balance < 1 || !creditorLimited) {
      debtorIdx++;
    }
    if (creditor.balance < 1) {
      creditorIdx++;
    }
  }

  const unsettledBalances: UnsettledBalance[] = [
    ...debtors
      .filter((debtor) => debtor.balance > EPSILON)
      .map((debtor) => ({ memberId: debtor.memberId, amount: -debtor.balance })),
    ...creditors
      .filter((creditor) => creditor.balance > EPSILON)
      .map((creditor) => ({ memberId: creditor.memberId, amount: creditor.balance })),
  ];

  return { transfers, details, unsettledBalances };
}

export function settleBalances(
  memberBreakdowns: MemberBreakdown[],
  taxRate: number = 0
): Transfer[] {
  return settleBalancesDetailed(memberBreakdowns, taxRate).transfers;
}
