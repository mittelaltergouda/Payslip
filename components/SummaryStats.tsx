"use client";

import type { PayslipResult } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";

/**
 * Format a number according to the specified language locale.
 */
function format(amount: number, lang: Lang): string {
  return Math.round(amount).toLocaleString(lang === "de" ? "de-DE" : "en-US");
}

/**
 * Props for the SummaryStats component.
 */
export interface SummaryStatsProps {
  /**
   * The calculated payslip result containing net profit.
   */
  result: PayslipResult;

  /**
   * Total revenue from all members.
   */
  totalRevenue: number;

  /**
   * Total investment from all members.
   */
  totalInvestment: number;

  /**
   * Total expenses (shared and individual).
   */
  totalExpenses: number;

  /**
   * Total transfer fees/taxes.
   */
  totalFees: number;

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
 * SummaryStats component displays the overall session summary including:
 * - Revenue, Investment, Expenses, Net Profit, Taxes, and Net Profit After Tax
 *
 * The Net Profit After Tax is color-coded: green (neon) for positive values, red for negative.
 *
 * @example
 * ```tsx
 * const result = calculatePayslip(session);
 * const totalRevenue = session.members.reduce((sum, m) => sum + (m.revenue || 0), 0);
 * const totalInvestment = session.members.reduce((sum, m) => sum + (m.investment || 0), 0);
 * const totalExpenses = calculateTotalExpenses(session);
 * const totalFees = calculateTotalFees(result);
 *
 * <SummaryStats
 *   result={result}
 *   totalRevenue={totalRevenue}
 *   totalInvestment={totalInvestment}
 *   totalExpenses={totalExpenses}
 *   totalFees={totalFees}
 *   translations={t}
 *   lang={lang}
 *   currency="aUEC"
 * />
 * ```
 */
export function SummaryStats({
  result,
  totalRevenue,
  totalInvestment,
  totalExpenses,
  totalFees,
  translations: t,
  lang,
  currency = "aUEC",
  className = "",
}: SummaryStatsProps) {
  const netAfterTax = totalRevenue - totalInvestment - totalExpenses - totalFees;

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="font-semibold text-white/80">{t.summary}</h4>
      <div
        className="grid grid-cols-2 gap-3 text-sm"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={t.summary || "Summary statistics"}
      >
        <span className="text-white/70">{t.revenueLabel}</span>
        <span>{format(totalRevenue, lang)} {currency}</span>
        <span className="text-white/70">{t.investmentLabel}</span>
        <span>{format(totalInvestment, lang)} {currency}</span>
        <span className="text-white/70">{t.expensesLabel}</span>
        <span>{format(totalExpenses, lang)} {currency}</span>
        <span className="text-white/70">{t.netProfit}</span>
        <span>{format(result.netProfit, lang)} {currency}</span>
        <span className="text-white/70">{t.taxesLabel}</span>
        <span>{format(totalFees, lang)} {currency}</span>
        <span className="text-white/70">{t.netProfitLabel}</span>
        <span className={netAfterTax >= 0 ? "text-neon font-semibold" : "text-red-400 font-semibold"}>
          {format(netAfterTax, lang)} {currency}
        </span>
      </div>
    </div>
  );
}
