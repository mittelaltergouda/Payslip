import { useState, useCallback, useMemo } from 'react';
import type { Lang } from '../lib/format';
import { formatInteger, parseFormattedInteger } from '../lib/format';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the useNumericInput hook
 */
export type UseNumericInputProps = {
  /** The current numeric value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Locale for formatting ('de' or 'en') */
  lang: Lang;
  /** Whether the input is disabled */
  disabled?: boolean;
};

/**
 * Handler functions returned by the hook
 */
export type NumericInputHandlers = {
  onFocus: () => void;
  onBlur: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

/**
 * Return type for useNumericInput hook
 */
export type UseNumericInputReturn = {
  /** The display value (formatted when blurred, raw when focused) */
  displayValue: string;
  /** Whether the input is currently focused */
  isFocused: boolean;
  /** Event handlers for the input element */
  handlers: NumericInputHandlers;
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Custom hook for numeric input fields with auto-clear and formatting behavior.
 *
 * Manages the display state for numeric inputs with the following features:
 * - Clears the field on focus if the current value is 0 (default)
 * - Restores 0 if the field is left empty on blur
 * - Formats numbers with locale-specific thousand separators when blurred
 * - Strips non-digit characters during input (integers only)
 * - Calls parent onChange with the raw numeric value
 *
 * @param props - Hook configuration
 * @param props.value - The current numeric value
 * @param props.onChange - Callback when value changes
 * @param props.lang - Locale for formatting ('de' or 'en')
 * @param props.disabled - Whether the input is disabled (default: false)
 * @returns Object containing displayValue, isFocused, and handlers
 *
 * @example
 * ```tsx
 * const { displayValue, isFocused, handlers } = useNumericInput({
 *   value: member.revenue,
 *   onChange: (v) => updateMember(member.id, { revenue: v }),
 *   lang: 'de',
 *   disabled: false,
 * });
 *
 * return (
 *   <input
 *     type="text"
 *     inputMode="numeric"
 *     value={displayValue}
 *     onFocus={handlers.onFocus}
 *     onBlur={handlers.onBlur}
 *     onChange={handlers.onChange}
 *   />
 * );
 * ```
 */
export function useNumericInput({
  value,
  onChange,
  lang,
  disabled = false,
}: UseNumericInputProps): UseNumericInputReturn {
  // State
  const [isFocused, setIsFocused] = useState<boolean>(false);

  /**
   * Computed display value:
   * - When focused: show raw number (or empty if value is 0)
   * - When blurred: show formatted number with thousand separators
   */
  const displayValue = useMemo<string>(() => {
    if (isFocused) {
      // When focused, show empty string if value is 0 (auto-clear behavior)
      // Otherwise show the raw number for easy editing
      return value === 0 ? '' : String(value);
    }
    // When blurred, show formatted number with thousand separators
    return formatInteger(value, lang);
  }, [isFocused, value, lang]);

  /**
   * Handle focus event - clears field if value is 0
   */
  const handleFocus = useCallback(() => {
    if (disabled) {return;}
    setIsFocused(true);
  }, [disabled]);

  /**
   * Handle blur event - restores 0 if empty and formats display
   */
  const handleBlur = useCallback(() => {
    if (disabled) {return;}
    setIsFocused(false);
    // Note: displayValue is already handled by useMemo based on isFocused state
    // If the current value is already correct, no onChange needed
  }, [disabled]);

  /**
   * Handle input change - strips non-digit chars and calls parent onChange
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) {return;}

      const inputValue = e.target.value;

      // Handle empty input - will be restored to 0 on blur
      if (inputValue === '' || inputValue === '-') {
        onChange(0);
        return;
      }

      // Parse the input, handling formatted numbers and stripping non-digits
      const parsedValue = parseFormattedInteger(inputValue);

      // Call parent onChange with the raw numeric value
      onChange(parsedValue);
    },
    [disabled, onChange]
  );

  // Memoize handlers object to prevent unnecessary re-renders
  const handlers = useMemo<NumericInputHandlers>(
    () => ({
      onFocus: handleFocus,
      onBlur: handleBlur,
      onChange: handleChange,
    }),
    [handleFocus, handleBlur, handleChange]
  );

  return {
    displayValue,
    isFocused,
    handlers,
  };
}
