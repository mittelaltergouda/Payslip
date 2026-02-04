// ============================================================================
// FORMAT UTILITIES
// ============================================================================
// This module provides number and currency formatting utilities
// for consistent display across the application.

/**
 * Supported locale languages for formatting.
 */
export type Lang = "de" | "en";

/**
 * Formats a number with locale-specific thousand separators.
 * Rounds to the nearest integer before formatting.
 *
 * @param amount - The number to format
 * @param lang - The locale language ('de' for German, 'en' for English)
 * @returns Formatted number string with appropriate thousand separators
 *
 * @example
 * format(1234567, 'en') // "1,234,567"
 * format(1234567, 'de') // "1.234.567"
 * format(42.7, 'en')    // "43"
 */
export function format(amount: number, lang: Lang): string {
  return Math.round(amount).toLocaleString(lang === "de" ? "de-DE" : "en-US");
}

/**
 * Formats a number with currency symbol using locale-appropriate formatting.
 * Supports standard currencies (USD, EUR, GBP) via Intl.NumberFormat and
 * custom game currency (aUEC) with simple suffix notation.
 *
 * For standard currencies, uses locale-specific formatting with proper
 * currency symbols and decimal places. For aUEC (Star Citizen currency),
 * rounds to the nearest integer and appends ' aUEC' suffix.
 *
 * @param amount - The numeric amount to format
 * @param currency - Currency code (aUEC, USD, EUR, GBP)
 * @param lang - The locale language ('de' for German, 'en' for English)
 * @returns Formatted currency string with appropriate symbol and separators
 *
 * @example
 * formatCurrency(1234567, 'aUEC', 'en') // "1,234,567 aUEC"
 * formatCurrency(1234567, 'aUEC', 'de') // "1.234.567 aUEC"
 * formatCurrency(1234.56, 'USD', 'en')  // "$1,234.56"
 * formatCurrency(1234.56, 'EUR', 'de')  // "1.234,56 €"
 * formatCurrency(1234.56, 'GBP', 'en')  // "£1,234.56"
 */
export function formatCurrency(
  amount: number,
  currency: string,
  lang: Lang
): string {
  // Handle Star Citizen game currency specially
  if (currency === "aUEC") {
    return `${format(amount, lang)} aUEC`;
  }

  // Use Intl.NumberFormat for standard currencies
  const locale = lang === "de" ? "de-DE" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Formats a number as a percentage with configurable decimal precision.
 * Automatically detects whether the input is a decimal (0-1 range) or
 * already a percentage value (>1).
 *
 * For values between -1 and 1 (exclusive), the function treats them
 * as decimal percentages and multiplies by 100. For values >= 1 or <= -1,
 * the function treats them as already being percentage values.
 *
 * @param value - The numeric value to format (decimal or percentage)
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted percentage string with '%' suffix
 *
 * @example
 * formatPercent(0.05)      // "5.00%"
 * formatPercent(0.05, 0)   // "5%"
 * formatPercent(0.1575, 2) // "15.75%"
 * formatPercent(15.75)     // "15.75%"
 * formatPercent(100, 0)    // "100%"
 * formatPercent(0.3333, 1) // "33.3%"
 */
export function formatPercent(value: number, decimals: number = 2): string {
  // Auto-detect if value is decimal (0-1 range) or already a percentage
  const percentValue = value > -1 && value < 1 ? value * 100 : value;
  return `${percentValue.toFixed(decimals)}%`;
}

/**
 * Formats a number in compact notation using K, M, B suffixes for large values.
 * Uses locale-appropriate decimal separators and preserves full precision
 * for values below 1000.
 *
 * The function applies the following rules:
 * - Values < 1000: display as-is with locale formatting
 * - Values >= 1000 and < 1,000,000: divide by 1000 and append 'k'
 * - Values >= 1,000,000 and < 1,000,000,000: divide by 1,000,000 and append 'M'
 * - Values >= 1,000,000,000: divide by 1,000,000,000 and append 'B'
 *
 * Compact values are displayed with one decimal place and locale-appropriate
 * decimal separator (comma for German, period for English).
 *
 * @param amount - The number to format in compact notation
 * @param lang - The locale language ('de' for German, 'en' for English)
 * @returns Formatted compact number string with appropriate suffix
 *
 * @example
 * formatCompact(500, 'en')          // "500"
 * formatCompact(1500, 'en')         // "1.5k"
 * formatCompact(1500, 'de')         // "1,5k"
 * formatCompact(1234567, 'en')      // "1.2M"
 * formatCompact(1234567, 'de')      // "1,2M"
 * formatCompact(1234567890, 'en')   // "1.2B"
 * formatCompact(999, 'en')          // "999"
 * formatCompact(1000, 'en')         // "1.0k"
 */
export function formatCompact(amount: number, lang: Lang): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  // Preserve full precision for values < 1000
  if (absAmount < 1000) {
    return `${sign}${Math.round(absAmount)}`;
  }

  // Determine magnitude and suffix
  let value: number;
  let suffix: string;

  if (absAmount >= 1_000_000_000) {
    // Billions
    value = absAmount / 1_000_000_000;
    suffix = 'B';
  } else if (absAmount >= 1_000_000) {
    // Millions
    value = absAmount / 1_000_000;
    suffix = 'M';
  } else {
    // Thousands
    value = absAmount / 1000;
    suffix = 'k';
  }

  // Format with one decimal place using locale-appropriate decimal separator
  const decimalSeparator = lang === 'de' ? ',' : '.';
  const formattedValue = value.toFixed(1).replace('.', decimalSeparator);

  return `${sign}${formattedValue}${suffix}`;
}

/**
 * Formats an integer with locale-specific thousand separators.
 * Truncates any decimal portion before formatting, since this is
 * intended for integer-only input fields.
 *
 * @param value - The integer value to format
 * @param lang - The locale language ('de' for German, 'en' for English)
 * @returns Formatted integer string with appropriate thousand separators
 *
 * @example
 * formatInteger(100000, 'de')  // "100.000"
 * formatInteger(100000, 'en')  // "100,000"
 * formatInteger(1234567, 'de') // "1.234.567"
 * formatInteger(0, 'de')       // "0"
 * formatInteger(-500, 'en')    // "-500"
 */
export function formatInteger(value: number, lang: Lang): string {
  return Math.trunc(value).toLocaleString(lang === "de" ? "de-DE" : "en-US");
}

/**
 * Parses a formatted integer string back to a number, stripping locale-specific
 * thousand separators and truncating any decimal portion.
 *
 * Handles multiple input formats:
 * - German formatted: "100.000" → 100000, "1.234.567" → 1234567
 * - English formatted: "1,234,567" → 1234567
 * - Mixed format with decimals: "1,234.56" → 1234, "1.234,56" → 1234
 * - Plain decimals: "123.45" → 123 (truncated)
 * - Negative values: "-500" → -500
 * - Empty or invalid input: "" → 0
 *
 * @param str - The formatted string to parse
 * @returns The parsed integer value, or 0 for empty/invalid input
 *
 * @example
 * parseFormattedInteger("100.000")     // 100000 (German thousand separator)
 * parseFormattedInteger("1,234,567")   // 1234567 (English thousand separator)
 * parseFormattedInteger("123.45")      // 123 (decimal truncated)
 * parseFormattedInteger("")            // 0
 * parseFormattedInteger("-500")        // -500
 */
export function parseFormattedInteger(str: string): number {
  const trimmed = str.trim();
  if (!trimmed || trimmed === '-') return 0;

  // Strip all characters except digits, dots, commas, and minus sign
  const sanitized = trimmed.replace(/[^\d.,-]/g, '');
  if (!sanitized || sanitized === '-') return 0;

  // Count separator occurrences
  const dotCount = (sanitized.match(/\./g) || []).length;
  const commaCount = (sanitized.match(/,/g) || []).length;

  let normalized: string;

  if (dotCount > 1 && commaCount === 0) {
    // Multiple dots, no commas → dots are thousand separators (German: 1.234.567)
    normalized = sanitized.replace(/\./g, '');
  } else if (commaCount > 1 && dotCount === 0) {
    // Multiple commas, no dots → commas are thousand separators
    normalized = sanitized.replace(/,/g, '');
  } else if (dotCount >= 1 && commaCount >= 1) {
    // Both present: the last separator is the decimal separator
    const lastDot = sanitized.lastIndexOf('.');
    const lastComma = sanitized.lastIndexOf(',');
    if (lastDot > lastComma) {
      // English format: 1,234.56 → commas are thousands, dot is decimal
      normalized = sanitized.replace(/,/g, '');
    } else {
      // German format: 1.234,56 → dots are thousands, comma is decimal
      normalized = sanitized.replace(/\./g, '').replace(',', '.');
    }
  } else if (dotCount === 1 && commaCount === 0) {
    // Single dot: thousand separator if pattern is N.NNN, otherwise decimal
    if (/^-?\d{1,3}\.\d{3}$/.test(sanitized)) {
      // Matches German thousand pattern (e.g., "100.000", "1.234")
      normalized = sanitized.replace('.', '');
    } else {
      // Decimal separator (e.g., "123.45", "1.5")
      normalized = sanitized;
    }
  } else if (commaCount === 1 && dotCount === 0) {
    // Single comma: thousand separator if pattern is N,NNN, otherwise decimal
    if (/^-?\d{1,3},\d{3}$/.test(sanitized)) {
      // Matches English thousand pattern (e.g., "1,000")
      normalized = sanitized.replace(',', '');
    } else {
      // German decimal comma (e.g., "1,5") → convert to dot
      normalized = sanitized.replace(',', '.');
    }
  } else {
    // No separators, just digits and possibly minus
    normalized = sanitized;
  }

  const parsed = parseFloat(normalized);
  if (isNaN(parsed)) return 0;
  return Math.trunc(parsed);
}
