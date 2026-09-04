/**
 * Input validation module.
 *
 * This module provides validation functions for session inputs and normalized data.
 * It ensures data integrity before calculations by checking for:
 * - Active members presence
 * - Valid percentage shares (must sum to 100% in PERCENT mode)
 * - Non-negative values for revenue, investment, and expenses
 * - Valid tax rates (0-1 range)
 * - Non-empty member handles
 *
 * @module lib/calc/validation
 */

import type {
  SessionInput,
  MemberInput,
  DistributionMode,
} from '../types';
import type {
  NormalizedMember,
  NormalizedSessionInput,
} from './types';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function assertSafeAuecValue(label: string, value: number | null | undefined): void {
  if (value === undefined || value === null) {return;}
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new Error(`${label} must be within the finite safe integer range, but got ${value}`);
  }
}

/**
 * Validates every aUEC-denominated input before calculations begin.
 */
export function validateSafeAuecValues(session: SessionInput): void {
  assertSafeAuecValue('Total revenue', session.totalRevenue);

  for (const member of session.members) {
    assertSafeAuecValue(`Member "${member.handle}" revenue`, member.revenue);
    assertSafeAuecValue(`Member "${member.handle}" investment`, member.investment);
    assertSafeAuecValue(`Member "${member.handle}" fixed bonus`, member.fixedBonus);
    assertSafeAuecValue(`Member "${member.handle}" fixed payout`, member.fixedPayout);
  }

  for (const expense of session.sharedExpenses ?? []) {
    assertSafeAuecValue(`Shared expense "${expense.label}" amount`, expense.amount);
  }

  for (const expense of session.individualExpenses ?? []) {
    assertSafeAuecValue(`Individual expense "${expense.label}" amount`, expense.amount);
  }
}

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
  if (mode !== 'PERCENT') {return;}

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
 * Validates tax rate is finite and within valid bounds (0 inclusive to 1 exclusive).
 *
 * @param taxRate - The tax rate to validate (0 <= rate < 1)
 * @throws Error if tax rate is outside valid bounds
 */
export function validateTaxRate(taxRate: number | undefined): void {
  if (taxRate === undefined) {return;}
  if (!Number.isFinite(taxRate)) {
    throw new Error(`Tax rate must be finite, but got ${taxRate}`);
  }
  if (taxRate < 0) {
    throw new Error(`Tax rate must be non-negative, but got ${taxRate}`);
  }
  if (taxRate >= 1) {
    throw new Error(`Tax rate must be less than 1, but got ${taxRate}`);
  }
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

  // Reject values JavaScript cannot represent exactly before arithmetic.
  validateSafeAuecValues(session);

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
