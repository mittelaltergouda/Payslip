import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResultsDisplay } from './ResultsDisplay';
import type { PayslipResult, SessionInput } from '@/lib/types';
import { translations } from '@/lib/i18n/translations';
import { calculatePayslip } from '@/lib/calc';
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
  it('does not show tiny rounding residuals', () => {
    render(
      <ResultsDisplay
        result={{
          ...mockResult,
          unsettledBalances: [
            { memberId: 'm1', amount: -1 },
            { memberId: 'm2', amount: 1 },
          ],
        }}
        session={mockSession}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/Unsettled balances/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Residual|excess retained|still to receive/)).not.toBeInTheDocument();
  });

  it('should explain suspended fixed amounts on a loss session', () => {
    render(
      <ResultsDisplay
        result={{ ...mockResult, fixedAmountsStatus: 'SUSPENDED_FOR_LOSS' }}
        session={mockSession}
        error={null}
        translations={translations.de}
        lang="de"
      />
    );

    expect(screen.getByRole('note')).toHaveTextContent('Verlust-Session: Fixbeträge ausgesetzt');
  });

  it('should explain proportionally cut fixed amounts when profit is too small', () => {
    render(
      <ResultsDisplay
        result={{ ...mockResult, fixedAmountsStatus: 'SCALED_TO_PROFIT' }}
        session={mockSession}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.getByRole('note')).toHaveTextContent('Fixed amounts reduced proportionally');
  });

  it('should show no fixed-amount note when fixed amounts were applied in full', () => {
    render(
      <ResultsDisplay
        result={{ ...mockResult, fixedAmountsStatus: 'APPLIED' }}
        session={mockSession}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

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

describe('ResultsDisplay - summary counts all service fees', () => {
  it('includes fees of transfers already made in Service Fees and net profit', () => {
    const session = {
      name: 'SC Session', type: 'TRADING' as const, distributionMode: 'EQUAL' as const, taxEnabled: true, taxRate: 0.005,
      members: [
        { id: 'p1', handle: 'Player 1', revenue: 1_000_000, investment: 100_000 },
        { id: 'p2', handle: 'Player 2', revenue: 2_000_000, investment: 200_000 },
      ],
      individualExpenses: [
        { id: 'e1', memberId: 'p1', label: 'Kosten', amount: 10_000 },
        { id: 'e2', memberId: 'p2', label: 'Kosten', amount: 20_000 },
      ],
      paidTransfers: [{ id: 't', fromMemberId: 'p2', toMemberId: 'p1', netAmount: 1_000_000, feeAmount: 5_000, feeIncluded: true, kind: 'SETTLEMENT' as const }],
    };
    render(<ResultsDisplay session={session} result={calculatePayslip(session)} error={null} translations={translations.de} lang="de" />);
    const summary = screen.getByRole('status', { name: translations.de.summary });
    expect(summary).toHaveTextContent('Gewinn (Brutto)2.670.000 aUEC');
    expect(summary).toHaveTextContent('Service Fees7.787 aUEC');
    expect(summary).toHaveTextContent('Gewinn (Netto)2.662.213 aUEC');
  });
});
