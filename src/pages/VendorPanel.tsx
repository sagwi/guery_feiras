import { useEffect } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { FileCheck, ClipboardList, AlertTriangle, CalendarCheck } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { completarOnboarding } from '../lib/completarOnboarding'
import KpiCard from '../components/KpiCard'
import CuradoriaBanner from '../components/CuradoriaBanner'

const tabTrigger =
  'px-4 py-2 text-sm font-medium text-marca-roxo/70 border-b-2 border-transparent data-[state=active]:border-marca-roxo data-[state=active]:text-marca-roxo transition'

export default function VendorPanel() {
  const { user, profile } = useAuth()

  useEffect(() => {
    if (user?.id) {
      completarOnboarding(user.id)
    }
  }, [user?.id])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-marca-roxo">Olá, {profile?.nome ?? ''}! 👋</h1>
        <p className="text-sm text-marca-roxo/70">Gerencie suas inscrições e participações</p>
      </div>

      {profile?.curadoria_status === 'pendente' && <CuradoriaBanner />}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Contratos ativos" valor={0} icon={FileCheck} />
        <KpiCard label="Inscrições" valor={0} icon={ClipboardList} />
        <KpiCard label="Pendências" valor={0} icon={AlertTriangle} />
        <KpiCard label="Participações" valor={0} icon={CalendarCheck} />
      </div>

      <Tabs.Root defaultValue="propostas">
        <Tabs.List className="flex gap-2 border-b border-marca-roxo/10">
          <Tabs.Trigger value="propostas" className={tabTrigger}>
            Minhas Propostas
          </Tabs.Trigger>
          <Tabs.Trigger value="participacoes" className={tabTrigger}>
            Últimas Participações
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="propostas" className="py-6 text-center text-sm text-marca-roxo/60">
          Nenhuma proposta ainda.
        </Tabs.Content>
        <Tabs.Content value="participacoes" className="py-6 text-center text-sm text-marca-roxo/60">
          Nenhuma participação registrada.
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
