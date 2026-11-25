/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef3fa',
          100: '#d9e4f2',
          200: '#b3c8e4',
          300: '#85a4cf',
          400: '#5a80b8',
          500: '#3a63a0',
          600: '#2a4d85',
          700: '#1f3b69',
          800: '#162d52',
          900: '#0d1f3c',
          950: '#081428',
        },
        teal: {
          50: '#effcfa',
          100: '#d0f7f1',
          200: '#a2ede3',
          300: '#6cdcd0',
          400: '#3cc3b8',
          500: '#1fa79f',
          600: '#14857f',
          700: '#136b67',
          800: '#145655',
          900: '#134847',
        },
      },
      fontFamily: {
        // System fonts only: fast on low-end devices, no external font requests.
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Noto Sans',
          'Noto Sans Devanagari',
          'Mangal',
          'Nirmala UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(13,31,60,0.04), 0 4px 16px rgba(13,31,60,0.06)',
        lift: '0 8px 30px rgba(13,31,60,0.12)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
