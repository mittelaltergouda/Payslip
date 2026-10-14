"use client";

import { useState } from "react";
import type { SessionInput, PayslipResult } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { getMemberPayoutSummaries } from "@/lib/export/payoutSummary";

/**
 * Props for the ExportClipboardButton component
 */
type ExportClipboardButtonProps = {
  /**
   * The session input data containing member and expense information
   */
  session: SessionInput;
  /**
   * The calculated payslip result with member breakdowns and transfers
   */
  result: PayslipResult;
  /**
   * Current language for translations and formatting
   */
  lang: Lang;
  /**
   * Currency symbol to display in the export (default: "aUEC")
   */
  currency?: string;
  /**
   * Callback when export succeeds
   */
  onExportSuccess?: () => void;
  /**
   * Callback when export fails
   * @param error - Error message
   */
  onExportError?: (error: string) => void;
};

// Translation strings
const translations = {
  de: {
    exportClipboard: "In Zwischenablage kopieren",
    exportClipboardTooltip: "Payslip-Daten als JSON kopieren",
    clipboardCopying: "Wird kopiert...",
  },
  en: {
    exportClipboard: "Copy to Clipboard",
    exportClipboardTooltip: "Copy payslip data as JSON",
    clipboardCopying: "Copying...",
  },
};

/**
 * ExportClipboardButton Component
 *
 * Provides clipboard export functionality for payslip data.
 * - Copies session and result data as formatted JSON to clipboard
 * - Displays loading state during copy operation
 * - Handles errors gracefully with optional callbacks
 * - Uses the Clipboard API for modern browser support
 *
 * Follows the glassmorphism design pattern from the existing codebase.
 *
 * @example
 * ```tsx
 * <ExportClipboardButton
 *   session={session}
 *   result={result}
 *   lang="en"
 *   currency="aUEC"
 *   onExportSuccess={() => console.log("Copied to clipboard")}
 *   onExportError={(error) => console.error(error)}
 * />
 * ```
 */
export function ExportClipboardButton({
  session,
  result,
  lang,
  currency = "aUEC",
  onExportSuccess,
  onExportError,
}: ExportClipboardButtonProps) {
  const [isCopying, setIsCopying] = useState(false);
  const t = translations[lang];

  /**
   * Handles the clipboard export action.
   * Copies session and result data as formatted JSON to clipboard.
   */
  const handleExportClipboard = async () => {
    try {
      setIsCopying(true);

      // Prepare export data
      const exportData = {
        session,
        result,
        payouts: getMemberPayoutSummaries(result),
        currency,
        exportedAt: new Date().toISOString(),
      };

      // Convert to formatted JSON
      const jsonString = JSON.stringify(exportData, null, 2);

      // Copy to clipboard using Clipboard API
      await navigator.clipboard.writeText(jsonString);

      // Notify success
      if (onExportSuccess) {
        onExportSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Clipboard export failed";
      if (onExportError) {
        onExportError(errorMessage);
      }
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleExportClipboard();
      }}
      disabled={isCopying}
      className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md px-4 py-2 text-white/90 hover:bg-white/10 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      title={t.exportClipboardTooltip}
      aria-label={t.exportClipboardTooltip}
    >
      <span className="flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        {isCopying ? t.clipboardCopying : t.exportClipboard}
      </span>
    </button>
  );
}
