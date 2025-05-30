/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base colors
        'bg-dark': '#0a0a1a',
        'neon-pink': '#ff1493',
        'neon-green': '#00FF41',
        'neon-blue': '#00bfff',
        'neon-purple': '#b026ff',
        'neon-yellow': '#ffde03',
        'neon-orange': '#ff6b00',
        
        // Text colors
        'text-primary': '#ffffff',
        'text-secondary': 'rgba(255, 255, 255, 0.7)',
        'text-tertiary': 'rgba(255, 255, 255, 0.5)',
        
        // Status colors
        'status-success': '#00FF41',
        'status-warning': '#ffde03',
        'status-error': '#ff1493',
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s infinite',
        'neon-border': 'neon-border 3s infinite',
        'neon-rotate': 'neon-rotate 2s linear infinite',
        'neon-float': 'neon-float 3s ease-in-out infinite',
        'neon-glow': 'neon-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': {
            'text-shadow': '0 0 5px #ff1493, 0 0 10px #ff1493, 0 0 20px #ff1493, 0 0 40px #ff1493',
          },
          '50%': {
            'text-shadow': '0 0 10px #ff1493, 0 0 20px #ff1493, 0 0 40px #ff1493, 0 0 80px #ff1493',
          },
        },
        'neon-border': {
          '0%, 100%': {
            'box-shadow': '0 0 5px #00FF41, 0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41',
          },
          '50%': {
            'box-shadow': '0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41, 0 0 80px #00FF41',
          },
        },
        'neon-rotate': {
          '0%': { 'filter': 'hue-rotate(0deg)' },
          '100%': { 'filter': 'hue-rotate(360deg)' },
        },
        'neon-float': {
          '0%, 100%': { 'transform': 'translateY(0)' },
          '50%': { 'transform': 'translateY(-10px)' },
        },
        'neon-glow': {
          '0%, 100%': {
            'opacity': '1',
            'filter': 'brightness(1)',
          },
          '50%': {
            'opacity': '0.8',
            'filter': 'brightness(1.5)',
          },
        },
      },
      backdropBlur: {
        'glass': '10px',
      },
      boxShadow: {
        'neon': '0 0 5px #ff1493, 0 0 10px #ff1493, 0 0 20px #ff1493, 0 0 40px #ff1493',
        'neon-green': '0 0 5px #00FF41, 0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41',
        'neon-blue': '0 0 5px #00bfff, 0 0 10px #00bfff, 0 0 20px #00bfff, 0 0 40px #00bfff',
        'neon-purple': '0 0 5px #b026ff, 0 0 10px #b026ff, 0 0 20px #b026ff, 0 0 40px #b026ff',
      },
    },
  },
  plugins: [],
} 