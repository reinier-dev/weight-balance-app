/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      animation: {
        'pulse-red': 'pulse-red 2s infinite',
        'pulse-green': 'pulse-green 2s infinite',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { backgroundColor: '#fef2f2' },
          '50%': { backgroundColor: '#fee2e2' },
        },
        'pulse-green': {
          '0%, 100%': { backgroundColor: '#f0fdf4' },
          '50%': { backgroundColor: '#dcfce7' },
        },
      },
    },
  },
  plugins: [],
}