"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input, InputProps } from "./input";

/**
 * Props for the FormField component.
 */
export interface FormFieldProps {
  /**
   * Unique identifier for the input field.
   * Used to associate label, hint, and error with the input.
   */
  id: string;

  /**
   * Label text displayed above the input.
   */
  label: string;

  /**
   * Optional hint text displayed below the label.
   * Useful for providing context or instructions.
   */
  hint?: string;

  /**
   * Optional error message displayed below the input.
   * When provided, the input will be styled as error state.
   */
  error?: string;

  /**
   * Whether the field is required.
   * Adds a required indicator to the label.
   */
  required?: boolean;

  /**
   * Optional CSS class name for the wrapper container.
   */
  className?: string;

  /**
   * Props to pass to the underlying Input component.
   */
  inputProps?: Omit<InputProps, "id" | "error" | "errorId" | "aria-describedby">;

  /**
   * Optional CSS class name for the label.
   */
  labelClassName?: string;

  /**
   * Optional CSS class name for the hint text.
   */
  hintClassName?: string;

  /**
   * Optional CSS class name for the error message.
   */
  errorClassName?: string;
}

/**
 * FormField Component
 *
 * A comprehensive form field wrapper that combines Label, Input, Error, and Hint.
 * Built with accessibility best practices and the Sam-inspired design system.
 *
 * Features:
 * - Accessible label with htmlFor association
 * - Optional hint text for context
 * - Error message display with ARIA support
 * - Required field indicator
 * - Automatic ARIA attribute management
 * - Full keyboard navigation support
 * - Consistent styling with design tokens
 *
 * @example
 * ```tsx
 * // Basic text input
 * <FormField
 *   id="username"
 *   label="Username"
 *   inputProps={{ placeholder: "Enter your username" }}
 * />
 *
 * // Required field with hint
 * <FormField
 *   id="email"
 *   label="Email"
 *   hint="We'll never share your email"
 *   required
 *   inputProps={{ type: "email", placeholder: "you@example.com" }}
 * />
 *
 * // Field with error
 * <FormField
 *   id="password"
 *   label="Password"
 *   error="Password must be at least 8 characters"
 *   inputProps={{ type: "password" }}
 * />
 *
 * // Number input with all features
 * <FormField
 *   id="amount"
 *   label="Amount"
 *   hint="Enter the amount in aUEC"
 *   error={formErrors.amount}
 *   required
 *   inputProps={{
 *     type: "number",
 *     min: 0,
 *     placeholder: "0"
 *   }}
 * />
 * ```
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      id,
      label,
      hint,
      error,
      required = false,
      className,
      inputProps = {},
      labelClassName,
      hintClassName,
      errorClassName,
    },
    ref
  ) => {
    // Generate IDs for hint and error for ARIA associations
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    // Construct aria-describedby from available hint/error
    const ariaDescribedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {/* Label */}
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium text-text-primary",
            labelClassName
          )}
        >
          {label}
          {required && (
            <span className="ml-1 text-feedback-error" aria-label="required">
              *
            </span>
          )}
        </label>

        {/* Hint text */}
        {hint && (
          <p
            id={hintId}
            className={cn(
              "text-xs text-text-muted",
              hintClassName
            )}
          >
            {hint}
          </p>
        )}

        {/* Input */}
        <Input
          id={id}
          ref={ref}
          error={!!error}
          aria-describedby={ariaDescribedBy}
          aria-required={required}
          {...inputProps}
        />

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            className={cn(
              "text-xs font-medium text-feedback-error",
              errorClassName
            )}
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
