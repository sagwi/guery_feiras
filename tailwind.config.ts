import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marca: {
          ink: '#241150', // texto principal
          roxo: '#241150', // ALIAS de compatibilidade: text-marca-roxo continua escuro/legível
          acao: '#6D28D9', // botões, links, estado ativo
          acaoHover: '#7C3AED',
          roxoClaro: '#7C3AED', // compat com hover:bg-marca-roxoClaro já existente
          roxoDark: '#2A1060', // topo da sidebar
          roxoDeep: '#1C0B3F', // base da sidebar
          amarelo: '#F5B400', // marca — reservado a pagamento / CTA
          coral: '#FF6A3D',
          verde: '#12B886',
          creme: '#FAF6EF', // fundo da área logada
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
      },
      boxShadow: {
        card: '0 12px 30px -20px rgba(36,17,80,.4)',
        lift: '0 22px 40px -22px rgba(36,17,80,.45)',
        glow: '0 12px 26px -12px rgba(109,40,217,.7)',
        amber: '0 10px 22px -10px rgba(245,180,0,.9)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        pulseBadge: {
          '0%': { boxShadow: '0 0 0 0 rgba(245,180,0,.55)' },
          '70%': { boxShadow: '0 0 0 8px rgba(245,180,0,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(245,180,0,0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .5s cubic-bezier(.2,.8,.2,1) both',
        pulseBadge: 'pulseBadge 2.4s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
