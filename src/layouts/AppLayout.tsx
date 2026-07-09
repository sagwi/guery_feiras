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

  return (
    <div className="flex h-screen overflow-hidden">
      <div className={collapsed ? 'w-16' : 'w-56'}>
        <Sidebar collapsed={collapsed} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
        <main className="flex-1 overflow-y-auto bg-marca-creme p-7">
          <Outlet />
        </main>
      </div>

      <ReportarProblemaButton />
      <CookieBanner />
    </div>
  )
}
