import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Base palette - use CSS variables for theme switching
        night: "var(--color-night)",
        slate: "var(--color-surface-elevated)",
        neon: "var(--color-primary)",
        aura: "var(--color-secondary)",
        sand: "var(--color-text-primary)",

        // Semantic tokens - Surface
        surface: {
          base: "var(--color-surface-base)",
          elevated: "var(--color-surface-elevated)",
          overlay: "var(--color-surface-overlay)",
          muted: "var(--color-surface-muted)",
        },

        // Semantic tokens - Interaction
        interaction: {
          primary: "var(--color-primary)",
          "primary-hover": "var(--color-primary)",
          secondary: "var(--color-secondary)",
          "secondary-hover": "var(--color-secondary)",
          ghost: "var(--color-ghost)",
          disabled: "var(--color-disabled)",
        },

        // Semantic tokens - Feedback (keeping original feedback colors)
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
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          inverse: "var(--color-text-inverse)",
          accent: "var(--color-text-accent)",
        },

        // Semantic tokens - Border
        border: {
          default: "var(--color-border-default)",
          hover: "var(--color-border-hover)",
          focus: "var(--color-border-focus)",
          error: "var(--color-border-error)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"]
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
