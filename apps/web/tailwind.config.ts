import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // CarryMe brand palette (60/30/10) — sourced from
        // .cursor/reference/Brand guidelines.md
        brand: {
          primary: "#F34213",      // 60% — dominant surfaces, brand expressions
          "primary-600": "#D63A0F",
          "primary-700": "#B7320D",
          secondary: "#BEB7A4",    // 30% — supporting surfaces, secondary CTAs
          "secondary-600": "#A9A28F",
          accent: "#FFFFFC",       // 10% (shared) — bright accent, highlights
          deep: "#000000",         // 10% (shared) — deep accent, text on light, dark surfaces
        },
        // Warm-neutral ink scale tuned to sit alongside the khaki secondary.
        ink: {
          900: "#1A1814",
          700: "#3D372E",
          500: "#6E665C",
          300: "#A8A095",
          100: "#E6E2DA",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#FAF8F3",
          raised: "#FFFFFF",
        },
        success: "#22C55E",
        warn: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
        "3xl": "28px",
      },
      boxShadow: {
        card: "0 6px 20px -8px rgba(0, 0, 0, 0.12)",
        pop: "0 12px 32px -12px rgba(243, 66, 19, 0.40)",
      },
      backgroundImage: {
        // Primary surface stays inside the orange family so the 60% allocation
        // keeps its identity instead of bleeding into the 30% khaki.
        "brand-gradient": "linear-gradient(135deg, #F34213 0%, #D63A0F 100%)",
        "deep-gradient": "linear-gradient(180deg, #000000 0%, #1A1814 100%)",
        "accent-gradient": "linear-gradient(135deg, #FFFFFC 0%, #BEB7A4 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
