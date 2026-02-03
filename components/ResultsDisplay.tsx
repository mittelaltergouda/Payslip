"use client";

import type { PayslipResult, SessionInput} from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { SummaryStats } from "./SummaryStats";
import { TransfersList } from "./TransfersList";
import { ExportPDFButton } from "./ExportPDFButton";

/**
 * Format a number according to the specified language locale.
 */
function format(amount: number, lang: Lang): string {
  return Math.round(amount).toLocaleString(lang === "de" ? "de-DE" : "en-US");
}

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
   * Mapping of member IDs to their total transfer fees.
   */
  feeByPayer: Record<string, number>;

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
 * - Detailed member-by-member breakdown table
 * - Suggested transfers list with fees
 *
 * This component composes SummaryStats and TransfersList components and adds
 * the member results table showing individual contributions and final payouts.
 *
 * The member results table displays:
 * - Handle: Member's name
 * - Revenue: Income generated
 * - Investment: Initial capital invested
 * - Expenses: Total expenses with itemized details
 * - Taxes: Transfer fees paid
 * - Profit Share: Calculated share of profit
 * - Net After Fees: Final payout amount (color-coded: green for positive, red for negative)
 *
 * @example
 * ```tsx
 * const result = calculatePayslip(session);
 * const feeByPayer = result.suggestedTransfers.reduce((acc, tr) => {
 *   acc[tr.fromMemberId] = (acc[tr.fromMemberId] || 0) + tr.feeAmount;
 *   return acc;
 * }, {});
 *
 * <ResultsDisplay
 *   result={result}
 *   session={session}
 *   feeByPayer={feeByPayer}
 *   error={null}
 *   translations={translations[lang]}
 *   lang={lang}
 *   currency="aUEC"
 * />
 * ```
 */
export function ResultsDisplay({
  result,
  session,
  feeByPayer,
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
          <ExportPDFButton
            session={session}
            result={result}
            lang={lang}
            currency={currency}
          />
        )}
      </div>

      {result && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column: Summary stats and member results table */}
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

            {/* Members results table */}
            <div className="space-y-2">
              <h4 className="font-semibold text-white/80">{t.members}</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-base">
                  <thead className="text-white/60 border-b border-white/10">
                    <tr className="whitespace-nowrap">
                      <th className="py-3 px-3 text-left">{t.handle}</th>
                      <th className="py-3 px-3 text-left">{t.revenueLabel}</th>
                      <th className="py-3 px-3 text-left">{t.investmentLabel}</th>
                      <th className="py-3 px-3 text-left">{t.expensesLabel}</th>
                      <th className="py-3 px-3 text-left">{t.taxesLabel}</th>
                      <th className="py-3 px-3 text-left">{t.profitShareCol}</th>
                      <th className="py-3 px-3 text-left">{t.netAfterFeesCol}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {result.members.map((m) => {
                      const taxes = feeByPayer[m.memberId] ?? 0;
                      const net = m.finalNet - taxes;
                      const memberExp =
                        session.individualExpenses
                          ?.filter((e) => e.memberId === m.memberId)
                          .map((e) => `${e.label}: ${format(e.amount, lang)}`)
                          .join(" • ") || "-";

                      return (
                        <tr key={m.memberId}>
                          <td className="py-3 px-3">{m.handle}</td>
                          <td className="py-3 px-3">{format(m.revenue, lang)}</td>
                          <td className="py-3 px-3">{format(m.investment, lang)}</td>
                          <td className="py-3 px-3">
                            {format(m.expenses, lang)}
                            <div className="text-xs text-white/60">{memberExp}</div>
                          </td>
                          <td className="py-3 px-3">{format(taxes, lang)}</td>
                          <td className="py-3 px-3">{format(m.profitShare, lang)}</td>
                          <td className="py-3 px-3 font-semibold">
                            <span className={net >= 0 ? "text-neon" : "text-red-400"}>
                              {format(net, lang)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
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
