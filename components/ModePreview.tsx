"use client";

import * as React from "react";
import type { ModePreviewResult } from "@/lib/modePreview";
import type { DistributionMode } from "@/lib/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
   * Whether the popover should be visible.
   */
  visible: boolean;

  /**
   * Optional trigger element. If provided, wraps content in a proper Popover.
   * If not provided, falls back to legacy absolute positioning mode.
   */
  children?: React.ReactNode;

  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;

  /**
   * Currency symbol to display with amounts (default: "aUEC").
   */
  currency?: string;

  /**
   * Callback when the popover open state changes.
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * ModePreview component displays a popover showing the projected payouts
 * for a specific distribution mode. It appears when hovering or focusing
 * on a distribution mode option.
 *
 * The popover shows:
 * - Mode name
 * - Net profit calculation
 * - Number of members receiving payouts
 * - Sample member payouts
 * - Error message if the mode can't be calculated
 *
 * Features:
 * - Accessible with keyboard navigation (Escape to close)
 * - Smooth animations and transitions
 * - Proper positioning with collision detection
 * - Error state styling with design tokens
 *
 * @example
 * ```tsx
 * const previews = calculateModePreviews(session);
 *
 * // With trigger element (recommended)
 * <ModePreview
 *   mode="EQUAL"
 *   preview={previews.EQUAL}
 *   visible={isOpen}
 *   onOpenChange={setIsOpen}
 *   currency="aUEC"
 * >
 *   <button>Equal Share</button>
 * </ModePreview>
 *
 * // Legacy mode (absolute positioning)
 * <ModePreview
 *   mode="EQUAL"
 *   preview={previews.EQUAL}
 *   visible={isHovering}
 *   currency="aUEC"
 *   className="top-full mt-2"
 * />
 * ```
 */
export function ModePreview({
  mode,
  preview,
  visible,
  children,
  className = "",
  currency = "aUEC",
  onOpenChange,
}: ModePreviewProps) {
  if (!preview) {
    return null;
  }

  const modeName = {
    EQUAL: "Equal Share",
    PERCENT: "Percentage",
    ADJUSTABLE: "Adjustable",
  }[mode];

  // Render content for the popover
  const renderContent = () => {
    // If there's an error, show error state
    if (preview.error || !preview.result) {
      return (
        <>
          <div className="font-semibold text-destructive-foreground mb-1">
            {modeName}
          </div>
          <div className="text-destructive text-xs">
            {preview.error || "Unable to calculate preview"}
          </div>
        </>
      );
    }

    const { result } = preview;
    const activeMembers = result.members.filter((m) => m.finalNet !== 0);

    return (
      <>
        <div className="font-semibold text-foreground mb-2">{modeName}</div>

        <div className="space-y-1 text-xs text-foreground">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Net Profit:</span>
            <span className="font-medium">
              {result.netProfit.toLocaleString()} {currency}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Members:</span>
            <span className="font-medium">{activeMembers.length}</span>
          </div>

          {activeMembers.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border-subtle">
              <div className="text-muted-foreground mb-1">Sample Payouts:</div>
              <div className="space-y-0.5">
                {activeMembers.slice(0, 3).map((member, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-muted-foreground truncate max-w-[120px]">
                      {member.handle}
                    </span>
                    <span className="font-mono">
                      {member.finalNet.toLocaleString()} {currency}
                    </span>
                  </div>
                ))}
                {activeMembers.length > 3 && (
                  <div className="text-muted-foreground text-xs italic opacity-60">
                    +{activeMembers.length - 3} more...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  // If children provided, render as a proper Popover with trigger
  if (children) {
    return (
      <Popover open={visible} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          size="sm"
          className={className}
          align="start"
          side="bottom"
        >
          {renderContent()}
        </PopoverContent>
      </Popover>
    );
  }

  // Legacy mode: render as absolutely positioned div for backward compatibility
  if (!visible) {
    return null;
  }

  const errorClass = preview.error || !preview.result
    ? "bg-destructive/10 border-destructive/20"
    : "bg-surface-elevated border-border-default";

  return (
    <div
      className={`
        absolute z-50 mt-1 p-3 rounded-lg shadow-lg
        ${errorClass}
        text-sm max-w-xs
        ${className}
      `}
      role="tooltip"
      aria-live="polite"
    >
      {renderContent()}
    </div>
  );
}
