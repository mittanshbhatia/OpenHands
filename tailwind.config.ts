import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#effaf6",
          100: "#d8f3e9",
          500: "#1f7a5c",
          600: "#17634a",
          700: "#124f3b",
          900: "#0b2f24",
        },
        coral: {
          400: "#f08a6b",
          500: "#e56b45",
          600: "#cf5230",
        },
        cream: {
          50: "#fbf8f2",
          100: "#f4eee3",
        },
        sage: {
          100: "#e7efe8",
          200: "#d3e0d6",
          500: "#6d8b78",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(18, 45, 36, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
