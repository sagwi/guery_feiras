import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Users, Plus, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatarMoeda, rotuloDiasSemana } from '../../lib/formatacao'
import { curadoriaUi as ui } from '../../components/curadoria/curadoriaUi'

type Fair = {
  id: string
  nome: string
  local: string | null
  taxa: number
  max_participantes: number | null
  dias_semana: number[]
  data_inicio: string
  data_fim: string
  status: 'aberto' | 'inativo'
  parks: { id: string; nome: string } | null
}

type Contagem = { total: number; confirmadas: number }

export default function CuradoriaFeiras() {
  const [feiras, setFeiras] = useState<Fair[]>([])
  const [contagem, setContagem] = useState<Record<string, Contagem>>({})
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'aberto' | 'inativo'>('todos')

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const [feirasRes, appsRes] = await Promise.all([
      supabase
        .from('fairs')
        .select('id,nome,local,taxa,max_participantes,dias_semana,data_inicio,data_fim,status,parks(id,nome)')
        .order('nome'),
      supabase.from('applications').select('fair_id,status'),
    ])
    if (feirasRes.error) {
      console.error('CuradoriaFeiras: falha ao carregar feiras', feirasRes.error)
      setErro('Falha ao carregar feiras: ' + feirasRes.error.message)
      setFeiras([])
      setLoading(false)
      return
    }
    setFeiras((feirasRes.data ?? []) as unknown as Fair[])

    const mapa: Record<string, Contagem> = {}
    for (const a of appsRes.data ?? []) {
      const id = (a as { fair_id: string }).fair_id
      if (!mapa[id]) mapa[id] = { total: 0, confirmadas: 0 }
      mapa[id].total += 1
      if (['aprovado', 'confirmado', 'realizada'].includes((a as { status: string }).status)) {
        mapa[id].confirmadas += 1
      }
    }
    if (appsRes.error) {
      console.error('CuradoriaFeiras: falha ao carregar aplicações', appsRes.error)
    }
    setContagem(mapa)
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return feiras.filter((f) => {
      if (filtroStatus !== 'todos' && f.status !== filtroStatus) return false
      if (!q) return true
      return (
        f.nome.toLowerCase().includes(q) ||
        (f.parks?.nome ?? '').toLowerCase().includes(q) ||
        (f.local ?? '').toLowerCase().includes(q)
      )
    })
  }, [feiras, busca, filtroStatus])

  if (loading) return <p className="text-sm text-marca-ink/60">Carregando…</p>

  return (
    <div className={ui.page}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={ui.titulo}>Gestão de Feiras</h2>
          <p className={ui.subtitulo}>
            {feiras.length} feira{feiras.length === 1 ? '' : 's'} no catálogo · clique para ver inscritos e exportar lista.
          </p>
        </div>
        <Link to="/curadoria/feiras/nova" className={`${ui.botaoPrimario} inline-flex items-center gap-1.5`}>
          <Plus className="h-4 w-4" /> Nova feira
        </Link>
      </div>

      {erro && <p className={ui.erro}>{erro}</p>}

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-marca-ink/40" />
          <input
            className={`${ui.input} pl-9`}
            placeholder="Buscar feira, parque ou local…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select
          className={ui.select}
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
        >
          <option value="todos">Todos os status</option>
          <option value="aberto">Abertas</option>
          <option value="inativo">Inativas</option>
        </select>
      </div>

      {filtradas.length === 0 && <p className={ui.empty}>Nenhuma feira encontrada.</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {filtradas.map((f) => {
          const c = contagem[f.id] ?? { total: 0, confirmadas: 0 }
          const vagas = f.max_participantes
          return (
            <Link key={f.id} to={`/curadoria/feiras/${f.id}`} className={`${ui.card} block`}>
              <div className={ui.cardBody}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-[17px] font-semibold text-marca-ink">{f.nome}</h3>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13.5px] text-marca-ink/60">
                      <MapPin className="h-3.5 w-3.5" />
                      {f.parks?.nome ?? '—'}
                      {f.local ? ` · ${f.local}` : ''}
                    </p>
                  </div>
                  <span
                    className={`${ui.badge} ${
                      f.status === 'aberto'
                        ? 'bg-[#D6F5E9] text-[#0B7A54]'
                        : 'bg-[#EDEAF3] text-[#5B5470]'
                    }`}
                  >
                    {f.status === 'aberto' ? 'Aberta' : 'Inativa'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-[13px] text-marca-ink/70">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {rotuloDiasSemana(f.dias_semana)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {c.confirmadas}
                    {vagas != null ? ` / ${vagas}` : ''} inscritos
                  </span>
                  <span>
                    Taxa <strong className="text-marca-ink">{formatarMoeda(f.taxa)}</strong>
                  </span>
                </div>

                <p className="text-[12px] text-marca-ink/45">
                  {c.total} inscrição{c.total === 1 ? '' : 'ões'} no total · período{' '}
                  {f.data_inicio} → {f.data_fim}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
