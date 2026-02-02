import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { describe, it, expect, vi } from 'vitest';

describe('LanguageSwitcher - Initial Rendering', () => {
  it('should render both DE and EN buttons', () => {
    const mockOnLangChange = vi.fn();
    render(<LanguageSwitcher lang="de" onLangChange={mockOnLangChange} />);

    const deButton = screen.getByRole('button', { name: /Switch to German/i });
    const enButton = screen.getByRole('button', { name: /Switch to English/i });

    expect(deButton).toBeInTheDocument();
    expect(enButton).toBeInTheDocument();
    expect(deButton).toHaveTextContent('DE');
    expect(enButton).toHaveTextContent('EN');
  });

  it('should highlight DE button when German is active', () => {
    const mockOnLangChange = vi.fn();
    render(<LanguageSwitcher lang="de" onLangChange={mockOnLangChange} />);

    const deButton = screen.getByRole('button', { name: /Switch to German/i });
    const enButton = screen.getByRole('button', { name: /Switch to English/i });

    expect(deButton).toHaveClass('bg-neon', 'text-night');
    expect(enButton).toHaveClass('bg-white/10');
    expect(enButton).not.toHaveClass('bg-neon');
  });

  it('should highlight EN button when English is active', () => {
    const mockOnLangChange = vi.fn();
    render(<LanguageSwitcher lang="en" onLangChange={mockOnLangChange} />);

    const deButton = screen.getByRole('button', { name: /Switch to German/i });
    const enButton = screen.getByRole('button', { name: /Switch to English/i });

    expect(enButton).toHaveClass('bg-neon', 'text-night');
    expect(deButton).toHaveClass('bg-white/10');
    expect(deButton).not.toHaveClass('bg-neon');
  });

  it('should apply custom className when provided', () => {
    const mockOnLangChange = vi.fn();
    const { container } = render(
      <LanguageSwitcher
        lang="de"
        onLangChange={mockOnLangChange}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should render with default empty className when not provided', () => {
    const mockOnLangChange = vi.fn();
    const { container } = render(
      <LanguageSwitcher lang="de" onLangChange={mockOnLangChange} />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'items-center', 'gap-2');
  });
});

describe('LanguageSwitcher - Accessibility', () => {
  it('should have correct aria-label attributes', () => {
    const mockOnLangChange = vi.fn();
    render(<LanguageSwitcher lang="de" onLangChange={mockOnLangChange} />);

    const deButton = screen.getByRole('button', { name: /Switch to German/i });
    const enButton = screen.getByRole('button', { name: /Switch to English/i });

    expect(deButton).toHaveAttribute('aria-label', 'Switch to German');
    expect(enButton).toHaveAttribute('aria-label', 'Switch to English');
  });

  it('should set aria-pressed to true for active language', () => {
    const mockOnLangChange = vi.fn();
    render(<LanguageSwitcher lang="de" onLangChange={mockOnLangChange} />);

    const deButton = screen.getByRole('button', { name: /Switch to German/i });
    const enButton = screen.getByRole('button', { name: /Switch to English/i });

    expect(deButton).toHaveAttribute('aria-pressed', 'true');
    expect(enButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should set aria-pressed to true for EN when English is active', () => {
    const mockOnLangChange = vi.fn();
    render(<LanguageSwitcher lang="en" onLangChange={mockOnLangChange} />);

    const deButton = screen.getByRole('button', { name: /Switch to German/i });
    const enButton = screen.getByRole('button', { name: /Switch to English/i });

    expect(deButton).toHaveAttribute('aria-pressed', 'false');
    expect(enButton).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('LanguageSwitcher - User Interaction', () => {
  it('should call onLangChange with "de" when DE button is clicked', () => {
    const mockOnLangChange = vi.fn();
    render(<LanguageSwitcher lang="en" onLangChange={mockOnLangChange} />);

    const deButton = screen.getByRole('button', { name: /Switch to German/i });
    fireEvent.click(deButton);

    expect(mockOnLangChange).toHaveBeenCalledTimes(1);
    expect(mockOnLangChange).toHaveBeenCalledWith('de');
  });

  it('should call onLangChange with "en" when EN button is clicked', () => {
    const mockOnLangChange = vi.fn();
    render(<LanguageSwitcher lang="de" onLangChange={mockOnLangChange} />);

    const enButton = screen.getByRole('button', { name: /Switch to English/i });
    fireEvent.click(enButton);

    expect(mockOnLangChange).toHaveBeenCalledTimes(1);
    expect(mockOnLangChange).toHaveBeenCalledWith('en');
  });

  it('should allow clicking the currently active language button', () => {
    const mockOnLangChange = vi.fn();
    render(<LanguageSwitcher lang="de" onLangChange={mockOnLangChange} />);

    const deButton = screen.getByRole('button', { name: /Switch to German/i });
    fireEvent.click(deButton);

    expect(mockOnLangChange).toHaveBeenCalledTimes(1);
    expect(mockOnLangChange).toHaveBeenCalledWith('de');
  });

  it('should handle multiple language switches', () => {
    const mockOnLangChange = vi.fn();
    render(<LanguageSwitcher lang="de" onLangChange={mockOnLangChange} />);

    const deButton = screen.getByRole('button', { name: /Switch to German/i });
    const enButton = screen.getByRole('button', { name: /Switch to English/i });

    fireEvent.click(enButton);
    fireEvent.click(deButton);
    fireEvent.click(enButton);

    expect(mockOnLangChange).toHaveBeenCalledTimes(3);
    expect(mockOnLangChange).toHaveBeenNthCalledWith(1, 'en');
    expect(mockOnLangChange).toHaveBeenNthCalledWith(2, 'de');
    expect(mockOnLangChange).toHaveBeenNthCalledWith(3, 'en');
  });
});

describe('LanguageSwitcher - Visual Styling', () => {
  it('should have consistent base styling for both buttons', () => {
    const mockOnLangChange = vi.fn();
    render(<LanguageSwitcher lang="de" onLangChange={mockOnLangChange} />);

    const deButton = screen.getByRole('button', { name: /Switch to German/i });
    const enButton = screen.getByRole('button', { name: /Switch to English/i });

    expect(deButton).toHaveClass('px-3', 'py-2', 'rounded-lg');
    expect(enButton).toHaveClass('px-3', 'py-2', 'rounded-lg');
  });

  it('should apply different styling to active and inactive buttons', () => {
    const mockOnLangChange = vi.fn();
    const { rerender } = render(
      <LanguageSwitcher lang="de" onLangChange={mockOnLangChange} />
    );

    const deButton = screen.getByRole('button', { name: /Switch to German/i });
    const enButton = screen.getByRole('button', { name: /Switch to English/i });

    // When DE is active
    expect(deButton.className).toContain('bg-neon');
    expect(deButton.className).toContain('text-night');
    expect(enButton.className).toContain('bg-white/10');

    // When EN is active
    rerender(<LanguageSwitcher lang="en" onLangChange={mockOnLangChange} />);

    expect(enButton.className).toContain('bg-neon');
    expect(enButton.className).toContain('text-night');
    expect(deButton.className).toContain('bg-white/10');
  });

  it('should maintain wrapper layout classes', () => {
    const mockOnLangChange = vi.fn();
    const { container } = render(
      <LanguageSwitcher lang="de" onLangChange={mockOnLangChange} />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'items-center', 'gap-2');
  });
});
