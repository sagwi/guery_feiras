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
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'

export type ItemMenu = { to: string; label: string; icon: LucideIcon }

const itensVendor: ItemMenu[] = [
  { to: '/VendorPanel', label: 'Painel', icon: LayoutDashboard },
  { to: '/VendorBusinesses', label: 'Meus negócios', icon: Building2 },
  { to: '/VendorApply', label: 'Nova Inscrição', icon: FileText },
  { to: '/VendorPayments', label: 'Pagamentos', icon: CreditCard },
  { to: '/VendorWallet', label: 'Minha Carteira', icon: Wallet },
  { to: '/ChangePassword', label: 'Alterar Senha', icon: KeyRound },
  { to: '/VendorManual', label: 'Manual', icon: BookOpen },
]

const linkBase =
  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors'
const linkInativo = 'text-white/60 hover:bg-white/5 hover:text-white'
const linkAtivo = 'bg-white/10 text-marca-amarelo font-semibold'

export default function Sidebar({
  collapsed,
  itens = itensVendor,
}: {
  collapsed: boolean
  itens?: ItemMenu[]
}) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSair() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="flex h-screen flex-col bg-gradient-to-b from-marca-roxoDark to-marca-roxoDeep text-white">
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-marca-amarelo to-marca-coral font-display text-lg font-bold text-marca-ink shadow-amber">
          GF
        </div>
        {!collapsed && (
          <div className="leading-none">
            <div className="font-display text-base font-semibold">Guery Feiras</div>
            <div className="mt-1 text-[11px] tracking-wide text-white/45">
              PAINEL DO COMERCIANTE
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {itens.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${linkBase} ${isActive ? linkAtivo : linkInativo}`}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.9} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleSair}
          className={`${linkBase} ${linkInativo} w-full`}
        >
          <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.9} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
