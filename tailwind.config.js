/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F1F5F3',
        ink: '#1B2B29',
        'ink-soft': '#4A5A57',
        primary: '#1F6F63',
        'primary-dark': '#163F38',
        accent: '#A8342A',
        gold: '#C98A2E',
        'risk-low': '#3F8F5F',
        'risk-mid': '#C98A2E',
        'risk-high': '#A8342A',
        line: '#D8E2DE'
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['"Work Sans"', 'sans-serif']
      }
    }
  },
  plugins: []
}
