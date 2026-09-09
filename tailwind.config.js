/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8EE',
        ivory: {
          DEFAULT: '#F5EDD8',
          dark: '#EEE0C0',
        },
        caramel: {
          DEFAULT: '#C8843A',
          light: '#D9954A',
        },
        gold: {
          DEFAULT: '#D4A843',
          light: '#E8C06A',
          dark: '#B8902E',
        },
        'deep-brown': '#2A1810',
        'warm-dark': '#1A0F08',
        'milk-white': '#FEFCF7',
        'text-dark': '#1C1008',
        'text-mid': '#5C3D1E',
        'text-light': '#9C7A55',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Cormorant Garamond"', 'serif'],
        ui: ['Inter', 'sans-serif'],
      },
      maxWidth: {
        container: '1400px',
      },
      screens: {
        xs: '420px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      boxShadow: {
        'gold-glow': '0 8px 32px rgba(212, 168, 67, 0.3)',
        'luxury': '0 20px 50px rgba(26, 15, 8, 0.15)',
        'deep': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
