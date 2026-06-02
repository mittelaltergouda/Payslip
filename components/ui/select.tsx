"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Select trigger variant styles using class-variance-authority.
 * Supports multiple states and sizes with consistent design tokens.
 */
const selectTriggerVariants = cva(
  // Base styles applied to all select triggers
  "inline-flex w-full items-center justify-between gap-2 rounded-lg border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 focus:ring-offset-surface-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/[0.02] disabled:border-white/5 data-[placeholder]:text-text-muted",
  {
    variants: {
      /**
       * Visual variants matching the design system
       * - default: Standard select style
       * - error: Error state with red border
       */
      variant: {
        default:
          "bg-white/5 border-border-default text-text-primary hover:border-border-hover data-[state=open]:border-border-focus",
        error:
          "bg-feedback-error-bg border-border-error text-text-primary data-[state=open]:border-border-error data-[state=open]:ring-border-error",
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
 * Select content variant styles.
 */
const selectContentVariants = cva(
  "relative z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border-default bg-surface-elevated shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

/**
 * Select item variant styles.
 */
const selectItemVariants = cva(
  "relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 outline-none transition-colors focus:bg-white/10 focus:text-text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:bg-interaction-primary/20 data-[state=checked]:text-interaction-primary",
  {
    variants: {
      size: {
        sm: "text-xs py-1 pl-6",
        md: "text-sm py-1.5 pl-8",
        lg: "text-base py-2 pl-10",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

/**
 * Props for the Select component root.
 */
export interface SelectProps extends SelectPrimitive.SelectProps {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Props for the SelectTrigger component.
 * Extends Radix UI SelectTrigger props with variant styling options.
 */
export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;

  /**
   * Whether the select is in an error state.
   * When true, the trigger displays error styling.
   */
  error?: boolean;

  /**
   * ID of the element describing the error.
   * Used for aria-describedby when error is true.
   */
  errorId?: string;
}

/**
 * Props for the SelectContent component.
 */
export interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>,
    VariantProps<typeof selectContentVariants> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Props for the SelectItem component.
 */
export interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>,
    VariantProps<typeof selectItemVariants> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Select Component (Root)
 *
 * A flexible, accessible select component built on Radix UI Select primitive.
 * Provides a dropdown selection interface with full keyboard navigation.
 *
 * @example
 * ```tsx
 * <Select value={value} onValueChange={setValue}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Select an option" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="option1">Option 1</SelectItem>
 *     <SelectItem value="option2">Option 2</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */
export const Select = SelectPrimitive.Root;

/**
 * SelectGroup Component
 *
 * Groups related select items together with an optional label.
 */
export const SelectGroup = SelectPrimitive.Group;

/**
 * SelectValue Component
 *
 * Displays the currently selected value or placeholder text.
 */
export const SelectValue = SelectPrimitive.Value;

/**
 * SelectTrigger Component
 *
 * The button that opens the select dropdown.
 * Built with accessibility best practices and the Sam-inspired design system.
 *
 * Features:
 * - Two visual variants (default, error)
 * - Three size options (sm, md, lg)
 * - Full accessibility support (keyboard navigation, focus states, ARIA)
 * - Error state support with ARIA attributes
 * - Consistent with design tokens
 * - Chevron icon for visual feedback
 *
 * @example
 * ```tsx
 * // Standard trigger
 * <SelectTrigger>
 *   <SelectValue placeholder="Choose..." />
 * </SelectTrigger>
 *
 * // Small trigger
 * <SelectTrigger size="sm">
 *   <SelectValue />
 * </SelectTrigger>
 *
 * // Error state
 * <SelectTrigger error errorId="select-error">
 *   <SelectValue />
 * </SelectTrigger>
 * ```
 */
export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, variant, size, error = false, errorId, children, ...props }, ref) => {
  // Automatically set variant to error if error prop is true
  const effectiveVariant = error ? "error" : variant;

  // Determine aria-describedby value
  const ariaDescribedBy = error && errorId ? errorId : props["aria-describedby"];

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(selectTriggerVariants({ variant: effectiveVariant, size, className }))}
      aria-invalid={error}
      {...props}
      aria-describedby={ariaDescribedBy}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-50"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/**
 * SelectContent Component
 *
 * The dropdown content that contains select items.
 * Features smooth animations and proper positioning.
 *
 * @example
 * ```tsx
 * <SelectContent>
 *   <SelectItem value="1">One</SelectItem>
 *   <SelectItem value="2">Two</SelectItem>
 * </SelectContent>
 * ```
 */
export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, size, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(selectContentVariants({ size, className }))}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));

SelectContent.displayName = SelectPrimitive.Content.displayName;

/**
 * SelectLabel Component
 *
 * A label for a group of select items.
 *
 * @example
 * ```tsx
 * <SelectGroup>
 *   <SelectLabel>Fruits</SelectLabel>
 *   <SelectItem value="apple">Apple</SelectItem>
 * </SelectGroup>
 * ```
 */
export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-xs font-semibold text-text-muted", className)}
    {...props}
  />
));

SelectLabel.displayName = SelectPrimitive.Label.displayName;

/**
 * SelectItem Component
 *
 * An individual selectable item in the dropdown.
 * Features hover states, checked indicator, and full keyboard support.
 *
 * @example
 * ```tsx
 * // Standard item
 * <SelectItem value="apple">Apple</SelectItem>
 *
 * // Small item
 * <SelectItem value="banana" size="sm">Banana</SelectItem>
 *
 * // Disabled item
 * <SelectItem value="orange" disabled>Orange (Out of stock)</SelectItem>
 * ```
 */
export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, size, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(selectItemVariants({ size, className }))}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));

SelectItem.displayName = SelectPrimitive.Item.displayName;

/**
 * SelectSeparator Component
 *
 * A visual separator between groups of items.
 *
 * @example
 * ```tsx
 * <SelectItem value="1">One</SelectItem>
 * <SelectSeparator />
 * <SelectItem value="2">Two</SelectItem>
 * ```
 */
export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border-default", className)}
    {...props}
  />
));

SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// Export variant types for external use
export { selectTriggerVariants, selectContentVariants, selectItemVariants };
