/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'rgb(var(--bg-primary) / <alpha-value>)',
          surface: 'rgb(var(--bg-surface) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
        },
        accent: {
          mint:   '#3DBA7E',
          cyan:   '#2BB8A0',
          green:  '#3DBA7E',
          amber:  '#F0A030',
          red:    '#E06060',
          rose:   '#E06060',
          sky:    '#50B8D8',
          sage:   '#2B7A5E',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          muted:   'rgb(var(--text-muted) / <alpha-value>)',
          subtle:  'rgb(var(--text-subtle) / <alpha-value>)',
        },
        eco: {
          50:  '#F0FAF5',
          100: '#D8F2E5',
          200: '#B5E8CE',
          300: '#7FD6AE',
          400: '#48C48C',
          500: '#2DAE72',
          600: '#208E5B',
          700: '#1A714A',
          800: '#145A3B',
          900: '#0E3F2A',
        }
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body:    ['Nunito', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        'eco': '0 4px 24px -4px rgba(45, 174, 114, 0.18)',
        'eco-lg': '0 8px 40px -8px rgba(45, 174, 114, 0.28)',
        'card': '0 2px 16px 0 rgba(0,0,0,0.08)',
        'card-lg': '0 8px 32px 0 rgba(0,0,0,0.12)',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'leaf-sway': {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%':      { transform: 'rotate(2deg)' },
        }
      },
      animation: {
        shake:        'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'fade-up':    'fade-up 0.4s ease-out both',
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
        'leaf-sway':  'leaf-sway 3s ease-in-out infinite',
      },
      backgroundImage: {
        'eco-gradient':      'linear-gradient(135deg, #2DAE72 0%, #2BB8A0 100%)',
        'eco-gradient-soft': 'linear-gradient(135deg, rgba(45,174,114,0.12) 0%, rgba(43,184,160,0.12) 100%)',
        'surface-gradient':  'linear-gradient(180deg, rgb(var(--bg-surface)) 0%, rgb(var(--bg-primary)) 100%)',
      }
    },
  },
  plugins: [],
}
