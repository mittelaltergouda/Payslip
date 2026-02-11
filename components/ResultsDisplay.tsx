"use client";

import type { PayslipResult, SessionInput} from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { SummaryStats } from "./SummaryStats";
import { TransfersList } from "./TransfersList";
import { generateSummaryCSV, generateDetailedCSV, downloadCSV } from "@/lib/csv/export";
import { ExportPDFButton } from "./ExportPDFButton";
import { ExportClipboardButton } from "./ExportClipboardButton";

// CSV export translation strings
const csvTranslations = {
  de: {
    exportSummary: "Zusammenfassung (CSV)",
    exportDetailed: "Detailliert (CSV)",
    exportSummaryTooltip: "Zusammenfassung als CSV herunterladen",
    exportDetailedTooltip: "Detaillierte Daten als CSV herunterladen",
  },
  en: {
    exportSummary: "Summary (CSV)",
    exportDetailed: "Detailed (CSV)",
    exportSummaryTooltip: "Download summary as CSV",
    exportDetailedTooltip: "Download detailed data as CSV",
  },
};

/**
 * Props for the ResultsDisplay component.
 */
export interface ResultsDisplayProps {
  /**
   * The calculated payslip result. Null if there's an error or no calculation yet.
   */
  result: PayslipResult | null;

  /**
   * The current session input data.
   */
  session: SessionInput;

  /**
   * Error message to display if calculation failed.
   */
  error: string | null;

  /**
   * Translation strings object for the current language.
   */
  translations: Record<string, string>;

  /**
   * Current language (de or en).
   */
  lang: Lang;

  /**
   * Currency symbol to display with amounts (default: "aUEC").
   */
  currency?: string;

  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * ResultsDisplay component displays the complete payout results section including:
 * - Overall summary statistics (revenue, expenses, profit, fees)
 * - Suggested transfers list with fees
 *
 * This component composes SummaryStats and TransfersList components.
 */
export function ResultsDisplay({
  result,
  session,
  error,
  translations: t,
  lang,
  currency = "aUEC",
  className = "",
}: ResultsDisplayProps) {
  const totalRevenue = session.members.reduce((sum, m) => sum + (m.revenue ?? 0), 0);
  const totalInvestment = session.members.reduce((sum, m) => sum + (m.investment ?? 0), 0);
  const totalExpenses = result?.members.reduce((sum, m) => sum + m.expenses, 0) ?? 0;
  const totalFees = result?.suggestedTransfers.reduce((sum, tr) => sum + tr.feeAmount, 0) ?? 0;

  const csvT = csvTranslations[lang];

  /**
   * Handles the summary CSV export.
   * Creates a downloadable CSV file with one row per member.
   */
  const handleExportSummary = () => {
    if (!result) {
      return;
    }

    try {
      const sessionName = session.name || "Untitled Session";
      const csvContent = generateSummaryCSV(result, sessionName, currency);
      downloadCSV(csvContent, "sc-payslip-summary");
    } catch (error) {
      console.error("Failed to export summary CSV:", error);
    }
  };

  /**
   * Handles the detailed CSV export.
   * Creates a downloadable CSV file with all expenses broken out.
   */
  const handleExportDetailed = () => {
    if (!result) {
      return;
    }

    try {
      const sessionName = session.name || "Untitled Session";
      const csvContent = generateDetailedCSV(result, sessionName, currency);
      downloadCSV(csvContent, "sc-payslip-detailed");
    } catch (error) {
      console.error("Failed to export detailed CSV:", error);
    }
  };

  // Empty state: no revenue entered yet
  const hasRevenue = session.members.some(m => (m.revenue ?? 0) > 0);

  if (!hasRevenue && !error) {
    return (
      <div className={`glass p-6 space-y-4 ${className}`}>
        <h3 className="text-xl font-display">{t.results}</h3>
        <div className="glass p-8 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-white/60 text-lg">{t.noResultsYet || "No results yet"}</p>
          <p className="text-white/40 text-sm mt-2">{t.noResultsDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-display">{t.results}</h3>
          {error && <span className="text-red-400 text-sm">{error}</span>}
        </div>
        {result && (
          <div className="flex items-center gap-3 flex-wrap">
            {/* PDF Export Button */}
            <ExportPDFButton
              session={session}
              result={result}
              lang={lang}
              currency={currency}
            />
            {/* Clipboard Export Button */}
            <ExportClipboardButton
              session={session}
              result={result}
              lang={lang}
              currency={currency}
            />
            {/* Summary CSV Export Button */}
            <button
              type="button"
              onClick={handleExportSummary}
              className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md px-4 py-2 text-white/90 hover:bg-white/10 transition-colors text-sm font-medium"
              title={csvT.exportSummaryTooltip}
              aria-label={csvT.exportSummaryTooltip}
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {csvT.exportSummary}
              </span>
            </button>
            {/* Detailed CSV Export Button */}
            <button
              type="button"
              onClick={handleExportDetailed}
              className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md px-4 py-2 text-white/90 hover:bg-white/10 transition-colors text-sm font-medium"
              title={csvT.exportDetailedTooltip}
              aria-label={csvT.exportDetailedTooltip}
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {csvT.exportDetailed}
              </span>
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column: Summary stats */}
          <div className="space-y-4">
            <SummaryStats
              result={result}
              totalRevenue={totalRevenue}
              totalInvestment={totalInvestment}
              totalExpenses={totalExpenses}
              totalFees={totalFees}
              translations={t}
              lang={lang}
              currency={currency}
            />
          </div>

          {/* Right column: Transfers list */}
          <TransfersList
            transfers={result.suggestedTransfers}
            members={session.members}
            translations={t}
            lang={lang}
            currency={currency}
          />
        </div>
      )}
    </div>
  );
}
