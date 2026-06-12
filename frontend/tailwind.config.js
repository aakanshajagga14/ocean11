/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          bg: '#050a14',
          surface: '#0d1b2a',
          card: '#112240',
          border: '#1e3a5f',
          accent: '#38bdf8',
          primary: '#e2e8f0',
          secondary: '#94a3b8',
        },
        risk: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#22c55e',
        },
      },
    },
  },
  plugins: [],
};
