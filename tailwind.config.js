/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          gold: '#D4AF37',
          black: '#0a0a0a',
          charcoal: '#1a1a1a',
          silver: '#C0C0C0',
          accent: '#b8860b',
        },
        fontFamily: {
            serif: ['Playfair Display', 'serif'],
            sans: ['Inter', 'sans-serif'],
        }
      },
    },
  },
  plugins: [],
}
