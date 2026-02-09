"use client";

import { useState } from "react";
import type { SessionType } from "@/lib/types";

/**
 * Sort options for session list.
 */
export type SortOption =
  | "date-newest"
  | "date-oldest"
  | "name-asc"
  | "name-desc"
  | "revenue-high"
  | "revenue-low";

/**
 * Props for the SessionFilters component.
 */
export interface SessionFiltersProps {
  /**
   * Current search query for filtering by session name.
   */
  searchQuery: string;

  /**
   * Callback when search query changes.
   */
  onSearchChange: (query: string) => void;

  /**
   * Current selected session type filter.
   * Null means "All Types" (no filter).
   */
  selectedType: SessionType | null;

  /**
   * Callback when session type filter changes.
   */
  onTypeChange: (type: SessionType | null) => void;

  /**
   * Current selected sort option.
   * Optional - will be added in later integration phase.
   */
  selectedSort?: SortOption;

  /**
   * Callback when sort option changes.
   * Optional - will be added in later integration phase.
   */
  onSortChange?: (sort: SortOption) => void;

  /**
   * Translation strings for the component.
   */
  translations: {
    searchPlaceholder: string;
    filterByType: string;
    allTypes: string;
    sortBy?: string;
  };

  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Available session types for filtering.
 */
const SESSION_TYPES: SessionType[] = [
  "TRADING",
  "PIRACY",
  "SALVAGE",
  "MINING",
  "BOUNTY",
  "OTHER",
];

/**
 * Available sort options for sorting sessions.
 */
const SORT_OPTIONS: SortOption[] = [
  "date-newest",
  "date-oldest",
  "name-asc",
  "name-desc",
  "revenue-high",
  "revenue-low",
];

/**
 * SessionFilters component provides search and type filtering controls
 * for the session list.
 *
 * Features:
 * - Text search input for filtering sessions by name
 * - Dropdown selector for filtering by session type
 * - "All Types" option to clear type filter
 * - Controlled components with onChange callbacks
 *
 * The component follows the design patterns from SessionSettings,
 * using consistent styling and dropdown behavior.
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState("");
 * const [selectedType, setSelectedType] = useState<SessionType | null>(null);
 *
 * <SessionFilters
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   selectedType={selectedType}
 *   onTypeChange={setSelectedType}
 *   translations={{
 *     searchPlaceholder: "Search sessions...",
 *     filterByType: "Filter by type",
 *     allTypes: "All Types"
 *   }}
 * />
 * ```
 */
export function SessionFilters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedSort,
  onSortChange,
  translations: t,
  className = "",
}: SessionFiltersProps) {
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const getTypeLabel = (type: SessionType | null): string => {
    return type ?? t.allTypes;
  };

  const getSortLabel = (sort: SortOption): string => {
    const labels: Record<SortOption, string> = {
      "date-newest": "Date (Newest First)",
      "date-oldest": "Date (Oldest First)",
      "name-asc": "Name (A-Z)",
      "name-desc": "Name (Z-A)",
      "revenue-high": "Revenue (Highest)",
      "revenue-low": "Revenue (Lowest)",
    };
    return labels[sort];
  };

  return (
    <div className={`glass p-4 space-y-4 ${className}`}>
      <div
        className={`grid gap-4 ${
          selectedSort !== undefined && onSortChange
            ? "md:grid-cols-3"
            : "md:grid-cols-2"
        }`}
      >
        {/* Search Input */}
        <div className="flex flex-col gap-1">
          <label htmlFor="session-search" className="text-sm text-white/70">
            {t.searchPlaceholder}
          </label>
          <input
            id="session-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="input w-full"
            aria-label={t.searchPlaceholder}
          />
        </div>

        {/* Type Filter Dropdown */}
        <div className="flex flex-col gap-1 relative">
          <span className="text-sm text-white/70">{t.filterByType}</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              onBlur={() => {
                // Delay closing to allow click events on options to fire
                setTimeout(() => setIsTypeDropdownOpen(false), 200);
              }}
              className="input w-full text-left flex items-center justify-between"
              aria-haspopup="listbox"
              aria-expanded={isTypeDropdownOpen}
              aria-label={t.filterByType}
            >
              <span>{getTypeLabel(selectedType)}</span>
              <span className="text-white/50">
                {isTypeDropdownOpen ? "▲" : "▼"}
              </span>
            </button>

            {isTypeDropdownOpen && (
              <div
                className="absolute z-10 w-full bg-night border border-white/20 rounded-lg mt-1 shadow-lg overflow-hidden"
                role="listbox"
              >
                {/* "All Types" option */}
                <div
                  role="option"
                  aria-selected={selectedType === null}
                  onClick={() => {
                    onTypeChange(null);
                    setIsTypeDropdownOpen(false);
                  }}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    selectedType === null
                      ? "bg-neon/20 text-neon"
                      : "hover:bg-white/10 text-white/80"
                  }`}
                >
                  {t.allTypes}
                </div>

                {/* Individual session types */}
                {SESSION_TYPES.map((type) => (
                  <div
                    key={type}
                    role="option"
                    aria-selected={selectedType === type}
                    onClick={() => {
                      onTypeChange(type);
                      setIsTypeDropdownOpen(false);
                    }}
                    className={`px-3 py-2 cursor-pointer transition-colors ${
                      selectedType === type
                        ? "bg-neon/20 text-neon"
                        : "hover:bg-white/10 text-white/80"
                    }`}
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sort Dropdown - Only render if sort props are provided */}
        {selectedSort !== undefined && onSortChange && t.sortBy && (
          <div className="flex flex-col gap-1 relative">
            <span className="text-sm text-white/70">{t.sortBy}</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                onBlur={() => {
                  // Delay closing to allow click events on options to fire
                  setTimeout(() => setIsSortDropdownOpen(false), 200);
                }}
                className="input w-full text-left flex items-center justify-between"
                aria-haspopup="listbox"
                aria-expanded={isSortDropdownOpen}
                aria-label={t.sortBy}
              >
                <span>{getSortLabel(selectedSort)}</span>
                <span className="text-white/50">
                  {isSortDropdownOpen ? "▲" : "▼"}
                </span>
              </button>

              {isSortDropdownOpen && (
                <div
                  className="absolute z-10 w-full bg-night border border-white/20 rounded-lg mt-1 shadow-lg overflow-hidden"
                  role="listbox"
                >
                  {/* Individual sort options */}
                  {SORT_OPTIONS.map((option) => (
                    <div
                      key={option}
                      role="option"
                      aria-selected={selectedSort === option}
                      onClick={() => {
                        onSortChange(option);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`px-3 py-2 cursor-pointer transition-colors ${
                        selectedSort === option
                          ? "bg-neon/20 text-neon"
                          : "hover:bg-white/10 text-white/80"
                      }`}
                    >
                      {getSortLabel(option)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
