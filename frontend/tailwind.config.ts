import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "hsl(var(--ink))",
        paper: "hsl(var(--paper))",
        card: "hsl(var(--card))",
        line: "hsl(var(--line))",
        muted: "hsl(var(--muted))",
        mint: "hsl(var(--mint))",
        coral: "hsl(var(--coral))",
        berry: "hsl(var(--berry))",
        sky: "hsl(var(--sky))"
      }
    }
  },
  plugins: []
};

export default config;
