import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-bricolage)", "Bricolage Grotesque", "sans-serif"],
        heading: ["var(--font-bricolage)", "Bricolage Grotesque", "sans-serif"],
      },
      fontSize: {
        "heading-lg": ["40px", { lineHeight: "1.2", letterSpacing: "-0.04em", fontWeight: "700" }],
        "heading-md": ["32px", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "700" }],
        "heading-sm": ["24px", { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "700" }],
      },
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0284c7',
          700: '#0369a1',
        }
      }
    },
  },
  plugins: [],
};
export default config;
