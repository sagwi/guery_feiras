import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  FileText,
  CreditCard,
  Wallet,
  KeyRound,
  BookOpen,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'

const itens = [
  { to: '/VendorPanel', label: 'Painel', icon: LayoutDashboard },
  { to: '/VendorBusinesses', label: 'Meus negócios', icon: Building2 },
  { to: '/VendorApply', label: 'Nova Inscrição', icon: FileText },
  { to: '/VendorPayments', label: 'Pagamentos', icon: CreditCard },
  { to: '/VendorWallet', label: 'Minha Carteira', icon: Wallet },
  { to: '/ChangePassword', label: 'Alterar Senha', icon: KeyRound },
  { to: '/VendorManual', label: 'Manual', icon: BookOpen },
]

const linkBase = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition'
const linkInativo = 'text-marca-roxo/70 hover:bg-marca-roxo/5 hover:text-marca-roxo'
const linkAtivo = 'bg-marca-roxo/10 text-marca-roxo'

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSair() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="flex h-screen flex-col border-r border-marca-roxo/10 bg-white">
      <div className="flex h-16 items-center border-b border-marca-roxo/10 px-4">
        {collapsed ? (
          <span className="text-marca-roxo font-bold">GF</span>
        ) : (
          <span className="text-marca-roxo font-bold">Guery Feiras</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {itens.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${linkBase} ${isActive ? linkAtivo : linkInativo}`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-marca-roxo/10 p-3">
        <button
          type="button"
          onClick={handleSair}
          className={`${linkBase} ${linkInativo} w-full`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
