import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResultsDisplay } from './ResultsDisplay';
import type { PayslipResult, SessionInput } from '@/lib/types';
import { translations } from '@/lib/i18n/translations';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as csvExport from '@/lib/csv/export';

// Mock the CSV export module
vi.mock('@/lib/csv/export', () => ({
  generateSummaryCSV: vi.fn(),
  generateDetailedCSV: vi.fn(),
  downloadCSV: vi.fn(),
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
  summaryStatistics: {
    minPayout: 9395,
    maxPayout: 13195,
    averagePayout: 11295,
    totalTransfers: 1,
    largestTransfer: 1005,
    highestEarner: "Pilot",
    lowestEarner: "Escort",
  },
};

const mockFeeByPayer = {
  m1: 5,
};

describe('ResultsDisplay - Basic Rendering', () => {
  it('should render the results heading with German translations', () => {
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

    expect(screen.getByText('Payout')).toBeInTheDocument();
  });

  it('should render the results heading with English translations', () => {
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

    expect(screen.getByText('Payout')).toBeInTheDocument();
  });

  it('should display error message when error is provided', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}
        feeByPayer={mockFeeByPayer}
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
        feeByPayer={{}}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('ResultsDisplay - Member Results Table', () => {
  it('should render table headers in German', () => {
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

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Check for table-specific headers (column names)
    expect(screen.getByText('Handle')).toBeInTheDocument();
    expect(screen.getByText('Gewinnanteil')).toBeInTheDocument();
    expect(screen.getByText('Überweisung')).toBeInTheDocument();

    // These labels appear in both table and summary, so just check they exist
    expect(screen.getAllByText('Umsatz').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Investment').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Kosten').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Steuern (Fees)').length).toBeGreaterThan(0);
  });

  it('should render table headers in English', () => {
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

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Check for table-specific headers (column names)
    expect(screen.getByText('Handle')).toBeInTheDocument();
    expect(screen.getByText('Profit Share')).toBeInTheDocument();
    expect(screen.getByText('Transfer')).toBeInTheDocument();

    // These labels appear in both table and summary, so just check they exist
    expect(screen.getAllByText('Revenue').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Investment').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Expenses').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Taxes (fees)').length).toBeGreaterThan(0);
  });

  it('should render member data rows', () => {
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

    // Member handles appear in both table and statistics, so use getAllByText
    expect(screen.getAllByText('Pilot').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Escort').length).toBeGreaterThan(0);
  });

  it('should format numbers with German locale', () => {
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

    // German locale uses periods as thousand separators
    expect(screen.getByText('10.000')).toBeInTheDocument();
  });

  it('should format numbers with English locale', () => {
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

    // English locale uses commas as thousand separators
    expect(screen.getByText('10,000')).toBeInTheDocument();
  });

  it('should display individual expense details', () => {
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

    // English locale: "Repairs: 200"
    expect(screen.getByText(/Repairs: 200/)).toBeInTheDocument();
  });

  it('should display positive net amount in green (neon)', () => {
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

    // Net for Pilot: 13200 - 5 = 13195
    const netElements = screen.getAllByText('13,195');
    expect(netElements.length).toBeGreaterThan(0);
    const netElement = netElements[0];
    expect(netElement).toHaveClass('text-neon');
  });

  it('should display negative net amount in red', () => {
    const negativeResult: PayslipResult = {
      saleRevenue: 100,
      netProfit: -400,
      taxRateApplied: 0,
      members: [
        {
          memberId: "m1",
          handle: "Pilot",
          revenue: 100,
          investment: 0,
          expenses: 500,
          sharedExpenses: 500,
          individualExpenses: 0,
          profitShare: -400,
          finalNet: -400,
        },
      ],
      suggestedTransfers: [],
    };

    const negativeSession: SessionInput = {
      ...mockSession,
      members: [{ id: "m1", handle: "Pilot", revenue: 100, investment: 0 }],
      individualExpenses: [],
    };

    render(
      <ResultsDisplay
        result={negativeResult}
        session={negativeSession}
        feeByPayer={{}}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // Net for Pilot: -400 - appears multiple times, find the one in the table
    const table = screen.getByRole('table');
    const negativeNetElement = table.querySelector('.text-red-400');
    expect(negativeNetElement).toBeInTheDocument();
    expect(negativeNetElement?.textContent).toContain('-400');
  });

  it('should calculate net after taxes correctly', () => {
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

    // Pilot: finalNet (13200) - taxes (5) = 13195
    expect(screen.getByText('13,195')).toBeInTheDocument();

    // Escort: finalNet (9400) - taxes (0) = 9400
    expect(screen.getByText('9,400')).toBeInTheDocument();
  });

  it('should display dash when member has no individual expenses', () => {
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

    // Escort has no individual expenses, so should show "-"
    const table = screen.getByRole('table');
    const rows = table.querySelectorAll('tbody tr');
    const escortRow = rows[1]; // Second row
    const expenseCell = escortRow.querySelectorAll('td')[3]; // Expenses column
    const expenseDetail = expenseCell.querySelector('.text-xs');
    expect(expenseDetail).toHaveTextContent('-');
  });
});

describe('ResultsDisplay - Currency Display', () => {
  it('should display default currency aUEC', () => {
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

    const currencyElements = screen.getAllByText(/aUEC/);
    expect(currencyElements.length).toBeGreaterThan(0);
  });

  it('should display custom currency when provided', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}
        feeByPayer={mockFeeByPayer}
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
        feeByPayer={mockFeeByPayer}
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
        feeByPayer={{}}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    const table = screen.getByRole('table');
    const tbody = table.querySelector('tbody');
    expect(tbody?.children.length).toBe(0);
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
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // Should render without errors - member name appears in multiple places
    expect(screen.getAllByText('Pilot').length).toBeGreaterThan(0);
  });
});

describe('ResultsDisplay - CSV Export Buttons Rendering', () => {
  it('should render both CSV export buttons with German text', () => {
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

    expect(screen.getByText('Zusammenfassung (CSV)')).toBeInTheDocument();
    expect(screen.getByText('Detailliert (CSV)')).toBeInTheDocument();
  });

  it('should render both CSV export buttons with English text', () => {
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

    expect(screen.getByText('Summary (CSV)')).toBeInTheDocument();
    expect(screen.getByText('Detailed (CSV)')).toBeInTheDocument();
  });

  it('should not render CSV export buttons when result is null', () => {
    render(
      <ResultsDisplay
        result={null}
        session={mockSession}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    expect(screen.queryByText('Summary (CSV)')).not.toBeInTheDocument();
    expect(screen.queryByText('Detailed (CSV)')).not.toBeInTheDocument();
  });

  it('should render CSV export buttons with proper styling', () => {
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

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    const detailedButton = screen.getByRole('button', { name: /Download detailed data as CSV/i });

    expect(summaryButton).toHaveClass('bg-white/5', 'border', 'border-white/10', 'rounded-2xl');
    expect(detailedButton).toHaveClass('bg-white/5', 'border', 'border-white/10', 'rounded-2xl');
  });

  it('should render CSV export buttons with SVG icons', () => {
    const { container } = render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    const svgElements = container.querySelectorAll('svg');
    // There should be multiple SVGs (2 for CSV buttons plus any others in the component)
    expect(svgElements.length).toBeGreaterThanOrEqual(2);
  });
});

describe('ResultsDisplay - CSV Export Button Tooltips', () => {
  it('should have German tooltip on summary CSV export button', () => {
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

    const summaryButton = screen.getByRole('button', { name: /Zusammenfassung als CSV herunterladen/i });
    expect(summaryButton).toHaveAttribute('title', 'Zusammenfassung als CSV herunterladen');
    expect(summaryButton).toHaveAttribute('aria-label', 'Zusammenfassung als CSV herunterladen');
  });

  it('should have German tooltip on detailed CSV export button', () => {
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

    const detailedButton = screen.getByRole('button', { name: /Detaillierte Daten als CSV herunterladen/i });
    expect(detailedButton).toHaveAttribute('title', 'Detaillierte Daten als CSV herunterladen');
    expect(detailedButton).toHaveAttribute('aria-label', 'Detaillierte Daten als CSV herunterladen');
  });

  it('should have English tooltip on summary CSV export button', () => {
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

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    expect(summaryButton).toHaveAttribute('title', 'Download summary as CSV');
    expect(summaryButton).toHaveAttribute('aria-label', 'Download summary as CSV');
  });

  it('should have English tooltip on detailed CSV export button', () => {
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

    const detailedButton = screen.getByRole('button', { name: /Download detailed data as CSV/i });
    expect(detailedButton).toHaveAttribute('title', 'Download detailed data as CSV');
    expect(detailedButton).toHaveAttribute('aria-label', 'Download detailed data as CSV');
  });
});

describe('ResultsDisplay - CSV Export Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock implementations
    vi.mocked(csvExport.generateSummaryCSV).mockReturnValue('mock,csv,data\n1,2,3');
    vi.mocked(csvExport.generateDetailedCSV).mockReturnValue('mock,detailed,csv\n4,5,6');
    vi.mocked(csvExport.downloadCSV).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call generateSummaryCSV when summary button is clicked', () => {
    const sessionWithName: SessionInput = {
      ...mockSession,
      name: 'Test Trading Session',
    };

    render(
      <ResultsDisplay
        result={mockResult}
        session={sessionWithName}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    fireEvent.click(summaryButton);

    expect(csvExport.generateSummaryCSV).toHaveBeenCalledTimes(1);
    expect(csvExport.generateSummaryCSV).toHaveBeenCalledWith(
      mockResult,
      'Test Trading Session',
      'aUEC'
    );
  });

  it('should call generateDetailedCSV when detailed button is clicked', () => {
    const sessionWithName: SessionInput = {
      ...mockSession,
      name: 'Test Trading Session',
    };

    render(
      <ResultsDisplay
        result={mockResult}
        session={sessionWithName}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    const detailedButton = screen.getByRole('button', { name: /Download detailed data as CSV/i });
    fireEvent.click(detailedButton);

    expect(csvExport.generateDetailedCSV).toHaveBeenCalledTimes(1);
    expect(csvExport.generateDetailedCSV).toHaveBeenCalledWith(
      mockResult,
      'Test Trading Session',
      'aUEC'
    );
  });

  it('should call downloadCSV after generating summary CSV', () => {
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

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    fireEvent.click(summaryButton);

    expect(csvExport.downloadCSV).toHaveBeenCalledTimes(1);
    expect(csvExport.downloadCSV).toHaveBeenCalledWith('mock,csv,data\n1,2,3', 'sc-payslip-summary');
  });

  it('should call downloadCSV after generating detailed CSV', () => {
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

    const detailedButton = screen.getByRole('button', { name: /Download detailed data as CSV/i });
    fireEvent.click(detailedButton);

    expect(csvExport.downloadCSV).toHaveBeenCalledTimes(1);
    expect(csvExport.downloadCSV).toHaveBeenCalledWith('mock,detailed,csv\n4,5,6', 'sc-payslip-detailed');
  });

  it('should use custom currency when provided for summary export', () => {
    const sessionWithName: SessionInput = {
      ...mockSession,
      name: 'Test Session',
    };

    render(
      <ResultsDisplay
        result={mockResult}
        session={sessionWithName}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
        currency="UEC"
      />
    );

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    fireEvent.click(summaryButton);

    expect(csvExport.generateSummaryCSV).toHaveBeenCalledWith(mockResult, 'Test Session', 'UEC');
  });

  it('should use custom currency when provided for detailed export', () => {
    const sessionWithName: SessionInput = {
      ...mockSession,
      name: 'Test Session',
    };

    render(
      <ResultsDisplay
        result={mockResult}
        session={sessionWithName}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
        currency="USD"
      />
    );

    const detailedButton = screen.getByRole('button', { name: /Download detailed data as CSV/i });
    fireEvent.click(detailedButton);

    expect(csvExport.generateDetailedCSV).toHaveBeenCalledWith(mockResult, 'Test Session', 'USD');
  });

  it('should use "Untitled Session" as default session name for summary export', () => {
    const sessionWithoutName: SessionInput = {
      ...mockSession,
      name: '',
    };

    render(
      <ResultsDisplay
        result={mockResult}
        session={sessionWithoutName}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    fireEvent.click(summaryButton);

    expect(csvExport.generateSummaryCSV).toHaveBeenCalledWith(
      mockResult,
      'Untitled Session',
      'aUEC'
    );
  });

  it('should use "Untitled Session" as default session name for detailed export', () => {
    const sessionWithoutName: SessionInput = {
      ...mockSession,
      name: '',
    };

    render(
      <ResultsDisplay
        result={mockResult}
        session={sessionWithoutName}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    const detailedButton = screen.getByRole('button', { name: /Download detailed data as CSV/i });
    fireEvent.click(detailedButton);

    expect(csvExport.generateDetailedCSV).toHaveBeenCalledWith(
      mockResult,
      'Untitled Session',
      'aUEC'
    );
  });

  it('should not call export functions when result is null', () => {
    render(
      <ResultsDisplay
        result={null}
        session={mockSession}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // Buttons should not exist when result is null
    expect(screen.queryByRole('button', { name: /Download summary as CSV/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Download detailed data as CSV/i })).not.toBeInTheDocument();
  });
});

describe('ResultsDisplay - CSV Export Error Handling', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should catch and log errors when summary CSV generation fails', () => {
    vi.mocked(csvExport.generateSummaryCSV).mockImplementation(() => {
      throw new Error('CSV generation failed');
    });

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

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    fireEvent.click(summaryButton);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to export summary CSV:',
      expect.any(Error)
    );
  });

  it('should catch and log errors when detailed CSV generation fails', () => {
    vi.mocked(csvExport.generateDetailedCSV).mockImplementation(() => {
      throw new Error('CSV generation failed');
    });

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

    const detailedButton = screen.getByRole('button', { name: /Download detailed data as CSV/i });
    fireEvent.click(detailedButton);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to export detailed CSV:',
      expect.any(Error)
    );
  });

  it('should not call downloadCSV when summary generation fails', () => {
    vi.mocked(csvExport.generateSummaryCSV).mockImplementation(() => {
      throw new Error('CSV generation failed');
    });

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

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    fireEvent.click(summaryButton);

    expect(csvExport.downloadCSV).not.toHaveBeenCalled();
  });

  it('should not call downloadCSV when detailed generation fails', () => {
    vi.mocked(csvExport.generateDetailedCSV).mockImplementation(() => {
      throw new Error('CSV generation failed');
    });

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

    const detailedButton = screen.getByRole('button', { name: /Download detailed data as CSV/i });
    fireEvent.click(detailedButton);

    expect(csvExport.downloadCSV).not.toHaveBeenCalled();
  });

  it('should handle errors when downloadCSV fails for summary', () => {
    vi.mocked(csvExport.generateSummaryCSV).mockReturnValue('mock,csv,data');
    vi.mocked(csvExport.downloadCSV).mockImplementation(() => {
      throw new Error('Download failed');
    });

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

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    fireEvent.click(summaryButton);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to export summary CSV:',
      expect.any(Error)
    );
  });

  it('should handle errors when downloadCSV fails for detailed', () => {
    vi.mocked(csvExport.generateDetailedCSV).mockReturnValue('mock,detailed,csv');
    vi.mocked(csvExport.downloadCSV).mockImplementation(() => {
      throw new Error('Download failed');
    });

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

    const detailedButton = screen.getByRole('button', { name: /Download detailed data as CSV/i });
    fireEvent.click(detailedButton);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to export detailed CSV:',
      expect.any(Error)
    );
  });
});

describe('ResultsDisplay - CSV Export Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(csvExport.generateSummaryCSV).mockReturnValue('mock,csv,data');
    vi.mocked(csvExport.generateDetailedCSV).mockReturnValue('mock,detailed,csv');
    vi.mocked(csvExport.downloadCSV).mockImplementation(() => {});
  });

  it('should handle export with empty session name', () => {
    const sessionWithEmptyName: SessionInput = {
      ...mockSession,
      name: '',
    };

    render(
      <ResultsDisplay
        result={mockResult}
        session={sessionWithEmptyName}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    fireEvent.click(summaryButton);

    expect(csvExport.generateSummaryCSV).toHaveBeenCalledWith(
      mockResult,
      'Untitled Session',
      'aUEC'
    );
  });

  it('should handle multiple clicks on summary button', () => {
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

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    fireEvent.click(summaryButton);
    fireEvent.click(summaryButton);
    fireEvent.click(summaryButton);

    expect(csvExport.generateSummaryCSV).toHaveBeenCalledTimes(3);
    expect(csvExport.downloadCSV).toHaveBeenCalledTimes(3);
  });

  it('should handle multiple clicks on detailed button', () => {
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

    const detailedButton = screen.getByRole('button', { name: /Download detailed data as CSV/i });
    fireEvent.click(detailedButton);
    fireEvent.click(detailedButton);

    expect(csvExport.generateDetailedCSV).toHaveBeenCalledTimes(2);
    expect(csvExport.downloadCSV).toHaveBeenCalledTimes(2);
  });

  it('should handle alternating clicks between summary and detailed buttons', () => {
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

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    const detailedButton = screen.getByRole('button', { name: /Download detailed data as CSV/i });

    fireEvent.click(summaryButton);
    fireEvent.click(detailedButton);
    fireEvent.click(summaryButton);

    expect(csvExport.generateSummaryCSV).toHaveBeenCalledTimes(2);
    expect(csvExport.generateDetailedCSV).toHaveBeenCalledTimes(1);
    expect(csvExport.downloadCSV).toHaveBeenCalledTimes(3);
  });

  it('should handle export with special characters in session name', () => {
    const sessionWithSpecialChars: SessionInput = {
      ...mockSession,
      name: 'Test "Session" with, commas & quotes',
    };

    render(
      <ResultsDisplay
        result={mockResult}
        session={sessionWithSpecialChars}
        feeByPayer={mockFeeByPayer}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    const summaryButton = screen.getByRole('button', { name: /Download summary as CSV/i });
    fireEvent.click(summaryButton);

    expect(csvExport.generateSummaryCSV).toHaveBeenCalledWith(
      mockResult,
      'Test "Session" with, commas & quotes',
      'aUEC'
    );
  });
});
