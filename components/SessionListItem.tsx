"use client";

import Link from "next/link";
import type { SessionType } from "@/lib/types";
import type { Lang } from "@/lib/format";
import { formatCompact } from "@/lib/format";

/**
 * Session data structure for display in the session list.
 */
export interface SessionListItemData {
  /**
   * Unique session identifier.
   */
  id: string;

  /**
   * Session name.
   */
  name: string;

  /**
   * Session type (TRADING, PIRACY, SALVAGE, MINING, BOUNTY, OTHER).
   */
  type: SessionType;

  /**
   * Session creation date in ISO format.
   */
  createdAt: string;

  /**
   * Total revenue for the session.
   */
  totalRevenue: number;

  /**
   * Number of members in the session.
   */
  memberCount: number;
}

/**
 * Props for the SessionListItem component.
 */
export interface SessionListItemProps {
  /**
   * Session data to display.
   */
  session: SessionListItemData;

  /**
   * Current language for date formatting and number formatting.
   */
  lang: Lang;

  /**
   * Translation strings for the component.
   */
  translations: {
    members: string;
    revenueLabel: string;
  };
}

/**
 * Type badge colors for different session types.
 */
const TYPE_COLORS: Record<SessionType, string> = {
  TRADING: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  PIRACY: "bg-red-500/20 text-red-300 border-red-500/30",
  SALVAGE: "bg-green-500/20 text-green-300 border-green-500/30",
  MINING: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  BOUNTY: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  OTHER: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

/**
 * SessionListItem component displays an individual session in the session list.
 *
 * Renders a clickable card showing session metadata including name, type badge,
 * creation date, total revenue, and member count. Clicking the card navigates
 * to the session editor page.
 *
 * @example
 * ```tsx
 * <SessionListItem
 *   session={{
 *     id: "abc123",
 *     name: "Mining Session 2024-01-15",
 *     type: "MINING",
 *     createdAt: "2024-01-15T10:30:00.000Z",
 *     totalRevenue: 150000,
 *     memberCount: 4
 *   }}
 *   lang="en"
 *   translations={{
 *     members: "Members",
 *     revenueLabel: "Revenue"
 *   }}
 * />
 * ```
 */
export function SessionListItem({
  session,
  lang,
  translations,
}: SessionListItemProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = lang === "de" ? "de-DE" : "en-US";
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format revenue using compact notation
  const formattedRevenue = formatCompact(session.totalRevenue, lang);

  // Get type badge color
  const typeColor = TYPE_COLORS[session.type];

  return (
    <Link href={`/session/${session.id}`}>
      <div className="glass p-4 hover:bg-white/10 transition cursor-pointer space-y-3">
        {/* Header: Name and Type Badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-sand text-lg flex-1 break-words">
            {session.name}
          </h3>
          <span
            className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${typeColor}`}
          >
            {session.type}
          </span>
        </div>

        {/* Date */}
        <div className="text-sm text-white/60">
          {formatDate(session.createdAt)}
        </div>

        {/* Stats: Revenue and Member Count */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white/60">{translations.revenueLabel}:</span>
            <span className="text-neon font-medium">{formattedRevenue} aUEC</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">{translations.members}:</span>
            <span className="text-sand font-medium">{session.memberCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
