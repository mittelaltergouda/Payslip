import type { SessionInput, PayslipResult, DistributionMode } from './types';
import { calculatePayslip } from './calc';

/**
 * Preview result for a single distribution mode.
 */
export type ModePreviewResult = {
  mode: DistributionMode;
  result: PayslipResult | null;
  error: string | null;
};

/**
 * Preview results for all three distribution modes.
 */
export type ModePreviews = {
  EQUAL: ModePreviewResult;
  PERCENT: ModePreviewResult;
  ADJUSTABLE: ModePreviewResult;
};

/**
 * Calculates preview payslips for all three distribution modes.
 *
 * This is a pure function that can be called speculatively without side effects.
 * For each mode, it creates a modified session input with that mode and calls
 * calculatePayslip. If a mode fails validation, the error is captured in the result.
 *
 * @param session - The current session input
 * @returns Preview results for all three modes (EQUAL, PERCENT, ADJUSTABLE)
 *
 * @example
 * ```ts
 * const session: SessionInput = {
 *   name: "Mining Op",
 *   type: "MINING",
 *   distributionMode: "EQUAL",
 *   members: [
 *     { handle: "Alice", revenue: 1000 },
 *     { handle: "Bob", revenue: 500 }
 *   ]
 * };
 *
 * const previews = calculateModePreviews(session);
 * console.log(previews.EQUAL.result?.netProfit);
 * console.log(previews.PERCENT.error); // May have error if percentShares not set
 * ```
 */
export function calculateModePreviews(session: SessionInput): ModePreviews {
  const modes: DistributionMode[] = ['EQUAL', 'PERCENT', 'ADJUSTABLE'];

  const results: Partial<ModePreviews> = {};

  for (const mode of modes) {
    try {
      // Create a modified session with this distribution mode
      const sessionWithMode: SessionInput = {
        ...session,
        distributionMode: mode,
      };

      // Calculate payslip for this mode
      const result = calculatePayslip(sessionWithMode);

      results[mode] = {
        mode,
        result,
        error: null,
      };
    } catch (err) {
      // Capture validation errors (e.g., PERCENT mode without valid percentShares)
      results[mode] = {
        mode,
        result: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return results as ModePreviews;
}
