import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nebras: {
          green: "#123c2e",
          gold: "#c7a44a",
          cream: "#f8f4e8",
          ink: "#1f2933",
          line: "#d8d1be"
        }
      },
      fontFamily: {
        tajawal: ["var(--font-tajawal)", "Tahoma", "Arial", "sans-serif"]
      },
      screens: {
        shell: "1050px",
        compact: "700px"
      }
    }
  },
  plugins: []
};

export default config;
