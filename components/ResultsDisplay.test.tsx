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
};

// Session with zero revenue for empty state testing
const zeroRevenueSession: SessionInput = {
  name: "Zero Revenue Session",
  type: "TRADING",
  distributionMode: "EQUAL",
  taxEnabled: true,
  taxRate: 0.005,
  members: [
    {
      id: "m1",
      handle: "Player 1",
      role: "Pilot",
      revenue: 0,
      investment: 0,
    },
    {
      id: "m2",
      handle: "Player 2",
      role: "Crew",
      revenue: 0,
      investment: 0,
    },
  ],
  sharedExpenses: [],
  individualExpenses: [],
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

describe('ResultsDisplay - CSV Export Buttons Rendering', () => {
  it('should render both CSV export buttons with German text', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}

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
    const sessionWithoutName = {
      ...mockSession,
      name: undefined,
    } as unknown as SessionInput;

    render(
      <ResultsDisplay
        result={mockResult}
        session={sessionWithoutName}

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
    const sessionWithoutName = {
      ...mockSession,
      name: undefined,
    } as unknown as SessionInput;

    render(
      <ResultsDisplay
        result={mockResult}
        session={sessionWithoutName}

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

describe('ResultsDisplay - Empty State Rendering', () => {
  it('should render empty state when all members have zero revenue', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={zeroRevenueSession}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // Should show the results heading
    expect(screen.getByText('Payout')).toBeInTheDocument();

    // Should show the empty state message
    expect(screen.getByText('No calculation yet')).toBeInTheDocument();
  });

  it('should render empty state with German translations', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={zeroRevenueSession}
        error={null}
        translations={translations.de}
        lang="de"
      />
    );

    // Should show the results heading
    expect(screen.getByText('Payout')).toBeInTheDocument();

    // Should show the German empty state message
    expect(screen.getByText('Noch keine Berechnung')).toBeInTheDocument();
  });

  it('should render empty state with English translations', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={zeroRevenueSession}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // Should show the results heading
    expect(screen.getByText('Payout')).toBeInTheDocument();

    // Should show the English empty state message
    expect(screen.getByText('No calculation yet')).toBeInTheDocument();
  });

  it('should render SVG icon in empty state', () => {
    const { container } = render(
      <ResultsDisplay
        result={mockResult}
        session={zeroRevenueSession}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // Should have an SVG element (the document/chart icon)
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('should not render CSV export buttons in empty state', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={zeroRevenueSession}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // CSV export buttons should not be present
    expect(screen.queryByText('Summary (CSV)')).not.toBeInTheDocument();
    expect(screen.queryByText('Detailed (CSV)')).not.toBeInTheDocument();
  });

  it('should not render result tables in empty state', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={zeroRevenueSession}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // Should not have any tables
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should not render empty state when error is present', () => {
    render(
      <ResultsDisplay
        result={null}
        session={zeroRevenueSession}
        error="Calculation failed"
        translations={translations.en}
        lang="en"
      />
    );

    // Should show error message, not empty state
    expect(screen.getByText('Calculation failed')).toBeInTheDocument();
    expect(screen.queryByText('No calculation yet')).not.toBeInTheDocument();
  });

  it('should not render empty state when result is present', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={mockSession}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // Should not show empty state message when there are results
    expect(screen.queryByText('No calculation yet')).not.toBeInTheDocument();
  });

  it('should apply custom className to empty state container', () => {
    const { container } = render(
      <ResultsDisplay
        result={mockResult}
        session={zeroRevenueSession}
        error={null}
        translations={translations.en}
        lang="en"
        className="custom-empty-class"
      />
    );

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('custom-empty-class');
  });

  it('should render description text in empty state (English)', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={zeroRevenueSession}
        error={null}
        translations={translations.en}
        lang="en"
      />
    );

    // Should show the description text
    expect(screen.getByText('Add members and enter revenue to calculate the payout distribution')).toBeInTheDocument();
  });

  it('should render description text in empty state (German)', () => {
    render(
      <ResultsDisplay
        result={mockResult}
        session={zeroRevenueSession}
        error={null}
        translations={translations.de}
        lang="de"
      />
    );

    // Should show the German description text
    expect(screen.getByText('Fügen Sie Mitglieder hinzu und geben Sie Umsätze ein, um die Auszahlung zu berechnen')).toBeInTheDocument();
  });
});
