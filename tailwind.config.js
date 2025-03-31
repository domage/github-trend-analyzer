/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }

  module.exports = {
    theme: {
      extend: {
        animation: {
          blink: 'blink 0.4s ease-in-out',
        },
        keyframes: {
          blink: {
            '0%, 100%': { backgroundColor: '#bfdbfe' }, // blue-100
            '50%': { backgroundColor: '#93c5fd' },     // slightly darker blue
          },
        },
      },
    },
  };