import type {
  SessionInput,
  MemberBreakdown,
  PayslipResult,
} from '../types';
import {
  validateSessionInput,
  validateNormalizedSession,
} from './validation';
import {
  normalizeSessionInput,
} from './normalization';
import {
  distributeProfit,
  getFixedAmountsStatus,
} from './distribution';
import {
  allocateSharedExpenses,
  allocateIndividualExpenses,
} from './expenses';
import {
  settleBalancesDetailed,
} from './settlement';

// Re-export types for external use
export type { SessionInput, PayslipResult, MemberBreakdown, Transfer } from '../types';

// Re-export utility functions for testing and external use
export { applyTransferTaxes, calculateGrossAmount, calculateFeeAmount, calculateServiceFee, SERVICE_FEE_RATE } from './tax';

/** Upper bound for the fee fixed point; in practice it settles in 2-3 rounds. */
const MAX_FEE_ROUNDS = 20;

// ============================================================================
// MAIN CALCULATION ORCHESTRATOR
// ============================================================================

/**
 * Main entry point for payslip calculation.
 * Validates input, normalizes data, computes distribution, and generates transfers.
 *
 * Calculation Flow:
 * 1. Validate raw input (handles, non-negative values, tax rate)
 * 2. Normalize input (apply defaults to optional fields)
 * 3. Validate normalized data (active members, percent shares)
 * 4. Calculate totals (revenue, investments, expenses)
 * 5. Calculate profit; service fees of all transfers are a shared cost
 * 6. Distribute profit using appropriate mode (EQUAL/PERCENT/ADJUSTABLE)
 * 7. Build member breakdowns with final net amounts
 * 8. Generate settlement transfers (sender pays the in-game service fee)
 *    and repeat 5-8 until the suggested transfers' fees are stable
 *
 * @param session - The session input with members, expenses, and configuration
 * @returns PayslipResult with member breakdowns and suggested transfers
 * @throws Error if validation fails
 */
export function calculatePayslip(session: SessionInput): PayslipResult {
  // -------------------------------------------------------------------------
  // Step 1: Validate raw input
  // -------------------------------------------------------------------------
  validateSessionInput(session);

  // -------------------------------------------------------------------------
  // Step 2: Normalize input (apply defaults)
  // -------------------------------------------------------------------------
  const normalized = normalizeSessionInput(session);

  // -------------------------------------------------------------------------
  // Step 3: Validate normalized data
  // -------------------------------------------------------------------------
  validateNormalizedSession(normalized);

  // -------------------------------------------------------------------------
  // Step 4: Calculate totals
  // -------------------------------------------------------------------------
  const activeMembers = normalized.members.filter((m) => m.active);

  // Revenue is the cash currently held by members. A stale legacy
  // totalRevenue value must not create money that cannot be settled.
  const totalRevenue = normalized.members.reduce((sum, m) => sum + m.revenue, 0);

  // Total investments from all members (both active and inactive)
  const totalInvestments = normalized.members.reduce(
    (sum, m) => sum + m.investment,
    0
  );

  // saleRevenue = totalRevenue - totalInvestments
  // This represents the actual proceeds available for distribution
  // (i.e., what's left after returning initial investments)
  const saleRevenue = totalRevenue - totalInvestments;

  // Calculate expense allocations
  const sharedExpenseAllocation = allocateSharedExpenses(
    normalized.sharedExpenses,
    normalized.members
  );

  const individualExpenseAllocation = allocateIndividualExpenses(
    normalized.individualExpenses,
    normalized.members
  );

  // Calculate total expenses
  const totalSharedExpenses = normalized.sharedExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );
  const totalIndividualExpenses = normalized.individualExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );
  const totalExpenses = totalSharedExpenses + totalIndividualExpenses;

  // -------------------------------------------------------------------------
  // Step 5: Calculate profit before service fees
  // -------------------------------------------------------------------------
  // Service fees of every transfer (already made and suggested) are a shared
  // session cost: they reduce profit before it is split, so nobody bears the
  // fee of a transfer alone just for being its recipient.
  const paidTransferFees = normalized.paidTransfers.reduce((sum, t) => sum + t.feeAmount, 0);
  const profitBeforeFees = saleRevenue - totalExpenses;

  // -------------------------------------------------------------------------
  // Steps 6-8: Distribute profit and settle balances
  // -------------------------------------------------------------------------
  const taxRateForTransfers = normalized.taxEnabled ? normalized.taxRate : 0;
  const contributions = normalized.paidTransfers.filter(t => t.kind === "COST_CONTRIBUTION");
  const sharesWithoutFees = distributeProfit(profitBeforeFees, activeMembers, normalized.distributionMode);

  const buildBreakdowns = (netProfit: number): MemberBreakdown[] => {
    const profitDistribution = distributeProfit(netProfit, activeMembers, normalized.distributionMode);
    return normalized.members.map((m) => {
      const memberSharedExpenses = sharedExpenseAllocation.get(m.id) ?? 0;
      const memberIndividualExpenses =
        individualExpenseAllocation.get(m.id) ?? 0;
      const memberTotalExpenses =
        memberSharedExpenses + memberIndividualExpenses;
      const profitShare = profitDistribution.get(m.id) ?? 0;

      // Costs are deducted once from profit, then reimbursed once to the members
      // who funded them. Shared expense participantIds identify those funders.
      const fundedByOthers = contributions.filter(t => t.toMemberId === m.id).reduce((sum, t) => sum + t.netAmount, 0);
      if (fundedByOthers > m.investment + memberTotalExpenses) {
        throw new Error("Cost contributions exceed recipient recorded costs");
      }
      const fundingAdjustment = contributions.filter(t => t.fromMemberId === m.id).reduce((sum, t) => sum + t.netAmount + t.feeAmount, 0) - fundedByOthers;
      const finalNet = m.investment + memberTotalExpenses + fundingAdjustment + profitShare;

      return {
        memberId: m.id,
        handle: m.handle,
        role: m.role || undefined,
        revenue: m.revenue,
        investment: m.investment,
        expenses: memberTotalExpenses,
        sharedExpenses: memberSharedExpenses,
        individualExpenses: memberIndividualExpenses,
        profitShare,
        serviceFeeShare: (sharesWithoutFees.get(m.id) ?? 0) - profitShare,
        finalNet,
        fundingAdjustment,
      };
    });
  };

  // The suggested transfers' fees depend on the transfers, which depend on the
  // shares after fees. Iterate to the fixed point; it settles within a few
  // rounds because a fee is only a fraction of a percent of its transfer.
  let suggestedTransferFees = 0;
  let netProfit = profitBeforeFees - paidTransferFees;
  let memberBreakdowns = buildBreakdowns(netProfit);
  let settlement = settleBalancesDetailed(memberBreakdowns, taxRateForTransfers, normalized.paidTransfers);
  const seenFees = new Set<number>([suggestedTransferFees]);
  for (let round = 0; round < MAX_FEE_ROUNDS; round++) {
    const actualFees = settlement.transfers.reduce((sum, t) => sum + t.feeAmount, 0);
    if (actualFees === suggestedTransferFees || seenFees.has(actualFees)) {
      break;
    }
    seenFees.add(actualFees);
    suggestedTransferFees = actualFees;
    netProfit = profitBeforeFees - paidTransferFees - suggestedTransferFees;
    memberBreakdowns = buildBreakdowns(netProfit);
    settlement = settleBalancesDetailed(memberBreakdowns, taxRateForTransfers, normalized.paidTransfers);
  }
  const { transfers: suggestedTransfers, details: settlementDetails, unsettledBalances } = settlement;

  // -------------------------------------------------------------------------
  // Step 9: Return the complete payslip result
  // -------------------------------------------------------------------------
  return {
    saleRevenue,
    netProfit,
    taxRateApplied: taxRateForTransfers,
    members: memberBreakdowns,
    suggestedTransfers,
    unsettledBalances,
    paidTransferFees,
    suggestedTransferFees,
    paidTransfers: normalized.paidTransfers,
    settlementDetails,
    fixedAmountsStatus: getFixedAmountsStatus(
      netProfit,
      activeMembers,
      normalized.distributionMode
    ),
  };
}
