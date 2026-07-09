import { PanelLeft } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import NotificacoesDropdown from '../components/NotificacoesDropdown'

function iniciais(nome?: string | null, fallback = 'GF'): string {
  if (!nome) return fallback
  const partes = nome.trim().split(/\s+/)
  const a = partes[0]?.[0] ?? ''
  const b = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (a + b).toUpperCase() || fallback
}

export default function Topbar({
  collapsed,
  onToggleCollapsed,
  role = 'Comerciante',
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
  role?: string
}) {
  const { profile } = useAuth()
  const nome = profile?.nome ?? role

  return (
    <header className="flex h-16 items-center justify-between border-b border-marca-ink/[.07] bg-white/80 px-5 backdrop-blur">
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        className="rounded-xl p-2 text-marca-ink/55 transition-colors hover:bg-marca-ink/5 hover:text-marca-ink"
      >
        <PanelLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-4">
        <NotificacoesDropdown />

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-marca-acao to-marca-coral font-display text-[12px] font-bold text-white">
            {iniciais(profile?.nome)}
          </div>
          <span className="text-sm font-semibold text-marca-ink">{nome}</span>
        </div>
      </div>
    </header>
  )
}
