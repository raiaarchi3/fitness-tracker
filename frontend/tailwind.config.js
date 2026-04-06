/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          bg: '#0D0D1A',
          card: '#13132A',
          card2: '#1A1A35',
          border: '#2A2A4A',
          purple: '#7B6FE8',
          'purple-light': '#9B8FF8',
          'purple-dim': '#4A3F8F',
          violet: '#6C5CE7',
          accent: '#8B5CF6',
          text: '#E2E2F0',
          muted: '#7A7A9A',
          dim: '#4A4A6A',
        }
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
