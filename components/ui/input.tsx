"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Input variant styles using class-variance-authority.
 * Supports multiple states and sizes with consistent design tokens.
 */
const inputVariants = cva(
  // Base styles applied to all inputs
  "inline-flex w-full rounded-lg border font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 focus:ring-offset-surface-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/[0.02] disabled:border-white/5 placeholder:text-text-muted",
  {
    variants: {
      /**
       * Visual variants matching the design system
       * - default: Standard input style
       * - error: Error state with red border
       */
      variant: {
        default:
          "bg-white/5 border-border-default text-text-primary hover:bg-white/[0.08] hover:border-border-hover hover:shadow-sm focus:bg-white/5 focus:border-border-focus",
        error:
          "bg-feedback-error-bg border-border-error text-text-primary hover:bg-feedback-error-bg/80 focus:border-border-error focus:ring-border-error",
      },
      /**
       * Size variants for different contexts
       * - sm: Compact for tight spaces
       * - md: Default size for most use cases
       * - lg: Prominent for emphasis
       */
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

/**
 * Props for the Input component.
 * Extends standard HTML input attributes with variant styling options.
 */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;

  /**
   * Whether the input is in an error state.
   * When true, the input displays error styling.
   */
  error?: boolean;

  /**
   * ID of the element describing the error.
   * Used for aria-describedby when error is true.
   */
  errorId?: string;
}

/**
 * Input Component
 *
 * A flexible, accessible input component with multiple variants and sizes.
 * Built with the Sam-inspired design system and accessibility best practices.
 *
 * Features:
 * - Two visual variants (default, error)
 * - Three size options (sm, md, lg)
 * - Full accessibility support (keyboard navigation, focus states, ARIA)
 * - Error state support with ARIA attributes
 * - Consistent with design tokens
 * - Supports all standard HTML input types
 *
 * @example
 * ```tsx
 * // Standard text input
 * <Input type="text" placeholder="Enter your name" />
 *
 * // Number input with small size
 * <Input type="number" size="sm" placeholder="Amount" />
 *
 * // Email input with error state
 * <Input
 *   type="email"
 *   error
 *   errorId="email-error"
 *   aria-describedby="email-error"
 * />
 *
 * // Large input with custom styling
 * <Input size="lg" className="max-w-md" placeholder="Search..." />
 *
 * // Disabled input
 * <Input disabled value="Read-only value" />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      error = false,
      errorId,
      type = "text",
      disabled,
      ...props
    },
    ref
  ) => {
    // Automatically set variant to error if error prop is true
    const effectiveVariant = error ? "error" : variant;

    // Determine aria-describedby value
    const ariaDescribedBy = error && errorId ? errorId : props["aria-describedby"];

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant: effectiveVariant, size, className }))}
        ref={ref}
        disabled={disabled}
        aria-invalid={error}
        {...props}
        aria-describedby={ariaDescribedBy}
      />
    );
  }
);

Input.displayName = "Input";

// Export variant types for external use
export { inputVariants };
