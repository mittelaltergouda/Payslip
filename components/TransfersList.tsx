"use client";

import type { Transfer, MemberInput } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { Avatar } from "@/components/ui/avatar";

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
 * It shows the amount to enter in Star Citizen, the sender and receiver with
 * avatar icons, and the fee plus total sender charge.
 *
 * The component displays:
 * - A header with the "Suggested Transfers" title
 * - A "no transfers required" message if the list is empty
 * - Each transfer showing:
 *   - From avatar → arrow icon → To avatar
 *   - Amount received / entered in the Wallet app
 *   - Fee and total amount charged to the sender (if > 0)
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
                <div className="flex items-center gap-2">
                  <Avatar name={from} size="sm" />
                  <svg
                    className="w-4 h-4 text-white/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  <Avatar name={to} size="sm" />
                </div>
                <span className="font-semibold">{net} {currency}</span>
              </div>
              {tr.feeAmount > 0 && (
                <p className="text-xs text-white/60">
                  {t.fee}: {fee} {currency} · {t.totalCharged}: {gross} {currency}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
