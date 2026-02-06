import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SessionListItem } from "./SessionListItem";
import type { SessionListItemData } from "./SessionListItem";
import { describe, it, expect } from "vitest";

// Mock translations
const mockTranslationsDE = {
  members: "Mitglieder",
  revenueLabel: "Umsatz",
  deleteSession: "Löschen",
};

const mockTranslationsEN = {
  members: "Members",
  revenueLabel: "Revenue",
  deleteSession: "Delete",
};

// Sample session data
const sampleSession: SessionListItemData = {
  id: "session-123",
  name: "Mining Session Alpha",
  type: "MINING",
  createdAt: "2024-01-15T10:30:00.000Z",
  totalRevenue: 150000,
  memberCount: 4,
};

describe("SessionListItem - Initial Rendering", () => {
  it("should render session name", () => {
    render(
      <SessionListItem
        session={sampleSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("Mining Session Alpha")).toBeInTheDocument();
  });

  it("should render session type badge", () => {
    render(
      <SessionListItem
        session={sampleSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("MINING")).toBeInTheDocument();
  });

  it("should render formatted date in English", () => {
    render(
      <SessionListItem
        session={sampleSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Check that some form of the date is displayed (Jan 15, 2024)
    const dateText = screen.getByText(/Jan.*15.*2024/i);
    expect(dateText).toBeInTheDocument();
  });

  it("should render formatted date in German", () => {
    render(
      <SessionListItem
        session={sampleSession}
        lang="de"
        translations={mockTranslationsDE}
      />
    );

    // Check that some form of the date is displayed (15. Jan. 2024)
    const dateText = screen.getByText(/15.*Jan.*2024/i);
    expect(dateText).toBeInTheDocument();
  });

  it("should render revenue with label", () => {
    render(
      <SessionListItem
        session={sampleSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("Revenue:")).toBeInTheDocument();
    expect(screen.getByText(/150\.0k aUEC/i)).toBeInTheDocument();
  });

  it("should render member count with label", () => {
    render(
      <SessionListItem
        session={sampleSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("Members:")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("should render with German translations", () => {
    render(
      <SessionListItem
        session={sampleSession}
        lang="de"
        translations={mockTranslationsDE}
      />
    );

    expect(screen.getByText("Umsatz:")).toBeInTheDocument();
    expect(screen.getByText("Mitglieder:")).toBeInTheDocument();
  });
});

describe("SessionListItem - Session Types", () => {
  it("should render TRADING type badge", () => {
    const tradingSession = { ...sampleSession, type: "TRADING" as const };
    render(
      <SessionListItem
        session={tradingSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("TRADING")).toBeInTheDocument();
  });

  it("should render PIRACY type badge", () => {
    const piracySession = { ...sampleSession, type: "PIRACY" as const };
    render(
      <SessionListItem
        session={piracySession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("PIRACY")).toBeInTheDocument();
  });

  it("should render SALVAGE type badge", () => {
    const salvageSession = { ...sampleSession, type: "SALVAGE" as const };
    render(
      <SessionListItem
        session={salvageSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("SALVAGE")).toBeInTheDocument();
  });

  it("should render MINING type badge", () => {
    const miningSession = { ...sampleSession, type: "MINING" as const };
    render(
      <SessionListItem
        session={miningSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("MINING")).toBeInTheDocument();
  });

  it("should render BOUNTY type badge", () => {
    const bountySession = { ...sampleSession, type: "BOUNTY" as const };
    render(
      <SessionListItem
        session={bountySession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("BOUNTY")).toBeInTheDocument();
  });

  it("should render OTHER type badge", () => {
    const otherSession = { ...sampleSession, type: "OTHER" as const };
    render(
      <SessionListItem
        session={otherSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("OTHER")).toBeInTheDocument();
  });
});

describe("SessionListItem - Revenue Formatting", () => {
  it("should format small revenue values", () => {
    const smallRevenueSession = { ...sampleSession, totalRevenue: 500 };
    render(
      <SessionListItem
        session={smallRevenueSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("500 aUEC")).toBeInTheDocument();
  });

  it("should format thousands with k suffix", () => {
    const thousandsSession = { ...sampleSession, totalRevenue: 5500 };
    render(
      <SessionListItem
        session={thousandsSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText(/5\.5k aUEC/i)).toBeInTheDocument();
  });

  it("should format millions with M suffix", () => {
    const millionsSession = { ...sampleSession, totalRevenue: 2500000 };
    render(
      <SessionListItem
        session={millionsSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText(/2\.5M aUEC/i)).toBeInTheDocument();
  });

  it("should format billions with B suffix", () => {
    const billionsSession = { ...sampleSession, totalRevenue: 1500000000 };
    render(
      <SessionListItem
        session={billionsSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText(/1\.5B aUEC/i)).toBeInTheDocument();
  });

  it("should use German decimal separator for compact numbers", () => {
    const session = { ...sampleSession, totalRevenue: 5500 };
    render(
      <SessionListItem
        session={session}
        lang="de"
        translations={mockTranslationsDE}
      />
    );

    expect(screen.getByText(/5,5k aUEC/i)).toBeInTheDocument();
  });
});

describe("SessionListItem - Member Count", () => {
  it("should display single member count", () => {
    const singleMemberSession = { ...sampleSession, memberCount: 1 };
    render(
      <SessionListItem
        session={singleMemberSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should display zero members", () => {
    const zeroMemberSession = { ...sampleSession, memberCount: 0 };
    render(
      <SessionListItem
        session={zeroMemberSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should display large member count", () => {
    const largeMemberSession = { ...sampleSession, memberCount: 50 };
    render(
      <SessionListItem
        session={largeMemberSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("50")).toBeInTheDocument();
  });
});

describe("SessionListItem - Navigation", () => {
  it("should render as a link to the session page", () => {
    const { container } = render(
      <SessionListItem
        session={sampleSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const link = container.querySelector('a[href="/session/session-123"]');
    expect(link).toBeInTheDocument();
  });

  it("should link to correct session ID", () => {
    const customSession = { ...sampleSession, id: "custom-id-456" };
    const { container } = render(
      <SessionListItem
        session={customSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    const link = container.querySelector('a[href="/session/custom-id-456"]');
    expect(link).toBeInTheDocument();
  });
});

describe("SessionListItem - Edge Cases", () => {
  it("should handle very long session names", () => {
    const longNameSession = {
      ...sampleSession,
      name: "This is a very long session name that should wrap to multiple lines without breaking the layout",
    };
    render(
      <SessionListItem
        session={longNameSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(
      screen.getByText(
        "This is a very long session name that should wrap to multiple lines without breaking the layout"
      )
    ).toBeInTheDocument();
  });

  it("should handle zero revenue", () => {
    const zeroRevenueSession = { ...sampleSession, totalRevenue: 0 };
    render(
      <SessionListItem
        session={zeroRevenueSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText("0 aUEC")).toBeInTheDocument();
  });

  it("should handle negative revenue", () => {
    const negativeRevenueSession = { ...sampleSession, totalRevenue: -5000 };
    render(
      <SessionListItem
        session={negativeRevenueSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    expect(screen.getByText(/-5\.0k aUEC/i)).toBeInTheDocument();
  });

  it("should handle future dates", () => {
    const futureSession = {
      ...sampleSession,
      createdAt: "2025-06-15T12:00:00.000Z",
    };
    render(
      <SessionListItem
        session={futureSession}
        lang="en"
        translations={mockTranslationsEN}
      />
    );

    // Check that the date is displayed (should contain Jun and 2025)
    const dateText = screen.getByText(/Jun.*2025/i);
    expect(dateText).toBeInTheDocument();
  });
});
