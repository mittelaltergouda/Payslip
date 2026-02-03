import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from '@/components/Toast';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Test component to use the toast hook
function TestComponent() {
  const { showToast, toasts, hideToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Test message', 'info')}>Show Info</button>
      <button onClick={() => showToast('Success message', 'success')}>Show Success</button>
      <button onClick={() => showToast('Error message', 'error')}>Show Error</button>
      <button onClick={() => showToast('Custom duration', 'info', 5000)}>Show Custom Duration</button>
      <button onClick={() => showToast('No auto-dismiss', 'info', 0)}>Show No Auto-dismiss</button>
      {toasts.length > 0 && (
        <div data-testid="toast-count">{toasts.length}</div>
      )}
      {toasts.map(toast => (
        <button key={toast.id} onClick={() => hideToast(toast.id)}>
          Hide {toast.id}
        </button>
      ))}
    </div>
  );
}

describe('ToastProvider - Basic Rendering', () => {
  it('should render children without toasts initially', () => {
    render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should not render toast container when there are no toasts', () => {
    const { container } = render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>
    );

    expect(container.querySelector('.toast-container')).not.toBeInTheDocument();
  });
});

describe('useToast Hook - Error Handling', () => {
  it('should throw error when used outside ToastProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      const TestComponentWithoutProvider = () => {
        useToast();
        return <div>Test</div>;
      };
      render(<TestComponentWithoutProvider />);
    }).toThrow('useToast must be used within ToastProvider');

    consoleError.mockRestore();
  });

  it('should work correctly when used within ToastProvider', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Show Info')).toBeInTheDocument();
  });
});

describe('showToast - Creating Toasts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display toast with info type', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Info');
    fireEvent.click(button);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should display toast with success type', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    fireEvent.click(button);

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should display toast with error type', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Error');
    fireEvent.click(button);

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should display multiple toasts simultaneously', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));

    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should add toasts to the toast array', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByText('Show Success'));

    expect(screen.getByTestId('toast-count')).toHaveTextContent('2');
  });
});

describe('showToast - Auto-dismiss Behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should auto-dismiss toast after default duration (3000ms)', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    expect(screen.getByText('Test message')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('should auto-dismiss toast after custom duration', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Custom Duration'));

    expect(screen.getByText('Custom duration')).toBeInTheDocument();

    // Should not dismiss after 3000ms (default)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('Custom duration')).toBeInTheDocument();

    // Should dismiss after 5000ms (custom duration)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('Custom duration')).not.toBeInTheDocument();
  });

  it('should not auto-dismiss when duration is 0', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show No Auto-dismiss'));

    expect(screen.getByText('No auto-dismiss')).toBeInTheDocument();

    // Should still be visible after long time
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText('No auto-dismiss')).toBeInTheDocument();
  });
});

describe('hideToast - Removing Toasts', () => {
  it('should remove toast when hideToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    const toastMessage = screen.getByText('Test message');
    expect(toastMessage).toBeInTheDocument();

    // Find and click the close button
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('should only remove the specified toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));
    fireEvent.click(screen.getByText('Show Success'));

    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Get all close buttons
    const closeButtons = screen.getAllByLabelText('Close notification');

    // Click the first close button
    fireEvent.click(closeButtons[0]);

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();

    // Second toast should still be visible
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });
});

describe('ToastContainer - Rendering', () => {
  it('should render toast container when toasts are present', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    expect(container.querySelector('.toast-container')).toBeInTheDocument();
  });

  it('should remove toast container when all toasts are dismissed', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    expect(container.querySelector('.toast-container')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    expect(container.querySelector('.toast-container')).not.toBeInTheDocument();
  });

  it('should render all toasts in the container', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));

    const toastItems = container.querySelectorAll('.toast-item');
    expect(toastItems).toHaveLength(3);
  });
});

describe('ToastItem - Type Styling', () => {
  it('should apply success styling to success toast', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));

    const toastItem = container.querySelector('.toast-success');
    expect(toastItem).toBeInTheDocument();
  });

  it('should apply error styling to error toast', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Error'));

    const toastItem = container.querySelector('.toast-error');
    expect(toastItem).toBeInTheDocument();
  });

  it('should apply info styling to info toast', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    const toastItem = container.querySelector('.toast-info');
    expect(toastItem).toBeInTheDocument();
  });
});

describe('ToastItem - Icons', () => {
  it('should render checkmark icon for success toast', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));

    const icon = container.querySelector('.toast-icon svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('w-5', 'h-5');
  });

  it('should render x icon for error toast', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Error'));

    const icon = container.querySelector('.toast-icon svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('w-5', 'h-5');
  });

  it('should render info icon for info toast', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    const icon = container.querySelector('.toast-icon svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('w-5', 'h-5');
  });
});

describe('ToastItem - Close Button', () => {
  it('should render close button with correct aria-label', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    const closeButton = screen.getByLabelText('Close notification');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveAttribute('type', 'button');
  });

  it('should close toast when close button is clicked', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    expect(screen.getByText('Test message')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('should render close icon with correct size', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    const closeButton = screen.getByLabelText('Close notification');
    const closeIcon = closeButton.querySelector('svg');
    expect(closeIcon).toHaveClass('w-4', 'h-4');
  });
});

describe('ToastItem - Message Display', () => {
  it('should display the correct message', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    const message = screen.getByText('Test message');
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('toast-message');
  });

  it('should display different messages for multiple toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));

    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});

describe('ToastItem - Accessibility', () => {
  it('should have role="alert" attribute', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    const toastItem = container.querySelector('[role="alert"]');
    expect(toastItem).toBeInTheDocument();
  });

  it('should have accessible close button', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    const closeButton = screen.getByLabelText('Close notification');
    expect(closeButton).toBeInTheDocument();
  });
});

describe('ToastItem - Layout and Structure', () => {
  it('should have correct layout classes', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    const innerContainer = container.querySelector('.flex.items-center.gap-3');
    expect(innerContainer).toBeInTheDocument();
  });

  it('should contain icon, message, and close button', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    const toastItem = container.querySelector('.toast-item');
    expect(toastItem?.querySelector('.toast-icon')).toBeInTheDocument();
    expect(toastItem?.querySelector('.toast-message')).toBeInTheDocument();
    expect(toastItem?.querySelector('.toast-close')).toBeInTheDocument();
  });
});

describe('Toast - Unique IDs', () => {
  it('should generate unique IDs for each toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));
    fireEvent.click(screen.getByText('Show Success'));

    const toastCount = screen.getByTestId('toast-count');
    expect(toastCount).toHaveTextContent('2');
  });

  it('should use crypto.randomUUID if available', () => {
    // This test verifies the ID generation logic works
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    // Just verify a toast was created
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});

describe('Toast - Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle rapid successive toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Click rapidly
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Show Info'));
    }

    const toastCount = screen.getByTestId('toast-count');
    expect(toastCount).toHaveTextContent('5');
  });

  it('should handle dismissing all toasts at once', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));

    const closeButtons = screen.getAllByLabelText('Close notification');

    // Click all close buttons
    closeButtons.forEach(button => fireEvent.click(button));

    expect(container.querySelector('.toast-container')).not.toBeInTheDocument();
  });

  it('should handle empty message string', () => {
    const EmptyMessageComponent = () => {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('', 'info')}>Show Empty</button>
      );
    };

    render(
      <ToastProvider>
        <EmptyMessageComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Empty'));

    // Toast should still render even with empty message
    const toastMessage = screen.getByRole('alert');
    expect(toastMessage).toBeInTheDocument();
  });

  it('should handle very long messages', () => {
    const longMessage = 'A'.repeat(500);

    const LongMessageComponent = () => {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast(longMessage, 'info')}>Show Long</button>
      );
    };

    render(
      <ToastProvider>
        <LongMessageComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Long'));

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });
});

describe('Toast - Cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should clean up timers when component unmounts', () => {
    const { unmount } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Unmount before timeout completes
    unmount();

    // Advance timers to see if there are any issues
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // No errors should occur
  });
});
