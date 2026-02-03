"use client";

import { useState } from "react";
import { generatePDF, generatePDFFilename } from "@/lib/pdf/generator";
import type { SessionInput, PayslipResult } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";

/**
 * Props for the ExportPDFButton component
 */
type ExportPDFButtonProps = {
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
   * Currency symbol to display in the PDF (default: "aUEC")
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
    exportPDF: "PDF exportieren",
    exportPDFTooltip: "Payslip als PDF herunterladen",
    pdfGenerating: "PDF wird erstellt...",
  },
  en: {
    exportPDF: "Export PDF",
    exportPDFTooltip: "Download payslip as PDF",
    pdfGenerating: "Generating PDF...",
  },
};

/**
 * ExportPDFButton Component
 *
 * Provides PDF export functionality for payslip data.
 * - Generates a professionally formatted PDF with session details, member breakdown, and transfers
 * - Downloads the PDF with a filename based on session name and date
 * - Displays loading state during PDF generation
 * - Handles errors gracefully with optional callbacks
 *
 * Follows the glassmorphism design pattern from the existing codebase.
 *
 * @example
 * ```tsx
 * <ExportPDFButton
 *   session={session}
 *   result={result}
 *   lang="en"
 *   currency="aUEC"
 *   onExportSuccess={() => console.log("PDF exported")}
 *   onExportError={(error) => console.error(error)}
 * />
 * ```
 */
export function ExportPDFButton({
  session,
  result,
  lang,
  currency = "aUEC",
  onExportSuccess,
  onExportError,
}: ExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const t = translations[lang];

  /**
   * Handles the PDF export action.
   * Creates a downloadable PDF file with session and result data.
   */
  const handleExportPDF = () => {
    try {
      setIsGenerating(true);

      // Generate PDF blob
      const pdfBlob = generatePDF(session, result, { lang, currency });

      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with session name and date
      link.download = generatePDFFilename(session.name || "payslip");

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
      const errorMessage = error instanceof Error ? error.message : "PDF export failed";
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
      onClick={handleExportPDF}
      disabled={isGenerating}
      className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md px-4 py-2 text-white/90 hover:bg-white/10 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      title={t.exportPDFTooltip}
      aria-label={t.exportPDFTooltip}
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
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        {isGenerating ? t.pdfGenerating : t.exportPDF}
      </span>
    </button>
  );
}
