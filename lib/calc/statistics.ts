/**
 * Summary statistics module.
 *
 * This module calculates aggregate summary statistics from member breakdowns
 * and settlement transfers. It provides high-level metrics about the session:
 * - Payout distribution (min/max/average)
 * - Transfer metrics (count, largest transfer)
 * - Top earners (highest and lowest earning members)
 *
 * These statistics are useful for displaying session summaries and identifying
 * outliers or interesting patterns in the payout distribution.
 *
 * @module lib/calc/statistics
 */

import type { MemberBreakdown, Transfer, SummaryStatistics } from '../types';

// ============================================================================
// SUMMARY STATISTICS CALCULATION
// ============================================================================

/**
 * Calculates aggregate summary statistics from member breakdowns and transfers.
 *
 * Computes:
 * - Min/max/average payout (based on finalNet)
 * - Total number of transfers and largest single transfer
 * - Members with highest and lowest earnings
 *
 * @param members - Array of member breakdowns with finalNet calculated
 * @param transfers - Array of settlement transfers
 * @returns SummaryStatistics object with aggregate metrics
 */
export function calculateSummaryStatistics(
  members: MemberBreakdown[],
  transfers: Transfer[]
): SummaryStatistics {
  // Handle empty members array - should not happen in normal flow but be defensive
  if (members.length === 0) {
    return {
      minPayout: 0,
      maxPayout: 0,
      averagePayout: 0,
      totalTransfers: 0,
      largestTransfer: 0,
      highestEarner: '',
      lowestEarner: '',
    };
  }

  // Extract finalNet values for all members
  const finalNets = members.map((m) => m.finalNet);

  // Calculate min/max/average payout
  const minPayout = Math.min(...finalNets);
  const maxPayout = Math.max(...finalNets);
  const averagePayout = finalNets.reduce((sum, val) => sum + val, 0) / members.length;

  // Find member handles for highest and lowest earners
  // In case of ties, we pick the first one found
  const highestEarner = members.find((m) => m.finalNet === maxPayout)?.handle ?? '';
  const lowestEarner = members.find((m) => m.finalNet === minPayout)?.handle ?? '';

  // Calculate transfer statistics
  const totalTransfers = transfers.length;
  const largestTransfer = transfers.length > 0
    ? Math.max(...transfers.map((t) => t.netAmount))
    : 0;

  return {
    minPayout,
    maxPayout,
    averagePayout,
    totalTransfers,
    largestTransfer,
    highestEarner,
    lowestEarner,
  };
}
