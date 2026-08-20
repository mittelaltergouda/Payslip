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
  // Steps 6-8: Distribute profit and settle balances
  // -------------------------------------------------------------------------
  // Session costs are deducted once before distribution. Each no-fee transfer
  // obligation is then treated as the sender's fixed total budget; the largest
  // possible recipient amount plus its fee is fitted inside that budget.
  const taxRateForTransfers = normalized.taxEnabled ? normalized.taxRate : 0;
  const profitDistribution = distributeProfit(
    netProfit,
    activeMembers,
    normalized.distributionMode
  );

  const memberBreakdowns: MemberBreakdown[] = normalized.members.map((m) => {
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

  const suggestedTransfers = settleBalances(
    memberBreakdowns,
    taxRateForTransfers
  );

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
