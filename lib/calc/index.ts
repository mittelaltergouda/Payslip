import type {
  SessionInput,
  MemberBreakdown,
  PayslipResult,
} from '../types';
import {
  NormalizedSessionInput,
} from './types';
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
import {
  calculateSummaryStatistics,
} from './statistics';
import {
  applyTransferTaxes,
  calculateGrossAmount,
  calculateFeeAmount,
} from './tax';

// Re-export types for external use
export type { SessionInput, PayslipResult, MemberBreakdown, Transfer } from '../types';

// Re-export utility functions for testing and external use
export { calculateSummaryStatistics } from './statistics';
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
 * 9. Apply tax gross-up to transfers if enabled
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
  // Step 6: Distribute profit using appropriate mode
  // -------------------------------------------------------------------------
  const profitDistribution = distributeProfit(
    netProfit,
    activeMembers,
    normalized.distributionMode
  );

  // -------------------------------------------------------------------------
  // Step 7: Build member breakdowns
  // -------------------------------------------------------------------------
  const memberBreakdowns: MemberBreakdown[] = normalized.members.map((m) => {
    // Get this member's allocated shared expenses
    const memberSharedExpenses = sharedExpenseAllocation.get(m.id) ?? 0;

    // Get this member's individual expenses
    const memberIndividualExpenses =
      individualExpenseAllocation.get(m.id) ?? 0;

    // Total expenses for this member (combination of shared and individual)
    const memberTotalExpenses = memberSharedExpenses + memberIndividualExpenses;

    // Get profit share (0 for inactive members since they're excluded from distribution)
    const profitShare = profitDistribution.get(m.id) ?? 0;

    // Final net calculation:
    // - Start with investment (what they put in gets returned)
    // - Add profit share (their portion of the distributed profit)
    // - Subtract expenses (costs allocated to them)
    const finalNet = m.investment + profitShare - memberTotalExpenses;

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

  // -------------------------------------------------------------------------
  // Step 8: Generate settlement transfers
  // -------------------------------------------------------------------------
  // Determine the tax rate to apply to transfers
  // Only apply tax if explicitly enabled, otherwise use 0
  const taxRateForTransfers = normalized.taxEnabled ? normalized.taxRate : 0;

  // Use greedy matching algorithm to minimize number of transfers
  // This algorithm pairs largest debtors with largest creditors to minimize
  // the total number of transactions needed to settle all balances
  const suggestedTransfers = settleBalances(
    memberBreakdowns,
    taxRateForTransfers
  );

  // -------------------------------------------------------------------------
  // Step 9: Calculate summary statistics
  // -------------------------------------------------------------------------
  const summaryStatistics = calculateSummaryStatistics(
    memberBreakdowns,
    suggestedTransfers
  );

  // -------------------------------------------------------------------------
  // Step 10: Return the complete payslip result
  // -------------------------------------------------------------------------
  return {
    saleRevenue,
    netProfit,
    taxRateApplied: taxRateForTransfers,
    members: memberBreakdowns,
    suggestedTransfers,
    summaryStatistics,
  };
}
