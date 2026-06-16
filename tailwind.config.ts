import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        tajawal: ['Tajawal', 'Arial', 'sans-serif'],
      },
      colors: {
        green: {
          900: '#003d2f',
          700: '#075540',
        },
        ink: {
          900: '#071d33',
        },
        gold: {
          500: '#c4a35a',
          600: '#b58d3a',
          200: '#f1d796',
        },
        bg: '#fbfaf7',
        soft: '#f6f2e9',
        surface: '#ffffff',
        line: '#e7ddc9',
        text: '#102820',
        muted: '#68766f',
        success: '#18a96b',
        warning: '#c38312',
        danger: '#d75151',
        info: '#286fd1',
      },
      borderRadius: {
        pill: '999px',
        input: '12px',
        card: '22px',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(0,61,47,.07)',
      },
    },
  },
  plugins: [],
}

export default config
