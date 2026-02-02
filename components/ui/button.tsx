"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button variant styles using class-variance-authority.
 * Supports multiple visual styles and sizes with consistent design tokens.
 */
const buttonVariants = cva(
  // Base styles applied to all buttons
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 focus:ring-offset-surface-base disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  {
    variants: {
      /**
       * Visual variants matching the design system
       * - primary: Main call-to-action (neon/cyan accent)
       * - secondary: Secondary actions (purple/aura accent)
       * - ghost: Subtle actions with minimal background
       * - danger: Destructive actions (red/error)
       * - success: Confirmation actions (green/success)
       */
      variant: {
        primary:
          "bg-interaction-primary text-text-inverse hover:bg-interaction-primary-hover shadow-sm",
        secondary:
          "bg-interaction-secondary text-text-primary hover:bg-interaction-secondary-hover shadow-sm",
        ghost:
          "bg-white/5 border border-white/10 text-text-primary hover:bg-white/10 backdrop-blur-md",
        danger:
          "bg-feedback-error text-white hover:bg-feedback-error/90 shadow-sm",
        success:
          "bg-feedback-success text-white hover:bg-feedback-success/90 shadow-sm",
      },
      /**
       * Size variants for different contexts
       * - sm: Compact for tight spaces or secondary actions
       * - md: Default size for most use cases
       * - lg: Prominent for primary actions
       */
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

/**
 * Props for the Button component.
 * Extends standard HTML button attributes with variant styling options.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;

  /**
   * Button content (text, icons, or mixed).
   */
  children?: React.ReactNode;

  /**
   * Whether the button is in a loading state.
   * When true, the button is disabled and may show a loading indicator.
   */
  isLoading?: boolean;
}

/**
 * Button Component
 *
 * A flexible, accessible button component with multiple variants and sizes.
 * Built on top of Radix UI principles with the Sam-inspired design system.
 *
 * Features:
 * - Five visual variants (primary, secondary, ghost, danger, success)
 * - Three size options (sm, md, lg)
 * - Full accessibility support (keyboard navigation, focus states, ARIA)
 * - Loading state support
 * - Glassmorphism effects for ghost variant
 * - Consistent with design tokens
 *
 * @example
 * ```tsx
 * // Primary button (default)
 * <Button onClick={handleSubmit}>Submit</Button>
 *
 * // Secondary button with small size
 * <Button variant="secondary" size="sm">Cancel</Button>
 *
 * // Ghost button with custom styling
 * <Button variant="ghost" className="w-full">
 *   More Options
 * </Button>
 *
 * // Danger button for destructive actions
 * <Button variant="danger" onClick={handleDelete}>
 *   Delete Account
 * </Button>
 *
 * // Success button with loading state
 * <Button variant="success" isLoading disabled>
 *   Saving...
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      children,
      isLoading = false,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// Export variant types for external use
export { buttonVariants };
