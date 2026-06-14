/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          bg: '#050a14',
          nav: '#051424',
          surface: '#0d1c2d',
          card: '#122131',
          border: '#584237',
          accent: '#ffb690',
          primary: '#d4e4fa',
          muted: '#e0c0b1',
        },
        risk: {
          critical: '#ffb4ab',
          high: '#f97316',
          medium: '#eab308',
          low: '#22c55e',
        },
      },
    },
  },
  plugins: [],
};
