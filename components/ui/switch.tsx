"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Switch variant styles using class-variance-authority.
 * Supports multiple sizes with consistent design tokens.
 */
const switchVariants = cva(
  // Base styles applied to all switches
  "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 focus:ring-offset-surface-base disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none data-[state=checked]:bg-interaction-primary data-[state=unchecked]:bg-white/10",
  {
    variants: {
      /**
       * Size variants for different contexts
       * - sm: Compact for tight spaces
       * - md: Default size for most use cases
       * - lg: Prominent for emphasis
       */
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
        lg: "h-7 w-14",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const switchThumbVariants = cva(
  // Base styles for the switch thumb (the moving circle)
  "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 data-[state=unchecked]:translate-x-0",
  {
    variants: {
      size: {
        sm: "h-4 w-4 data-[state=checked]:translate-x-4",
        md: "h-5 w-5 data-[state=checked]:translate-x-5",
        lg: "h-6 w-6 data-[state=checked]:translate-x-7",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

/**
 * Props for the Switch component.
 * Extends Radix UI Switch props with variant styling options.
 */
export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;

  /**
   * Optional CSS class name for the thumb element.
   */
  thumbClassName?: string;
}

/**
 * Switch Component
 *
 * A flexible, accessible toggle switch component built on Radix UI Switch primitive.
 * Perfect for binary on/off states like enabling tax calculations or showing/hiding fields.
 *
 * Features:
 * - Three size options (sm, md, lg)
 * - Full accessibility support (keyboard navigation, focus states, ARIA)
 * - Smooth animations and transitions
 * - Built on Radix UI for robust behavior
 * - Consistent with design tokens
 * - Disabled state support
 *
 * @example
 * ```tsx
 * // Basic switch with controlled state
 * const [enabled, setEnabled] = useState(false);
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 *
 * // Switch with label using aria-label
 * <Switch
 *   checked={taxEnabled}
 *   onCheckedChange={setTaxEnabled}
 *   aria-label="Enable tax calculation"
 * />
 *
 * // Small switch
 * <Switch size="sm" checked={value} onCheckedChange={setValue} />
 *
 * // Large switch
 * <Switch size="lg" checked={value} onCheckedChange={setValue} />
 *
 * // Disabled switch
 * <Switch disabled checked={value} />
 *
 * // Switch with custom styling
 * <Switch className="ml-4" thumbClassName="bg-neon" />
 * ```
 */
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, thumbClassName, size, ...props }, ref) => {
  return (
    <SwitchPrimitive.Root
      className={cn(switchVariants({ size, className }))}
      {...props}
      ref={ref}
    >
      <SwitchPrimitive.Thumb
        className={cn(switchThumbVariants({ size, className: thumbClassName }))}
      />
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = "Switch";

// Export variant types for external use
export { switchVariants, switchThumbVariants };
