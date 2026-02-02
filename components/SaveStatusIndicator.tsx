"use client";

import { SaveStatus } from "@/hooks/useAutoSave";

type Props = {
  status: SaveStatus;
  error?: string | null;
};

/**
 * SaveStatusIndicator component
 *
 * Displays real-time visual feedback about session save status:
 * - ✓ Saved (green): Changes successfully saved to localStorage
 * - ⏳ Saving (yellow): Save operation in progress
 * - • Unsaved (red): Changes pending, will auto-save in 1 second
 *
 * @param status - Current save status from useAutoSave hook
 * @param error - Optional error message from failed save operation
 *
 * @example
 * ```tsx
 * const { saveStatus, error } = useAutoSave(session);
 * <SaveStatusIndicator status={saveStatus} error={error} />
 * ```
 */
export function SaveStatusIndicator({ status, error }: Props) {
  const config = {
    saved: {
      icon: "✓",
      label: "Saved",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      borderColor: "border-green-400/20",
    },
    saving: {
      icon: "⏳",
      label: "Saving",
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      borderColor: "border-yellow-400/20",
    },
    unsaved: {
      icon: "•",
      label: "Unsaved",
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      borderColor: "border-red-400/20",
    },
  };

  const { icon, label, color, bgColor, borderColor } = config[status];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${bgColor} ${borderColor} transition-all duration-200`}
        title={error || label}
      >
        <span className={`text-sm font-semibold ${color}`}>{icon}</span>
        <span className={`text-xs font-medium ${color}`}>{label}</span>
      </div>
      {error && (
        <span className="text-xs text-red-400/80" title={error}>
          ⚠
        </span>
      )}
    </div>
  );
}
