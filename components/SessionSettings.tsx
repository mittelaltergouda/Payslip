"use client";

import { useState } from "react";
import { DistributionMode, SessionInput } from "@/lib/types";
import { ModePreview } from "./ModePreview";
import { ModePreviewResult } from "@/lib/modePreview";

/**
 * Props for the SessionSettings component.
 */
export interface SessionSettingsProps {
  /**
   * The current session data.
   */
  session: SessionInput;

  /**
   * Callback to update the session with partial updates.
   */
  onSessionUpdate: (updates: Partial<SessionInput>) => void;

  /**
   * Callback to handle distribution mode changes.
   * This includes special logic for PERCENT mode initialization.
   */
  onDistributionChange: (mode: DistributionMode) => void;

  /**
   * Callback to reset the session to initial state.
   */
  onReset: () => void;

  /**
   * Whether to show the role field in the members table.
   */
  showRole: boolean;

  /**
   * Callback to toggle the role field visibility.
   */
  onShowRoleChange: (show: boolean) => void;

  /**
   * Translation strings for the current language.
   */
  translations: Record<string, string>;

  /**
   * Calculated preview results for each distribution mode.
   */
  modePreviews: Record<DistributionMode, ModePreviewResult | null>;

  /**
   * Fixed tax rate to apply when tax is enabled (default: 0.005 for 0.5%).
   */
  taxRate: number;

  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * SessionSettings component displays the session configuration controls:
 * - Distribution mode selector with preview tooltips
 * - Tax calculation toggle
 * - Role field visibility toggle
 * - Reset button to restore initial state
 *
 * The distribution mode dropdown shows a preview of calculated payouts
 * for each mode when hovering over options, helping users understand
 * the impact of their choice before switching.
 *
 * @example
 * ```tsx
 * const modePreviews = useMemo(() => calculateModePreviews(session), [session]);
 *
 * <SessionSettings
 *   session={session}
 *   onSessionUpdate={(updates) => setSession(prev => ({ ...prev, ...updates }))}
 *   onDistributionChange={handleDistributionChange}
 *   onReset={() => setSession(buildInitialSession())}
 *   showRole={showRole}
 *   onShowRoleChange={setShowRole}
 *   translations={translations.de}
 *   modePreviews={modePreviews}
 *   taxRate={0.005}
 * />
 * ```
 */
export function SessionSettings({
  session,
  onSessionUpdate,
  onDistributionChange,
  onReset,
  showRole,
  onShowRoleChange,
  translations: t,
  modePreviews,
  taxRate,
  className = "",
}: SessionSettingsProps) {
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<DistributionMode | null>(null);

  const getModeLabel = (mode: DistributionMode): string => {
    switch (mode) {
      case "EQUAL":
        return t.equal;
      case "PERCENT":
        return t.percent;
      case "ADJUSTABLE":
        return t.adjustable;
    }
  };

  const handleTaxToggle = (checked: boolean) => {
    onSessionUpdate({
      taxEnabled: checked,
      taxRate: taxRate,
    });
  };

  return (
    <div className={`glass p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-display">{t.sessionSettings}</h2>
        <button className="btn" onClick={onReset}>
          {t.reset}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {/* Distribution Mode Dropdown */}
        <div className="flex flex-col gap-1 relative">
          <span className="text-sm text-white/70">{t.distribution}</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
              onBlur={() => {
                // Delay closing to allow click events on options to fire
                setTimeout(() => setIsModeDropdownOpen(false), 200);
              }}
              className="input w-full text-left flex items-center justify-between"
              aria-haspopup="listbox"
              aria-expanded={isModeDropdownOpen}
            >
              <span>{getModeLabel(session.distributionMode)}</span>
              <span className="text-white/50">
                {isModeDropdownOpen ? "▲" : "▼"}
              </span>
            </button>

            {isModeDropdownOpen && (
              <div
                className="absolute z-10 w-full bg-night border border-white/20 rounded-lg mt-1 shadow-lg overflow-hidden"
                role="listbox"
              >
                {(["EQUAL", "PERCENT", "ADJUSTABLE"] as DistributionMode[]).map(
                  (mode) => (
                    <div
                      key={mode}
                      role="option"
                      aria-selected={session.distributionMode === mode}
                      onMouseEnter={() => setHoveredMode(mode)}
                      onMouseLeave={() => setHoveredMode(null)}
                      onClick={() => {
                        onDistributionChange(mode);
                        setIsModeDropdownOpen(false);
                        setHoveredMode(null);
                      }}
                      className={`px-3 py-2 cursor-pointer transition-colors ${
                        session.distributionMode === mode
                          ? "bg-neon/20 text-neon"
                          : "hover:bg-white/10 text-white/80"
                      }`}
                    >
                      {getModeLabel(mode)}
                    </div>
                  )
                )}
              </div>
            )}

            {hoveredMode && hoveredMode !== session.distributionMode && (
              <ModePreview
                mode={hoveredMode}
                preview={modePreviews[hoveredMode]}
                visible={true}
                currency={session.currency}
                className="top-full mt-2"
              />
            )}
          </div>
          <span className="text-xs text-white/60">
            {t.explanation}: {getModeLabel(session.distributionMode)}
          </span>
        </div>

        {/* Tax Toggle */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={session.taxEnabled ?? true}
            onChange={(e) => handleTaxToggle(e.target.checked)}
          />
          <span className="text-sm text-white/80">{t.taxToggle}</span>
        </label>

        {/* Role Toggle */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showRole}
            onChange={(e) => onShowRoleChange(e.target.checked)}
          />
          <span className="text-sm text-white/80">{t.showRole}</span>
        </label>
      </div>
    </div>
  );
}
