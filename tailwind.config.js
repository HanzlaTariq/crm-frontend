export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0E14',
          900: '#10161F',
          850: '#151C27',
          800: '#1A2230',
          700: '#26303F',
          600: '#37424F',
        },
        paper: {
          DEFAULT: '#F6F6F3',
          card: '#FFFFFF',
        },
        brand: {
          50: '#FDF4E7',
          100: '#FBE7C6',
          400: '#EDB35E',
          500: '#E8A33D',
          600: '#C97F1E',
          700: '#9C6416',
        },
        status: {
          new: '#64748B',
          interested: '#12B76A',
          notinterested: '#F04438',
          followup: '#E8A33D',
          sale: '#7C5CFF',
          lost: '#94A3B8',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(16,22,31,0.04), 0 8px 24px -12px rgba(16,22,31,0.10)',
        rail: 'inset -1px 0 0 rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
}