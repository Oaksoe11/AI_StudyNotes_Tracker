import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        paper: "#F8FAFC",
        mint: "#DDF7E3",
        coral: "#F9735B"
      }
    }
  },
  plugins: []
};

export default config;

