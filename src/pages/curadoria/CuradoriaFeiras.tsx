import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, CalendarDays, Settings, MoreHorizontal, Plus, X, Rocket, PencilLine } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatarDataBR, formatarMoeda } from '../../lib/formatacao'
import { curadoriaUi as ui, statusBadge } from '../../components/curadoria/curadoriaUi'
import { BarraBusca, Segmented } from '../../components/curadoria/CuradoriaToolbar'
import CapaSlot from '../../components/curadoria/CapaSlot'
import CuradoriaToast from '../../components/curadoria/CuradoriaToast'

export type FairStatus = 'aberto' | 'rascunho' | 'encerrada' | 'inativo'

export type Fair = {
  id: string
  park_id: string
  nome: string
  local: string | null
  descricao: string | null
  regras: string | null
  imagem_url: string | null
  taxa: number
  max_participantes: number | null
  dias_semana: number[]
  data_inicio: string
  data_fim: string
  horario: string | null
  categorias: string[] | null
  status: FairStatus
  parks: { id: string; nome: string } | null
}

type Contagem = { total: number; confirmadas: number }

type Filtro = 'todos' | 'aberto' | 'rascunho' | 'encerrada'

function statusUi(s: FairStatus): { label: string; className: string } {
  if (s === 'aberto') return { label: 'Aberta', className: statusBadge.aberto }
  if (s === 'rascunho') return { label: 'Rascunho', className: statusBadge.rascunho }
  return { label: 'Encerrada', className: statusBadge.encerrada }
}

function normalizarStatus(s: FairStatus, dataFim: string): FairStatus {
  if (s === 'inativo') return 'encerrada'
  if (s === 'aberto' && dataFim < new Date().toISOString().slice(0, 10)) return 'encerrada'
  return s
}

export default function CuradoriaFeiras() {
  const navigate = useNavigate()
  const [feiras, setFeiras] = useState<Fair[]>([])
  const [parks, setParks] = useState<{ id: string; nome: string }[]>([])
  const [contagem, setContagem] = useState<Record<string, Contagem>>({})
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [createOpen, setCreateOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    park_id: '',
    local: '',
    data: '',
    horario: '09h – 18h',
    taxa: '150',
    vagas: '40',
    categorias: 'Alimentação, Vestuário, Artesanato',
    descricao: '',
    imagem_url: null as string | null,
  })

  const carregar = useCallback(async () => {
    setLoading(true)
    const [feirasRes, parksRes, appsRes] = await Promise.all([
      supabase
        .from('fairs')
        .select(
          'id,park_id,nome,local,descricao,regras,imagem_url,taxa,max_participantes,dias_semana,data_inicio,data_fim,horario,categorias,status,parks(id,nome)',
        )
        .order('nome'),
      supabase.from('parks').select('id,nome').order('nome'),
      supabase.from('applications').select('fair_id,status'),
    ])
    if (feirasRes.error) {
      console.error('CuradoriaFeiras:', feirasRes.error)
      setErro('Falha ao carregar feiras: ' + feirasRes.error.message)
      setLoading(false)
      return
    }
    setFeiras((feirasRes.data ?? []) as unknown as Fair[])
    setParks((parksRes.data ?? []) as { id: string; nome: string }[])
    setForm((f) =>
      f.park_id || !parksRes.data?.[0]
        ? f
        : { ...f, park_id: (parksRes.data[0] as { id: string }).id },
    )
    const mapa: Record<string, Contagem> = {}
    for (const a of appsRes.data ?? []) {
      const id = (a as { fair_id: string }).fair_id
      if (!mapa[id]) mapa[id] = { total: 0, confirmadas: 0 }
      mapa[id].total += 1
      if (['aprovado', 'confirmado', 'realizada'].includes((a as { status: string }).status)) {
        mapa[id].confirmadas += 1
      }
    }
    setContagem(mapa)
    setErro(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return feiras.filter((f) => {
      const st = normalizarStatus(f.status, f.data_fim)
      if (filtro !== 'todos' && st !== filtro) return false
      if (!q) return true
      return (
        f.nome.toLowerCase().includes(q) ||
        (f.parks?.nome ?? '').toLowerCase().includes(q) ||
        (f.local ?? '').toLowerCase().includes(q)
      )
    })
  }, [feiras, busca, filtro])

  async function salvar(modo: 'rascunho' | 'publicar') {
    if (!form.nome.trim() || !form.park_id) {
      setErro('Nome e parque são obrigatórios.')
      return
    }
    setSalvando(true)
    setErro(null)
    const data = form.data || new Date().toISOString().slice(0, 10)
    const cats = form.categorias
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
    const payload = {
      park_id: form.park_id,
      nome: form.nome.trim(),
      local: form.local.trim() || null,
      descricao: form.descricao.trim() || null,
      imagem_url: form.imagem_url,
      taxa: Number(form.taxa) || 0,
      max_participantes: form.vagas ? Number(form.vagas) : null,
      dias_semana: [new Date(data + 'T12:00:00').getDay()],
      data_inicio: data,
      data_fim: data,
      horario: form.horario.trim() || null,
      categorias: cats,
      status: modo === 'publicar' ? 'aberto' : 'rascunho',
    }
    const { data: row, error } = await supabase.from('fairs').insert(payload).select('id').single()
    setSalvando(false)
    if (error || !row) {
      setErro('Falha ao criar feira: ' + (error?.message ?? 'desconhecido'))
      return
    }
    setCreateOpen(false)
    setToast(modo === 'publicar' ? 'Feira publicada' : 'Rascunho salvo')
    navigate(`/curadoria/feiras/${row.id}`)
  }

  if (loading) return <p className="text-sm text-marca-ink/60">Carregando…</p>

  return (
    <div className={ui.page}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={ui.titulo}>Minhas feiras</h2>
          <p className={ui.subtitulo}>
            {feiras.length} feira{feiras.length === 1 ? '' : 's'} · gerencie inscritos, taxas e ocupação
          </p>
        </div>
        <button type="button" className={ui.botaoPrimario} onClick={() => setCreateOpen(true)}>
          <Plus className="h-5 w-5" /> Nova feira
        </button>
      </div>

      {erro && <p className={ui.erro}>{erro}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={filtro}
          onChange={setFiltro}
          options={[
            { id: 'todos', label: 'Todas' },
            { id: 'aberto', label: 'Abertas', activeClass: 'text-[#16A34A]' },
            { id: 'rascunho', label: 'Rascunhos', activeClass: 'text-[#B45309]' },
            { id: 'encerrada', label: 'Encerradas', activeClass: 'text-[#6B6480]' },
          ]}
        />
        <div className="min-w-[200px] flex-1">
          <BarraBusca value={busca} onChange={setBusca} placeholder="Buscar feira ou parque" />
        </div>
      </div>

      {filtradas.length === 0 && <p className={ui.empty}>Nenhuma feira encontrada.</p>}

      <div className="grid gap-[18px] md:grid-cols-2 xl:grid-cols-3">
        {filtradas.map((f) => {
          const st = statusUi(normalizarStatus(f.status, f.data_fim))
          const c = contagem[f.id] ?? { total: 0, confirmadas: 0 }
          const vagas = f.max_participantes ?? 0
          const ocup = vagas > 0 ? Math.min(100, Math.round((c.confirmadas / vagas) * 100)) : 0
          const rest = Math.max(0, vagas - c.confirmadas)
          const cats = f.categorias ?? []
          return (
            <article key={f.id} className={`${ui.card} flex flex-col overflow-hidden`}>
              <div className="relative h-[150px]">
                {f.imagem_url ? (
                  <img src={f.imagem_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 border-b border-dashed border-black/20 bg-black/[.03] text-[13px] text-black/45">
                    <span>Capa da feira</span>
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  <span className={`${ui.badge} ${st.className}`}>{st.label}</span>
                </div>
                <div className="absolute right-3 top-3 rounded-full bg-[rgba(42,26,94,.9)] px-2.5 py-1 text-[12px] font-bold text-white">
                  {formatarMoeda(f.taxa).replace(/\s/g, ' ')}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-[18px]">
                <h3 className="text-[16.5px] font-bold text-marca-ink">{f.nome}</h3>
                <div className="space-y-1 text-[13px] text-marca-ink/60">
                  <p className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {f.parks?.nome ?? '—'}
                    {f.local ? ` · ${f.local}` : ''}
                  </p>
                  <p className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> {formatarDataBR(f.data_inicio)}
                    {f.horario ? ` · ${f.horario}` : ''}
                  </p>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[12.5px]">
                    <span className="text-marca-ink/60">Ocupação</span>
                    <span className="font-bold text-marca-ink whitespace-nowrap">
                      {c.confirmadas}/{vagas || '—'}
                      {vagas ? ` · ${rest} vagas` : ''}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#EDE7FB]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"
                      style={{ width: `${ocup}%` }}
                    />
                  </div>
                </div>
                {cats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {cats.slice(0, 4).map((cat) => (
                      <span key={cat} className={ui.chip}>
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-auto flex gap-2 pt-1">
                  <Link
                    to={`/curadoria/feiras/${f.id}`}
                    className={`${ui.botaoPrimario} flex-1 justify-center !py-2.5 !text-[13.5px]`}
                  >
                    <Settings className="h-4 w-4" /> Gerenciar
                  </Link>
                  <button type="button" className={ui.botaoSecundario} aria-label="Mais opções">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {createOpen && (
        <div className={ui.overlay}>
          <div className={ui.modal}>
            <div className={ui.modalHeader}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFE9FB]">
                  <CalendarDays className="h-6 w-6 text-marca-acao" />
                </div>
                <p className="font-display text-[19px] font-bold text-marca-ink">Nova feira</p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-marca-ink/5"
                onClick={() => setCreateOpen(false)}
                aria-label="Fechar"
              >
                <X className="h-5 w-5 text-marca-ink/50" />
              </button>
            </div>
            <div className={`${ui.modalBody} grid gap-3 md:grid-cols-2`}>
              <div className="md:col-span-2">
                <label className={ui.label}>Imagem de capa</label>
                <CapaSlot
                  value={form.imagem_url}
                  onChange={(url) => setForm((f) => ({ ...f, imagem_url: url }))}
                  placeholder="Arraste a capa da feira ou clique para escolher"
                />
              </div>
              <div className="md:col-span-2">
                <label className={ui.label}>Nome da feira</label>
                <input
                  className={ui.input}
                  placeholder="Ex.: Feira Criativa Dona Lindu"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                />
              </div>
              <div>
                <label className={ui.label}>Parque / Local</label>
                <select
                  className={`${ui.select} w-full`}
                  value={form.park_id}
                  onChange={(e) => setForm((f) => ({ ...f, park_id: e.target.value }))}
                >
                  {parks.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label}>Local (opcional)</label>
                <input
                  className={ui.input}
                  placeholder="área central"
                  value={form.local}
                  onChange={(e) => setForm((f) => ({ ...f, local: e.target.value }))}
                />
              </div>
              <div>
                <label className={ui.label}>Data</label>
                <input
                  className={ui.input}
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                />
              </div>
              <div>
                <label className={ui.label}>Horário</label>
                <input
                  className={ui.input}
                  placeholder="09h – 18h"
                  value={form.horario}
                  onChange={(e) => setForm((f) => ({ ...f, horario: e.target.value }))}
                />
              </div>
              <div>
                <label className={ui.label}>Taxa (R$)</label>
                <input
                  className={ui.input}
                  placeholder="150,00"
                  value={form.taxa}
                  onChange={(e) => setForm((f) => ({ ...f, taxa: e.target.value }))}
                />
              </div>
              <div>
                <label className={ui.label}>Vagas</label>
                <input
                  className={ui.input}
                  placeholder="40"
                  value={form.vagas}
                  onChange={(e) => setForm((f) => ({ ...f, vagas: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className={ui.label}>Categorias permitidas</label>
                <input
                  className={ui.input}
                  placeholder="Alimentação, Vestuário, Artesanato"
                  value={form.categorias}
                  onChange={(e) => setForm((f) => ({ ...f, categorias: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className={ui.label}>Descrição</label>
                <textarea
                  className={ui.textarea}
                  rows={3}
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                />
              </div>
            </div>
            <div className={ui.modalFooter}>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-[11px] border border-[#FBD9A8] bg-white px-[18px] py-[11px] text-sm font-bold text-[#B45309] hover:bg-[#FFFBEB]"
                disabled={salvando}
                onClick={() => salvar('rascunho')}
              >
                <PencilLine className="h-4 w-4" /> Salvar rascunho
              </button>
              <div className="flex gap-2">
                <button type="button" className={ui.botaoSecundario} onClick={() => setCreateOpen(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className={ui.botaoPrimario}
                  disabled={salvando}
                  onClick={() => salvar('publicar')}
                >
                  <Rocket className="h-4 w-4" /> Publicar feira
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CuradoriaToast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
