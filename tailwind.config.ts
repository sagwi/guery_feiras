import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { marca: { amarelo: '#F5B400', roxo: '#2E1065', roxoClaro: '#5B21B6' } },
    },
  },
  plugins: [],
} satisfies Config
