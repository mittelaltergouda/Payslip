import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Base palette
        night: "#0b1021",
        slate: "#1a2b3c",
        neon: "#4de8e4",
        aura: "#9b7bff",
        sand: "#f5f0e6",

        // Semantic tokens - Surface
        surface: {
          base: "#0b1021",      // night - main background
          elevated: "#1a2b3c",  // slate - cards, modals
          overlay: "#2a3b4c",   // lighter variant for overlays
          muted: "#f5f0e6",     // sand - light surface variant
        },

        // Semantic tokens - Interaction
        interaction: {
          primary: "#4de8e4",        // neon - primary actions
          "primary-hover": "#3dd8d4", // darker neon
          secondary: "#9b7bff",      // aura - secondary actions
          "secondary-hover": "#8b6bef", // darker aura
          ghost: "rgba(77, 232, 228, 0.1)", // subtle interaction
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
          primary: "#f5f0e6",        // sand - main text
          secondary: "#9ca3af",      // gray - secondary text
          muted: "#6b7280",          // darker gray - muted text
          inverse: "#0b1021",        // night - text on light backgrounds
          accent: "#4de8e4",         // neon - accent text/links
        },

        // Semantic tokens - Border
        border: {
          default: "rgba(156, 163, 175, 0.2)", // subtle borders
          hover: "rgba(77, 232, 228, 0.4)",    // interactive borders
          focus: "#4de8e4",                    // focus ring
          error: "#ef4444",                    // error state borders
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
