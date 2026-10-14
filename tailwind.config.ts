import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Themeable tokens: RGB channels from CSS variables (app/globals.css),
        // so a theme only swaps the variables and opacity modifiers keep working.
        // Base palette
        night: "rgb(var(--color-night) / <alpha-value>)",
        slate: "rgb(var(--color-slate) / <alpha-value>)",
        neon: "rgb(var(--color-neon) / <alpha-value>)",
        aura: "rgb(var(--color-aura) / <alpha-value>)",
        sand: "rgb(var(--color-sand) / <alpha-value>)",
        // Positive amounts (profit); stays distinct from the accent in every theme.
        positive: "rgb(var(--color-positive) / <alpha-value>)",

        // Semantic tokens - Surface
        surface: {
          base: "rgb(var(--color-night) / <alpha-value>)",      // night - main background
          elevated: "rgb(var(--color-slate) / <alpha-value>)",  // slate - cards, modals
          overlay: "rgb(var(--color-overlay) / <alpha-value>)", // lighter variant for overlays
          muted: "rgb(var(--color-sand) / <alpha-value>)",      // sand - light surface variant
        },

        // Semantic tokens - Interaction
        interaction: {
          primary: "rgb(var(--color-neon) / <alpha-value>)",                  // neon - primary actions
          "primary-hover": "rgb(var(--color-neon-hover) / <alpha-value>)",    // darker neon
          secondary: "rgb(var(--color-aura) / <alpha-value>)",                // aura - secondary actions
          "secondary-hover": "rgb(var(--color-aura-hover) / <alpha-value>)",  // darker aura
          ghost: "rgb(var(--color-neon) / 0.1)", // subtle interaction
          disabled: "#6b7280",       // gray for disabled state
        },

        // Semantic tokens - Feedback
        feedback: {
          success: "#10b981",        // green
          "success-bg": "rgba(16, 185, 129, 0.1)",
          error: "#ef4444",          // red
          "error-bg": "rgba(239, 68, 68, 0.1)",
          warning: "#f59e0b",        // amber
          "warning-bg": "rgba(245, 158, 11, 0.1)",
          info: "#3b82f6",           // blue
          "info-bg": "rgba(59, 130, 246, 0.1)",
        },

        // Semantic tokens - Text
        text: {
          primary: "rgb(var(--color-sand) / <alpha-value>)",   // sand - main text
          secondary: "#9ca3af",      // gray - secondary text
          muted: "#6b7280",          // darker gray - muted text
          inverse: "rgb(var(--color-on-neon) / <alpha-value>)", // text on primary (neon) backgrounds
          accent: "rgb(var(--color-neon) / <alpha-value>)",   // neon - accent text/links
        },

        // Semantic tokens - Border
        border: {
          default: "rgba(156, 163, 175, 0.2)", // subtle borders
          hover: "rgb(var(--color-neon) / 0.4)", // interactive borders
          focus: "rgb(var(--color-neon) / <alpha-value>)", // focus ring
          error: "#ef4444",                    // error state borders
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      // Transition utilities
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
        slower: "var(--duration-slower)",
      },
      transitionTimingFunction: {
        "in-out": "var(--ease-in-out)",
        out: "var(--ease-out)",
        in: "var(--ease-in)",
      },
      // Animation utilities
      animation: {
        "slide-in-right": "slide-in-from-right var(--duration-slow) var(--ease-out)",
      },
      keyframes: {
        "slide-in-from-right": {
          from: {
            transform: "translateX(100%)",
            opacity: "0",
          },
          to: {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
      },
    }
  },
  plugins: []
};

export default config;
