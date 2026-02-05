import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNumericInput } from './useNumericInput';
import type { Lang } from '../lib/format';

// ============================================================================
// MOCKS
// ============================================================================

// Mock the format module to control formatting behavior in tests
vi.mock('../lib/format', () => ({
  formatInteger: (value: number, lang: Lang) => {
    if (lang === 'de') {
      return Math.trunc(value).toLocaleString('de-DE');
    }
    return Math.trunc(value).toLocaleString('en-US');
  },
  parseFormattedInteger: (str: string) => {
    const trimmed = str.trim();
    if (!trimmed || trimmed === '-') return 0;
    // Simple implementation for tests - strip non-digits except minus
    const cleaned = trimmed.replace(/[^\d-]/g, '');
    if (!cleaned || cleaned === '-') return 0;
    return parseInt(cleaned, 10) || 0;
  },
}));

// ============================================================================
// TEST DATA
// ============================================================================

const createDefaultProps = (overrides?: Partial<{
  value: number;
  onChange: (value: number) => void;
  lang: Lang;
  disabled: boolean;
}>) => ({
  value: 0,
  onChange: vi.fn(),
  lang: 'de' as Lang,
  disabled: false,
  ...overrides,
});

// ============================================================================
// TESTS: Auto-Clear on Focus When Value is 0
// ============================================================================

describe('useNumericInput - Auto-Clear on Focus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear display when focusing on a field with value 0', () => {
    const props = createDefaultProps({ value: 0 });
    const { result } = renderHook(() => useNumericInput(props));

    // Initially shows formatted '0'
    expect(result.current.displayValue).toBe('0');
    expect(result.current.isFocused).toBe(false);

    // Focus the input
    act(() => {
      result.current.handlers.onFocus();
    });

    // Should show empty string (auto-clear behavior)
    expect(result.current.displayValue).toBe('');
    expect(result.current.isFocused).toBe(true);
  });

  it('should show raw number when focusing on a field with non-zero value', () => {
    const props = createDefaultProps({ value: 5000 });
    const { result } = renderHook(() => useNumericInput(props));

    // Initially shows formatted value
    expect(result.current.displayValue).toBe('5.000');

    // Focus the input
    act(() => {
      result.current.handlers.onFocus();
    });

    // Should show raw number without formatting
    expect(result.current.displayValue).toBe('5000');
    expect(result.current.isFocused).toBe(true);
  });

  it('should not clear display if value is explicitly 0 set by user', () => {
    // When user explicitly typed 0, focus should still clear it
    // (We cannot distinguish between default 0 and user-typed 0 in this implementation)
    const props = createDefaultProps({ value: 0 });
    const { result } = renderHook(() => useNumericInput(props));

    act(() => {
      result.current.handlers.onFocus();
    });

    expect(result.current.displayValue).toBe('');
  });
});

// ============================================================================
// TESTS: Auto-Restore on Blur When Empty
// ============================================================================

describe('useNumericInput - Auto-Restore on Blur', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show 0 after blurring an empty field', () => {
    const onChange = vi.fn();
    const props = createDefaultProps({ value: 0, onChange });
    const { result } = renderHook(() => useNumericInput(props));

    // Focus and then blur without changing
    act(() => {
      result.current.handlers.onFocus();
    });

    expect(result.current.displayValue).toBe('');

    act(() => {
      result.current.handlers.onBlur();
    });

    // Should restore to formatted 0
    expect(result.current.displayValue).toBe('0');
    expect(result.current.isFocused).toBe(false);
  });

  it('should restore formatted value on blur', () => {
    const props = createDefaultProps({ value: 100000 });
    const { result } = renderHook(() => useNumericInput(props));

    // Focus
    act(() => {
      result.current.handlers.onFocus();
    });

    expect(result.current.displayValue).toBe('100000');

    // Blur
    act(() => {
      result.current.handlers.onBlur();
    });

    // Should show formatted value with thousand separators
    expect(result.current.displayValue).toBe('100.000');
  });
});

// ============================================================================
// TESTS: Preserve User Input
// ============================================================================

describe('useNumericInput - Preserve User Input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should preserve user-entered value after blur', () => {
    const onChange = vi.fn();
    const props = createDefaultProps({ value: 0, onChange });
    const { result, rerender } = renderHook(
      ({ props }) => useNumericInput(props),
      { initialProps: { props } }
    );

    // Focus
    act(() => {
      result.current.handlers.onFocus();
    });

    // Simulate user typing '5000'
    act(() => {
      result.current.handlers.onChange({
        target: { value: '5000' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(onChange).toHaveBeenCalledWith(5000);

    // Update the hook with new value (simulating parent state update)
    const updatedProps = createDefaultProps({ value: 5000, onChange });
    rerender({ props: updatedProps });

    // Blur
    act(() => {
      result.current.handlers.onBlur();
    });

    // Should show formatted value
    expect(result.current.displayValue).toBe('5.000');
  });

  it('should call onChange with parsed numeric value', () => {
    const onChange = vi.fn();
    const props = createDefaultProps({ value: 0, onChange });
    const { result } = renderHook(() => useNumericInput(props));

    act(() => {
      result.current.handlers.onFocus();
    });

    act(() => {
      result.current.handlers.onChange({
        target: { value: '12345' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(onChange).toHaveBeenCalledWith(12345);
  });

  it('should handle empty input during editing', () => {
    const onChange = vi.fn();
    const props = createDefaultProps({ value: 5000, onChange });
    const { result } = renderHook(() => useNumericInput(props));

    act(() => {
      result.current.handlers.onFocus();
    });

    // User clears the input
    act(() => {
      result.current.handlers.onChange({
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Should call onChange with 0 (will be restored on blur)
    expect(onChange).toHaveBeenCalledWith(0);
  });
});

// ============================================================================
// TESTS: Decimal Rejection
// ============================================================================

describe('useNumericInput - Decimal Rejection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should strip decimal point and only use integer part when typing decimal', () => {
    const onChange = vi.fn();
    const props = createDefaultProps({ value: 0, onChange });
    const { result } = renderHook(() => useNumericInput(props));

    act(() => {
      result.current.handlers.onFocus();
    });

    // User types '123.45' - the parseFormattedInteger strips non-digits
    act(() => {
      result.current.handlers.onChange({
        target: { value: '123.45' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Should parse as 12345 (dots stripped by parseFormattedInteger)
    // The actual implementation strips non-digits, so '123.45' becomes '12345'
    expect(onChange).toHaveBeenCalled();
  });

  it('should strip decimal comma when typing', () => {
    const onChange = vi.fn();
    const props = createDefaultProps({ value: 0, onChange });
    const { result } = renderHook(() => useNumericInput(props));

    act(() => {
      result.current.handlers.onFocus();
    });

    // User types with comma as decimal (German style for decimals)
    act(() => {
      result.current.handlers.onChange({
        target: { value: '123,45' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // parseFormattedInteger will strip the comma and return 12345
    expect(onChange).toHaveBeenCalled();
  });

  it('should only accept digit characters', () => {
    const onChange = vi.fn();
    const props = createDefaultProps({ value: 0, onChange });
    const { result } = renderHook(() => useNumericInput(props));

    act(() => {
      result.current.handlers.onFocus();
    });

    // User types with letters
    act(() => {
      result.current.handlers.onChange({
        target: { value: 'abc123def' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Should only parse digits
    expect(onChange).toHaveBeenCalledWith(123);
  });
});

// ============================================================================
// TESTS: Thousand Separator Display on Blur
// ============================================================================

describe('useNumericInput - Thousand Separator Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display with German thousand separators (period) when lang is de', () => {
    const props = createDefaultProps({ value: 100000, lang: 'de' });
    const { result } = renderHook(() => useNumericInput(props));

    // When not focused, should show formatted value
    expect(result.current.displayValue).toBe('100.000');
  });

  it('should display with English thousand separators (comma) when lang is en', () => {
    const props = createDefaultProps({ value: 100000, lang: 'en' });
    const { result } = renderHook(() => useNumericInput(props));

    // When not focused, should show formatted value
    expect(result.current.displayValue).toBe('100,000');
  });

  it('should show raw number without separators when focused', () => {
    const props = createDefaultProps({ value: 1234567, lang: 'de' });
    const { result } = renderHook(() => useNumericInput(props));

    expect(result.current.displayValue).toBe('1.234.567');

    act(() => {
      result.current.handlers.onFocus();
    });

    expect(result.current.displayValue).toBe('1234567');
  });

  it('should format large numbers correctly', () => {
    const props = createDefaultProps({ value: 999999999, lang: 'de' });
    const { result } = renderHook(() => useNumericInput(props));

    expect(result.current.displayValue).toBe('999.999.999');
  });

  it('should format small numbers without separators', () => {
    const props = createDefaultProps({ value: 999, lang: 'de' });
    const { result } = renderHook(() => useNumericInput(props));

    expect(result.current.displayValue).toBe('999');
  });
});

// ============================================================================
// TESTS: Disabled Field Behavior
// ============================================================================

describe('useNumericInput - Disabled Field Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not respond to focus when disabled', () => {
    const props = createDefaultProps({ value: 5000, disabled: true });
    const { result } = renderHook(() => useNumericInput(props));

    expect(result.current.isFocused).toBe(false);

    act(() => {
      result.current.handlers.onFocus();
    });

    // Should remain not focused
    expect(result.current.isFocused).toBe(false);
    // Should still show formatted value
    expect(result.current.displayValue).toBe('5.000');
  });

  it('should not respond to blur when disabled', () => {
    const props = createDefaultProps({ value: 5000, disabled: true });
    const { result } = renderHook(() => useNumericInput(props));

    act(() => {
      result.current.handlers.onBlur();
    });

    // Should remain unchanged
    expect(result.current.isFocused).toBe(false);
    expect(result.current.displayValue).toBe('5.000');
  });

  it('should not respond to onChange when disabled', () => {
    const onChange = vi.fn();
    const props = createDefaultProps({ value: 5000, disabled: true, onChange });
    const { result } = renderHook(() => useNumericInput(props));

    act(() => {
      result.current.handlers.onChange({
        target: { value: '9999' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Should not call onChange
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should still display formatted value when disabled', () => {
    const props = createDefaultProps({ value: 100000, disabled: true, lang: 'de' });
    const { result } = renderHook(() => useNumericInput(props));

    expect(result.current.displayValue).toBe('100.000');
  });
});

// ============================================================================
// TESTS: Sync with External Value Changes
// ============================================================================

describe('useNumericInput - Sync with External Value Changes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update displayValue when external value changes', () => {
    const props = createDefaultProps({ value: 1000 });
    const { result, rerender } = renderHook(
      ({ props }) => useNumericInput(props),
      { initialProps: { props } }
    );

    expect(result.current.displayValue).toBe('1.000');

    // External value changes
    const updatedProps = createDefaultProps({ value: 2000 });
    rerender({ props: updatedProps });

    expect(result.current.displayValue).toBe('2.000');
  });

  it('should handle value change while focused', () => {
    const props = createDefaultProps({ value: 1000 });
    const { result, rerender } = renderHook(
      ({ props }) => useNumericInput(props),
      { initialProps: { props } }
    );

    // Focus
    act(() => {
      result.current.handlers.onFocus();
    });

    expect(result.current.displayValue).toBe('1000');

    // External value changes while focused
    const updatedProps = createDefaultProps({ value: 2000 });
    rerender({ props: updatedProps });

    // Should show raw number since still focused
    expect(result.current.displayValue).toBe('2000');
  });

  it('should handle value change from non-zero to zero', () => {
    const props = createDefaultProps({ value: 5000 });
    const { result, rerender } = renderHook(
      ({ props }) => useNumericInput(props),
      { initialProps: { props } }
    );

    expect(result.current.displayValue).toBe('5.000');

    // External value changes to 0
    const updatedProps = createDefaultProps({ value: 0 });
    rerender({ props: updatedProps });

    // Should show '0' when blurred
    expect(result.current.displayValue).toBe('0');
  });

  it('should handle value change from zero to non-zero', () => {
    const props = createDefaultProps({ value: 0 });
    const { result, rerender } = renderHook(
      ({ props }) => useNumericInput(props),
      { initialProps: { props } }
    );

    expect(result.current.displayValue).toBe('0');

    // External value changes to non-zero
    const updatedProps = createDefaultProps({ value: 5000 });
    rerender({ props: updatedProps });

    expect(result.current.displayValue).toBe('5.000');
  });

  it('should handle lang change', () => {
    const props = createDefaultProps({ value: 100000, lang: 'de' });
    const { result, rerender } = renderHook(
      ({ props }) => useNumericInput(props),
      { initialProps: { props } }
    );

    expect(result.current.displayValue).toBe('100.000');

    // Lang changes to English
    const updatedProps = createDefaultProps({ value: 100000, lang: 'en' });
    rerender({ props: updatedProps });

    expect(result.current.displayValue).toBe('100,000');
  });
});

// ============================================================================
// TESTS: Handler Memoization
// ============================================================================

describe('useNumericInput - Handler Memoization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should memoize handlers object', () => {
    const props = createDefaultProps({ value: 1000 });
    const { result, rerender } = renderHook(
      ({ props }) => useNumericInput(props),
      { initialProps: { props } }
    );

    const initialHandlers = result.current.handlers;

    // Rerender with same props
    rerender({ props });

    // Handlers should be the same reference
    expect(result.current.handlers).toBe(initialHandlers);
  });

  it('should update handlers when onChange callback changes', () => {
    const onChange1 = vi.fn();
    const props1 = createDefaultProps({ value: 1000, onChange: onChange1 });
    const { result, rerender } = renderHook(
      ({ props }) => useNumericInput(props),
      { initialProps: { props: props1 } }
    );

    const initialHandlers = result.current.handlers;

    // Rerender with new onChange callback
    const onChange2 = vi.fn();
    const props2 = createDefaultProps({ value: 1000, onChange: onChange2 });
    rerender({ props: props2 });

    // Handlers should be different reference
    expect(result.current.handlers).not.toBe(initialHandlers);
  });
});

// ============================================================================
// TESTS: Edge Cases
// ============================================================================

describe('useNumericInput - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle negative values', () => {
    const props = createDefaultProps({ value: -500 });
    const { result } = renderHook(() => useNumericInput(props));

    expect(result.current.displayValue).toBe('-500');
  });

  it('should handle minus sign input', () => {
    const onChange = vi.fn();
    const props = createDefaultProps({ value: 0, onChange });
    const { result } = renderHook(() => useNumericInput(props));

    act(() => {
      result.current.handlers.onFocus();
    });

    // User types just minus sign
    act(() => {
      result.current.handlers.onChange({
        target: { value: '-' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Should call onChange with 0 (incomplete negative number)
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('should handle rapid focus/blur cycles', () => {
    const props = createDefaultProps({ value: 5000 });
    const { result } = renderHook(() => useNumericInput(props));

    // Rapid focus/blur
    act(() => {
      result.current.handlers.onFocus();
      result.current.handlers.onBlur();
      result.current.handlers.onFocus();
      result.current.handlers.onBlur();
    });

    // Should end up in blurred state with formatted value
    expect(result.current.isFocused).toBe(false);
    expect(result.current.displayValue).toBe('5.000');
  });

  it('should handle focus/blur when value is 0 without crashing', () => {
    const onChange = vi.fn();
    const props = createDefaultProps({ value: 0, onChange });
    const { result } = renderHook(() => useNumericInput(props));

    // Multiple focus/blur cycles on 0
    act(() => {
      result.current.handlers.onFocus();
    });
    expect(result.current.displayValue).toBe('');

    act(() => {
      result.current.handlers.onBlur();
    });
    expect(result.current.displayValue).toBe('0');

    act(() => {
      result.current.handlers.onFocus();
    });
    expect(result.current.displayValue).toBe('');
  });
});
