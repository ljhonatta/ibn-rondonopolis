/** @type {import('tailwindcss').Config} */
export default {
  content: { relative: true, files: ['./index.html', './src/**/*.{js,jsx}'] },
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        brand: { DEFAULT: '#E3262E', dark: '#B81D24', soft: '#FDECEC' },
        mist: '#F4F4F4',
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        script: ['"Great Vibes"', 'cursive'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: { site: '1200px' },
    },
  },
  plugins: [],
}
