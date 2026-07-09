import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Tabs from '@radix-ui/react-tabs'
import {
  FileCheck,
  ClipboardList,
  AlertTriangle,
  CalendarCheck,
  Plus,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { completarOnboarding } from '../lib/completarOnboarding'
import KpiCard from '../components/KpiCard'
import CuradoriaBanner from '../components/CuradoriaBanner'
import PropostaCard from '../components/PropostaCard'
import type { Proposta } from '../components/PropostaCard'

const tabTrigger =
  'px-4 py-2.5 text-sm font-semibold text-marca-ink/50 border-b-2 border-transparent transition-colors hover:text-marca-ink data-[state=active]:border-marca-acao data-[state=active]:text-marca-acao'

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
    if (error) {
      console.error('VendorPanel: falha ao carregar propostas', error)
      setPropostas([])
      setLoadingPropostas(false)
      return
    }
    setPropostas((data ?? []) as Proposta[])
    setLoadingPropostas(false)
  }, [user?.id])

  useEffect(() => {
    carregarPropostas()
  }, [carregarPropostas])

  // ponytail: participação real (check-in) ainda não existe — Participações deriva do status 'realizada'.
  const pendencias = propostas.filter((p) => p.status === 'aprovado').length
  const contratosAtivos = propostas.filter((p) => p.status === 'confirmado').length
  const participacoes = propostas.filter((p) => p.status === 'realizada').length

  return (
    <div className="space-y-6">
      <div className="relative animate-fadeUp overflow-hidden rounded-[22px] bg-gradient-to-br from-marca-roxoDark via-marca-acao to-marca-acaoHover px-7 py-6 text-white">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_85%_20%,rgba(245,180,0,.35),transparent_45%),radial-gradient(circle_at_70%_120%,rgba(255,106,61,.4),transparent_40%)]" />
        <div className="relative">
          {profile?.curadoria_status === 'aprovado' && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Curadoria aprovada
            </div>
          )}
          <h1 className="font-display text-[28px] font-semibold">Olá, {profile?.nome ?? ''}! 👋</h1>
          <p className="mt-0.5 text-white/80">Gerencie suas inscrições e participações nas feiras.</p>
        </div>
      </div>

      {profile?.curadoria_status === 'pendente' && <CuradoriaBanner />}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Contratos ativos" valor={contratosAtivos} icon={FileCheck} tone="roxo" />
        <KpiCard label="Inscrições" valor={propostas.length} icon={ClipboardList} tone="azul" />
        <KpiCard label="Pendências" valor={pendencias} icon={AlertTriangle} tone="amarelo" hint="a pagar" />
        <KpiCard label="Participações" valor={participacoes} icon={CalendarCheck} tone="coral" />
      </div>

      <Tabs.Root defaultValue="propostas">
        <div className="flex items-center justify-between border-b border-marca-ink/10">
          <Tabs.List className="flex gap-1">
            <Tabs.Trigger value="propostas" className={tabTrigger}>
              Minhas Propostas
            </Tabs.Trigger>
            <Tabs.Trigger value="participacoes" className={tabTrigger}>
              Últimas Participações
            </Tabs.Trigger>
          </Tabs.List>
          <Link
            to="/VendorApply"
            className="mb-2 flex items-center gap-1.5 rounded-xl bg-marca-acao px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover"
          >
            <Plus className="h-4 w-4" /> Nova inscrição
          </Link>
        </div>

        <Tabs.Content value="propostas" className="space-y-4 py-6">
          {!loadingPropostas && propostas.length === 0 && (
            <p className="py-6 text-center text-sm text-marca-ink/60">Nenhuma proposta ainda.</p>
          )}
          <div className="space-y-3">
            {propostas.map((p) => (
              <PropostaCard key={p.id} proposta={p} />
            ))}
          </div>
        </Tabs.Content>
        <Tabs.Content value="participacoes" className="py-6 text-center text-sm text-marca-ink/60">
          Nenhuma participação registrada.
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
