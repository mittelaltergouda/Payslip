import type { PayslipResult } from "../types";

/**
 * Escapes a CSV field value according to RFC 4180.
 * - Wraps field in double quotes if it contains comma, newline, or double quote
 * - Escapes internal double quotes by doubling them
 *
 * @param value - The field value to escape
 * @returns Properly escaped CSV field value
 *
 * @example
 * ```ts
 * escapeCSVField('simple') // 'simple'
 * escapeCSVField('Hello, World') // '"Hello, World"'
 * escapeCSVField('He said "Hi"') // '"He said ""Hi"""'
 * ```
 */
function escapeCSVField(value: string | number | undefined | null): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return "";
  }

  // Convert to string
  const str = String(value);

  // Check if escaping is needed (contains comma, newline, or double quote)
  const needsEscaping = /[",\n\r]/.test(str);

  if (needsEscaping) {
    // Escape double quotes by doubling them and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts an array of rows into CSV format.
 * Each row is an array of field values.
 *
 * @param rows - Array of rows, where each row is an array of field values
 * @returns CSV-formatted string
 */
function rowsToCSV(rows: (string | number | undefined | null)[][]): string {
  return rows.map((row) => row.map(escapeCSVField).join(",")).join("\n");
}

/**
 * Generates a summary CSV with one row per member and key metrics.
 * Columns: Handle, Role, Active, Revenue, Investment, Total Expenses, Shared Expenses, Individual Expenses, Profit Share, Final Net
 *
 * @param result - The calculated payslip result
 * @param sessionName - Name of the session for the CSV header
 * @param currency - Currency symbol (e.g., "aUEC", "USD")
 * @returns CSV-formatted string with summary data
 *
 * @example
 * ```ts
 * const csv = generateSummaryCSV(payslipResult, "Trading Run #1", "aUEC");
 * // Downloads as: sc-payslip-summary-2024-01-15T10-30-00.csv
 * ```
 */
export function generateSummaryCSV(
  result: PayslipResult,
  sessionName: string,
  currency: string = "aUEC"
): string {
  const rows: (string | number)[][] = [];

  // Header row 1: Session info
  rows.push([`Session: ${sessionName}`]);
  rows.push([`Currency: ${currency}`]);
  rows.push([`Total Revenue: ${result.saleRevenue}`]);
  rows.push([`Net Profit: ${result.netProfit}`]);
  rows.push([`Tax Rate: ${result.taxRateApplied}%`]);
  rows.push([]); // Empty row for spacing

  // Header row 2: Column headers
  rows.push([
    "Handle",
    "Role",
    "Active",
    "Revenue",
    "Investment",
    "Total Expenses",
    "Shared Expenses",
    "Individual Expenses",
    "Profit Share",
    "Final Net",
  ]);

  // Data rows: One per member
  for (const member of result.members) {
    rows.push([
      member.handle,
      member.role || "",
      member.active ? "Yes" : "No",
      member.revenue,
      member.investment,
      member.expenses,
      member.sharedExpenses,
      member.individualExpenses,
      member.profitShare,
      member.finalNet,
    ]);
  }

  // Summary statistics (if available)
  if (result.summaryStatistics) {
    const stats = result.summaryStatistics;
    rows.push([]); // Empty row for spacing
    rows.push(["Summary Statistics"]);
    rows.push(["Min Payout", stats.minPayout]);
    rows.push(["Max Payout", stats.maxPayout]);
    rows.push(["Average Payout", stats.averagePayout]);
    rows.push(["Total Transfers", stats.totalTransfers]);
    rows.push(["Largest Transfer", stats.largestTransfer]);
    rows.push(["Highest Earner", stats.highestEarner]);
    rows.push(["Lowest Earner", stats.lowestEarner]);
  }

  return rowsToCSV(rows);
}

/**
 * Generates a detailed CSV with all expenses broken out.
 * Includes transfers section showing suggested settlements.
 *
 * @param result - The calculated payslip result
 * @param sessionName - Name of the session for the CSV header
 * @param currency - Currency symbol (e.g., "aUEC", "USD")
 * @returns CSV-formatted string with detailed data
 *
 * @example
 * ```ts
 * const csv = generateDetailedCSV(payslipResult, "Trading Run #1", "aUEC");
 * // Downloads as: sc-payslip-detailed-2024-01-15T10-30-00.csv
 * ```
 */
export function generateDetailedCSV(
  result: PayslipResult,
  sessionName: string,
  currency: string = "aUEC"
): string {
  const rows: (string | number)[][] = [];

  // Header row 1: Session info
  rows.push([`Session: ${sessionName}`]);
  rows.push([`Currency: ${currency}`]);
  rows.push([`Total Revenue: ${result.saleRevenue}`]);
  rows.push([`Net Profit: ${result.netProfit}`]);
  rows.push([`Tax Rate: ${result.taxRateApplied}%`]);
  rows.push([]); // Empty row for spacing

  // Section 1: Member Breakdown
  rows.push(["MEMBER BREAKDOWN"]);
  rows.push([
    "Handle",
    "Role",
    "Active",
    "Revenue",
    "Investment",
    "Total Expenses",
    "Shared Expenses",
    "Individual Expenses",
    "Profit Share",
    "Final Net",
  ]);

  for (const member of result.members) {
    rows.push([
      member.handle,
      member.role || "",
      member.active ? "Yes" : "No",
      member.revenue,
      member.investment,
      member.expenses,
      member.sharedExpenses,
      member.individualExpenses,
      member.profitShare,
      member.finalNet,
    ]);
  }

  rows.push([]); // Empty row for spacing

  // Section 2: Suggested Transfers
  rows.push(["SUGGESTED TRANSFERS"]);
  rows.push(["From", "To", "Net Amount", "Gross Amount (with tax)", "Fee Amount"]);

  for (const transfer of result.suggestedTransfers) {
    // Find member handles by ID
    const fromMember = result.members.find((m) => m.memberId === transfer.fromMemberId);
    const toMember = result.members.find((m) => m.memberId === transfer.toMemberId);

    rows.push([
      fromMember?.handle || transfer.fromMemberId,
      toMember?.handle || transfer.toMemberId,
      transfer.netAmount,
      transfer.grossAmount,
      transfer.feeAmount,
    ]);
  }

  rows.push([]); // Empty row for spacing

  // Section 3: Summary Statistics (if available)
  if (result.summaryStatistics) {
    const stats = result.summaryStatistics;
    rows.push(["SUMMARY STATISTICS"]);
    rows.push(["Metric", "Value"]);
    rows.push(["Min Payout", stats.minPayout]);
    rows.push(["Max Payout", stats.maxPayout]);
    rows.push(["Average Payout", stats.averagePayout]);
    rows.push(["Total Transfers", stats.totalTransfers]);
    rows.push(["Largest Transfer", stats.largestTransfer]);
    rows.push(["Highest Earner", stats.highestEarner]);
    rows.push(["Lowest Earner", stats.lowestEarner]);
  }

  return rowsToCSV(rows);
}

/**
 * Triggers a CSV download in the browser.
 * Creates a Blob and temporary download link following the SessionActions pattern.
 *
 * @param csvContent - The CSV content as a string
 * @param filename - Base filename without extension (timestamp will be added)
 *
 * @example
 * ```ts
 * const csv = generateSummaryCSV(result, "Trading Run #1", "aUEC");
 * downloadCSV(csv, "sc-payslip-summary");
 * // Downloads as: sc-payslip-summary-2024-01-15T10-30-00.csv
 * ```
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Create a blob with the CSV data
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
  link.download = `${filename}-${timestamp}.csv`;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
