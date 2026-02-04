import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SessionFilters } from "./SessionFilters";
import type { SessionFiltersProps } from "./SessionFilters";
import type { SessionType } from "@/lib/types";
import { describe, it, expect, vi } from "vitest";

// Mock translations
const mockTranslationsDE = {
  searchPlaceholder: "Sessions durchsuchen...",
  filterByType: "Nach Typ filtern",
  allTypes: "Alle Typen",
};

const mockTranslationsEN = {
  searchPlaceholder: "Search sessions...",
  filterByType: "Filter by type",
  allTypes: "All Types",
};

// Helper function to create default props
const createDefaultProps = (
  overrides?: Partial<SessionFiltersProps>
): SessionFiltersProps => ({
  searchQuery: "",
  onSearchChange: vi.fn(),
  selectedType: null,
  onTypeChange: vi.fn(),
  translations: mockTranslationsEN,
  ...overrides,
});

describe("SessionFilters - Initial Rendering", () => {
  it("should render search input with placeholder", () => {
    const props = createDefaultProps();
    render(<SessionFilters {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue("");
  });

  it("should render type filter dropdown button", () => {
    const props = createDefaultProps();
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    expect(filterButton).toBeInTheDocument();
  });

  it("should display 'All Types' when no type is selected", () => {
    const props = createDefaultProps();
    render(<SessionFilters {...props} />);

    expect(screen.getByText("All Types")).toBeInTheDocument();
  });

  it("should display selected type in dropdown button", () => {
    const props = createDefaultProps({ selectedType: "MINING" });
    render(<SessionFilters {...props} />);

    expect(screen.getByText("MINING")).toBeInTheDocument();
  });

  it("should render with custom className", () => {
    const props = createDefaultProps({ className: "custom-class" });
    const { container } = render(<SessionFilters {...props} />);

    const filterContainer = container.querySelector(".custom-class");
    expect(filterContainer).toBeInTheDocument();
  });
});

describe("SessionFilters - Search Input", () => {
  it("should call onSearchChange when typing in search input", () => {
    const mockOnSearchChange = vi.fn();
    const props = createDefaultProps({ onSearchChange: mockOnSearchChange });
    render(<SessionFilters {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "mining" } });

    expect(mockOnSearchChange).toHaveBeenCalledWith("mining");
  });

  it("should display current search query in input", () => {
    const props = createDefaultProps({ searchQuery: "trading session" });
    render(<SessionFilters {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    expect(searchInput).toHaveValue("trading session");
  });

  it("should call onSearchChange multiple times for multiple changes", () => {
    const mockOnSearchChange = vi.fn();
    const props = createDefaultProps({ onSearchChange: mockOnSearchChange });
    render(<SessionFilters {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");

    fireEvent.change(searchInput, { target: { value: "m" } });
    fireEvent.change(searchInput, { target: { value: "mi" } });
    fireEvent.change(searchInput, { target: { value: "min" } });

    expect(mockOnSearchChange).toHaveBeenCalledTimes(3);
    expect(mockOnSearchChange).toHaveBeenNthCalledWith(1, "m");
    expect(mockOnSearchChange).toHaveBeenNthCalledWith(2, "mi");
    expect(mockOnSearchChange).toHaveBeenNthCalledWith(3, "min");
  });

  it("should handle clearing search input", () => {
    const mockOnSearchChange = vi.fn();
    const props = createDefaultProps({
      searchQuery: "mining",
      onSearchChange: mockOnSearchChange,
    });
    render(<SessionFilters {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, { target: { value: "" } });

    expect(mockOnSearchChange).toHaveBeenCalledWith("");
  });
});

describe("SessionFilters - Type Dropdown", () => {
  it("should open dropdown when clicking the button", () => {
    const props = createDefaultProps();
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    // Check for dropdown options
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("should display all session types in dropdown", () => {
    const props = createDefaultProps();
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    // Check for all session types
    const sessionTypes: SessionType[] = [
      "TRADING",
      "PIRACY",
      "SALVAGE",
      "MINING",
      "BOUNTY",
      "OTHER",
    ];

    sessionTypes.forEach((type) => {
      expect(screen.getByText(type)).toBeInTheDocument();
    });
  });

  it("should display 'All Types' option in dropdown", () => {
    const props = createDefaultProps();
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    const allTypesOptions = screen.getAllByText("All Types");
    // Should have both button text and dropdown option
    expect(allTypesOptions.length).toBeGreaterThanOrEqual(2);
  });

  it("should call onTypeChange when selecting a type", () => {
    const mockOnTypeChange = vi.fn();
    const props = createDefaultProps({ onTypeChange: mockOnTypeChange });
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    const miningOption = screen.getByRole("option", { name: "MINING" });
    fireEvent.click(miningOption);

    expect(mockOnTypeChange).toHaveBeenCalledWith("MINING");
  });

  it("should call onTypeChange with null when selecting 'All Types'", () => {
    const mockOnTypeChange = vi.fn();
    const props = createDefaultProps({
      selectedType: "MINING",
      onTypeChange: mockOnTypeChange,
    });
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    const allTypesOption = screen.getByRole("option", { name: "All Types" });
    fireEvent.click(allTypesOption);

    expect(mockOnTypeChange).toHaveBeenCalledWith(null);
  });

  it("should highlight selected type in dropdown", () => {
    const props = createDefaultProps({ selectedType: "PIRACY" });
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    const piracyOption = screen.getByRole("option", { name: "PIRACY" });
    expect(piracyOption).toHaveClass("bg-neon/20 text-neon");
  });

  it("should highlight 'All Types' when no type is selected", () => {
    const props = createDefaultProps({ selectedType: null });
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    const allTypesOption = screen.getByRole("option", { name: "All Types" });
    expect(allTypesOption).toHaveClass("bg-neon/20 text-neon");
  });

  it("should show down arrow when dropdown is closed", () => {
    const props = createDefaultProps();
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    expect(filterButton).toHaveTextContent("▼");
  });

  it("should show up arrow when dropdown is open", () => {
    const props = createDefaultProps();
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    expect(filterButton).toHaveTextContent("▲");
  });

  it("should set aria-expanded correctly when dropdown opens/closes", () => {
    const props = createDefaultProps();
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });

    // Initially closed
    expect(filterButton).toHaveAttribute("aria-expanded", "false");

    // Open dropdown
    fireEvent.click(filterButton);
    expect(filterButton).toHaveAttribute("aria-expanded", "true");
  });

  it("should work with all session types", () => {
    const mockOnTypeChange = vi.fn();
    const props = createDefaultProps({ onTypeChange: mockOnTypeChange });
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });

    const sessionTypes: SessionType[] = [
      "TRADING",
      "PIRACY",
      "SALVAGE",
      "MINING",
      "BOUNTY",
      "OTHER",
    ];

    sessionTypes.forEach((type) => {
      mockOnTypeChange.mockClear();
      fireEvent.click(filterButton);

      const option = screen.getByRole("option", { name: type });
      fireEvent.click(option);

      expect(mockOnTypeChange).toHaveBeenCalledWith(type);
    });
  });
});

describe("SessionFilters - Translations", () => {
  it("should render German translations", () => {
    const props = createDefaultProps({ translations: mockTranslationsDE });
    render(<SessionFilters {...props} />);

    expect(
      screen.getByPlaceholderText("Sessions durchsuchen...")
    ).toBeInTheDocument();
    expect(screen.getByText("Alle Typen")).toBeInTheDocument();
  });

  it("should render English translations", () => {
    const props = createDefaultProps({ translations: mockTranslationsEN });
    render(<SessionFilters {...props} />);

    expect(
      screen.getByPlaceholderText("Search sessions...")
    ).toBeInTheDocument();
    expect(screen.getByText("All Types")).toBeInTheDocument();
  });
});

describe("SessionFilters - Edge Cases", () => {
  it("should handle rapid search input changes", () => {
    const mockOnSearchChange = vi.fn();
    const props = createDefaultProps({ onSearchChange: mockOnSearchChange });
    render(<SessionFilters {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");

    // Simulate rapid typing
    for (let i = 0; i < 10; i++) {
      fireEvent.change(searchInput, { target: { value: `test${i}` } });
    }

    expect(mockOnSearchChange).toHaveBeenCalledTimes(10);
  });

  it("should handle special characters in search input", () => {
    const mockOnSearchChange = vi.fn();
    const props = createDefaultProps({ onSearchChange: mockOnSearchChange });
    render(<SessionFilters {...props} />);

    const searchInput = screen.getByPlaceholderText("Search sessions...");
    fireEvent.change(searchInput, {
      target: { value: "test@#$%^&*()[]{}|\\/<>?;:'\"" },
    });

    expect(mockOnSearchChange).toHaveBeenCalledWith(
      "test@#$%^&*()[]{}|\\/<>?;:'\""
    );
  });

  it("should handle empty translations gracefully", () => {
    const props = createDefaultProps({
      translations: {
        searchPlaceholder: "",
        filterByType: "",
        allTypes: "",
      },
    });

    // Should not throw
    expect(() => render(<SessionFilters {...props} />)).not.toThrow();
  });

  it("should maintain search input value when type filter changes", () => {
    const mockOnTypeChange = vi.fn();
    const props = createDefaultProps({
      searchQuery: "mining session",
      onTypeChange: mockOnTypeChange,
    });
    render(<SessionFilters {...props} />);

    // Open type dropdown and select a type
    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    const miningOption = screen.getByRole("option", { name: "MINING" });
    fireEvent.click(miningOption);

    // Search input should still have the same value
    const searchInput = screen.getByPlaceholderText("Search sessions...");
    expect(searchInput).toHaveValue("mining session");
  });

  it("should handle type change when search is active", () => {
    const mockOnSearchChange = vi.fn();
    const mockOnTypeChange = vi.fn();
    const props = createDefaultProps({
      searchQuery: "test",
      onSearchChange: mockOnSearchChange,
      onTypeChange: mockOnTypeChange,
    });
    render(<SessionFilters {...props} />);

    // Change type filter
    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    const tradingOption = screen.getByRole("option", { name: "TRADING" });
    fireEvent.click(tradingOption);

    expect(mockOnTypeChange).toHaveBeenCalledWith("TRADING");
    // Search callback should not be called
    expect(mockOnSearchChange).not.toHaveBeenCalled();
  });
});

describe("SessionFilters - Accessibility", () => {
  it("should have proper labels for screen readers", () => {
    const props = createDefaultProps();
    render(<SessionFilters {...props} />);

    const searchInput = screen.getByLabelText("Search sessions...");
    expect(searchInput).toBeInTheDocument();

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    expect(filterButton).toBeInTheDocument();
  });

  it("should have proper aria attributes on dropdown button", () => {
    const props = createDefaultProps();
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });

    expect(filterButton).toHaveAttribute("aria-haspopup", "listbox");
    expect(filterButton).toHaveAttribute("aria-expanded");
  });

  it("should mark selected option with aria-selected", () => {
    const props = createDefaultProps({ selectedType: "MINING" });
    render(<SessionFilters {...props} />);

    const filterButton = screen.getByRole("button", {
      name: "Filter by type",
    });
    fireEvent.click(filterButton);

    const miningOption = screen.getByRole("option", { name: "MINING" });
    expect(miningOption).toHaveAttribute("aria-selected", "true");
  });
});
