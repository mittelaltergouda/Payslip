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
// PLACEHOLDER FOR MAIN CALCULATION (to be implemented in subsequent subtasks)
// ============================================================================

/**
 * Main entry point for payslip calculation.
 * Validates input, normalizes data, computes distribution, and generates transfers.
 *
 * @param session - The session input with members, expenses, and configuration
 * @returns PayslipResult with member breakdowns and suggested transfers
 * @throws Error if validation fails
 *
 * TODO: Full implementation in subtask-1-5
 */
export function calculatePayslip(session: SessionInput): PayslipResult {
  // Step 1: Validate raw input
  validateSessionInput(session);

  // Step 2: Normalize input
  const normalized = normalizeSessionInput(session);

  // Step 3: Validate normalized data
  validateNormalizedSession(normalized);

  // Placeholder implementation - returns basic structure
  // Full implementation will be completed in subsequent subtasks
  const activeMembers = normalized.members.filter((m) => m.active);

  // Calculate total revenue from members or use provided totalRevenue
  const totalRevenue =
    normalized.totalRevenue ??
    normalized.members.reduce((sum, m) => sum + m.revenue, 0);

  // Calculate total investments
  const totalInvestments = normalized.members.reduce(
    (sum, m) => sum + m.investment,
    0
  );

  // saleRevenue = totalRevenue - totalInvestments
  const saleRevenue = totalRevenue - totalInvestments;

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

  // Net profit = saleRevenue - expenses
  const netProfit = saleRevenue - totalExpenses;

  // Placeholder member breakdowns (equal distribution for now)
  const profitPerMember =
    activeMembers.length > 0 ? netProfit / activeMembers.length : 0;

  const memberBreakdowns: MemberBreakdown[] = normalized.members.map((m) => {
    // Calculate this member's share of shared expenses
    const memberSharedExpenses =
      m.active && activeMembers.length > 0
        ? totalSharedExpenses / activeMembers.length
        : 0;

    // Calculate this member's individual expenses
    const memberIndividualExpenses = normalized.individualExpenses
      .filter((e) => e.memberId === m.id)
      .reduce((sum, e) => sum + e.amount, 0);

    const memberTotalExpenses = memberSharedExpenses + memberIndividualExpenses;
    const profitShare = m.active ? profitPerMember : 0;
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

  return {
    saleRevenue,
    netProfit,
    taxRateApplied: normalized.taxEnabled ? normalized.taxRate : 0,
    members: memberBreakdowns,
    suggestedTransfers: [], // To be implemented in subtask-1-3
  };
}
