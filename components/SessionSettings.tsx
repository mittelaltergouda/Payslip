"use client";

import { useState } from "react";
import { DistributionMode, SessionInput } from "@/lib/types";
import { ModePreview } from "./ModePreview";
import { ModePreviewResult } from "@/lib/modePreview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Checkbox } from "./ui/checkbox";

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
    <div className={`glass p-6 space-y-4 ${className}`} role="region" aria-labelledby="session-settings-heading">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 id="session-settings-heading" className="text-xl font-display">{t.sessionSettings}</h2>
        <button
          className="btn"
          onClick={onReset}
          aria-label={`${t.reset} ${t.sessionSettings}`}
        >
          {t.reset}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {/* Distribution Mode Select */}
        <div className="flex flex-col gap-1 relative">
          <span className="text-sm text-white/70" id="distribution-mode-label">{t.distribution}</span>
          <div className="relative">
            <Select
              value={session.distributionMode}
              onValueChange={(value) => onDistributionChange(value as DistributionMode)}
            >
              <SelectTrigger aria-labelledby="distribution-mode-label" aria-describedby="distribution-mode-description">
                <SelectValue placeholder={getModeLabel(session.distributionMode)} />
              </SelectTrigger>
              <SelectContent>
                {(["EQUAL", "PERCENT", "ADJUSTABLE"] as DistributionMode[]).map(
                  (mode) => (
                    <SelectItem
                      key={mode}
                      value={mode}
                      onMouseEnter={() => setHoveredMode(mode)}
                      onMouseLeave={() => setHoveredMode(null)}
                    >
                      {getModeLabel(mode)}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

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
          <span className="text-xs text-white/60" id="distribution-mode-description">
            {t.explanation}: {getModeLabel(session.distributionMode)}
          </span>
        </div>

        {/* Tax Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch
            checked={session.taxEnabled ?? true}
            onCheckedChange={handleTaxToggle}
            aria-label={t.taxToggle}
            aria-describedby="tax-toggle-label"
          />
          <span className="text-sm text-white/80" id="tax-toggle-label">{t.taxToggle}</span>
        </label>

        {/* Role Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={showRole}
            onCheckedChange={(checked) => onShowRoleChange(checked === true)}
            aria-label={t.showRole}
            aria-describedby="role-toggle-label"
          />
          <span className="text-sm text-white/80" id="role-toggle-label">{t.showRole}</span>
        </label>
      </div>
    </div>
  );
}
