"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Checkbox variant styles using class-variance-authority.
 * Supports multiple sizes with consistent design tokens.
 */
const checkboxVariants = cva(
  // Base styles applied to all checkboxes
  "shrink-0 rounded border-2 border-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 focus:ring-offset-surface-base disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none data-[state=checked]:bg-interaction-primary data-[state=checked]:border-interaction-primary data-[state=unchecked]:bg-white/5",
  {
    variants: {
      /**
       * Size variants for different contexts
       * - sm: Compact for tight spaces
       * - md: Default size for most use cases
       * - lg: Prominent for emphasis
       */
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const checkboxIndicatorVariants = cva(
  // Base styles for the checkbox indicator (checkmark icon)
  "flex items-center justify-center text-white",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

/**
 * Props for the Checkbox component.
 * Extends Radix UI Checkbox props with variant styling options.
 */
export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;

  /**
   * Optional CSS class name for the indicator element.
   */
  indicatorClassName?: string;
}

/**
 * Checkbox Component
 *
 * A flexible, accessible checkbox component built on Radix UI Checkbox primitive.
 * Perfect for selection states, task lists, and multi-option forms.
 *
 * Features:
 * - Three size options (sm, md, lg)
 * - Full accessibility support (keyboard navigation, focus states, ARIA)
 * - Smooth animations and transitions
 * - Built on Radix UI for robust behavior
 * - Consistent with design tokens
 * - Disabled state support
 * - Indeterminate state support
 *
 * @example
 * ```tsx
 * // Basic checkbox with controlled state
 * const [checked, setChecked] = useState(false);
 * <Checkbox checked={checked} onCheckedChange={setChecked} />
 *
 * // Checkbox with label using aria-label
 * <Checkbox
 *   checked={agreeToTerms}
 *   onCheckedChange={setAgreeToTerms}
 *   aria-label="Agree to terms and conditions"
 * />
 *
 * // Small checkbox
 * <Checkbox size="sm" checked={value} onCheckedChange={setValue} />
 *
 * // Large checkbox
 * <Checkbox size="lg" checked={value} onCheckedChange={setValue} />
 *
 * // Disabled checkbox
 * <Checkbox disabled checked={value} />
 *
 * // Checkbox with custom styling
 * <Checkbox className="ml-4" indicatorClassName="text-neon" />
 *
 * // Indeterminate state (useful for "select all" scenarios)
 * <Checkbox checked="indeterminate" />
 * ```
 */
export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, indicatorClassName, size, ...props }, ref) => {
  return (
    <CheckboxPrimitive.Root
      className={cn(checkboxVariants({ size, className }))}
      {...props}
      ref={ref}
    >
      <CheckboxPrimitive.Indicator
        className={cn(checkboxIndicatorVariants({ size, className: indicatorClassName }))}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-full w-full"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = "Checkbox";

// Export variant types for external use
export { checkboxVariants, checkboxIndicatorVariants };
