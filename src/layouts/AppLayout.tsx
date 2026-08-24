import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useIdleLogout } from '../auth/useIdleLogout'
import ReportarProblemaButton from '../components/ReportarProblemaButton'
import CookieBanner from '../components/CookieBanner'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  useIdleLogout()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <div className={`hidden md:block ${collapsed ? 'w-16' : 'w-56'}`}>
        <Sidebar collapsed={collapsed} />
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
            <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-marca-creme p-4 md:p-7">
          <Outlet />
        </main>
      </div>

      <ReportarProblemaButton />
      <CookieBanner />
    </div>
  )
}
