import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Report = {
  id: string
  user_id: string
  titulo: string
  descricao: string
  pagina: string | null
  status: 'aberto' | 'resolvido'
  criado_em: string
}

type Perfil = { id: string; nome: string | null; email: string | null }

const card = 'animate-fadeUp space-y-3 rounded-card border border-marca-ink/[.07] bg-white p-5 shadow-card'
const badge = 'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold'
const badgeAberto = 'bg-amber-100 text-amber-800'
const badgeResolvido = 'bg-green-100 text-green-800'
const botao =
  'rounded-xl bg-marca-acao px-4 py-2 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover disabled:opacity-50'

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR')
}

export default function CuradoriaSuporte() {
  const [reports, setReports] = useState<Report[]>([])
  const [perfis, setPerfis] = useState<Record<string, Perfil>>({})
  const [loading, setLoading] = useState(true)
  const [processandoId, setProcessandoId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const { data, error } = await supabase
      .from('problem_reports')
      .select('id,user_id,titulo,descricao,pagina,status,criado_em')
      .order('status', { ascending: true })
      .order('criado_em', { ascending: false })
    if (error) {
      console.error('CuradoriaSuporte: falha ao carregar reports', error)
      setErro('Falha ao carregar reports: ' + error.message)
      setLoading(false)
      return
    }
    const lista = (data ?? []) as Report[]
    setReports(lista)

    const userIds = [...new Set(lista.map((r) => r.user_id))]
    if (userIds.length > 0) {
      const { data: perfisData, error: perfisError } = await supabase
        .from('profiles')
        .select('id,nome,email')
        .in('id', userIds)
      if (perfisError) {
        console.error('CuradoriaSuporte: falha ao carregar perfis', perfisError)
      } else {
        const mapa: Record<string, Perfil> = {}
        for (const p of (perfisData ?? []) as Perfil[]) mapa[p.id] = p
        setPerfis(mapa)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function marcarResolvido(report: Report) {
    setErro(null)
    setProcessandoId(report.id)
    const { error } = await supabase
      .from('problem_reports')
      .update({ status: 'resolvido', resolvido_em: new Date().toISOString() })
      .eq('id', report.id)
    if (error) {
      setErro('Falha ao atualizar: ' + error.message)
      setProcessandoId(null)
      return
    }
    setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, status: 'resolvido' } : r)))
    setProcessandoId(null)
  }

  if (loading) return <p className="text-sm text-marca-ink/60">Carregando…</p>

  const abertos = reports.filter((r) => r.status === 'aberto')
  const resolvidos = reports.filter((r) => r.status === 'resolvido')

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-marca-ink">Suporte</h2>

      {erro && <p className="text-sm text-marca-coral">{erro}</p>}

      <h3 className="font-display text-lg font-semibold text-marca-ink">Em aberto ({abertos.length})</h3>
      {abertos.length === 0 && (
        <p className="py-6 text-center text-sm text-marca-ink/60">Nenhum problema em aberto.</p>
      )}
      <div className="space-y-3">
        {abertos.map((r) => {
          const perfil = perfis[r.user_id]
          return (
            <div key={r.id} className={card}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-display font-semibold text-marca-ink">{r.titulo}</p>
                <span className={`${badge} ${badgeAberto}`}>Aberto</span>
              </div>
              <p className="text-sm text-marca-ink/80">{r.descricao}</p>
              <div className="grid grid-cols-1 gap-1 text-xs text-marca-ink/50 sm:grid-cols-3">
                <span>Comerciante: {perfil?.nome ?? perfil?.email ?? r.user_id}</span>
                <span>Página: {r.pagina ?? '—'}</span>
                <span>Em: {formatarDataHora(r.criado_em)}</span>
              </div>
              <button
                type="button"
                className={botao}
                disabled={processandoId === r.id}
                onClick={() => marcarResolvido(r)}
              >
                {processandoId === r.id ? 'Marcando...' : 'Marcar como resolvido'}
              </button>
            </div>
          )
        })}
      </div>

      <h3 className="pt-4 font-display text-lg font-semibold text-marca-ink">Resolvidos ({resolvidos.length})</h3>
      <div className="space-y-3">
        {resolvidos.map((r) => {
          const perfil = perfis[r.user_id]
          return (
            <div key={r.id} className={card}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-display font-semibold text-marca-ink">{r.titulo}</p>
                <span className={`${badge} ${badgeResolvido}`}>Resolvido</span>
              </div>
              <p className="text-sm text-marca-ink/80">{r.descricao}</p>
              <div className="grid grid-cols-1 gap-1 text-xs text-marca-ink/50 sm:grid-cols-3">
                <span>Comerciante: {perfil?.nome ?? perfil?.email ?? r.user_id}</span>
                <span>Página: {r.pagina ?? '—'}</span>
                <span>Em: {formatarDataHora(r.criado_em)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
