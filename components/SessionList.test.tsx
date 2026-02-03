import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SessionList } from "./SessionList";
import type { SessionListProps } from "./SessionList";
import type { SessionListItemData } from "./SessionListItem";
import { describe, it, expect } from "vitest";

// Mock translations
const mockTranslationsDE = {
  members: "Mitglieder",
  revenueLabel: "Umsatz",
  searchPlaceholder: "Sessions durchsuchen...",
  filterByType: "Nach Typ filtern",
  allTypes: "Alle Typen",
  noSessions: "Keine gespeicherten Sessions",
  noSessionsFound: "Keine Sessions gefunden, die Ihren Filtern entsprechen",
};

const mockTranslationsEN = {
  members: "Members",
  revenueLabel: "Revenue",
  searchPlaceholder: "Search sessions...",
  filterByType: "Filter by type",
  allTypes: "All Types",
  noSessions: "No saved sessions",
  noSessionsFound: "No sessions found matching your filters",
};

// Sample session data
const createSession = (
  overrides?: Partial<SessionListItemData>
): SessionListItemData => ({
  id: "session-1",
  name: "Mining Session Alpha",
  type: "MINING",
  createdAt: "2024-01-15T10:30:00.000Z",
  totalRevenue: 150000,
  memberCount: 4,
  ...overrides,
});

const sampleSessions: SessionListItemData[] = [
  createSession({
    id: "session-1",
    name: "Mining Session Alpha",
    type: "MINING",
    totalRevenue: 150000,
    memberCount: 4,
  }),
  createSession({
    id: "session-2",
    name: "Trading Run Beta",
    type: "TRADING",
    totalRevenue: 200000,
    memberCount: 3,
  }),
  createSession({
    id: "session-3",
    name: "Piracy Mission Gamma",
    type: "PIRACY",
    totalRevenue: 100000,
    memberCount: 5,
  }),
  createSession({
    id: "session-4",
    name: "Mining Session Delta",
    type: "MINING",
    totalRevenue: 175000,
    memberCount: 4,
  }),
  createSession({
    id: "session-5",
    name: "Salvage Operation Epsilon",
    type: "SALVAGE",
    totalRevenue: 120000,
    memberCount: 2,
  }),
];

// Helper function to create default props
const createDefaultProps = (
  overrides?: Partial<SessionListProps>
): SessionListProps => ({
  sessions: sampleSessions,
  lang: "en",
  translations: mockTranslationsEN,
  ...overrides,
});

describe("SessionList - Empty State", () => {
  it("should render empty state when no sessions provided", () => {
    const props = createDefaultProps({ sessions: [] });
    render(<SessionList {...props} />);

    expect(screen.getByText("No saved sessions")).toBeInTheDocument();
  });

  it("should not render filters when no sessions", () => {
    const props = createDefaultProps({ sessions: [] });
    render(<SessionList {...props} />);

    // Search input should not be present
    expect(
      screen.queryByPlaceholderText("Search sessions...")
    ).not.toBeInTheDocument();
  });

  it("should render empty state in German", () => {
    const props = createDefaultProps({
      sessions: [],
      lang: "de",
      translations: mockTranslationsDE,
    });
    render(<SessionList {...props} />);

    expect(screen.getByText("Keine gespeicherten Sessions")).toBeInTheDocument();
  });

  it("should render with custom className on empty state", () => {
    const props = createDefaultProps({
      sessions: [],
      className: "custom-empty-class",
    });
    const { container } = render(<SessionList {...props} />);

    const customElement = container.querySelector(".custom-empty-class");
    expect(customElement).toBeInTheDocument();
  });
});

describe("SessionList - Initial Rendering with Sessions", () => {
  it("should render SessionFilters component", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    expect(
      screen.getByPlaceholderText("Search sessions...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by type" })
    ).toBeInTheDocument();
  });

  it("should render all sessions", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
    expect(screen.getByText("Trading Run Beta")).toBeInTheDocument();
    expect(screen.getByText("Piracy Mission Gamma")).toBeInTheDocument();
    expect(screen.getByText("Mining Session Delta")).toBeInTheDocument();
    expect(screen.getByText("Salvage Operation Epsilon")).toBeInTheDocument();
  });

  it("should render correct number of sessions", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    // Each session has a type badge, so count type badges
    const typeBadges = screen.getAllByText(/MINING|TRADING|PIRACY|SALVAGE/);
    expect(typeBadges.length).toBe(5);
  });

  it("should render with custom className", () => {
    const props = createDefaultProps({ className: "custom-list-class" });
    const { container } = render(<SessionList {...props} />);

    const customElement = container.querySelector(".custom-list-class");
    expect(customElement).toBeInTheDocument();
  });
});

describe("SessionList - Search Filtering", () => {
  it("should filter sessions by name (case-insensitive)", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "mining" } });

    // Should show only mining sessions
    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
    expect(screen.getByText("Mining Session Delta")).toBeInTheDocument();
    expect(screen.queryByText("Trading Run Beta")).not.toBeInTheDocument();
    expect(screen.queryByText("Piracy Mission Gamma")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Salvage Operation Epsilon")
    ).not.toBeInTheDocument();
  });

  it("should filter sessions by partial name match", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "beta" } });

    expect(screen.getByText("Trading Run Beta")).toBeInTheDocument();
    expect(screen.queryByText("Mining Session Alpha")).not.toBeInTheDocument();
  });

  it("should handle case-insensitive search", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "TRADING" } });

    expect(screen.getByText("Trading Run Beta")).toBeInTheDocument();
  });

  it("should show empty state when search matches no sessions", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(
      screen.getByText("No sessions found matching your filters")
    ).toBeInTheDocument();
  });

  it("should handle empty search query", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "" } });

    // Should show all sessions
    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
    expect(screen.getByText("Trading Run Beta")).toBeInTheDocument();
  });

  it("should handle whitespace-only search query", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "   " } });

    // Should show all sessions (whitespace trimmed)
    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
    expect(screen.getByText("Trading Run Beta")).toBeInTheDocument();
  });

  it("should update filtered results when search query changes", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");

    // First search
    fireEvent.change(searchInput, { target: { value: "mining" } });
    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Trading Run Beta")).not.toBeInTheDocument();

    // Change search
    fireEvent.change(searchInput, { target: { value: "trading" } });
    expect(screen.getByText("Trading Run Beta")).toBeInTheDocument();
    expect(screen.queryByText("Mining Session Alpha")).not.toBeInTheDocument();
  });
});

describe("SessionList - Type Filtering", () => {
  it("should filter sessions by type", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    // Open type dropdown
    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    // Select MINING type
    const miningOption = screen.getByRole("option", { name: "MINING" });
    fireEvent.click(miningOption);

    // Should show only MINING sessions
    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
    expect(screen.getByText("Mining Session Delta")).toBeInTheDocument();
    expect(screen.queryByText("Trading Run Beta")).not.toBeInTheDocument();
    expect(screen.queryByText("Piracy Mission Gamma")).not.toBeInTheDocument();
  });

  it("should filter sessions by TRADING type", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    const tradingOption = screen.getByRole("option", { name: "TRADING" });
    fireEvent.click(tradingOption);

    expect(screen.getByText("Trading Run Beta")).toBeInTheDocument();
    expect(screen.queryByText("Mining Session Alpha")).not.toBeInTheDocument();
  });

  it("should show empty state when type filter matches no sessions", () => {
    const props = createDefaultProps({
      sessions: [createSession({ type: "MINING" })],
    });
    render(<SessionList {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    const bountyOption = screen.getByRole("option", { name: "BOUNTY" });
    fireEvent.click(bountyOption);

    expect(
      screen.getByText("No sessions found matching your filters")
    ).toBeInTheDocument();
  });

  it("should reset filter when 'All Types' is selected", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    // Select a type first
    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);
    const miningOption = screen.getByRole("option", { name: "MINING" });
    fireEvent.click(miningOption);

    // Verify filtered
    expect(screen.queryByText("Trading Run Beta")).not.toBeInTheDocument();

    // Select All Types
    fireEvent.click(filterButton);
    const allTypesOption = screen.getByRole("option", { name: "All Types" });
    fireEvent.click(allTypesOption);

    // Should show all sessions again
    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
    expect(screen.getByText("Trading Run Beta")).toBeInTheDocument();
  });
});

describe("SessionList - Combined Filtering", () => {
  it("should filter by both search and type", () => {
    const props = createDefaultProps({
      sessions: [
        createSession({
          id: "1",
          name: "Mining Alpha",
          type: "MINING",
        }),
        createSession({
          id: "2",
          name: "Mining Beta",
          type: "MINING",
        }),
        createSession({
          id: "3",
          name: "Trading Alpha",
          type: "TRADING",
        }),
      ],
    });
    render(<SessionList {...props} />);

    // Filter by type
    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);
    const miningOption = screen.getByRole("option", { name: "MINING" });
    fireEvent.click(miningOption);

    // Filter by search
    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "alpha" } });

    // Should show only Mining Alpha
    expect(screen.getByText("Mining Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Mining Beta")).not.toBeInTheDocument();
    expect(screen.queryByText("Trading Alpha")).not.toBeInTheDocument();
  });

  it("should show empty state when combined filters match nothing", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    // Filter by type
    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);
    const miningOption = screen.getByRole("option", { name: "MINING" });
    fireEvent.click(miningOption);

    // Search for non-mining session
    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "trading" } });

    expect(
      screen.getByText("No sessions found matching your filters")
    ).toBeInTheDocument();
  });

  it("should clear search and keep type filter", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    // Set both filters
    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);
    const miningOption = screen.getByRole("option", { name: "MINING" });
    fireEvent.click(miningOption);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "alpha" } });

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });

    // Should show all mining sessions
    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
    expect(screen.getByText("Mining Session Delta")).toBeInTheDocument();
    expect(screen.queryByText("Trading Run Beta")).not.toBeInTheDocument();
  });
});

describe("SessionList - Translations", () => {
  it("should render German translations", () => {
    const props = createDefaultProps({
      lang: "de",
      translations: mockTranslationsDE,
    });
    render(<SessionList {...props} />);

    expect(
      screen.getByPlaceholderText("Sessions durchsuchen...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nach Typ filtern" })
    ).toBeInTheDocument();
  });

  it("should render English translations", () => {
    const props = createDefaultProps({
      lang: "en",
      translations: mockTranslationsEN,
    });
    render(<SessionList {...props} />);

    expect(
      screen.getByPlaceholderText("Search sessions...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by type" })
    ).toBeInTheDocument();
  });

  it("should show German empty state message", () => {
    const props = createDefaultProps({
      lang: "de",
      translations: mockTranslationsDE,
    });
    render(<SessionList {...props} />);

    const searchInput = screen.getByPlaceholderText("Sessions durchsuchen...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(
      screen.getByText("Keine Sessions gefunden, die Ihren Filtern entsprechen")
    ).toBeInTheDocument();
  });

  it("should show English empty state message", () => {
    const props = createDefaultProps();
    render(<SessionList {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(
      screen.getByText("No sessions found matching your filters")
    ).toBeInTheDocument();
  });
});

describe("SessionList - Edge Cases", () => {
  it("should handle sessions with zero revenue", () => {
    const props = createDefaultProps({
      sessions: [createSession({ totalRevenue: 0 })],
    });
    render(<SessionList {...props} />);

    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
  });

  it("should handle sessions with zero members", () => {
    const props = createDefaultProps({
      sessions: [createSession({ memberCount: 0 })],
    });
    render(<SessionList {...props} />);

    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should handle sessions with very long names", () => {
    const longName = "A".repeat(200);
    const props = createDefaultProps({
      sessions: [createSession({ name: longName })],
    });
    render(<SessionList {...props} />);

    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  it("should handle sessions with identical names", () => {
    const props = createDefaultProps({
      sessions: [
        createSession({ id: "1", name: "Duplicate Name" }),
        createSession({ id: "2", name: "Duplicate Name" }),
      ],
    });
    render(<SessionList {...props} />);

    const duplicateNames = screen.getAllByText("Duplicate Name");
    expect(duplicateNames.length).toBe(2);
  });

  it("should handle single session", () => {
    const props = createDefaultProps({
      sessions: [createSession()],
    });
    render(<SessionList {...props} />);

    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
  });

  it("should handle all session types", () => {
    const props = createDefaultProps({
      sessions: [
        createSession({ id: "1", type: "TRADING" }),
        createSession({ id: "2", type: "PIRACY" }),
        createSession({ id: "3", type: "SALVAGE" }),
        createSession({ id: "4", type: "MINING" }),
        createSession({ id: "5", type: "BOUNTY" }),
        createSession({ id: "6", type: "OTHER" }),
      ],
    });
    render(<SessionList {...props} />);

    expect(screen.getByText("TRADING")).toBeInTheDocument();
    expect(screen.getByText("PIRACY")).toBeInTheDocument();
    expect(screen.getByText("SALVAGE")).toBeInTheDocument();
    expect(screen.getByText("MINING")).toBeInTheDocument();
    expect(screen.getByText("BOUNTY")).toBeInTheDocument();
    expect(screen.getByText("OTHER")).toBeInTheDocument();
  });

  it("should maintain filter state when sessions prop changes", () => {
    const props = createDefaultProps();
    const { rerender } = render(<SessionList {...props} />);

    // Set a search filter
    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "mining" } });

    // Update sessions prop
    const newSessions = [
      ...sampleSessions,
      createSession({ id: "new-1", name: "Mining Session New" }),
    ];
    rerender(<SessionList {...props} sessions={newSessions} />);

    // Filter should still be active and include new session
    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
    expect(screen.getByText("Mining Session Delta")).toBeInTheDocument();
    expect(screen.getByText("Mining Session New")).toBeInTheDocument();
    expect(screen.queryByText("Trading Run Beta")).not.toBeInTheDocument();
  });
});
