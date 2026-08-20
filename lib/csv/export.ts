// ============================================================================
// CSV GENERATOR UTILITY
// ============================================================================
// This module provides CSV generation functionality for payslip sessions.
// It creates a unified CSV document with session details, member breakdowns,
// and settlement transfers in a locale-appropriate format.

import type { SessionInput, PayslipResult } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { format } from "@/lib/format";

/**
 * CSV generation options for customizing output format and styling.
 */
export interface CSVGeneratorOptions {
  /**
   * Language for number formatting and locale-specific separators.
   * - "de": Uses semicolon as delimiter, dot as thousand separator
   * - "en": Uses comma as delimiter, comma as thousand separator
   * Default: "en"
   */
  lang?: Lang;

  /**
   * Currency symbol or code to display with amounts.
   * Default: "aUEC"
   */
  currency?: string;
}

/**
 * Translations for CSV headers in German and English.
 */
const csvTranslations = {
  de: {
    exportTitle: "SC Payslip Export",
    session: "Session",
    date: "Datum",
    currency: "Währung",
    memberBreakdown: "Mitglieder Übersicht",
    handle: "Handle",
    revenue: "Umsatz",
    investment: "Investment",
    expenses: "Ausgaben",
    taxes: "Steuern",
    profitShare: "Gewinnanteil",
    netPayout: "Netto Auszahlung",
    settlementTransfers: "Überweisungen",
    from: "Von",
    to: "An",
    netAmount: "Überweisungsbetrag",
    grossAmount: "Gesamtbelastung",
    fee: "Gebühr",
    noTransfers: "Keine Überweisungen erforderlich",
  },
  en: {
    exportTitle: "SC Payslip Export",
    session: "Session",
    date: "Date",
    currency: "Currency",
    memberBreakdown: "Member Breakdown",
    handle: "Handle",
    revenue: "Revenue",
    investment: "Investment",
    expenses: "Expenses",
    taxes: "Taxes",
    profitShare: "Profit Share",
    netPayout: "Net Payout",
    settlementTransfers: "Settlement Transfers",
    from: "From",
    to: "To",
    netAmount: "Amount to Send",
    grossAmount: "Total Charged",
    fee: "Fee",
    noTransfers: "No transfers required",
  },
};

/**
 * Escapes a CSV field value according to RFC 4180.
 * - Wraps field in double quotes if it contains delimiter, newline, or double quote
 * - Escapes internal double quotes by doubling them
 *
 * @param value - The field value to escape
 * @param delimiter - The CSV delimiter being used (comma or semicolon)
 * @returns Properly escaped CSV field value
 *
 * @example
 * ```ts
 * escapeCSVField('simple', ',') // 'simple'
 * escapeCSVField('Hello, World', ',') // '"Hello, World"'
 * escapeCSVField('He said "Hi"', ',') // '"He said ""Hi"""'
 * escapeCSVField('Value;here', ';') // '"Value;here"'
 * ```
 */
function escapeCSVField(
  value: string | number | undefined | null,
  delimiter: string
): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return "";
  }

  // Convert to string
  const str = String(value);

  // Check if escaping is needed (contains delimiter, newline, or double quote)
  const needsEscaping =
    str.includes(delimiter) || str.includes('"') || /[\n\r]/.test(str);

  if (needsEscaping) {
    // Escape double quotes by doubling them and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts an array of rows into CSV format with the specified delimiter.
 *
 * @param rows - Array of rows, where each row is an array of field values
 * @param delimiter - The delimiter to use between fields
 * @returns CSV-formatted string
 */
function rowsToCSV(
  rows: (string | number | undefined | null)[][],
  delimiter: string
): string {
  return rows
    .map((row) => row.map((field) => escapeCSVField(field, delimiter)).join(delimiter))
    .join("\n");
}

/**
 * Generates a CSV document from session and result data.
 *
 * Creates a unified CSV document containing:
 * - Session header with name, date, and currency
 * - Member breakdown table showing handle, revenue, investment, expenses, taxes, profit share, and net payout
 * - Settlement transfers list with from/to member details and amounts (net, gross, fees)
 *
 * The CSV format adapts based on locale:
 * - German (de): Uses semicolon as delimiter, periods for thousand separators
 * - English (en): Uses comma as delimiter, commas for thousand separators
 *
 * @param session - The session input data containing member and expense information
 * @param result - The calculated payslip result with member breakdowns and transfers
 * @param options - Optional configuration for language and currency formatting
 * @returns A string containing the generated CSV document
 *
 * @example
 * ```tsx
 * const session: SessionInput = {
 *   name: "Mining Operation Alpha",
 *   type: "MINING",
 *   members: [...],
 *   // ...other session data
 * };
 * const result = calculatePayslip(session);
 * const csvContent = generateCSV(session, result, { lang: 'en', currency: 'aUEC' });
 *
 * // Download the CSV
 * const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
 * const url = URL.createObjectURL(blob);
 * const link = document.createElement('a');
 * link.href = url;
 * link.download = 'payslip.csv';
 * link.click();
 * URL.revokeObjectURL(url);
 * ```
 */
export function generateCSV(
  session: SessionInput,
  result: PayslipResult,
  options: CSVGeneratorOptions = {}
): string {
  const { lang = "en", currency = "aUEC" } = options;

  // Select delimiter based on locale (German uses semicolon, English uses comma)
  const delimiter = lang === "de" ? ";" : ",";

  // Get translations for the selected language
  const t = csvTranslations[lang];

  // Format date according to locale
  const exportDate = new Date().toLocaleDateString(
    lang === "de" ? "de-DE" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // Calculate fees per member for display
  const feeByPayer: Record<string, number> = {};
  result.suggestedTransfers.forEach((transfer) => {
    feeByPayer[transfer.fromMemberId] =
      (feeByPayer[transfer.fromMemberId] || 0) + transfer.feeAmount;
  });

  // Build CSV rows
  const rows: (string | number | undefined | null)[][] = [];

  // ========================================================================
  // HEADER SECTION
  // ========================================================================
  rows.push([t.exportTitle]);
  rows.push([`${t.session}:`, session.name || "Payslip"]);
  rows.push([`${t.date}:`, exportDate]);
  rows.push([`${t.currency}:`, currency]);
  rows.push([]); // Empty row for spacing

  // ========================================================================
  // MEMBER BREAKDOWN TABLE
  // ========================================================================
  rows.push([t.memberBreakdown]);
  rows.push([
    t.handle,
    t.revenue,
    t.investment,
    t.expenses,
    t.taxes,
    t.profitShare,
    t.netPayout,
  ]);

  // Add member rows
  for (const member of result.members) {
    const taxes = feeByPayer[member.memberId] ?? 0;
    const netAfterFees = member.finalNet - taxes;

    rows.push([
      member.handle,
      format(member.revenue, lang),
      format(member.investment, lang),
      format(member.expenses, lang),
      format(taxes, lang),
      format(member.profitShare, lang),
      format(netAfterFees, lang),
    ]);
  }

  rows.push([]); // Empty row for spacing

  // ========================================================================
  // SETTLEMENT TRANSFERS SECTION
  // ========================================================================
  rows.push([t.settlementTransfers]);

  if (result.suggestedTransfers.length === 0) {
    rows.push([t.noTransfers]);
  } else {
    rows.push([t.from, t.to, t.netAmount, t.grossAmount, t.fee]);

    for (const transfer of result.suggestedTransfers) {
      // Find member handles by ID
      const fromMember = session.members.find(
        (m) => m.id === transfer.fromMemberId
      );
      const toMember = session.members.find(
        (m) => m.id === transfer.toMemberId
      );

      const fromHandle = fromMember?.handle || transfer.fromMemberId;
      const toHandle = toMember?.handle || transfer.toMemberId;

      rows.push([
        fromHandle,
        toHandle,
        format(transfer.netAmount, lang),
        format(transfer.grossAmount, lang),
        format(transfer.feeAmount, lang),
      ]);
    }
  }

  return rowsToCSV(rows, delimiter);
}

/**
 * Generates a filename for the CSV export based on session name and current date.
 *
 * Creates a URL-safe filename in the format: "sessionname-YYYY-MM-DD.csv"
 * - Converts session name to lowercase
 * - Replaces spaces and special characters with hyphens
 * - Appends ISO date format (YYYY-MM-DD)
 * - Adds .csv extension
 *
 * @param sessionName - The name of the session to include in the filename
 * @returns A sanitized filename string suitable for download
 *
 * @example
 * ```tsx
 * generateCSVFilename("Mining Operation Alpha")
 * // Returns: "mining-operation-alpha-2026-02-03.csv"
 *
 * generateCSVFilename("Trade Run #1")
 * // Returns: "trade-run-1-2026-02-03.csv"
 * ```
 */
export function generateCSVFilename(sessionName: string): string {
  const sanitizedName = sessionName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  return `${sanitizedName}-${date}.csv`;
}
