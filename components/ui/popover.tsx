"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Popover content variant styles using class-variance-authority.
 * Supports multiple sizes with consistent design tokens.
 */
const popoverContentVariants = cva(
  // Base styles applied to all popover content
  "z-50 rounded-lg border border-border-default bg-surface-elevated p-4 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      /**
       * Size variants for different contexts
       * - sm: Compact for tight spaces
       * - md: Default size for most use cases
       * - lg: Prominent for emphasis
       */
      size: {
        sm: "p-3 text-xs max-w-xs",
        md: "p-4 text-sm max-w-sm",
        lg: "p-6 text-base max-w-md",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

/**
 * Props for the Popover component root.
 */
export interface PopoverProps extends PopoverPrimitive.PopoverProps {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Props for the PopoverContent component.
 */
export interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
    VariantProps<typeof popoverContentVariants> {
  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Popover Component (Root)
 *
 * A flexible, accessible popover component built on Radix UI Popover primitive.
 * Provides a floating panel that displays content anchored to a trigger element.
 *
 * Features:
 * - Full accessibility support (keyboard navigation, focus management, ARIA)
 * - Smooth animations and transitions
 * - Flexible positioning with collision detection
 * - Portal rendering to avoid z-index issues
 * - Controlled or uncontrolled state
 *
 * @example
 * ```tsx
 * // Basic uncontrolled popover
 * <Popover>
 *   <PopoverTrigger>Open</PopoverTrigger>
 *   <PopoverContent>
 *     <p>Popover content goes here</p>
 *   </PopoverContent>
 * </Popover>
 *
 * // Controlled popover
 * const [open, setOpen] = useState(false);
 * <Popover open={open} onOpenChange={setOpen}>
 *   <PopoverTrigger>Toggle</PopoverTrigger>
 *   <PopoverContent>
 *     <p>Content</p>
 *   </PopoverContent>
 * </Popover>
 * ```
 */
export const Popover = PopoverPrimitive.Root;

/**
 * PopoverTrigger Component
 *
 * The button or element that toggles the popover's visibility.
 * Accepts any valid React element as children.
 *
 * @example
 * ```tsx
 * <PopoverTrigger>
 *   <button>Click me</button>
 * </PopoverTrigger>
 *
 * // Or with asChild to merge props with child
 * <PopoverTrigger asChild>
 *   <Button>Open popover</Button>
 * </PopoverTrigger>
 * ```
 */
export const PopoverTrigger = PopoverPrimitive.Trigger;

/**
 * PopoverAnchor Component
 *
 * An optional anchor element to position the popover relative to.
 * Useful when you want the popover positioned relative to a different element than the trigger.
 *
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverAnchor asChild>
 *     <div>Anchor point</div>
 *   </PopoverAnchor>
 *   <PopoverTrigger>Open</PopoverTrigger>
 *   <PopoverContent>Content</PopoverContent>
 * </Popover>
 * ```
 */
export const PopoverAnchor = PopoverPrimitive.Anchor;

/**
 * PopoverContent Component
 *
 * The container for popover content that appears when the popover is open.
 * Automatically positioned relative to the trigger with collision detection.
 *
 * Features:
 * - Three size variants (sm, md, lg)
 * - Portal rendering for proper stacking
 * - Configurable alignment and side positioning
 * - Collision detection and boundary awareness
 * - Focus management and keyboard support (Escape to close)
 * - Smooth enter/exit animations
 *
 * @example
 * ```tsx
 * // Standard content
 * <PopoverContent>
 *   <h3>Title</h3>
 *   <p>Description</p>
 * </PopoverContent>
 *
 * // Small content
 * <PopoverContent size="sm">
 *   <p>Compact info</p>
 * </PopoverContent>
 *
 * // Large content with custom alignment
 * <PopoverContent size="lg" align="start" side="bottom">
 *   <div>Rich content</div>
 * </PopoverContent>
 *
 * // With custom offset and no portal
 * <PopoverContent sideOffset={10} alignOffset={-5}>
 *   <p>Content</p>
 * </PopoverContent>
 * ```
 */
export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, size, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(popoverContentVariants({ size, className }))}
      {...props}
    />
  </PopoverPrimitive.Portal>
));

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

/**
 * PopoverClose Component
 *
 * A button that closes the popover when clicked.
 * Useful for adding explicit close buttons within the popover content.
 *
 * @example
 * ```tsx
 * <PopoverContent>
 *   <p>Content</p>
 *   <PopoverClose asChild>
 *     <button>Close</button>
 *   </PopoverClose>
 * </PopoverContent>
 *
 * // Or with icon
 * <PopoverClose className="absolute top-2 right-2">
 *   <X className="h-4 w-4" />
 * </PopoverClose>
 * ```
 */
export const PopoverClose = PopoverPrimitive.Close;

// Export variant types for external use
export { popoverContentVariants };
