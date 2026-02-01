/**
 * Profit distribution module.
 *
 * This module handles the distribution of net profit among active crew members
 * based on the selected distribution mode:
 * - EQUAL: Divides profit equally among all active members
 * - PERCENT: Distributes according to percentage shares (must sum to 100%)
 * - ADJUSTABLE: Supports fixed payouts, fixed bonuses, and flexible percentages
 *
 * The ADJUSTABLE mode provides the most flexibility, allowing for:
 * - Fixed payouts that bypass the profit pool entirely
 * - Fixed bonuses added on top of base shares
 * - Optional percentage-based distribution for remaining pool
 * - Equal distribution fallback if no percentages specified
 *
 * @module lib/calc/distribution
 */

import { DistributionMode } from '../types';
import { NormalizedMember } from './types';

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
