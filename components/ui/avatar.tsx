"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Avatar variant styles using class-variance-authority.
 * Circular design with glassmorphism effect and size variants.
 */
const avatarVariants = cva(
  // Base styles applied to all avatars - circular with glassmorphism
  "relative inline-flex items-center justify-center rounded-full font-semibold bg-white/5 border border-white/10 text-text-primary backdrop-blur-md shadow-sm transition-all duration-200 ease-out hover:bg-white/10 hover:border-white/20 hover:shadow-md",
  {
    variants: {
      /**
       * Size variants for different contexts
       * - sm: Compact for inline or list items
       * - md: Default size for most use cases
       * - lg: Prominent for profile displays
       */
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

/**
 * Props for the Avatar component.
 */
export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  /**
   * The name/handle to display as initials.
   * Examples: "Pilot" -> "P", "John Doe" -> "JD"
   */
  name: string;

  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * Extracts initials from a name/handle.
 *
 * Rules:
 * - Single word: First letter (e.g., "Pilot" -> "P")
 * - Multiple words: First letter of first two words (e.g., "John Doe" -> "JD")
 * - Empty/whitespace: Returns "?"
 * - Special characters/numbers: Includes them if they're first characters
 *
 * @param name - The name to extract initials from
 * @returns The extracted initials in uppercase
 *
 * @example
 * ```ts
 * getInitials("Pilot") // => "P"
 * getInitials("John Doe") // => "JD"
 * getInitials("") // => "?"
 * getInitials("  ") // => "?"
 * getInitials("a b c") // => "AB"
 * ```
 */
function getInitials(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    return "?";
  }

  const words = trimmed.split(/\s+/);

  if (words.length === 1) {
    // Single word: return first character
    return words[0][0].toUpperCase();
  }

  // Multiple words: return first character of first two words
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Avatar Component
 *
 * A circular avatar component that displays user initials with glassmorphism styling.
 * Built following the Sam-inspired design system with accessible patterns.
 *
 * Features:
 * - Automatic initials extraction from name/handle
 * - Three size options (sm, md, lg)
 * - Glassmorphism effect matching the design system
 * - Full accessibility support (ARIA labels)
 * - Hover effects for interactive feel
 *
 * @example
 * ```tsx
 * // Default avatar with medium size
 * <Avatar name="Pilot" />
 *
 * // Small avatar for inline display
 * <Avatar name="John Doe" size="sm" />
 *
 * // Large avatar with custom styling
 * <Avatar name="Commander" size="lg" className="ring-2 ring-interaction-primary" />
 *
 * // Avatar in a list
 * <div className="flex gap-2">
 *   <Avatar name="Pilot" />
 *   <Avatar name="Escort" />
 *   <Avatar name="Engineer" />
 * </div>
 * ```
 */
export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, name, ...props }, ref) => {
    const initials = React.useMemo(() => getInitials(name), [name]);

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, className }))}
        aria-label={`Avatar for ${name}`}
        role="img"
        {...props}
      >
        <span aria-hidden="true">{initials}</span>
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
