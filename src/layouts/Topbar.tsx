import { PanelLeft } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import NotificacoesDropdown from '../components/NotificacoesDropdown'

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

  return (
    <header className="flex h-16 items-center justify-between border-b border-marca-roxo/10 bg-white px-4">
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        className="rounded-lg p-2 text-marca-roxo/70 hover:bg-marca-roxo/5 hover:text-marca-roxo"
      >
        <PanelLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-4">
        <NotificacoesDropdown />

        <span className="text-sm font-medium text-marca-roxo">
          {profile?.nome ?? role}
        </span>
      </div>
    </header>
  )
}
