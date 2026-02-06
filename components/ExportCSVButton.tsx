"use client";

import { useState } from "react";
import { generateCSV, generateCSVFilename } from "@/lib/csv/export";
import type { SessionInput, PayslipResult } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";

/**
 * Props for the ExportCSVButton component
 */
type ExportCSVButtonProps = {
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
   * Currency symbol to display in the CSV (default: "aUEC")
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
    exportCSV: "CSV exportieren",
    exportCSVTooltip: "Payslip als CSV herunterladen",
    csvGenerating: "CSV wird erstellt...",
  },
  en: {
    exportCSV: "Export CSV",
    exportCSVTooltip: "Download payslip as CSV",
    csvGenerating: "Generating CSV...",
  },
};

/**
 * ExportCSVButton Component
 *
 * Provides CSV export functionality for payslip data.
 * - Generates a CSV file with session details, member breakdown, and transfers
 * - Downloads the CSV with a filename based on session name and date
 * - Displays loading state during CSV generation
 * - Handles errors gracefully with optional callbacks
 *
 * Follows the glassmorphism design pattern from the existing codebase.
 *
 * @example
 * ```tsx
 * <ExportCSVButton
 *   session={session}
 *   result={result}
 *   lang="en"
 *   currency="aUEC"
 *   onExportSuccess={() => console.log("CSV exported")}
 *   onExportError={(error) => console.error(error)}
 * />
 * ```
 */
export function ExportCSVButton({
  session,
  result,
  lang,
  currency = "aUEC",
  onExportSuccess,
  onExportError,
}: ExportCSVButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const t = translations[lang];

  /**
   * Handles the CSV export action.
   * Creates a downloadable CSV file with session and result data.
   */
  const handleExportCSV = () => {
    try {
      setIsGenerating(true);

      // Generate CSV content
      const csvContent = generateCSV(session, result, { lang, currency });

      // Create blob with UTF-8 BOM for Excel compatibility
      const BOM = "\uFEFF";
      const csvBlob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      // Create a download link
      const url = URL.createObjectURL(csvBlob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with session name and date
      link.download = generateCSVFilename(session.name || "payslip");

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Notify success
      if (onExportSuccess) {
        onExportSuccess();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "CSV export failed";
      if (onExportError) {
        onExportError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExportCSV}
      disabled={isGenerating}
      className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md px-4 py-2 text-white/90 hover:bg-white/10 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      title={t.exportCSVTooltip}
      aria-label={t.exportCSVTooltip}
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
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        {isGenerating ? t.csvGenerating : t.exportCSV}
      </span>
    </button>
  );
}
