export const theme = {
  colors: {
    bgDark: '#0a0a1a',
    neonPink: '#00ff9d',
    neonGreen: '#00FF41',
    neonBlue: '#00bfff',
    neonPurple: '#b026ff',
    neonYellow: '#ffde03',
    neonOrange: '#ff6b00',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.5)',
    statusSuccess: '#00FF41',
    statusWarning: '#ffde03',
    statusError: '#ff1493',
  },
  shadows: {
    neon: '0 0 5px #00FF41, 0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41',
    neonGreen: '0 0 5px #00FF41, 0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41',
    neonBlue: '0 0 5px #00bfff, 0 0 10px #00bfff, 0 0 20px #00bfff, 0 0 40px #00bfff',
    neonPurple: '0 0 5px #b026ff, 0 0 10px #b026ff, 0 0 20px #b026ff, 0 0 40px #b026ff',
    glass: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  animations: {
    neonPulse: `
      @keyframes neonPulse {
        0%, 100% {
          text-shadow: 0 0 5px #00FF41, 0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41;
        }
        50% {
          text-shadow: 0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41, 0 0 80px #00FF41;
        }
      }
    `,
    neonBorder: `
      @keyframes neonBorder {
        0%, 100% {
          box-shadow: 0 0 5px #00FF41, 0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41;
        }
        50% {
          box-shadow: 0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41, 0 0 80px #00FF41;
        }
      }
    `,
    neonRotate: `
      @keyframes neonRotate {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }
    `,
    neonFloat: `
      @keyframes neonFloat {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }
    `,
    neonGlow: `
      @keyframes neonGlow {
        0%, 100% {
          opacity: 1;
          filter: brightness(1);
        }
        50% {
          opacity: 0.8;
          filter: brightness(1.5);
        }
      }
    `,
    psychedelicBg: `
      @keyframes psychedelicBg {
        0% {
          background: radial-gradient(circle at 50% 50%, rgba(0, 255, 65, 0.1) 0%, rgba(10, 10, 26, 0.8) 100%);
        }
        25% {
          background: radial-gradient(circle at 75% 25%, rgba(0, 255, 65, 0.15) 0%, rgba(10, 10, 26, 0.8) 100%);
        }
        50% {
          background: radial-gradient(circle at 50% 50%, rgba(0, 255, 65, 0.2) 0%, rgba(10, 10, 26, 0.8) 100%);
        }
        75% {
          background: radial-gradient(circle at 25% 75%, rgba(0, 255, 65, 0.15) 0%, rgba(10, 10, 26, 0.8) 100%);
        }
        100% {
          background: radial-gradient(circle at 50% 50%, rgba(0, 255, 65, 0.1) 0%, rgba(10, 10, 26, 0.8) 100%);
        }
      }
    `,
  },
  transitions: {
    default: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} 