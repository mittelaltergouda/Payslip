import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { describe, it, expect } from 'vitest';
import { SaveStatus } from '@/hooks/useAutoSave';

describe('SaveStatusIndicator - Basic Rendering', () => {
  it('should render with "saved" status', () => {
    render(<SaveStatusIndicator status="saved" />);

    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('should render with "saving" status', () => {
    render(<SaveStatusIndicator status="saving" />);

    expect(screen.getByText('⏳')).toBeInTheDocument();
    expect(screen.getByText('Saving')).toBeInTheDocument();
  });

  it('should render with "unsaved" status', () => {
    render(<SaveStatusIndicator status="unsaved" />);

    expect(screen.getByText('•')).toBeInTheDocument();
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });
});

describe('SaveStatusIndicator - Status Colors', () => {
  it('should apply green color for "saved" status', () => {
    render(<SaveStatusIndicator status="saved" />);

    const icon = screen.getByText('✓');
    const label = screen.getByText('Saved');

    expect(icon).toHaveClass('text-green-400');
    expect(label).toHaveClass('text-green-400');
  });

  it('should apply yellow color for "saving" status', () => {
    render(<SaveStatusIndicator status="saving" />);

    const icon = screen.getByText('⏳');
    const label = screen.getByText('Saving');

    expect(icon).toHaveClass('text-yellow-400');
    expect(label).toHaveClass('text-yellow-400');
  });

  it('should apply red color for "unsaved" status', () => {
    render(<SaveStatusIndicator status="unsaved" />);

    const icon = screen.getByText('•');
    const label = screen.getByText('Unsaved');

    expect(icon).toHaveClass('text-red-400');
    expect(label).toHaveClass('text-red-400');
  });
});

describe('SaveStatusIndicator - Background and Border Colors', () => {
  it('should apply correct background and border for "saved" status', () => {
    const { container } = render(<SaveStatusIndicator status="saved" />);

    const statusContainer = container.querySelector('.bg-green-400\\/10');
    expect(statusContainer).toBeInTheDocument();
    expect(statusContainer).toHaveClass('border-green-400/20');
  });

  it('should apply correct background and border for "saving" status', () => {
    const { container } = render(<SaveStatusIndicator status="saving" />);

    const statusContainer = container.querySelector('.bg-yellow-400\\/10');
    expect(statusContainer).toBeInTheDocument();
    expect(statusContainer).toHaveClass('border-yellow-400/20');
  });

  it('should apply correct background and border for "unsaved" status', () => {
    const { container } = render(<SaveStatusIndicator status="unsaved" />);

    const statusContainer = container.querySelector('.bg-red-400\\/10');
    expect(statusContainer).toBeInTheDocument();
    expect(statusContainer).toHaveClass('border-red-400/20');
  });
});

describe('SaveStatusIndicator - Error Handling', () => {
  it('should not display error icon when error is null', () => {
    render(<SaveStatusIndicator status="saved" error={null} />);

    expect(screen.queryByText('⚠')).not.toBeInTheDocument();
  });

  it('should not display error icon when error is undefined', () => {
    render(<SaveStatusIndicator status="saved" />);

    expect(screen.queryByText('⚠')).not.toBeInTheDocument();
  });

  it('should display error icon when error is provided', () => {
    render(<SaveStatusIndicator status="unsaved" error="Failed to save" />);

    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('should have error message in title attribute', () => {
    render(<SaveStatusIndicator status="unsaved" error="Network error" />);

    const errorIcon = screen.getByText('⚠');
    expect(errorIcon).toHaveAttribute('title', 'Network error');
  });

  it('should apply red color to error icon', () => {
    render(<SaveStatusIndicator status="unsaved" error="Save failed" />);

    const errorIcon = screen.getByText('⚠');
    expect(errorIcon).toHaveClass('text-red-400/80');
  });
});

describe('SaveStatusIndicator - Title Attributes', () => {
  it('should have status label as title when no error', () => {
    const { container } = render(<SaveStatusIndicator status="saved" />);

    const statusContainer = container.querySelector('[title="Saved"]');
    expect(statusContainer).toBeInTheDocument();
  });

  it('should have error message as title when error is provided', () => {
    const { container } = render(<SaveStatusIndicator status="unsaved" error="Custom error message" />);

    const statusContainer = container.querySelector('[title="Custom error message"]');
    expect(statusContainer).toBeInTheDocument();
  });
});

describe('SaveStatusIndicator - Status Transitions', () => {
  it('should update when status changes from saved to unsaved', () => {
    const { rerender } = render(<SaveStatusIndicator status="saved" />);

    expect(screen.getByText('Saved')).toBeInTheDocument();

    rerender(<SaveStatusIndicator status="unsaved" />);

    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('should update when status changes from unsaved to saving', () => {
    const { rerender } = render(<SaveStatusIndicator status="unsaved" />);

    expect(screen.getByText('Unsaved')).toBeInTheDocument();

    rerender(<SaveStatusIndicator status="saving" />);

    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
    expect(screen.getByText('Saving')).toBeInTheDocument();
  });

  it('should update when status changes from saving to saved', () => {
    const { rerender } = render(<SaveStatusIndicator status="saving" />);

    expect(screen.getByText('Saving')).toBeInTheDocument();

    rerender(<SaveStatusIndicator status="saved" />);

    expect(screen.queryByText('Saving')).not.toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
});

describe('SaveStatusIndicator - Error State Changes', () => {
  it('should show error icon when error is added', () => {
    const { rerender } = render(<SaveStatusIndicator status="saved" />);

    expect(screen.queryByText('⚠')).not.toBeInTheDocument();

    rerender(<SaveStatusIndicator status="unsaved" error="New error" />);

    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('should hide error icon when error is removed', () => {
    const { rerender } = render(<SaveStatusIndicator status="unsaved" error="Some error" />);

    expect(screen.getByText('⚠')).toBeInTheDocument();

    rerender(<SaveStatusIndicator status="saved" error={null} />);

    expect(screen.queryByText('⚠')).not.toBeInTheDocument();
  });

  it('should update error message in title when error changes', () => {
    const { rerender } = render(<SaveStatusIndicator status="unsaved" error="First error" />);

    let errorIcon = screen.getByText('⚠');
    expect(errorIcon).toHaveAttribute('title', 'First error');

    rerender(<SaveStatusIndicator status="unsaved" error="Second error" />);

    errorIcon = screen.getByText('⚠');
    expect(errorIcon).toHaveAttribute('title', 'Second error');
  });
});

describe('SaveStatusIndicator - CSS Classes', () => {
  it('should have proper layout classes', () => {
    const { container } = render(<SaveStatusIndicator status="saved" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'items-center', 'gap-2');
  });

  it('should have transition classes on status container', () => {
    const { container } = render(<SaveStatusIndicator status="saved" />);

    const statusContainer = container.querySelector('.transition-all');
    expect(statusContainer).toBeInTheDocument();
    expect(statusContainer).toHaveClass('duration-200');
  });

  it('should have correct padding and border radius', () => {
    const { container } = render(<SaveStatusIndicator status="saved" />);

    const statusContainer = container.querySelector('.px-2\\.5');
    expect(statusContainer).toBeInTheDocument();
    expect(statusContainer).toHaveClass('py-1', 'rounded-lg', 'border');
  });
});

describe('SaveStatusIndicator - Component Structure', () => {
  it('should render icon and label in the same container', () => {
    render(<SaveStatusIndicator status="saved" />);

    const icon = screen.getByText('✓');
    const label = screen.getByText('Saved');

    expect(icon.parentElement).toBe(label.parentElement);
  });

  it('should render error icon as a sibling to status container', () => {
    const { container } = render(<SaveStatusIndicator status="unsaved" error="Error" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.children.length).toBe(2);
  });
});

describe('SaveStatusIndicator - All Valid Status Values', () => {
  const validStatuses: SaveStatus[] = ['saved', 'saving', 'unsaved'];

  validStatuses.forEach((status) => {
    it(`should render without errors for status: ${status}`, () => {
      const { container } = render(<SaveStatusIndicator status={status} />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
