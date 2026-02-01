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
