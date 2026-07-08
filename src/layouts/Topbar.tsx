import { PanelLeft, Bell } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'

export default function Topbar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
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
        <button
          type="button"
          aria-label="Notificações"
          className="relative rounded-lg p-2 text-marca-roxo/70 hover:bg-marca-roxo/5 hover:text-marca-roxo"
        >
          <Bell className="h-5 w-5" />
          {/* ponytail: badge fixo em 0 — notificações reais fora do escopo desta fatia */}
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-marca-amarelo text-[10px] font-bold text-marca-roxo">
            0
          </span>
        </button>

        <span className="text-sm font-medium text-marca-roxo">
          {profile?.nome ?? 'Comerciante'}
        </span>
      </div>
    </header>
  )
}
