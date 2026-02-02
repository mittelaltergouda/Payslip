import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionActions } from './SessionActions';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as sessionStorage from '@/lib/storage/sessionStorage';

// Mock the sessionStorage module
vi.mock('@/lib/storage/sessionStorage', () => ({
  exportAll: vi.fn(),
  importAll: vi.fn(),
}));

describe('SessionActions - Basic Rendering', () => {
  it('should render export button with German text', () => {
    render(<SessionActions lang="de" />);

    expect(screen.getByText('Exportieren')).toBeInTheDocument();
  });

  it('should render import button with German text', () => {
    render(<SessionActions lang="de" />);

    expect(screen.getByText('Importieren')).toBeInTheDocument();
  });

  it('should render export button with English text', () => {
    render(<SessionActions lang="en" />);

    expect(screen.getByText('Export All')).toBeInTheDocument();
  });

  it('should render import button with English text', () => {
    render(<SessionActions lang="en" />);

    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('should render both buttons', () => {
    render(<SessionActions lang="en" />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });
});

describe('SessionActions - Button Tooltips', () => {
  it('should have German tooltip on export button', () => {
    render(<SessionActions lang="de" />);

    const exportButton = screen.getByRole('button', { name: /Alle Sessions als JSON herunterladen/i });
    expect(exportButton).toHaveAttribute('title', 'Alle Sessions als JSON herunterladen');
  });

  it('should have German tooltip on import button', () => {
    render(<SessionActions lang="de" />);

    const importButton = screen.getByRole('button', { name: /Sessions aus JSON-Datei importieren/i });
    expect(importButton).toHaveAttribute('title', 'Sessions aus JSON-Datei importieren');
  });

  it('should have English tooltip on export button', () => {
    render(<SessionActions lang="en" />);

    const exportButton = screen.getByRole('button', { name: /Download all sessions as JSON/i });
    expect(exportButton).toHaveAttribute('title', 'Download all sessions as JSON');
  });

  it('should have English tooltip on import button', () => {
    render(<SessionActions lang="en" />);

    const importButton = screen.getByRole('button', { name: /Import sessions from JSON file/i });
    expect(importButton).toHaveAttribute('title', 'Import sessions from JSON file');
  });
});

describe('SessionActions - File Input', () => {
  it('should render hidden file input', () => {
    const { container } = render(<SessionActions lang="en" />);

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden');
  });

  it('should accept only JSON files', () => {
    const { container } = render(<SessionActions lang="en" />);

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', 'application/json,.json');
  });

  it('should have aria-hidden attribute', () => {
    const { container } = render(<SessionActions lang="en" />);

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('SessionActions - Export Functionality', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
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
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = mockClick;

    // Mock exportAll
    vi.mocked(sessionStorage.exportAll).mockReturnValue('{"sessions":[]}');
  });

  afterEach(() => {
    // Restore original methods
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.clearAllMocks();
  });

  it('should call exportAll when export button is clicked', () => {
    render(<SessionActions lang="en" />);

    const exportButton = screen.getByRole('button', { name: /Download all sessions as JSON/i });
    fireEvent.click(exportButton);

    expect(sessionStorage.exportAll).toHaveBeenCalledTimes(1);
  });

  it('should create a blob with JSON data', () => {
    const mockData = '{"sessions":[{"id":"1","name":"Test"}]}';
    vi.mocked(sessionStorage.exportAll).mockReturnValue(mockData);

    render(<SessionActions lang="en" />);

    const exportButton = screen.getByRole('button', { name: /Download all sessions as JSON/i });
    fireEvent.click(exportButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should trigger download with proper filename', () => {
    render(<SessionActions lang="en" />);

    const exportButton = screen.getByRole('button', { name: /Download all sessions as JSON/i });
    fireEvent.click(exportButton);

    expect(mockClick).toHaveBeenCalled();
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should revoke object URL after download', () => {
    render(<SessionActions lang="en" />);

    const exportButton = screen.getByRole('button', { name: /Download all sessions as JSON/i });
    fireEvent.click(exportButton);

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should call onExportSuccess callback on successful export', () => {
    const onExportSuccess = vi.fn();

    render(<SessionActions lang="en" onExportSuccess={onExportSuccess} />);

    const exportButton = screen.getByRole('button', { name: /Download all sessions as JSON/i });
    fireEvent.click(exportButton);

    expect(onExportSuccess).toHaveBeenCalledTimes(1);
  });

  it('should call onExportError callback when export fails', () => {
    const onExportError = vi.fn();
    vi.mocked(sessionStorage.exportAll).mockImplementation(() => {
      throw new Error('Export failed');
    });

    render(<SessionActions lang="en" onExportError={onExportError} />);

    const exportButton = screen.getByRole('button', { name: /Download all sessions as JSON/i });
    fireEvent.click(exportButton);

    expect(onExportError).toHaveBeenCalledWith('Export failed');
  });

  it('should handle unknown errors during export', () => {
    const onExportError = vi.fn();
    vi.mocked(sessionStorage.exportAll).mockImplementation(() => {
      throw 'Unknown error';
    });

    render(<SessionActions lang="en" onExportError={onExportError} />);

    const exportButton = screen.getByRole('button', { name: /Download all sessions as JSON/i });
    fireEvent.click(exportButton);

    expect(onExportError).toHaveBeenCalledWith('Export failed');
  });
});

describe('SessionActions - Import Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock File.prototype.text for file reading
    // This is necessary because File.text() may not be available in all test environments
    if (!File.prototype.text) {
      File.prototype.text = async function() {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(this);
        });
      };
    }
  });

  it('should trigger file input click when import button is clicked', () => {
    const { container } = render(<SessionActions lang="en" />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const mockClick = vi.fn();
    fileInput.click = mockClick;

    const importButton = screen.getByRole('button', { name: /Import sessions from JSON file/i });
    fireEvent.click(importButton);

    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('should not process when no file is selected', async () => {
    const onImportSuccess = vi.fn();

    render(<SessionActions lang="en" onImportSuccess={onImportSuccess} />);

    const { container } = render(<SessionActions lang="en" />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [] } });

    await waitFor(() => {
      expect(onImportSuccess).not.toHaveBeenCalled();
    });
  });

  it('should call importAll with file content', async () => {
    const mockFileContent = '{"sessions":[{"id":"1"}]}';
    const mockFile = new File([mockFileContent], 'test.json', { type: 'application/json' });

    vi.mocked(sessionStorage.importAll).mockReturnValue({
      success: true,
      data: { count: 1 },
    });

    const { container } = render(<SessionActions lang="en" />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    // Trigger file change
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(sessionStorage.importAll).toHaveBeenCalledWith(mockFileContent);
    }, { timeout: 3000 });
  });

  it('should call onImportSuccess callback with count', async () => {
    const onImportSuccess = vi.fn();
    const mockFileContent = '{"sessions":[{"id":"1"},{"id":"2"}]}';
    const mockFile = new File([mockFileContent], 'test.json', { type: 'application/json' });

    vi.mocked(sessionStorage.importAll).mockReturnValue({
      success: true,
      data: { count: 2 },
    });

    const { container } = render(<SessionActions lang="en" onImportSuccess={onImportSuccess} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(onImportSuccess).toHaveBeenCalledWith(2);
    }, { timeout: 3000 });
  });

  it('should call onSessionsImported callback after successful import', async () => {
    const onSessionsImported = vi.fn();
    const mockFileContent = '{"sessions":[{"id":"1"}]}';
    const mockFile = new File([mockFileContent], 'test.json', { type: 'application/json' });

    vi.mocked(sessionStorage.importAll).mockReturnValue({
      success: true,
      data: { count: 1 },
    });

    const { container } = render(<SessionActions lang="en" onSessionsImported={onSessionsImported} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(onSessionsImported).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  });

  it('should call onImportError when import fails', async () => {
    const onImportError = vi.fn();
    const mockFileContent = 'invalid json';
    const mockFile = new File([mockFileContent], 'test.json', { type: 'application/json' });

    vi.mocked(sessionStorage.importAll).mockReturnValue({
      success: false,
      error: 'Invalid JSON format',
    });

    const { container } = render(<SessionActions lang="en" onImportError={onImportError} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(onImportError).toHaveBeenCalledWith('Invalid JSON format');
    }, { timeout: 3000 });
  });

  it('should handle file read errors', async () => {
    const onImportError = vi.fn();
    const mockFile = {
      text: vi.fn().mockRejectedValue(new Error('Failed to read file')),
    } as unknown as File;

    const { container } = render(<SessionActions lang="en" onImportError={onImportError} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(onImportError).toHaveBeenCalledWith('Failed to read file');
    });
  });

  it('should handle unknown errors during file read', async () => {
    const onImportError = vi.fn();
    const mockFile = {
      text: vi.fn().mockRejectedValue('Unknown error'),
    } as unknown as File;

    const { container } = render(<SessionActions lang="en" onImportError={onImportError} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(onImportError).toHaveBeenCalledWith('Failed to read file');
    });
  });

  it('should reset file input after import', async () => {
    const mockFileContent = '{"sessions":[{"id":"1"}]}';
    const mockFile = new File([mockFileContent], 'test.json', { type: 'application/json' });

    vi.mocked(sessionStorage.importAll).mockReturnValue({
      success: true,
      data: { count: 1 },
    });

    const { container } = render(<SessionActions lang="en" />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(fileInput.value).toBe('');
    });
  });

  it('should handle import failure with fallback error message', async () => {
    const onImportError = vi.fn();
    const mockFileContent = '{"sessions":[]}';
    const mockFile = new File([mockFileContent], 'test.json', { type: 'application/json' });

    vi.mocked(sessionStorage.importAll).mockReturnValue({
      success: false,
      error: undefined,
    });

    const { container } = render(<SessionActions lang="en" onImportError={onImportError} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(onImportError).toHaveBeenCalledWith('Import failed');
    }, { timeout: 3000 });
  });
});

describe('SessionActions - Language Switching', () => {
  it('should update button text when language changes from German to English', () => {
    const { rerender } = render(<SessionActions lang="de" />);

    expect(screen.getByText('Exportieren')).toBeInTheDocument();
    expect(screen.getByText('Importieren')).toBeInTheDocument();

    rerender(<SessionActions lang="en" />);

    expect(screen.queryByText('Exportieren')).not.toBeInTheDocument();
    expect(screen.queryByText('Importieren')).not.toBeInTheDocument();
    expect(screen.getByText('Export All')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('should update button text when language changes from English to German', () => {
    const { rerender } = render(<SessionActions lang="en" />);

    expect(screen.getByText('Export All')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();

    rerender(<SessionActions lang="de" />);

    expect(screen.queryByText('Export All')).not.toBeInTheDocument();
    expect(screen.queryByText('Import')).not.toBeInTheDocument();
    expect(screen.getByText('Exportieren')).toBeInTheDocument();
    expect(screen.getByText('Importieren')).toBeInTheDocument();
  });
});

describe('SessionActions - Button Styles', () => {
  it('should have glassmorphism styles on export button', () => {
    render(<SessionActions lang="en" />);

    const exportButton = screen.getByRole('button', { name: /Download all sessions as JSON/i });
    expect(exportButton).toHaveClass('bg-white/5', 'border', 'border-white/10', 'backdrop-blur-md');
  });

  it('should have glassmorphism styles on import button', () => {
    render(<SessionActions lang="en" />);

    const importButton = screen.getByRole('button', { name: /Import sessions from JSON file/i });
    expect(importButton).toHaveClass('bg-white/5', 'border', 'border-white/10', 'backdrop-blur-md');
  });

  it('should have hover styles on buttons', () => {
    render(<SessionActions lang="en" />);

    const exportButton = screen.getByRole('button', { name: /Download all sessions as JSON/i });
    const importButton = screen.getByRole('button', { name: /Import sessions from JSON file/i });

    expect(exportButton).toHaveClass('hover:bg-white/10', 'transition-colors');
    expect(importButton).toHaveClass('hover:bg-white/10', 'transition-colors');
  });
});

describe('SessionActions - SVG Icons', () => {
  it('should render export icon', () => {
    const { container } = render(<SessionActions lang="en" />);

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('should render import icon', () => {
    const { container } = render(<SessionActions lang="en" />);

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });
});

describe('SessionActions - Component Structure', () => {
  it('should render wrapper with proper layout classes', () => {
    const { container } = render(<SessionActions lang="en" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'items-center', 'gap-3', 'flex-wrap');
  });

  it('should render buttons with type="button"', () => {
    render(<SessionActions lang="en" />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});

describe('SessionActions - Callback Combinations', () => {
  it('should work with only onExportSuccess callback', () => {
    const onExportSuccess = vi.fn();
    vi.mocked(sessionStorage.exportAll).mockReturnValue('{}');

    render(<SessionActions lang="en" onExportSuccess={onExportSuccess} />);

    const exportButton = screen.getByRole('button', { name: /Download all sessions as JSON/i });
    fireEvent.click(exportButton);

    expect(onExportSuccess).toHaveBeenCalled();
  });

  it('should work with only onImportSuccess callback', async () => {
    const onImportSuccess = vi.fn();
    const mockFile = new File(['{"sessions":[]}'], 'test.json', { type: 'application/json' });

    vi.mocked(sessionStorage.importAll).mockReturnValue({
      success: true,
      data: { count: 0 },
    });

    const { container } = render(<SessionActions lang="en" onImportSuccess={onImportSuccess} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(onImportSuccess).toHaveBeenCalledWith(0);
    }, { timeout: 3000 });
  });

  it('should work without any callbacks', () => {
    vi.mocked(sessionStorage.exportAll).mockReturnValue('{}');

    render(<SessionActions lang="en" />);

    const exportButton = screen.getByRole('button', { name: /Download all sessions as JSON/i });

    // Should not throw error
    expect(() => fireEvent.click(exportButton)).not.toThrow();
  });
});
