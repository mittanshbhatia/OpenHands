import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // shadcn-style tokens (used by components/ui)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        teal: {
          50: "#FAF9F6",
          100: "#F2F0E9",
          500: "#555555",
          600: "#333333",
          700: "#1A1A1A",
          800: "#4D4D4D",
          900: "#1A1A1A",
        },
        coral: {
          400: "#E58E7D",
          500: "#D96C5E",
          600: "#C45547",
        },
        cream: {
          50: "#FAF9F6",
          100: "#FFFFFF",
        },
        sage: {
          100: "#F5F5F5",
          200: "#EAEAEC",
          400: "#999999",
          500: "#666666",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0, 0, 0, 0.05)",
      },
      transitionDuration: {
        400: "400ms",
      },
    },
  },
  plugins: [animate],
};

export default config;
