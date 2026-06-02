/**
 * Input normalization module.
 *
 * This module normalizes raw session inputs by applying default values to all
 * optional fields. This ensures downstream calculation logic can work with
 * guaranteed non-null values, simplifying the codebase and reducing edge cases.
 *
 * Default values applied:
 * - Member IDs: auto-generated if not provided
 * - Member active status: true
 * - Revenue/investment: 0
 * - Session currency: 'aUEC'
 * - Tax settings: disabled by default
 * - Expenses: empty arrays
 *
 * @module lib/calc/normalization
 */

import type {
  SessionInput,
  MemberInput,
} from '../types';
import type {
  NormalizedMember,
  NormalizedSessionInput,
} from './types';

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
