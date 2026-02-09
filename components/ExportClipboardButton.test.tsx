import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExportClipboardButton } from './ExportClipboardButton';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SessionInput, PayslipResult } from '@/lib/types';

// Mock session data for testing
const mockSession: SessionInput = {
  name: 'Test Session',
  type: 'TRADING',
  distributionMode: 'EQUAL',
  members: [
    { id: '1', handle: 'Alice', revenue: 500, investment: 0 },
    { id: '2', handle: 'Bob', revenue: 500, investment: 0 },
  ],
  taxEnabled: true,
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

describe('ExportClipboardButton - Basic Rendering', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should render export button with German text', () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="de"
      />
    );

    expect(screen.getByText('In Zwischenablage kopieren')).toBeInTheDocument();
  });

  it('should render export button with English text', () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
  });

  it('should render button with SVG icon', () => {
    const { container } = render(
      <ExportClipboardButton
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
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="de"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Payslip-Daten als JSON kopieren');
    expect(button).toHaveAttribute('aria-label', 'Payslip-Daten als JSON kopieren');
  });

  it('should have English tooltip', () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Copy payslip data as JSON');
    expect(button).toHaveAttribute('aria-label', 'Copy payslip data as JSON');
  });

  it('should have proper button styling classes', () => {
    render(
      <ExportClipboardButton
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

describe('ExportClipboardButton - Button States', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should not be disabled initially', () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('should show copying text in German when processing', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="de"
      />
    );

    const button = screen.getByRole('button');

    // Initial state
    expect(button).toHaveTextContent('In Zwischenablage kopieren');

    fireEvent.click(button);

    // Should show copying text while processing
    await waitFor(() => {
      expect(button).toHaveTextContent('Wird kopiert...');
    });

    // Should return to normal text after completion
    await waitFor(() => {
      expect(button).toHaveTextContent('In Zwischenablage kopieren');
    });
  });

  it('should show copying text in English when processing', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');

    // Initial state
    expect(button).toHaveTextContent('Copy to Clipboard');

    fireEvent.click(button);

    // Should show copying text while processing
    await waitFor(() => {
      expect(button).toHaveTextContent('Copying...');
    });

    // Should return to normal text after completion
    await waitFor(() => {
      expect(button).toHaveTextContent('Copy to Clipboard');
    });
  });

  it('should disable button while copying', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');

    fireEvent.click(button);

    // Button should be disabled during copy operation
    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    // Button should be enabled again after completion
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should apply disabled styling when copying', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });
  });
});

describe('ExportClipboardButton - Clipboard Functionality', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  it('should copy data to clipboard when clicked', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should format data as JSON with correct structure', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
        currency="aUEC"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      const copiedText = writeTextMock.mock.calls[0][0];
      const parsedData = JSON.parse(copiedText);

      expect(parsedData).toHaveProperty('session');
      expect(parsedData).toHaveProperty('result');
      expect(parsedData).toHaveProperty('currency');
      expect(parsedData).toHaveProperty('exportedAt');
    });
  });

  it('should include session data in export', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const copiedText = writeTextMock.mock.calls[0][0];
      const parsedData = JSON.parse(copiedText);

      expect(parsedData.session).toEqual(mockSession);
    });
  });

  it('should include result data in export', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const copiedText = writeTextMock.mock.calls[0][0];
      const parsedData = JSON.parse(copiedText);

      expect(parsedData.result).toEqual(mockResult);
    });
  });

  it('should use default currency when not specified', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const copiedText = writeTextMock.mock.calls[0][0];
      const parsedData = JSON.parse(copiedText);

      expect(parsedData.currency).toBe('aUEC');
    });
  });

  it('should use custom currency when specified', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
        currency="USD"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const copiedText = writeTextMock.mock.calls[0][0];
      const parsedData = JSON.parse(copiedText);

      expect(parsedData.currency).toBe('USD');
    });
  });

  it('should include exportedAt timestamp', async () => {
    const beforeExport = new Date().toISOString();

    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const copiedText = writeTextMock.mock.calls[0][0];
      const parsedData = JSON.parse(copiedText);

      expect(parsedData.exportedAt).toBeDefined();
      expect(new Date(parsedData.exportedAt).getTime()).toBeGreaterThanOrEqual(new Date(beforeExport).getTime());
    });
  });

  it('should format JSON with proper indentation', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const copiedText = writeTextMock.mock.calls[0][0];

      // Check that JSON is formatted with 2-space indentation
      expect(copiedText).toContain('\n');
      expect(copiedText).toContain('  ');
    });
  });
});

describe('ExportClipboardButton - Callbacks', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should call onExportSuccess when clipboard copy succeeds', async () => {
    const onExportSuccess = vi.fn();

    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
        onExportSuccess={onExportSuccess}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onExportSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('should not call onExportSuccess when not provided', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');

    // Should not throw error when callback is not provided
    expect(() => fireEvent.click(button)).not.toThrow();

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('should call onExportError when clipboard copy fails', async () => {
    const onExportError = vi.fn();
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard access denied'));

    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
        onExportError={onExportError}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onExportError).toHaveBeenCalledTimes(1);
      expect(onExportError).toHaveBeenCalledWith('Clipboard access denied');
    });
  });

  it('should not call onExportError when not provided and copy fails', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard access denied'));

    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');

    // Should not throw error when callback is not provided
    expect(() => fireEvent.click(button)).not.toThrow();

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
  });
});

describe('ExportClipboardButton - Error Handling', () => {
  it('should handle clipboard API errors gracefully', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard not available'));

    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const onExportError = vi.fn();

    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
        onExportError={onExportError}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onExportError).toHaveBeenCalledWith('Clipboard not available');
    });
  });

  it('should handle non-Error exceptions', async () => {
    const writeTextMock = vi.fn().mockRejectedValue('String error');

    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const onExportError = vi.fn();

    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
        onExportError={onExportError}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onExportError).toHaveBeenCalledWith('Clipboard export failed');
    });
  });

  it('should re-enable button after error', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));

    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Button should be disabled during copy attempt
    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    // Button should be re-enabled after error
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should show normal text after error', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));

    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should return to normal text after error
    await waitFor(() => {
      expect(button).toHaveTextContent('Copy to Clipboard');
    });
  });
});

describe('ExportClipboardButton - Edge Cases', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should handle session with no members', async () => {
    const emptySession: SessionInput = {
      ...mockSession,
      members: [],
    };

    const emptyResult: PayslipResult = {
      ...mockResult,
      members: [],
    };

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ExportClipboardButton
        session={emptySession}
        result={emptyResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      const copiedText = writeTextMock.mock.calls[0][0];
      const parsedData = JSON.parse(copiedText);

      expect(parsedData.session.members).toEqual([]);
      expect(parsedData.result.members).toEqual([]);
    });
  });

  it('should handle session with many members', async () => {
    const manyMembers = Array.from({ length: 20 }, (_, i) => ({
      id: `${i + 1}`,
      handle: `Member${i + 1}`,
      revenue: 100 * (i + 1),
      investment: 50 * i,
    }));

    const largeSession: SessionInput = {
      ...mockSession,
      members: manyMembers,
    };

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ExportClipboardButton
        session={largeSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      const copiedText = writeTextMock.mock.calls[0][0];
      const parsedData = JSON.parse(copiedText);

      expect(parsedData.session.members).toHaveLength(20);
    });
  });

  it('should handle special characters in session name', async () => {
    const specialSession: SessionInput = {
      ...mockSession,
      name: 'Test <Session> "with" \'special\' & characters',
    };

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ExportClipboardButton
        session={specialSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      const copiedText = writeTextMock.mock.calls[0][0];
      const parsedData = JSON.parse(copiedText);

      expect(parsedData.session.name).toBe('Test <Session> "with" \'special\' & characters');
    });
  });

  it('should handle unicode characters in member handles', async () => {
    const unicodeSession: SessionInput = {
      ...mockSession,
      members: [
        { id: '1', handle: '游戏玩家', revenue: 500, investment: 0 },
        { id: '2', handle: 'Игрок', revenue: 500, investment: 0 },
        { id: '3', handle: 'プレイヤー', revenue: 500, investment: 0 },
      ],
    };

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ExportClipboardButton
        session={unicodeSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      const copiedText = writeTextMock.mock.calls[0][0];
      const parsedData = JSON.parse(copiedText);

      expect(parsedData.session.members[0].handle).toBe('游戏玩家');
      expect(parsedData.session.members[1].handle).toBe('Игрок');
      expect(parsedData.session.members[2].handle).toBe('プレイヤー');
    });
  });

  it('should handle very large numbers in calculations', async () => {
    const largeNumberSession: SessionInput = {
      ...mockSession,
      members: [
        { id: '1', handle: 'Alice', revenue: 999999999, investment: 0 },
        { id: '2', handle: 'Bob', revenue: 999999999, investment: 0 },
      ],
    };

    const largeNumberResult: PayslipResult = {
      ...mockResult,
      saleRevenue: 1999999998,
      netProfit: 1999999998,
    };

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ExportClipboardButton
        session={largeNumberSession}
        result={largeNumberResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      const copiedText = writeTextMock.mock.calls[0][0];
      const parsedData = JSON.parse(copiedText);

      expect(parsedData.result.saleRevenue).toBe(1999999998);
      expect(parsedData.result.netProfit).toBe(1999999998);
    });
  });
});

describe('ExportClipboardButton - Accessibility', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should have button type="button"', () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should have aria-label matching tooltip', () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');
    const ariaLabel = button.getAttribute('aria-label');
    const title = button.getAttribute('title');

    expect(ariaLabel).toBe(title);
  });

  it('should be keyboard accessible', () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');

    // Button should be focusable
    expect(button).not.toHaveAttribute('tabindex', '-1');
  });

  it('should properly announce state changes for screen readers', async () => {
    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');

    // Initial state
    expect(button).toHaveTextContent('Copy to Clipboard');

    fireEvent.click(button);

    // Processing state
    await waitFor(() => {
      expect(button).toHaveTextContent('Copying...');
    });

    // Completion state
    await waitFor(() => {
      expect(button).toHaveTextContent('Copy to Clipboard');
    });
  });
});

describe('ExportClipboardButton - Multiple Clicks', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should prevent multiple simultaneous copy operations', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');

    // Click multiple times rapidly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      // Should only call clipboard API once due to disabled state
      expect(writeTextMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should allow clicking again after first operation completes', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ExportClipboardButton
        session={mockSession}
        result={mockResult}
        lang="en"
      />
    );

    const button = screen.getByRole('button');

    // First click
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });

    // Second click after first completes
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(2);
    });
  });
});
