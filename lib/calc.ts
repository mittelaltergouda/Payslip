import {
  SessionInput,
  MemberInput,
  MemberBreakdown,
  PayslipResult,
  Transfer,
  DistributionMode,
  SharedExpenseInput,
  IndividualExpenseInput,
} from './types';

// Re-export types for external use
export type { SessionInput, PayslipResult, MemberBreakdown, Transfer };

// ============================================================================
// INTERNAL TYPES
// ============================================================================

/**
 * Normalized member with all fields guaranteed to have values.
 * Used internally after input normalization.
 */
export type NormalizedMember = {
  id: string;
  handle: string;
  role: string;
  active: boolean;
  revenue: number;
  investment: number;
  percentShare: number | null;
  fixedBonus: number | null;
  fixedPayout: number | null;
};

/**
 * Normalized session input with all optional fields resolved to defaults.
 */
export type NormalizedSessionInput = {
  id: string;
  name: string;
  type: string;
  currency: string;
  totalRevenue: number | null;
  distributionMode: DistributionMode;
  taxEnabled: boolean;
  taxRate: number;
  members: NormalizedMember[];
  sharedExpenses: SharedExpenseInput[];
  individualExpenses: IndividualExpenseInput[];
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates that the session has at least one active member.
 *
 * @param members - Array of normalized members to validate
 * @throws Error if no active members are present
 */
export function validateHasActiveMembers(members: NormalizedMember[]): void {
  const activeMembers = members.filter((m) => m.active);
  if (activeMembers.length === 0) {
    throw new Error(
      'Session must have at least one active member to calculate payslip'
    );
  }
}

/**
 * Validates that percent shares sum to exactly 100% in PERCENT mode.
 * Only validates active members with non-null percentShare values.
 *
 * @param members - Array of normalized members to validate
 * @param mode - Distribution mode to check if validation is needed
 * @throws Error if percentShares don't sum to 100% (within tolerance)
 */
export function validatePercentShares(
  members: NormalizedMember[],
  mode: DistributionMode
): void {
  if (mode !== 'PERCENT') return;

  const activeMembers = members.filter((m) => m.active);
  const totalPercent = activeMembers.reduce((sum, m) => {
    return sum + (m.percentShare ?? 0);
  }, 0);

  // Use small epsilon for floating point comparison
  const EPSILON = 0.0001;
  if (Math.abs(totalPercent - 100) > EPSILON) {
    throw new Error(
      `PERCENT mode requires percentShares to sum to 100%, but got ${totalPercent.toFixed(2)}%`
    );
  }
}

/**
 * Validates that all members have non-empty handles.
 *
 * @param members - Array of member inputs to validate
 * @throws Error if any member has empty or whitespace-only handle
 */
export function validateMemberHandles(members: MemberInput[]): void {
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (!member.handle || member.handle.trim() === '') {
      throw new Error(
        `Member at index ${i} has an empty or whitespace-only handle`
      );
    }
  }
}

/**
 * Validates that numeric values are not negative where they shouldn't be.
 *
 * @param session - The session input to validate
 * @throws Error if revenue, investment, or expense amounts are negative
 */
export function validateNonNegativeValues(session: SessionInput): void {
  // Validate member values
  for (const member of session.members) {
    if (member.revenue !== undefined && member.revenue < 0) {
      throw new Error(
        `Member "${member.handle}" has negative revenue: ${member.revenue}`
      );
    }
    if (member.investment !== undefined && member.investment < 0) {
      throw new Error(
        `Member "${member.handle}" has negative investment: ${member.investment}`
      );
    }
  }

  // Validate shared expenses
  if (session.sharedExpenses) {
    for (const expense of session.sharedExpenses) {
      if (expense.amount < 0) {
        throw new Error(
          `Shared expense "${expense.label}" has negative amount: ${expense.amount}`
        );
      }
    }
  }

  // Validate individual expenses
  if (session.individualExpenses) {
    for (const expense of session.individualExpenses) {
      if (expense.amount < 0) {
        throw new Error(
          `Individual expense "${expense.label}" has negative amount: ${expense.amount}`
        );
      }
    }
  }
}

/**
 * Validates tax rate is within valid bounds (0 to 1 inclusive).
 *
 * @param taxRate - The tax rate to validate (0-1 representing 0-100%)
 * @throws Error if tax rate is outside valid bounds
 */
export function validateTaxRate(taxRate: number | undefined): void {
  if (taxRate === undefined) return;
  if (taxRate < 0 || taxRate > 1) {
    throw new Error(
      `Tax rate must be between 0 and 1, but got ${taxRate}`
    );
  }
}

// ============================================================================
// NORMALIZATION HELPERS
// ============================================================================

/**
 * Generates a unique ID for a member if one is not provided.
 * Uses a simple incremental strategy with prefix.
 *
 * @param index - Zero-based index of the member in the input array
 * @returns Generated member ID in format "member-N" where N = index + 1
 */
function generateMemberId(index: number): string {
  return `member-${index + 1}`;
}

/**
 * Normalizes a single member input by applying default values to all optional fields.
 *
 * Defaults:
 * - id: auto-generated based on index
 * - role: empty string
 * - active: true
 * - revenue: 0
 * - investment: 0
 * - percentShare: null
 * - fixedBonus: null
 * - fixedPayout: null
 *
 * @param member - The member input to normalize
 * @param index - Zero-based index for generating member ID if not provided
 * @returns Normalized member with all fields guaranteed to have values
 */
export function normalizeMember(
  member: MemberInput,
  index: number
): NormalizedMember {
  return {
    id: member.id ?? generateMemberId(index),
    handle: member.handle.trim(),
    role: member.role ?? '',
    active: member.active ?? true,
    revenue: member.revenue ?? 0,
    investment: member.investment ?? 0,
    percentShare: member.percentShare ?? null,
    fixedBonus: member.fixedBonus ?? null,
    fixedPayout: member.fixedPayout ?? null,
  };
}

/**
 * Normalizes an array of member inputs by applying defaults to all members.
 * Each member gets an auto-generated ID if not provided.
 *
 * @param members - Array of member inputs
 * @returns Array of normalized members with all fields guaranteed
 */
export function normalizeMembers(members: MemberInput[]): NormalizedMember[] {
  return members.map((member, index) => normalizeMember(member, index));
}

/**
 * Normalizes the entire session input, applying defaults to all optional fields.
 *
 * Defaults:
 * - id: auto-generated UUID-like string
 * - currency: 'aUEC'
 * - totalRevenue: null (will be computed from member revenues)
 * - taxEnabled: false
 * - taxRate: 0
 * - sharedExpenses: empty array
 * - individualExpenses: empty array
 *
 * @param session - The session input to normalize
 * @returns Normalized session with all optional fields resolved to defaults
 */
export function normalizeSessionInput(
  session: SessionInput
): NormalizedSessionInput {
  return {
    id: session.id ?? `session-${Date.now()}`,
    name: session.name,
    type: session.type,
    currency: session.currency ?? 'aUEC',
    totalRevenue: session.totalRevenue ?? null,
    distributionMode: session.distributionMode,
    taxEnabled: session.taxEnabled ?? false,
    taxRate: session.taxRate ?? 0,
    members: normalizeMembers(session.members),
    sharedExpenses: session.sharedExpenses ?? [],
    individualExpenses: session.individualExpenses ?? [],
  };
}

// ============================================================================
// INPUT VALIDATION (combines all validators)
// ============================================================================

/**
 * Validates the entire session input before calculation.
 * Runs all validation checks and throws descriptive errors.
 *
 * @param session - The session input to validate
 * @throws Error with descriptive message if validation fails
 */
export function validateSessionInput(session: SessionInput): void {
  // Validate member handles first (before normalization)
  validateMemberHandles(session.members);

  // Validate non-negative values
  validateNonNegativeValues(session);

  // Validate tax rate
  validateTaxRate(session.taxRate);
}

/**
 * Validates normalized session data (post-normalization checks).
 *
 * @param session - The normalized session to validate
 * @throws Error with descriptive message if validation fails
 */
export function validateNormalizedSession(
  session: NormalizedSessionInput
): void {
  // Validate has active members
  validateHasActiveMembers(session.members);

  // Validate percent shares in PERCENT mode
  validatePercentShares(session.members, session.distributionMode);
}

// ============================================================================
// PROFIT DISTRIBUTION
// ============================================================================

/**
 * Result of profit distribution for a single member.
 */
export type ProfitDistribution = {
  memberId: string;
  profitShare: number;
};

/**
 * Distributes profit equally among all active members.
 * Each active member receives an equal share of the net profit.
 *
 * @param netProfit - Total profit to distribute
 * @param activeMembers - Array of active members to receive profit
 * @returns Array of profit distributions per member
 */
function distributeEqual(
  netProfit: number,
  activeMembers: NormalizedMember[]
): ProfitDistribution[] {
  if (activeMembers.length === 0) {
    return [];
  }

  // Divide total profit equally among all active members
  const sharePerMember = netProfit / activeMembers.length;

  return activeMembers.map((member) => ({
    memberId: member.id,
    profitShare: sharePerMember,
  }));
}

/**
 * Distributes profit according to percentage shares.
 * Each active member receives profit proportional to their percentShare.
 * Validation ensures percentShares sum to 100% before this is called.
 *
 * @param netProfit - Total profit to distribute
 * @param activeMembers - Array of active members with percentShare values
 * @returns Array of profit distributions per member
 */
function distributePercent(
  netProfit: number,
  activeMembers: NormalizedMember[]
): ProfitDistribution[] {
  if (activeMembers.length === 0) {
    return [];
  }

  return activeMembers.map((member) => {
    const percentShare = member.percentShare ?? 0;
    // Convert percentage (0-100) to decimal and multiply by total profit
    const profitShare = (netProfit * percentShare) / 100;

    return {
      memberId: member.id,
      profitShare,
    };
  });
}

/**
 * Distributes profit using the ADJUSTABLE mode:
 * 1. Members with fixedPayout get exactly that amount and are excluded from pool
 * 2. Fixed bonuses are added on top (subtracted from remaining pool)
 * 3. Remaining profit is distributed:
 *    - By percentShare if any member has one set
 *    - Otherwise equally among remaining members
 *
 * @param netProfit - Total profit to distribute
 * @param activeMembers - Array of active members with optional fixedPayout/fixedBonus/percentShare
 * @returns Array of profit distributions per member
 */
function distributeAdjustable(
  netProfit: number,
  activeMembers: NormalizedMember[]
): ProfitDistribution[] {
  if (activeMembers.length === 0) {
    return [];
  }

  const results: ProfitDistribution[] = [];
  let remainingProfit = netProfit;

  // Separate members into two categories:
  // - fixedPayoutMembers: receive exact amount, excluded from profit pool
  // - poolMembers: share remaining profit after fixed payouts
  const fixedPayoutMembers = activeMembers.filter(
    (m) => m.fixedPayout !== null
  );
  const poolMembers = activeMembers.filter((m) => m.fixedPayout === null);

  // Step 1: Allocate fixed payouts
  for (const member of fixedPayoutMembers) {
    const payout = member.fixedPayout ?? 0;
    results.push({
      memberId: member.id,
      profitShare: payout,
    });
    remainingProfit -= payout;
  }

  // Step 2: Subtract fixed bonuses from remaining pool
  // Fixed bonuses are amounts added on top of the base share.
  // We deduct them from the pool first, then distribute the remainder.
  // This ensures bonuses don't dilute the base distribution for other members.
  const totalBonuses = poolMembers.reduce(
    (sum, m) => sum + (m.fixedBonus ?? 0),
    0
  );
  const poolAfterBonuses = remainingProfit - totalBonuses;

  // Step 3: Distribute remaining profit to pool members
  if (poolMembers.length > 0) {
    // Check if any pool member has a percentShare set
    // If so, use percentage-based distribution; otherwise use equal distribution
    const hasPercentShares = poolMembers.some((m) => m.percentShare !== null);

    if (hasPercentShares) {
      // Distribute by percentShare (for members without percentShare, treat as 0)
      // Note: In ADJUSTABLE mode, percentShares don't need to sum to 100%
      // Calculate total percent among pool members for proportional distribution
      const totalPercent = poolMembers.reduce(
        (sum, m) => sum + (m.percentShare ?? 0),
        0
      );

      for (const member of poolMembers) {
        const percentShare = member.percentShare ?? 0;
        const fixedBonus = member.fixedBonus ?? 0;

        // Calculate base share from percentages
        // Use proportional distribution based on each member's share of totalPercent
        let baseShare = 0;
        if (totalPercent > 0) {
          baseShare = (poolAfterBonuses * percentShare) / totalPercent;
        }

        // Add fixed bonus on top of base share
        const profitShare = baseShare + fixedBonus;

        results.push({
          memberId: member.id,
          profitShare,
        });
      }
    } else {
      // No percentShares set - distribute equally among pool members
      const equalShare = poolAfterBonuses / poolMembers.length;

      for (const member of poolMembers) {
        const fixedBonus = member.fixedBonus ?? 0;
        // Each member gets equal share plus their fixed bonus
        const profitShare = equalShare + fixedBonus;

        results.push({
          memberId: member.id,
          profitShare,
        });
      }
    }
  }

  return results;
}

/**
 * Main profit distribution function that routes to the appropriate distribution strategy.
 *
 * Distribution modes:
 * - EQUAL: Divides profit equally among all active members
 * - PERCENT: Distributes according to percentShare values (must sum to 100%)
 * - ADJUSTABLE: Handles fixedPayout, fixedBonus, then distributes remainder
 *
 * @param netProfit - The net profit amount to distribute
 * @param activeMembers - Array of normalized active members
 * @param mode - The distribution mode to use
 * @returns Map of memberId to their profit share amount
 */
export function distributeProfit(
  netProfit: number,
  activeMembers: NormalizedMember[],
  mode: DistributionMode
): Map<string, number> {
  let distributions: ProfitDistribution[];

  // Route to the appropriate distribution strategy based on mode
  switch (mode) {
    case 'EQUAL':
      distributions = distributeEqual(netProfit, activeMembers);
      break;
    case 'PERCENT':
      distributions = distributePercent(netProfit, activeMembers);
      break;
    case 'ADJUSTABLE':
      distributions = distributeAdjustable(netProfit, activeMembers);
      break;
    default:
      // TypeScript exhaustiveness check - ensures all enum values are handled
      const _exhaustive: never = mode;
      throw new Error(`Unknown distribution mode: ${_exhaustive}`);
  }

  // Convert to Map for easy lookup
  const result = new Map<string, number>();
  for (const dist of distributions) {
    result.set(dist.memberId, dist.profitShare);
  }

  return result;
}

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

// ============================================================================
// SHARED EXPENSE ALLOCATION
// ============================================================================

/**
 * Calculates shared expense allocation for each member.
 *
 * Allocation rules:
 * - If participantIds is specified and non-empty, only those members share the expense
 * - Otherwise, all active members share the expense equally
 * - Each expense is divided equally among its participants
 *
 * @param sharedExpenses - Array of shared expense inputs with amounts and optional participants
 * @param members - Array of normalized members
 * @returns Map of memberId to their total shared expense allocation
 */
function allocateSharedExpenses(
  sharedExpenses: SharedExpenseInput[],
  members: NormalizedMember[]
): Map<string, number> {
  const allocation = new Map<string, number>();

  // Initialize all members with 0
  for (const member of members) {
    allocation.set(member.id, 0);
  }

  // Get set of active member IDs for default allocation
  const activeMemberIds = new Set(
    members.filter((m) => m.active).map((m) => m.id)
  );

  for (const expense of sharedExpenses) {
    // Determine participants for this expense
    let participantIds: string[];

    if (expense.participantIds && expense.participantIds.length > 0) {
      // Use specified participants (filter to only include valid member IDs)
      // This allows expenses to be shared among a subset of members
      participantIds = expense.participantIds.filter((id) =>
        members.some((m) => m.id === id)
      );
    } else {
      // Default to all active members if no participants specified
      participantIds = Array.from(activeMemberIds);
    }

    // Skip if no valid participants (e.g., all specified IDs were invalid)
    if (participantIds.length === 0) {
      continue;
    }

    // Allocate expense equally among all participants
    const sharePerParticipant = expense.amount / participantIds.length;

    for (const participantId of participantIds) {
      const current = allocation.get(participantId) ?? 0;
      allocation.set(participantId, current + sharePerParticipant);
    }
  }

  return allocation;
}

/**
 * Calculates individual expense totals for each member.
 * Each expense is assigned to a specific member via memberId.
 *
 * @param individualExpenses - Array of individual expense inputs with memberId and amount
 * @param members - Array of normalized members
 * @returns Map of memberId to their total individual expenses
 */
function allocateIndividualExpenses(
  individualExpenses: IndividualExpenseInput[],
  members: NormalizedMember[]
): Map<string, number> {
  const allocation = new Map<string, number>();

  // Initialize all members with 0
  for (const member of members) {
    allocation.set(member.id, 0);
  }

  // Sum up all individual expenses per member
  for (const expense of individualExpenses) {
    const current = allocation.get(expense.memberId) ?? 0;
    allocation.set(expense.memberId, current + expense.amount);
  }

  return allocation;
}

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
