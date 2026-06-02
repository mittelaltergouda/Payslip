"use client";

import * as React from "react";
import { Input, type InputProps } from "./input";
import { useNumericInput } from "@/hooks/useNumericInput";
import type { Lang } from "@/lib/format";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the NumericInput component.
 * Extends InputProps from ui/input.tsx, excluding type/value/onChange
 * which are controlled internally by the useNumericInput hook.
 */
export interface NumericInputProps
  extends Omit<InputProps, "type" | "value" | "onChange"> {
  /**
   * The current numeric value.
   */
  value: number;

  /**
   * Callback when the numeric value changes.
   * Receives the raw numeric value (not formatted string).
   */
  onValueChange: (value: number) => void;

  /**
   * Locale for number formatting.
   * - 'de': German format (1.234)
   * - 'en': English format (1,234)
   */
  lang: Lang;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * NumericInput Component
 *
 * A specialized input component for numeric values with automatic formatting
 * and locale-aware display. Uses the useNumericInput hook internally.
 *
 * Features:
 * - Auto-clears the field on focus if the current value is 0
 * - Restores 0 if the field is left empty on blur
 * - Formats numbers with locale-specific thousand separators when blurred
 * - Strips non-digit characters during input (integers only)
 * - Uses type="text" with inputMode="numeric" for mobile keyboard support
 * - Pattern attribute for basic HTML validation
 * - Full accessibility support (ARIA attributes, keyboard navigation)
 * - Supports all Input component variants and sizes
 *
 * @example
 * ```tsx
 * // Basic usage
 * <NumericInput
 *   value={revenue}
 *   onValueChange={setRevenue}
 *   lang="de"
 * />
 *
 * // With size and placeholder
 * <NumericInput
 *   value={amount}
 *   onValueChange={setAmount}
 *   lang="en"
 *   size="sm"
 *   placeholder="Enter amount"
 * />
 *
 * // With error state
 * <NumericInput
 *   value={expense}
 *   onValueChange={setExpense}
 *   lang="de"
 *   error
 *   errorId="expense-error"
 * />
 *
 * // Disabled state
 * <NumericInput
 *   value={fixedValue}
 *   onValueChange={() => {}}
 *   lang="de"
 *   disabled
 * />
 * ```
 */
export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      value,
      onValueChange,
      lang,
      disabled,
      ...inputProps
    },
    ref
  ) => {
    // Use the numeric input hook for formatting and state management
    const { displayValue, handlers } = useNumericInput({
      value,
      onChange: onValueChange,
      lang,
      disabled,
    });

    return (
      <Input
        ref={ref}
        {...inputProps}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={displayValue}
        onFocus={handlers.onFocus}
        onBlur={handlers.onBlur}
        onChange={handlers.onChange}
        disabled={disabled}
      />
    );
  }
);

NumericInput.displayName = "NumericInput";
