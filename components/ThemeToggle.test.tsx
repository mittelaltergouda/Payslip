import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '@/lib/ThemeContext';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
  });

  it('displays correct aria-label for dark mode', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    // Wait for hydration
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentLabel = button.getAttribute('aria-label');
    expect(currentLabel).toMatch(/light/i);
  });

  it('toggles theme on click', async () => {
    const { rerender } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    // Wait for hydration
    await new Promise(resolve => setTimeout(resolve, 100));

    const button = screen.getByRole('button');
    const initialLabel = button.getAttribute('aria-label');

    fireEvent.click(button);

    // Wait for update
    await new Promise(resolve => setTimeout(resolve, 100));

    const newLabel = button.getAttribute('aria-label');
    expect(initialLabel).not.toBe(newLabel);
  });

  it('has accessibility attributes', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    // Wait for hydration
    await new Promise(resolve => setTimeout(resolve, 100));

    const button = screen.getByRole('button');
    expect(button.hasAttribute('aria-label')).toBe(true);
    expect(button.hasAttribute('title')).toBe(true);
  });

  it('handles hydration safely without errors', () => {
    // This should not throw during server rendering or hydration
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
