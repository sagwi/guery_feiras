import { useState } from 'react'

const CHAVE = 'gf_cookies'

export default function CookieBanner() {
  const [visivel, setVisivel] = useState(() => localStorage.getItem(CHAVE) !== '1')

  if (!visivel) return null

  function aceitar() {
    localStorage.setItem(CHAVE, '1')
    setVisivel(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-marca-roxo/10 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-marca-roxo/80">
          Usamos cookies para melhorar sua experiência, conforme a Lei nº 13.709/2018 (LGPD).
        </p>
        <button
          type="button"
          onClick={aceitar}
          className="shrink-0 rounded-lg bg-marca-roxo px-4 py-2 text-sm font-semibold text-white hover:bg-marca-roxoClaro"
        >
          Aceitar
        </button>
      </div>
    </div>
  )
}
