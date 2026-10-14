"use client";

import type { PayslipResult, SessionInput} from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { SummaryStats } from "./SummaryStats";
import { TransfersList } from "./TransfersList";
import { ExportPDFButton } from "./ExportPDFButton";
import { ExportClipboardButton } from "./ExportClipboardButton";
import { ExportCSVButton } from "./ExportCSVButton";
import { buildArithmeticSections, sessionTotals } from "@/lib/accounting";


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
  // Fees of transfers already made count too, not only the suggested ones.
  const totals = result ? sessionTotals(session, result) : null;
  const totalRevenue = totals?.revenue ?? 0;
  const totalInvestment = totals?.investment ?? 0;
  const totalExpenses = totals?.expenses ?? 0;
  const totalFees = totals?.serviceFees ?? 0;

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
            {/* CSV Export Button */}
            <ExportCSVButton
              session={session}
              result={result}
              lang={lang}
              currency={currency}
            />
          </div>
        )}
      </div>

      {result && (result.fixedAmountsStatus === "SUSPENDED_FOR_LOSS" || result.fixedAmountsStatus === "SCALED_TO_PROFIT") && (
        <p
          role="note"
          className="rounded-xl border border-sky-400/30 bg-sky-400/10 p-4 text-sm text-sky-100"
        >
          {result.fixedAmountsStatus === "SUSPENDED_FOR_LOSS" ? t.fixedAmountsSuspended : t.fixedAmountsScaled}
        </p>
      )}

      {result && <details className="rounded-xl border border-white/10 p-4"><summary className="cursor-pointer font-semibold">{lang === "de" ? "Rechnung nachvollziehen" : "Calculation explained"}</summary><div className="mt-3 space-y-4 text-sm break-words">{buildArithmeticSections(session, result, lang).map((section) => <section key={section.title}><h4 className="font-semibold">{section.title}</h4><ul className="mt-1 space-y-1">{section.lines.map((line, index) => <li key={index}>{line}</li>)}</ul></section>)}</div></details>}

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
