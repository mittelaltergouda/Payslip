/**
 * Expense allocation module.
 *
 * This module handles allocation of both shared and individual expenses
 * to crew members. Shared expenses can be split equally among all active
 * members or a specific subset of participants. Individual expenses are
 * directly assigned to specific members.
 *
 * @module lib/calc/expenses
 */

import { SharedExpenseInput, IndividualExpenseInput } from '../types';
import { NormalizedMember } from './types';

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
export function allocateSharedExpenses(
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
export function allocateIndividualExpenses(
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
