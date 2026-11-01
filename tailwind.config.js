/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './app.js', './logic.js', './questions.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-rounded', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

