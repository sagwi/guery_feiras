import { Outlet } from 'react-router-dom'

// ponytail: shell only — Task 8 adds a real Sidebar/Topbar (cookie de negócio ativo, relatório etc.)
export default function AppLayout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-white border-r border-marca-roxo/10 p-4">
        <span className="text-marca-roxo font-bold">Guery Feiras</span>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
