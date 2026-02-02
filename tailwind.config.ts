import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        night: "#0b1021",
        slate: "#1a2b3c",
        neon: "#4de8e4",
        aura: "#9b7bff",
        sand: "#f5f0e6"
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
