import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: { emerald: { 400: "#34d399", 500: "#10b981" } },
    },
  },
  plugins: [],
};
export default config;