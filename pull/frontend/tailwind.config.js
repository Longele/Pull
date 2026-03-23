/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0A0A',
        ivory: '#F5F0E8',
        amber: '#C9A84C',
        'amber-light': '#D4B86A',
        'amber-dim': 'rgba(201,168,76,0.15)',
        error: '#E05252',
        success: '#4CAF7D',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
