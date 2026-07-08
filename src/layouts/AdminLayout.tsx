import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const navLink =
  'text-sm font-medium text-marca-roxo/70 hover:text-marca-roxo transition [&.active]:text-marca-roxo [&.active]:font-semibold'

export default function AdminLayout() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-marca-roxo/5">
      <header className="flex items-center justify-between border-b border-marca-roxo/10 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-marca-roxo">Curadoria — Guery Feiras</h1>
        <nav className="flex items-center gap-6">
          <NavLink to="/curadoria" className={({ isActive }) => (isActive ? `${navLink} active` : navLink)}>
            Cadastros
          </NavLink>
          <NavLink to="/curadoria/inscricoes" className={({ isActive }) => (isActive ? `${navLink} active` : navLink)}>
            Inscrições
          </NavLink>
          <button onClick={signOut} className="text-sm font-medium text-marca-roxo/70 hover:text-marca-roxo transition">
            Sair
          </button>
        </nav>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
