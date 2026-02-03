import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShareButton } from './ShareButton';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock window.location.origin
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
});

describe('ShareButton - Basic Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render share button with German text', () => {
    render(<ShareButton sessionId="test-id" lang="de" />);

    expect(screen.getByText('Teilen')).toBeInTheDocument();
  });

  it('should render share button with English text', () => {
    render(<ShareButton sessionId="test-id" lang="en" />);

    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('should render button with type="button"', () => {
    render(<ShareButton sessionId="test-id" lang="en" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should not be disabled initially', () => {
    render(<ShareButton sessionId="test-id" lang="en" />);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });
});

describe('ShareButton - Button Tooltips', () => {
  it('should have German tooltip', () => {
    render(<ShareButton sessionId="test-id" lang="de" />);

    const button = screen.getByRole('button', { name: /Share-Link erstellen und kopieren/i });
    expect(button).toHaveAttribute('title', 'Share-Link erstellen und kopieren');
  });

  it('should have English tooltip', () => {
    render(<ShareButton sessionId="test-id" lang="en" />);

    const button = screen.getByRole('button', { name: /Generate and copy share link/i });
    expect(button).toHaveAttribute('title', 'Generate and copy share link');
  });
});

describe('ShareButton - Share Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'token-id',
        sessionId: 'test-id',
        token: 'test-token',
        expiresAt: null,
        shareUrl: '/share/test-token',
      }),
    } as Response);
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);
  });

  it('should call fetch with correct URL when clicked', async () => {
    render(<ShareButton sessionId="test-id" lang="en" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/sessions/test-id/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  it('should copy full URL to clipboard', async () => {
    render(<ShareButton sessionId="test-id" lang="en" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost:3000/share/test-token'
      );
    });
  });

  it('should call onShareSuccess callback with full URL', async () => {
    const onShareSuccess = vi.fn();

    render(<ShareButton sessionId="test-id" lang="en" onShareSuccess={onShareSuccess} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onShareSuccess).toHaveBeenCalledWith('http://localhost:3000/share/test-token');
    });
  });

  it('should show "Copied!" message after successful share', async () => {
    render(<ShareButton sessionId="test-id" lang="en" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should show "Kopiert!" message in German after successful share', async () => {
    render(<ShareButton sessionId="test-id" lang="de" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Kopiert!')).toBeInTheDocument();
    });
  });
});

describe('ShareButton - Language Switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update button text when language changes from German to English', () => {
    const { rerender } = render(<ShareButton sessionId="test-id" lang="de" />);

    expect(screen.getByText('Teilen')).toBeInTheDocument();

    rerender(<ShareButton sessionId="test-id" lang="en" />);

    expect(screen.queryByText('Teilen')).not.toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('should update button text when language changes from English to German', () => {
    const { rerender } = render(<ShareButton sessionId="test-id" lang="en" />);

    expect(screen.getByText('Share')).toBeInTheDocument();

    rerender(<ShareButton sessionId="test-id" lang="de" />);

    expect(screen.queryByText('Share')).not.toBeInTheDocument();
    expect(screen.getByText('Teilen')).toBeInTheDocument();
  });
});

describe('ShareButton - Button Styles', () => {
  it('should have glassmorphism styles', () => {
    render(<ShareButton sessionId="test-id" lang="en" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'bg-white/5',
      'border',
      'border-white/10',
      'backdrop-blur-md',
      'rounded-2xl'
    );
  });

  it('should have hover styles', () => {
    render(<ShareButton sessionId="test-id" lang="en" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-white/10', 'transition-colors');
  });

  it('should have disabled styles', () => {
    render(<ShareButton sessionId="test-id" lang="en" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
  });

  it('should apply custom className', () => {
    render(<ShareButton sessionId="test-id" lang="en" className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});

describe('ShareButton - Icons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render share icon initially', () => {
    const { container } = render(<ShareButton sessionId="test-id" lang="en" />);

    const shareIcon = container.querySelector('svg path[d*="8.684"]');
    expect(shareIcon).toBeInTheDocument();
  });
});
