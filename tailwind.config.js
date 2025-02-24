/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#E50914',
        secondary: '#141414',
        // Light mode colors
        light: {
          background: '#ffffff',
          text: '#1a1a1a',
          secondary: '#4a5568',
          accent: '#E50914',
          card: '#f7fafc',
          border: '#e2e8f0'
        },
        // Dark mode colors
        dark: {
          background: '#1a1a1a',
          text: '#f7fafc',
          secondary: '#a0aec0',
          accent: '#E50914',
          card: '#2d3748',
          border: '#4a5568'
        }
      },
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke',
      },
      transitionDuration: {
        '300': '300ms',
      },
    },
  },
  plugins: [],
};
