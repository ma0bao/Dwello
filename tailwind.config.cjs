/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.html', './src/**/*.js'],
  theme: {
    extend: {
      colors: {
        forest: '#1B4332',
        sage: '#40916C',
        gold: '#D4A853',
        offwhite: '#F8F6F1',
        mint: '#B7E4C7',
        slate: '#1A2420'
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'sans-serif']
      }
    }
  },
  plugins: []
};
