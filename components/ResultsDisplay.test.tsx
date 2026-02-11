import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResultsDisplay } from './ResultsDisplay';
import type { PayslipResult, SessionInput } from '@/lib/types';
import { translations } from '@/lib/i18n/translations';
import { describe, it, expect, vi } from 'vitest';

// Mock the ExportCSVButton component
vi.mock('./ExportCSVButton', () => ({
  ExportCSVButton: ({ lang }: { lang: string }) => (
    <button type="button" data-testid="export-csv-button">
      {lang === 'de' ? 'CSV exportieren' : 'Export CSV'}
    </button>
  ),
}));

const mockSession: SessionInput = {
  name: "Test Session",
  type: "TRADING",
  distributionMode: "EQUAL",
  taxEnabled: true,
  taxRate: 0.005,
  members: [
    {
      id: "m1",
      handle: "Pilot",
      role: "Captain",
      revenue: 10000,
      investment: 2000,
    },
    {
      id: "m2",
      handle: "Escort",
      role: "Guard",
      revenue: 5000,
      investment: 1000,
    },
  ],
  sharedExpenses: [
    { id: "e1", label: "Fuel", amount: 500 },
  ],
  individualExpenses: [
    { id: "ie1", memberId: "m1", label: "Repairs", amount: 200 },
  ],
};

const mockResult: PayslipResult = {
  saleRevenue: 15000,
  netProfit: 11300,
  taxRateApplied: 0.005,
  members: [
    {
      memberId: "m1",
      handle: "Pilot",
      role: "Captain",
      revenue: 10000,
      investment: 2000,
      expenses: 450,
      sharedExpenses: 250,
      individualExpenses: 200,
      profitShare: 5650,
      finalNet: 13200,
    },
    {
      memberId: "m2",
      handle: "Escort",
      role: "Guard",
      revenue: 5000,
      investment: 1000,
      expenses: 250,
      sharedExpenses: 250,
      individualExpenses: 0,
      profitShare: 5650,
      finalNet: 9400,
    },
  ],
  suggestedTransfers: [
    {
      fromMemberId: "m1",
      toMemberId: "m2",
      netAmount: 1000,
      grossAmount: 1005,
      feeAmount: 5,
    },
  ],
};

describe('ResultsDisplay - Basic Rendering', () => {
  it('should render the results heading with German translations', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}

        error={null}
        translations={translations.de}
        lang="de"
      />
    );

    expect(screen.getByText('Payout')).toBeInTheDocument();
  });

  it('should render the results heading with English translations', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}

        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Payout')).toBeInTheDocument();
  });

  it('should display error message when error is provided', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}

        error="Calculation failed"
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByText('Calculation failed')).toBeInTheDocument();
  });

  it('should not render result tables when result is null', () => {
    render(
      <ResultsDisplay
        result={null}
        session={mockSession}

        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('ResultsDisplay - Currency Display', () => {
  it('should display default currency aUEC', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}

        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    const currencyElements = screen.getAllByText(/aUEC/);
    expect(currencyElements.length).toBeGreaterThan(0);
  });

  it('should display custom currency when provided', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}

        error={null}
        translations={translations.en}
        lang="en"
        currency="UEC"
      />
    );

    const currencyElements = screen.getAllByText(/UEC/);
    expect(currencyElements.length).toBeGreaterThan(0);
  });
});

describe('ResultsDisplay - Custom Class Name', () => {
  it('should apply custom className', () => {
    const { container } = render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}

        error={null}
        translations={translations.en}
        lang="en"
        className="custom-class"
      />
    );

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('custom-class');
  });
});

describe('ResultsDisplay - Empty States', () => {
  it('should handle empty members array', () => {
    const emptyResult: PayslipResult = {
      ...mockResult,
      members: [],
    };

    const emptySession: SessionInput = {
      ...mockSession,
      members: [],
    };

    render(
      <ResultsDisplay
        result={emptyResult}
        session={emptySession}

        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // Should render without errors
    expect(screen.getByText('Payout')).toBeInTheDocument();
  });

  it('should handle missing individual expenses array', () => {
    const sessionWithoutIndividualExpenses: SessionInput = {
      ...mockSession,
      individualExpenses: undefined,
    };

    render(
      <ResultsDisplay
        result={mockResult}
        session={sessionWithoutIndividualExpenses}

        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // Should render without errors
    expect(screen.getByText('Payout')).toBeInTheDocument();
  });
});

describe('ResultsDisplay - CSV Export Button', () => {
  it('should render CSV export button when result is provided', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}

        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // The mocked ExportCSVButton renders a button with this text
    expect(screen.getByTestId('export-csv-button')).toBeInTheDocument();
  });

  it('should render CSV export button with German text when lang is de', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.de}
        lang="de"
      />
    );

    // The mocked ExportCSVButton shows different text based on lang
    const csvButton = screen.getByTestId('export-csv-button');
    expect(csvButton).toHaveTextContent('CSV exportieren');
  });

  it('should render CSV export button with English text when lang is en', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // The mocked ExportCSVButton shows different text based on lang
    const csvButton = screen.getByTestId('export-csv-button');
    expect(csvButton).toHaveTextContent('Export CSV');
  });

  it('should not render CSV export button when result is null', () => {
    render(
      <ResultsDisplay
        result={null}
        session={mockSession}

        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // CSV button should not exist when result is null
    expect(screen.queryByTestId('export-csv-button')).not.toBeInTheDocument();
  });
});
