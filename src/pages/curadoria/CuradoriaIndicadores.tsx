import { useCallback, useEffect, useMemo, useState } from 'react'
import { Users, ShieldCheck, Store, CalendarCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { SEGMENTOS, FAIXAS_FATURAMENTO } from '../../lib/segmentos'
import KpiCard from '../../components/KpiCard'

type CuradoriaStatus = 'pendente' | 'aprovado' | 'reprovado'

type Business = {
  id: string
  user_id: string
  nome: string
  segmento: string
  faixa_faturamento: string | null
  ativo: boolean
  criado_em: string
}

type Perfil = { id: string; nome: string | null; email: string | null; curadoria_status: CuradoriaStatus }

type Fair = {
  id: string
  nome: string
  taxa: number
  max_participantes: number | null
  parks: { nome: string } | null
}

const CURADORIA_LABELS: Record<CuradoriaStatus, { label: string; cor: string }> = {
  pendente: { label: 'Pendente', cor: 'bg-amber-100 text-amber-800' },
  aprovado: { label: 'Aprovado', cor: 'bg-green-100 text-green-800' },
  reprovado: { label: 'Reprovado', cor: 'bg-red-100 text-red-800' },
}

const card = 'rounded-card border border-marca-ink/[.07] bg-white p-5 shadow-card'
const select =
  'rounded-xl border border-marca-ink/15 px-3 py-2 text-sm outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10'
const badge = 'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold'
const tabBtn = 'rounded-xl px-4 py-2 text-sm font-semibold transition'
const tabAtiva = 'bg-marca-acao text-white shadow-glow'
const tabInativa = 'text-marca-ink/60 hover:bg-marca-ink/5'

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CuradoriaIndicadores() {
  const [aba, setAba] = useState<'comerciantes' | 'feiras'>('comerciantes')

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [perfis, setPerfis] = useState<Record<string, Perfil>>({})
  const [participacoes, setParticipacoes] = useState<Record<string, { total: number; confirmadas: number }>>({})

  const [fairs, setFairs] = useState<Fair[]>([])
  const [desempenhoFeiras, setDesempenhoFeiras] = useState<
    Record<string, { total: number; confirmadas: number; arrecadado: number }>
  >({})

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [segmento, setSegmento] = useState('')
  const [faixa, setFaixa] = useState('')
  const [statusCuradoria, setStatusCuradoria] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const [negociosRes, feirasRes] = await Promise.all([
      supabase
        .from('businesses')
        .select('id,user_id,nome,segmento,faixa_faturamento,ativo,criado_em')
        .order('criado_em', { ascending: false }),
      supabase.from('fairs').select('id,nome,taxa,max_participantes,parks(nome)').order('nome'),
    ])
    if (negociosRes.error || feirasRes.error) {
      const e = negociosRes.error ?? feirasRes.error!
      console.error('CuradoriaIndicadores: falha ao carregar negócios/feiras', e)
      setErro('Falha ao carregar comerciantes: ' + e.message)
      setLoading(false)
      return
    }
    const lista = (negociosRes.data ?? []) as Business[]
    setBusinesses(lista)
    setFairs((feirasRes.data ?? []) as unknown as Fair[])

    const userIds = [...new Set(lista.map((b) => b.user_id))]
    const businessIds = lista.map((b) => b.id)

    const [perfisRes, appsRes] = await Promise.all([
      userIds.length
        ? supabase.from('profiles').select('id,nome,email,curadoria_status').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      businessIds.length
        ? supabase.from('applications').select('id,business_id,fair_id,status').in('business_id', businessIds)
        : Promise.resolve({ data: [], error: null }),
    ])
    if (perfisRes.error || appsRes.error) {
      const e = perfisRes.error ?? appsRes.error!
      console.error('CuradoriaIndicadores: falha ao carregar perfis/participações', e)
      setErro('Falha ao carregar indicadores: ' + e.message)
      setLoading(false)
      return
    }

    const mapaPerfis: Record<string, Perfil> = {}
    for (const p of (perfisRes.data ?? []) as Perfil[]) mapaPerfis[p.id] = p
    setPerfis(mapaPerfis)

    const aplicacoes = (appsRes.data ?? []) as { id: string; business_id: string; fair_id: string; status: string }[]

    const mapaParticipacoes: Record<string, { total: number; confirmadas: number }> = {}
    const mapaFeiras: Record<string, { total: number; confirmadas: number; arrecadado: number }> = {}
    for (const a of aplicacoes) {
      const atual = mapaParticipacoes[a.business_id] ?? { total: 0, confirmadas: 0 }
      atual.total += 1
      const confirmada = a.status === 'confirmado' || a.status === 'realizada'
      if (confirmada) atual.confirmadas += 1
      mapaParticipacoes[a.business_id] = atual

      const atualFeira = mapaFeiras[a.fair_id] ?? { total: 0, confirmadas: 0, arrecadado: 0 }
      atualFeira.total += 1
      if (confirmada) atualFeira.confirmadas += 1
      mapaFeiras[a.fair_id] = atualFeira
    }
    setParticipacoes(mapaParticipacoes)

    const appIds = aplicacoes.map((a) => a.id)
    if (appIds.length) {
      const { data: pagamentos, error: pagamentosErro } = await supabase
        .from('payments')
        .select('application_id,valor')
        .eq('status', 'confirmado')
        .in('application_id', appIds)
      if (pagamentosErro) {
        console.error('CuradoriaIndicadores: falha ao carregar pagamentos por feira', pagamentosErro)
      } else {
        const appParaFeira: Record<string, string> = {}
        for (const a of aplicacoes) appParaFeira[a.id] = a.fair_id
        for (const p of (pagamentos ?? []) as { application_id: string; valor: number }[]) {
          const fairId = appParaFeira[p.application_id]
          if (!fairId) continue
          const atualFeira = mapaFeiras[fairId] ?? { total: 0, confirmadas: 0, arrecadado: 0 }
          atualFeira.arrecadado += Number(p.valor)
          mapaFeiras[fairId] = atualFeira
        }
      }
    }
    setDesempenhoFeiras(mapaFeiras)

    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return businesses
      .map((b) => ({
        business: b,
        perfil: perfis[b.user_id],
        part: participacoes[b.id] ?? { total: 0, confirmadas: 0 },
      }))
      .filter(({ business: b, perfil }) => {
        if (segmento && b.segmento !== segmento) return false
        if (faixa && b.faixa_faturamento !== faixa) return false
        if (statusCuradoria && perfil?.curadoria_status !== statusCuradoria) return false
        if (termo) {
          const alvo = `${b.nome} ${perfil?.nome ?? ''} ${perfil?.email ?? ''}`.toLowerCase()
          if (!alvo.includes(termo)) return false
        }
        return true
      })
  }, [businesses, perfis, participacoes, busca, segmento, faixa, statusCuradoria])

  const kpis = useMemo(() => {
    const aprovados = businesses.filter((b) => perfis[b.user_id]?.curadoria_status === 'aprovado').length
    const ativos = businesses.filter((b) => b.ativo).length
    const confirmadas = Object.values(participacoes).reduce((acc, p) => acc + p.confirmadas, 0)
    return { total: businesses.length, aprovados, ativos, confirmadas }
  }, [businesses, perfis, participacoes])

  const linhasFeiras = useMemo(() => {
    return fairs
      .map((f) => ({ fair: f, desempenho: desempenhoFeiras[f.id] ?? { total: 0, confirmadas: 0, arrecadado: 0 } }))
      .sort((a, b) => b.desempenho.arrecadado - a.desempenho.arrecadado)
  }, [fairs, desempenhoFeiras])

  if (loading) return <p className="text-sm text-marca-ink/60">Carregando…</p>

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-bold text-marca-ink">Indicadores</h2>

      {erro && <p className="text-sm text-marca-coral">{erro}</p>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Comerciantes cadastrados" valor={kpis.total} icon={Users} tone="roxo" />
        <KpiCard label="Aprovados na curadoria" valor={kpis.aprovados} icon={ShieldCheck} tone="verde" />
        <KpiCard label="Negócios ativos" valor={kpis.ativos} icon={Store} tone="azul" />
        <KpiCard label="Participações confirmadas" valor={kpis.confirmadas} icon={CalendarCheck} tone="amarelo" />
      </div>

      <div className="flex gap-2 border-b border-marca-ink/10 pb-2">
        <button
          type="button"
          className={`${tabBtn} ${aba === 'comerciantes' ? tabAtiva : tabInativa}`}
          onClick={() => setAba('comerciantes')}
        >
          Comerciantes
        </button>
        <button
          type="button"
          className={`${tabBtn} ${aba === 'feiras' ? tabAtiva : tabInativa}`}
          onClick={() => setAba('feiras')}
        >
          Desempenho das feiras
        </button>
      </div>

      {aba === 'feiras' ? (
        <div className={`${card} overflow-x-auto p-0`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-marca-ink/10 text-marca-ink/50">
                <th className="px-5 py-3 font-medium">Feira</th>
                <th className="px-5 py-3 font-medium">Parque</th>
                <th className="px-5 py-3 font-medium">Taxa</th>
                <th className="px-5 py-3 font-medium">Inscrições</th>
                <th className="px-5 py-3 font-medium">Ocupação</th>
                <th className="px-5 py-3 font-medium">Arrecadação</th>
              </tr>
            </thead>
            <tbody>
              {linhasFeiras.map(({ fair: f, desempenho: d }) => {
                const ocupacao = f.max_participantes ? Math.round((d.confirmadas / f.max_participantes) * 100) : null
                return (
                  <tr key={f.id} className="border-b border-marca-ink/[.05] last:border-0">
                    <td className="px-5 py-3 font-medium text-marca-ink">{f.nome}</td>
                    <td className="px-5 py-3 text-marca-ink/80">{f.parks?.nome ?? '—'}</td>
                    <td className="px-5 py-3 text-marca-ink/80">{formatarMoeda(f.taxa)}</td>
                    <td className="px-5 py-3 text-marca-ink/80">
                      {d.total} <span className="text-marca-ink/40">({d.confirmadas} confirmadas)</span>
                    </td>
                    <td className="px-5 py-3 text-marca-ink/80">
                      {ocupacao === null ? '—' : `${ocupacao}% (${d.confirmadas}/${f.max_participantes})`}
                    </td>
                    <td className="px-5 py-3 font-semibold text-marca-ink">{formatarMoeda(d.arrecadado)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {linhasFeiras.length === 0 && (
            <p className="py-8 text-center text-sm text-marca-ink/60">Nenhuma feira cadastrada.</p>
          )}
        </div>
      ) : (
        <>
      <div className={`${card} flex flex-wrap gap-3`}>
        <input
          type="text"
          placeholder="Buscar por nome, negócio ou e-mail"
          className={`${select} w-full sm:w-64`}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select className={select} value={segmento} onChange={(e) => setSegmento(e.target.value)}>
          <option value="">Todos os segmentos</option>
          {SEGMENTOS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={select} value={faixa} onChange={(e) => setFaixa(e.target.value)}>
          <option value="">Todas as faixas de faturamento</option>
          {FAIXAS_FATURAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className={select} value={statusCuradoria} onChange={(e) => setStatusCuradoria(e.target.value)}>
          <option value="">Todos os status de curadoria</option>
          <option value="pendente">Pendente</option>
          <option value="aprovado">Aprovado</option>
          <option value="reprovado">Reprovado</option>
        </select>
        {(busca || segmento || faixa || statusCuradoria) && (
          <button
            type="button"
            className="text-sm font-semibold text-marca-ink/60 hover:text-marca-ink"
            onClick={() => { setBusca(''); setSegmento(''); setFaixa(''); setStatusCuradoria('') }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className={`${card} overflow-x-auto p-0`}>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-marca-ink/10 text-marca-ink/50">
              <th className="px-5 py-3 font-medium">Comerciante</th>
              <th className="px-5 py-3 font-medium">Negócio</th>
              <th className="px-5 py-3 font-medium">Segmento</th>
              <th className="px-5 py-3 font-medium">Faturamento autoclarado</th>
              <th className="px-5 py-3 font-medium">Curadoria</th>
              <th className="px-5 py-3 font-medium">Participações</th>
              <th className="px-5 py-3 font-medium">Cadastrado em</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ business: b, perfil, part }) => {
              const statusInfo = perfil ? CURADORIA_LABELS[perfil.curadoria_status] : null
              return (
                <tr key={b.id} className="border-b border-marca-ink/[.05] last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-marca-ink">{perfil?.nome ?? '—'}</p>
                    <p className="text-xs text-marca-ink/50">{perfil?.email ?? '—'}</p>
                  </td>
                  <td className="px-5 py-3 text-marca-ink">
                    {b.nome}
                    {!b.ativo && <span className="ml-2 text-xs text-marca-ink/40">(inativo)</span>}
                  </td>
                  <td className="px-5 py-3 text-marca-ink/80">{b.segmento}</td>
                  <td className="px-5 py-3 text-marca-ink/80">{b.faixa_faturamento ?? '—'}</td>
                  <td className="px-5 py-3">
                    {statusInfo && <span className={`${badge} ${statusInfo.cor}`}>{statusInfo.label}</span>}
                  </td>
                  <td className="px-5 py-3 text-marca-ink/80">
                    {part.total} {part.total > 0 && <span className="text-marca-ink/40">({part.confirmadas} confirmadas)</span>}
                  </td>
                  <td className="px-5 py-3 text-marca-ink/60">{formatarData(b.criado_em)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {linhas.length === 0 && (
          <p className="py-8 text-center text-sm text-marca-ink/60">Nenhum comerciante encontrado com esses filtros.</p>
        )}
      </div>
        </>
      )}
    </div>
  )
}
