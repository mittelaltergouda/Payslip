"use client";

import type { Transfer, MemberInput } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";

/**
 * Format a number according to the specified language locale.
 */
function format(amount: number, lang: Lang): string {
  return Math.round(amount).toLocaleString(lang === "de" ? "de-DE" : "en-US");
}

/**
 * Props for the TransfersList component.
 */
export interface TransfersListProps {
  /**
   * Array of suggested transfers to display.
   */
  transfers: Transfer[];

  /**
   * Array of session members to look up handles by ID.
   */
  members: MemberInput[];

  /**
   * Translation strings for the current language.
   */
  translations: Record<string, string>;

  /**
   * Current language for number formatting.
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
 * TransfersList component displays a list of suggested transfers between members.
 * It shows the transfer amount (gross and net), the sender and receiver handles,
 * and any applicable fees.
 *
 * The component displays:
 * - A header with the "Suggested Transfers" title
 * - A "no transfers required" message if the list is empty
 * - Each transfer showing:
 *   - From handle → To handle
 *   - Gross amount with currency
 *   - Net amount (in smaller text)
 *   - Fee amount (if > 0)
 *
 * @example
 * ```tsx
 * const result = calculatePayslip(session);
 *
 * <TransfersList
 *   transfers={result.suggestedTransfers}
 *   members={session.members}
 *   translations={translations[lang]}
 *   lang={lang}
 *   currency="aUEC"
 * />
 * ```
 */
export function TransfersList({
  transfers,
  members,
  translations,
  lang,
  currency = "aUEC",
  className = "",
}: TransfersListProps) {
  const t = translations;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-white/80">{t.suggestedTransfers}</h4>
      </div>

      {transfers.length === 0 && (
        <p className="text-white/60 text-sm">{t.noTransfers}</p>
      )}

      <div className="space-y-2">
        {transfers.map((tr: Transfer, idx) => {
          const from = members.find((m) => m.id === tr.fromMemberId)?.handle ?? "-";
          const to = members.find((m) => m.id === tr.toMemberId)?.handle ?? "-";
          const gross = format(tr.grossAmount, lang);
          const net = format(tr.netAmount, lang);
          const fee = format(tr.feeAmount, lang);

          return (
            <div key={idx} className="border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span>
                  {from} → {to}
                </span>
                <span className="font-semibold">
                  {gross} {currency} <span className="text-white/60 text-xs">(net {net})</span>
                </span>
              </div>
              {tr.feeAmount > 0 && (
                <p className="text-xs text-white/60">Fee: {fee} {currency}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
