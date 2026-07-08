import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Tabs from '@radix-ui/react-tabs'
import { FileCheck, ClipboardList, AlertTriangle, CalendarCheck, Plus } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { completarOnboarding } from '../lib/completarOnboarding'
import KpiCard from '../components/KpiCard'
import CuradoriaBanner from '../components/CuradoriaBanner'
import PropostaCard from '../components/PropostaCard'
import type { Proposta } from '../components/PropostaCard'

const tabTrigger =
  'px-4 py-2 text-sm font-medium text-marca-roxo/70 border-b-2 border-transparent data-[state=active]:border-marca-roxo data-[state=active]:text-marca-roxo transition'

export default function VendorPanel() {
  const { user, profile } = useAuth()
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loadingPropostas, setLoadingPropostas] = useState(true)

  useEffect(() => {
    if (user?.id) {
      completarOnboarding(user.id)
    }
  }, [user?.id])

  const carregarPropostas = useCallback(async () => {
    if (!user?.id) return
    setLoadingPropostas(true)
    const { data, error } = await supabase
      .from('applications')
      .select('*, fairs(nome,local,imagem_url,taxa,parks(nome)), businesses(nome)')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })
    if (error) { console.error('VendorPanel: falha ao carregar propostas', error); setPropostas([]); setLoadingPropostas(false); return }
    setPropostas((data ?? []) as Proposta[])
    setLoadingPropostas(false)
  }, [user?.id])

  useEffect(() => { carregarPropostas() }, [carregarPropostas])

  // ponytail: pagamento/participação reais nas fatias 4-6 — por ora derivam do status.
  const pendencias = propostas.filter((p) => p.status === 'pendente').length
  const contratosAtivos = propostas.filter((p) => p.status === 'confirmado').length
  const participacoes = propostas.filter((p) => p.status === 'realizada').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-marca-roxo">Olá, {profile?.nome ?? ''}! 👋</h1>
        <p className="text-sm text-marca-roxo/70">Gerencie suas inscrições e participações</p>
      </div>

      {profile?.curadoria_status === 'pendente' && <CuradoriaBanner />}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Contratos ativos" valor={contratosAtivos} icon={FileCheck} />
        <KpiCard label="Inscrições" valor={propostas.length} icon={ClipboardList} />
        <KpiCard label="Pendências" valor={pendencias} icon={AlertTriangle} />
        <KpiCard label="Participações" valor={participacoes} icon={CalendarCheck} />
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

        <Tabs.Content value="propostas" className="space-y-4 py-6">
          <div className="flex justify-end">
            <Link
              to="/VendorApply"
              className="flex items-center gap-1 rounded-lg bg-marca-roxo px-4 py-2 text-sm font-semibold text-white hover:bg-marca-roxoClaro transition"
            >
              <Plus className="h-4 w-4" /> Nova inscrição
            </Link>
          </div>
          {!loadingPropostas && propostas.length === 0 && (
            <p className="py-6 text-center text-sm text-marca-roxo/60">Nenhuma proposta ainda.</p>
          )}
          <div className="space-y-3">
            {propostas.map((p) => (
              <PropostaCard key={p.id} proposta={p} />
            ))}
          </div>
        </Tabs.Content>
        <Tabs.Content value="participacoes" className="py-6 text-center text-sm text-marca-roxo/60">
          Nenhuma participação registrada.
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
