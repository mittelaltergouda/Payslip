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
} from './distribution';
import {
  allocateSharedExpenses,
  allocateIndividualExpenses,
} from './expenses';
import {
  settleBalances,
} from './settlement';

// Re-export types for external use
export type { SessionInput, PayslipResult, MemberBreakdown, Transfer } from '../types';

// Re-export utility functions for testing and external use
export { applyTransferTaxes, calculateGrossAmount, calculateFeeAmount } from './tax';

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
 * 5. Calculate net profit
 * 6. Distribute profit using appropriate mode (EQUAL/PERCENT/ADJUSTABLE)
 * 7. Build member breakdowns with final net amounts
 * 8. Generate settlement transfers using greedy matching
 * 9. Add Star Citizen's sender-paid transfer fee if enabled
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

  // Total revenue: use provided totalRevenue or sum of member revenues
  // If totalRevenue is explicitly set, it overrides individual member revenues
  const totalRevenue =
    normalized.totalRevenue ??
    normalized.members.reduce((sum, m) => sum + m.revenue, 0);

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
  // Step 5: Calculate net profit
  // -------------------------------------------------------------------------
  // Net profit = saleRevenue - total expenses
  const netProfit = saleRevenue - totalExpenses;

  // -------------------------------------------------------------------------
  // Steps 6-8: Distribute profit and settle balances, including transfer fees
  // -------------------------------------------------------------------------
  // Costs are deducted once before distribution. Transfer fees are also a
  // shared session cost, but they depend on the transfers themselves. Iterate
  // until the per-payer fees stabilize:
  //   1. distribute profit after the current fee estimate,
  //   2. account for fees already paid by each sender,
  //   3. recalculate transfers and their fees.
  const taxRateForTransfers = normalized.taxEnabled ? normalized.taxRate : 0;
  let feeByPayer = new Map<string, number>();
  let memberBreakdowns: MemberBreakdown[] = [];
  let suggestedTransfers: PayslipResult['suggestedTransfers'] = [];
  const MAX_FEE_ITERATIONS = 100;

  for (let iteration = 0; iteration < MAX_FEE_ITERATIONS; iteration++) {
    const totalTransferFees = Array.from(feeByPayer.values()).reduce(
      (sum, fee) => sum + fee,
      0
    );
    const distributableProfit = netProfit - totalTransferFees;
    const profitDistribution = distributeProfit(
      distributableProfit,
      activeMembers,
      normalized.distributionMode
    );

    memberBreakdowns = normalized.members.map((m) => {
      const memberSharedExpenses = sharedExpenseAllocation.get(m.id) ?? 0;
      const memberIndividualExpenses =
        individualExpenseAllocation.get(m.id) ?? 0;
      const memberTotalExpenses =
        memberSharedExpenses + memberIndividualExpenses;
      const profitShare = profitDistribution.get(m.id) ?? 0;

      // Investments are reimbursed and the already cost-adjusted profit is
      // distributed. Expenses must not be subtracted a second time here.
      const finalNet = m.investment + profitShare;

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
        finalNet,
      };
    });

    // A sender pays the fee in addition to the transfer amount. Subtract the
    // current fee estimate from their cash-on-hand before settling so the fee
    // burden is shared through the distribution instead of landing solely on
    // that sender.
    const settlementBreakdowns = memberBreakdowns.map((member) => ({
      ...member,
      revenue: member.revenue - (feeByPayer.get(member.memberId) ?? 0),
    }));
    suggestedTransfers = settleBalances(
      settlementBreakdowns,
      taxRateForTransfers
    );

    const nextFeeByPayer = new Map<string, number>();
    for (const transfer of suggestedTransfers) {
      nextFeeByPayer.set(
        transfer.fromMemberId,
        (nextFeeByPayer.get(transfer.fromMemberId) ?? 0) + transfer.feeAmount
      );
    }

    const payerIds = new Set([
      ...feeByPayer.keys(),
      ...nextFeeByPayer.keys(),
    ]);
    const feesStable = Array.from(payerIds).every(
      (memberId) =>
        Math.abs(
          (feeByPayer.get(memberId) ?? 0) -
            (nextFeeByPayer.get(memberId) ?? 0)
        ) < 0.01
    );

    if (feesStable) {
      break;
    }

    feeByPayer = nextFeeByPayer;

    if (iteration === MAX_FEE_ITERATIONS - 1) {
      throw new Error('Transfer fee calculation did not converge');
    }
  }

  // -------------------------------------------------------------------------
  // Step 9: Return the complete payslip result
  // -------------------------------------------------------------------------
  return {
    saleRevenue,
    netProfit,
    taxRateApplied: taxRateForTransfers,
    members: memberBreakdowns,
    suggestedTransfers,
  };
}
