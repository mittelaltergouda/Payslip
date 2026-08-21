"use client";

import type { PayslipResult, SessionInput} from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { SummaryStats } from "./SummaryStats";
import { TransfersList } from "./TransfersList";
import { ExportPDFButton } from "./ExportPDFButton";
import { ExportClipboardButton } from "./ExportClipboardButton";
import { ExportCSVButton } from "./ExportCSVButton";
import { format } from "@/lib/format";


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

      {result && (result.unsettledBalances?.length ?? 0) > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100"
        >
          <p className="font-semibold">{t.unsettledBalances}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {result.unsettledBalances?.map((balance) => {
              const member = result.members.find((candidate) => candidate.memberId === balance.memberId);
              const label = balance.amount > 0 ? t.stillToReceive : t.excessRetained;
              return (
                <li key={balance.memberId}>
                  {member?.handle ?? balance.memberId}: {label} {format(Math.abs(balance.amount), lang)} {currency}.
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
