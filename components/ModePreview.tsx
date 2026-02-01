"use client";

import { ModePreviewResult } from "@/lib/modePreview";
import { DistributionMode } from "@/lib/types";

/**
 * Props for the ModePreview component.
 */
export interface ModePreviewProps {
  /**
   * The distribution mode being previewed (EQUAL, PERCENT, or ADJUSTABLE).
   */
  mode: DistributionMode;

  /**
   * The preview result data for this mode, or null if not yet calculated.
   */
  preview: ModePreviewResult | null;

  /**
   * Whether the tooltip should be visible.
   */
  visible: boolean;

  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;

  /**
   * Currency symbol to display with amounts (default: "aUEC").
   */
  currency?: string;
}

/**
 * ModePreview component displays a tooltip showing the projected payouts
 * for a specific distribution mode. It appears when hovering or focusing
 * on a distribution mode option.
 *
 * The tooltip shows:
 * - Mode name
 * - Net profit calculation
 * - Number of members receiving payouts
 * - Error message if the mode can't be calculated
 *
 * @example
 * ```tsx
 * const previews = calculateModePreviews(session);
 *
 * <ModePreview
 *   mode="EQUAL"
 *   preview={previews.EQUAL}
 *   visible={isHovering}
 *   currency="aUEC"
 * />
 * ```
 */
export function ModePreview({
  mode,
  preview,
  visible,
  className = "",
  currency = "aUEC",
}: ModePreviewProps) {
  if (!visible || !preview) {
    return null;
  }

  const modeName = {
    EQUAL: "Equal Share",
    PERCENT: "Percentage",
    ADJUSTABLE: "Adjustable",
  }[mode];

  // If there's an error, show error state
  if (preview.error || !preview.result) {
    return (
      <div
        className={`
          absolute z-50 mt-1 p-3 rounded-lg shadow-lg
          bg-red-50 border border-red-200
          text-sm max-w-xs
          ${className}
        `}
        role="tooltip"
        aria-live="polite"
      >
        <div className="font-semibold text-red-800 mb-1">{modeName}</div>
        <div className="text-red-600 text-xs">
          {preview.error || "Unable to calculate preview"}
        </div>
      </div>
    );
  }

  const { result } = preview;
  const activeMembers = result.members.filter((m) => m.finalNet !== 0);

  return (
    <div
      className={`
        absolute z-50 mt-1 p-3 rounded-lg shadow-lg
        bg-white border border-gray-200
        text-sm max-w-xs
        ${className}
      `}
      role="tooltip"
      aria-live="polite"
    >
      <div className="font-semibold text-gray-800 mb-2">{modeName}</div>

      <div className="space-y-1 text-xs text-gray-700">
        <div className="flex justify-between">
          <span className="text-gray-600">Net Profit:</span>
          <span className="font-medium">
            {result.netProfit.toLocaleString()} {currency}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Members:</span>
          <span className="font-medium">{activeMembers.length}</span>
        </div>

        {activeMembers.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-gray-600 mb-1">Sample Payouts:</div>
            <div className="space-y-0.5">
              {activeMembers.slice(0, 3).map((member, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-gray-500 truncate max-w-[120px]">
                    {member.handle}
                  </span>
                  <span className="font-mono">
                    {member.finalNet.toLocaleString()} {currency}
                  </span>
                </div>
              ))}
              {activeMembers.length > 3 && (
                <div className="text-gray-400 text-xs italic">
                  +{activeMembers.length - 3} more...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
