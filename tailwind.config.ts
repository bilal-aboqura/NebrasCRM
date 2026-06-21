import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        nebras: {
          green: "#003d2f",
          gold: "#c4a35a",
          cream: "#fbfaf7",
        },
      },
      fontFamily: { sans: ["var(--font-tajawal)", "Tahoma", "sans-serif"] },
    },
  },
  plugins: [],
};

export default config;

