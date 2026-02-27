import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5" },
        accent: { 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed" },
        dark: { 800: "#1e1e2e", 900: "#11111b", 950: "#0a0a14" },
      },
    },
  },
  plugins: [],
};
export default config;
