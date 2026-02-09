"use client";

import { useMemo, useState } from "react";
import type { SessionType } from "@/lib/types";
import type { Lang } from "@/lib/i18n/translations";
import { SessionFilters, type SortOption } from "./SessionFilters";
import { SessionListItem, type SessionListItemData } from "./SessionListItem";

/**
 * Props for the SessionList component.
 */
export interface SessionListProps {
  /**
   * Array of sessions to display.
   */
  sessions: SessionListItemData[];

  /**
   * Current language for formatting and translations.
   */
  lang: Lang;

  /**
   * Translation strings for the component.
   */
  translations: {
    members: string;
    revenueLabel: string;
    deleteSession: string;
    searchPlaceholder: string;
    filterByType: string;
    allTypes: string;
    sortBy?: string;
    noSessions: string;
    noSessionsFound: string;
  };

  /**
   * Optional callback invoked when the user confirms deletion of a session.
   * Called with the session ID as the parameter.
   */
  onDelete?: (sessionId: string) => void;

  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * SessionList component displays a filterable and sortable list of sessions.
 *
 * Features:
 * - Search filtering by session name (case-insensitive)
 * - Type filtering by session type
 * - Sorting by date, name, or revenue
 * - Empty state for no sessions
 * - Empty state for no matching sessions
 * - Integrates SessionFilters and SessionListItem components
 *
 * The component manages filtering and sorting state internally and renders
 * filtered and sorted sessions using the SessionListItem component.
 *
 * @example
 * ```tsx
 * <SessionList
 *   sessions={[
 *     {
 *       id: "abc123",
 *       name: "Mining Session 2024-01-15",
 *       type: "MINING",
 *       createdAt: "2024-01-15T10:30:00.000Z",
 *       totalRevenue: 150000,
 *       memberCount: 4
 *     }
 *   ]}
 *   lang="en"
 *   translations={{
 *     members: "Members",
 *     revenueLabel: "Revenue",
 *     searchPlaceholder: "Search sessions...",
 *     filterByType: "Filter by type",
 *     allTypes: "All Types",
 *     noSessions: "No saved sessions",
 *     noSessionsFound: "No sessions found matching your filters"
 *   }}
 * />
 * ```
 */
export function SessionList({
  sessions,
  lang,
  translations: t,
  onDelete,
  className = "",
}: SessionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<SessionType | null>(null);
  const [selectedSort, setSelectedSort] = useState<SortOption>("date-newest");

  // Filter and sort sessions based on search query, selected type, and sort option
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((session) =>
        session.name.toLowerCase().includes(query)
      );
    }

    // Filter by selected type
    if (selectedType !== null) {
      filtered = filtered.filter((session) => session.type === selectedType);
    }

    // Sort filtered sessions
    const sorted = [...filtered];
    switch (selectedSort) {
      case "date-newest":
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "date-oldest":
        sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "revenue-high":
        sorted.sort((a, b) => b.totalRevenue - a.totalRevenue);
        break;
      case "revenue-low":
        sorted.sort((a, b) => a.totalRevenue - b.totalRevenue);
        break;
    }

    return sorted;
  }, [sessions, searchQuery, selectedType, selectedSort]);

  // Empty state: no sessions at all
  if (sessions.length === 0) {
    return (
      <div className={className}>
        <div className="glass p-8 text-center">
          <p className="text-white/60 text-lg">{t.noSessions}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      <SessionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        {...(t.sortBy && {
          selectedSort,
          onSortChange: setSelectedSort,
        })}
        translations={{
          searchPlaceholder: t.searchPlaceholder,
          filterByType: t.filterByType,
          allTypes: t.allTypes,
          ...(t.sortBy && { sortBy: t.sortBy }),
        }}
      />

      {/* Session list or empty state */}
      {filteredSessions.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-white/60 text-lg">{t.noSessionsFound}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <SessionListItem
              key={session.id}
              session={session}
              lang={lang}
              onDelete={onDelete}
              translations={{
                members: t.members,
                revenueLabel: t.revenueLabel,
                deleteSession: t.deleteSession,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
