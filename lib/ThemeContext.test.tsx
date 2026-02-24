import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';
import React from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test component that uses useTheme
function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme-display">{theme}</div>
      <button onClick={toggleTheme} data-testid="toggle-button">
        Toggle Theme
      </button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('provides theme to wrapped components', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const display = screen.getByTestId('theme-display');
    expect(display.textContent).toBe('dark');
  });

  it('toggles theme on button click', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const button = screen.getByTestId('toggle-button');
    const display = screen.getByTestId('theme-display');

    expect(display.textContent).toBe('dark');

    fireEvent.click(button);

    await waitFor(() => {
      expect(display.textContent).toBe('light');
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(display.textContent).toBe('dark');
    });
  });

  it('persists theme to localStorage', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const button = screen.getByTestId('toggle-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  it('applies data-theme attribute to document', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const button = screen.getByTestId('toggle-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  it('reads stored theme on mount', () => {
    localStorage.setItem('theme', 'light');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const display = screen.getByTestId('theme-display');
    expect(display.textContent).toBe('light');
  });

  it('throws error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within ThemeProvider');

    consoleSpy.mockRestore();
  });
});
