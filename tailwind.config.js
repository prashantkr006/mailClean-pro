/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0b0b09',
          soft: '#2a2a26',
          muted: '#6b6b63',
        },
        paper: {
          DEFAULT: '#f7f7f5',
          warm: '#f0ede8',
          border: '#e4e2dc',
        },
        accent: {
          promo: '#c2410c',
          unread: '#1d4ed8',
          bulk: '#7c3aed',
          inactive: '#047857',
          newsletter: '#b45309',
          keep: '#374151',
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
