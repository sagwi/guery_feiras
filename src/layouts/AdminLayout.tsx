import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
  Users,
  ClipboardCheck,
  CalendarDays,
  BarChart3,
  MessageSquareWarning,
  Megaphone,
  Settings,
} from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const itensAdmin = [
  { to: '/curadoria', label: 'Cadastros', icon: Users },
  { to: '/curadoria/inscricoes', label: 'Inscrições', icon: ClipboardCheck },
  { to: '/curadoria/feiras', label: 'Feiras', icon: CalendarDays },
  { to: '/curadoria/avisos', label: 'Avisos', icon: Megaphone },
  { to: '/curadoria/indicadores', label: 'Indicadores', icon: BarChart3 },
  { to: '/curadoria/suporte', label: 'Suporte', icon: MessageSquareWarning },
  { to: '/curadoria/definicoes', label: 'Definições', icon: Settings },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <div className={`hidden md:block ${collapsed ? 'w-16' : 'w-56'}`}>
        <Sidebar collapsed={collapsed} itens={itensAdmin} subtitle="PAINEL DO CURADOR" />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-marca-roxoDeep/50"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 h-full w-56 shadow-lift">
            <Sidebar
              collapsed={false}
              itens={itensAdmin}
              subtitle="PAINEL DO CURADOR"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          onOpenMobile={() => setMobileOpen(true)}
          role="Curador"
        />
        <main className="flex-1 overflow-y-auto bg-marca-creme p-4 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
