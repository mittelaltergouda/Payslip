/**
 * Design Tokens
 *
 * Centralized design system tokens for consistent styling across the application.
 * These tokens map to CSS custom properties defined in globals.css and Tailwind config.
 */

/**
 * Spacing scale based on 8px grid system
 */
export const spacing = {
  0: "0rem",
  1: "0.25rem",   // 4px
  2: "0.5rem",    // 8px
  3: "0.75rem",   // 12px
  4: "1rem",      // 16px
  5: "1.25rem",   // 20px
  6: "1.5rem",    // 24px
  8: "2rem",      // 32px
  10: "2.5rem",   // 40px
  12: "3rem",     // 48px
  16: "4rem",     // 64px
  20: "5rem",     // 80px
  24: "6rem",     // 96px
} as const;

export type SpacingKey = keyof typeof spacing;

/**
 * Border radius scale
 */
export const radius = {
  none: "0",
  sm: "0.25rem",   // 4px
  md: "0.5rem",    // 8px
  lg: "0.75rem",   // 12px
  xl: "1rem",      // 16px
  "2xl": "1.25rem", // 20px
  "3xl": "1.5rem", // 24px
  full: "9999px",
} as const;

export type RadiusKey = keyof typeof radius;

/**
 * Box shadow tokens
 */
export const shadow = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
  glow: "0 0 20px rgba(147, 51, 234, 0.3)",
  "glow-strong": "0 0 30px rgba(147, 51, 234, 0.5)",
} as const;

export type ShadowKey = keyof typeof shadow;

/**
 * Transition durations
 */
export const duration = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  slower: "500ms",
} as const;

export type DurationKey = keyof typeof duration;

/**
 * Transition timing functions
 */
export const easing = {
  "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

export type EasingKey = keyof typeof easing;

/**
 * Base color palette
 */
export const baseColors = {
  night: "#0b1021",
  slate: "#1a2b3c",
  neon: "#4de8e4",
  aura: "#9b7bff",
  sand: "#f5f0e6",
} as const;

/**
 * Semantic color tokens for surfaces
 */
export const surfaceColors = {
  base: "#0b1021",      // night - main background
  elevated: "#1a2b3c",  // slate - cards, modals
  overlay: "#2a3b4c",   // lighter variant for overlays
  muted: "#f5f0e6",     // sand - light surface variant
} as const;

/**
 * Semantic color tokens for interactions
 */
export const interactionColors = {
  primary: "#4de8e4",        // neon - primary actions
  "primary-hover": "#3dd8d4", // darker neon
  secondary: "#9b7bff",      // aura - secondary actions
  "secondary-hover": "#8b6bef", // darker aura
  ghost: "rgba(77, 232, 228, 0.1)", // subtle interaction
  disabled: "#6b7280",       // gray for disabled state
} as const;

/**
 * Semantic color tokens for feedback
 */
export const feedbackColors = {
  success: "#10b981",        // green
  "success-bg": "rgba(16, 185, 129, 0.1)",
  error: "#ef4444",          // red
  "error-bg": "rgba(239, 68, 68, 0.1)",
  warning: "#f59e0b",        // amber
  "warning-bg": "rgba(245, 158, 11, 0.1)",
  info: "#3b82f6",           // blue
  "info-bg": "rgba(59, 130, 246, 0.1)",
} as const;

/**
 * Semantic color tokens for text
 */
export const textColors = {
  primary: "#f5f0e6",        // sand - main text
  secondary: "#9ca3af",      // gray - secondary text
  muted: "#6b7280",          // darker gray - muted text
  inverse: "#0b1021",        // night - text on light backgrounds
  accent: "#4de8e4",         // neon - accent text/links
} as const;

/**
 * Semantic color tokens for borders
 */
export const borderColors = {
  default: "rgba(156, 163, 175, 0.2)", // subtle borders
  hover: "rgba(77, 232, 228, 0.4)",    // interactive borders
  focus: "#4de8e4",                    // focus ring
  error: "#ef4444",                    // error state borders
} as const;

/**
 * Complete design tokens object
 */
export const designTokens = {
  spacing,
  radius,
  shadow,
  duration,
  easing,
  colors: {
    base: baseColors,
    surface: surfaceColors,
    interaction: interactionColors,
    feedback: feedbackColors,
    text: textColors,
    border: borderColors,
  },
} as const;

export type DesignTokens = typeof designTokens;
