import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        nebras: { green: "#0b4d3b", gold: "#c5a253", cream: "#f7f2e8" },
      },
      fontFamily: { sans: ["var(--font-tajawal)", "Tahoma", "sans-serif"] },
    },
  },
  plugins: [],
};

export default config;

