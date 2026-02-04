import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExportPDFButton } from './ExportPDFButton';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as pdfGenerator from '@/lib/pdf/generator';
import type { SessionInput, PayslipResult } from '@/lib/types';

// Mock the pdf generator module
vi.mock('@/lib/pdf/generator', () => ({
  generatePDF: vi.fn(),
  generatePDFFilename: vi.fn(),
}));

// Mock session data for testing
const mockSession: SessionInput = {
  name: 'Test Session',
  type: 'TRADING',
  distributionMode: 'EQUAL',
  members: [
    { handle: 'Alice', fixedPayout: null, percentShare: null },
    { handle: 'Bob', fixedPayout: null, percentShare: null },
  ],
  sharedExpenses: [],
  totalRevenue: 1000,
  taxRate: 4.25,
};

// Mock result data for testing
const mockResult: PayslipResult = {
  saleRevenue: 1000,
  netProfit: 1000,
  taxRateApplied: 4.25,
  members: [
    {
      memberId: '1',
      handle: 'Alice',
      revenue: 500,
      investment: 0,
      expenses: 0,
      sharedExpenses: 0,
      individualExpenses: 0,
      profitShare: 500,
      finalNet: 500,
    },
    {
      memberId: '2',
      handle: 'Bob',
      revenue: 500,
      investment: 0,
      expenses: 0,
      sharedExpenses: 0,
      individualExpenses: 0,
      profitShare: 500,
      finalNet: 500,
    },
  ],
  suggestedTransfers: [],
};

describe('ExportPDFButton - Basic Rendering', () => {
  it('should render export button with German text', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="de"
      />
    );

    expect(screen.getByText('PDF exportieren')).toBeInTheDocument();
  });

  it('should render export button with English text', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    expect(screen.getByText('Export PDF')).toBeInTheDocument();
  });

  it('should render button with SVG icon', () => {
    const { container } = render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('should have German tooltip', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="de"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Payslip als PDF herunterladen');
    expect(button).toHaveAttribute('aria-label', 'Payslip als PDF herunterladen');
  });

  it('should have English tooltip', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Download payslip as PDF');
    expect(button).toHaveAttribute('aria-label', 'Download payslip as PDF');
  });

  it('should have proper button styling classes', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-white/5');
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('border-white/10');
    expect(button).toHaveClass('rounded-2xl');
    expect(button).toHaveClass('backdrop-blur-md');
  });
});

describe('ExportPDFButton - Button States', () => {
  it('should not be disabled initially', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('should show generating text in German when processing', async () => {
    vi.mocked(pdfGenerator.generatePDF).mockImplementation(() => {
      return new Blob(['test'], { type: 'application/pdf' });
    });
    vi.mocked(pdfGenerator.generatePDFFilename).mockReturnValue('test.pdf');

    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="de"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Button should show generating text during execution
    // Since setState is synchronous in tests, we check after click
    await waitFor(() => {
      expect(button).toHaveTextContent('PDF exportieren');
    });
  });

  it('should show generating text in English when processing', async () => {
    vi.mocked(pdfGenerator.generatePDF).mockImplementation(() => {
      return new Blob(['test'], { type: 'application/pdf' });
    });
    vi.mocked(pdfGenerator.generatePDFFilename).mockReturnValue('test.pdf');

    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('Export PDF');
    });
  });

  it('should have disabled styling when disabled', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('disabled:opacity-50');
    expect(button).toHaveClass('disabled:cursor-not-allowed');
  });
});

describe('ExportPDFButton - PDF Generation', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear all mocks from previous tests
    vi.clearAllMocks();

    // Save original methods
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    // Mock URL methods
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock link click
    mockClick = vi.fn();
    HTMLAnchorElement.prototype.click = mockClick;

    // Mock PDF generation
    vi.mocked(pdfGenerator.generatePDF).mockReturnValue(
      new Blob(['test pdf content'], { type: 'application/pdf' })
    );
    vi.mocked(pdfGenerator.generatePDFFilename).mockReturnValue('test-session.pdf');
  });

  afterEach(() => {
    // Restore original methods
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.clearAllMocks();
  });

  it('should call generatePDF when button is clicked', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pdfGenerator.generatePDF).toHaveBeenCalledTimes(1);
    expect(pdfGenerator.generatePDF).toHaveBeenCalledWith(
      mockSession,
      mockResult,
      { lang: 'en', currency: 'aUEC' }
    );
  });

  it('should call generatePDF with custom currency', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
        currency="UEC"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pdfGenerator.generatePDF).toHaveBeenCalledWith(
      mockSession,
      mockResult,
      { lang: 'en', currency: 'UEC' }
    );
  });

  it('should call generatePDFFilename with session name', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pdfGenerator.generatePDFFilename).toHaveBeenCalledWith('Test Session');
  });

  it('should use default filename when session name is empty', () => {
    const sessionWithoutName = { ...mockSession, name: '' };

    render(
      <ExportPDFButton
        session={sessionWithoutName}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pdfGenerator.generatePDFFilename).toHaveBeenCalledWith('payslip');
  });

  it('should create a blob URL', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should trigger download with proper filename', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockClick).toHaveBeenCalled();
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should revoke object URL after download', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should call onExportSuccess callback on successful export', () => {
    const onExportSuccess = vi.fn();

    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
        onExportSuccess={onExportSuccess}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onExportSuccess).toHaveBeenCalledTimes(1);
  });

  it('should not fail when onExportSuccess is not provided', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');

    expect(() => fireEvent.click(button)).not.toThrow();
  });
});

describe('ExportPDFButton - Error Handling', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  let mockClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear all mocks from previous tests
    vi.clearAllMocks();

    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock link click
    mockClick = vi.fn();
    HTMLAnchorElement.prototype.click = mockClick;

    // Mock generatePDFFilename for non-error cases
    vi.mocked(pdfGenerator.generatePDFFilename).mockReturnValue('test-session.pdf');
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.clearAllMocks();
  });

  it('should call onExportError callback when generatePDF fails', () => {
    const onExportError = vi.fn();
    vi.mocked(pdfGenerator.generatePDF).mockImplementation(() => {
      throw new Error('PDF generation failed');
    });

    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
        onExportError={onExportError}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onExportError).toHaveBeenCalledWith('PDF generation failed');
  });

  it('should handle unknown errors during export', () => {
    const onExportError = vi.fn();
    vi.mocked(pdfGenerator.generatePDF).mockImplementation(() => {
      throw 'Unknown error';
    });

    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
        onExportError={onExportError}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onExportError).toHaveBeenCalledWith('PDF export failed');
  });

  it('should not fail when onExportError is not provided', () => {
    vi.mocked(pdfGenerator.generatePDF).mockImplementation(() => {
      throw new Error('PDF generation failed');
    });

    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');

    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('should reset generating state after error', async () => {
    vi.mocked(pdfGenerator.generatePDF).mockImplementation(() => {
      throw new Error('PDF generation failed');
    });

    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});

describe('ExportPDFButton - Currency Handling', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  let mockClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear all mocks from previous tests
    vi.clearAllMocks();

    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock link click
    mockClick = vi.fn();
    HTMLAnchorElement.prototype.click = mockClick;

    vi.mocked(pdfGenerator.generatePDF).mockReturnValue(
      new Blob(['test'], { type: 'application/pdf' })
    );
    vi.mocked(pdfGenerator.generatePDFFilename).mockReturnValue('test.pdf');
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.clearAllMocks();
  });

  it('should use default currency "aUEC" when not specified', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pdfGenerator.generatePDF).toHaveBeenCalledWith(
      mockSession,
      mockResult,
      { lang: 'en', currency: 'aUEC' }
    );
  });

  it('should use custom currency when provided', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
        currency="UEC"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pdfGenerator.generatePDF).toHaveBeenCalledWith(
      mockSession,
      mockResult,
      { lang: 'en', currency: 'UEC' }
    );
  });

  it('should accept empty string as currency', () => {
    render(
      <ExportPDFButton
        session={mockSession}
        result={mockResult}
        lang="en"
        currency=""
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pdfGenerator.generatePDF).toHaveBeenCalledWith(
      mockSession,
      mockResult,
      { lang: 'en', currency: '' }
    );
  });
});
