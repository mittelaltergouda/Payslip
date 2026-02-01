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
