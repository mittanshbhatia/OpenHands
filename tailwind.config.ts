import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
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
    },
  },
  plugins: [],
};

export default config;
