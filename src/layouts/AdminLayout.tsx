import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Users, ClipboardCheck } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const itensAdmin = [
  { to: '/curadoria', label: 'Cadastros', icon: Users },
  { to: '/curadoria/inscricoes', label: 'Inscrições', icon: ClipboardCheck },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen">
      <div className={collapsed ? 'w-16' : 'w-56'}>
        <Sidebar collapsed={collapsed} itens={itensAdmin} />
      </div>

      <div className="flex flex-1 flex-col">
        <Topbar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} role="Curador" />
        <main className="flex-1 bg-marca-creme p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
