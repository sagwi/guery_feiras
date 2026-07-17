import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as Tabs from '@radix-ui/react-tabs'
import { ArrowLeft, Download, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { STATUS_LABELS, type StatusInscricao } from '../../lib/statusInscricao'
import { formatarDataBR, formatarMoeda, rotuloDiasSemana } from '../../lib/formatacao'
import {
  baixarDataUrl,
  filtrarLinhasExportaveis,
  gerarPngListaFeira,
  type LinhaListaFeira,
} from '../../lib/exportListaFeira'
import { curadoriaUi as ui } from '../../components/curadoria/curadoriaUi'
import KpiCard from '../../components/KpiCard'
import { Users, ClipboardList, BadgeCheck, AlertTriangle } from 'lucide-react'

type Park = { id: string; nome: string }

type Fair = {
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
  status: 'aberto' | 'inativo'
  parks: Park | null
}

type Inscricao = {
  id: string
  user_id: string
  data_escolhida: string
  status: StatusInscricao
  businesses: { nome: string } | null
}

type Perfil = { id: string; nome: string | null; email: string | null; telefone: string | null }

type FormState = {
  park_id: string
  nome: string
  local: string
  descricao: string
  regras: string
  taxa: string
  max_participantes: string
  dias_semana: number[]
  data_inicio: string
  data_fim: string
  status: 'aberto' | 'inativo'
}

const DIAS_OPTS = [
  { v: 0, l: 'Dom' },
  { v: 1, l: 'Seg' },
  { v: 2, l: 'Ter' },
  { v: 3, l: 'Qua' },
  { v: 4, l: 'Qui' },
  { v: 5, l: 'Sex' },
  { v: 6, l: 'Sáb' },
]

function formVazio(parkId = ''): FormState {
  const hoje = new Date()
  const iso = hoje.toISOString().slice(0, 10)
  const fim = new Date(hoje)
  fim.setDate(fim.getDate() + 90)
  return {
    park_id: parkId,
    nome: '',
    local: '',
    descricao: '',
    regras: '',
    taxa: '200',
    max_participantes: '50',
    dias_semana: [6],
    data_inicio: iso,
    data_fim: fim.toISOString().slice(0, 10),
    status: 'aberto',
  }
}

function fairParaForm(f: Fair): FormState {
  return {
    park_id: f.park_id,
    nome: f.nome,
    local: f.local ?? '',
    descricao: f.descricao ?? '',
    regras: f.regras ?? '',
    taxa: String(f.taxa),
    max_participantes: f.max_participantes != null ? String(f.max_participantes) : '',
    dias_semana: f.dias_semana ?? [],
    data_inicio: f.data_inicio,
    data_fim: f.data_fim,
    status: f.status,
  }
}

export default function CuradoriaFeiraDetalhe() {
  const { id } = useParams<{ id: string }>()
  const nova = id === 'nova'
  const navigate = useNavigate()

  const [fair, setFair] = useState<Fair | null>(null)
  const [parks, setParks] = useState<Park[]>([])
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([])
  const [perfis, setPerfis] = useState<Record<string, Perfil>>({})
  const [form, setForm] = useState<FormState>(formVazio())
  const [dataFiltro, setDataFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const parksRes = await supabase.from('parks').select('id,nome').order('nome')
    if (parksRes.error) {
      console.error('CuradoriaFeiraDetalhe: falha ao carregar parques', parksRes.error)
      setErro('Falha ao carregar parques: ' + parksRes.error.message)
      setLoading(false)
      return
    }
    const listaParks = (parksRes.data ?? []) as Park[]
    setParks(listaParks)

    if (nova) {
      setFair(null)
      setForm(formVazio(listaParks[0]?.id ?? ''))
      setInscricoes([])
      setLoading(false)
      return
    }

    const [fairRes, appsRes] = await Promise.all([
      supabase
        .from('fairs')
        .select(
          'id,park_id,nome,local,descricao,regras,imagem_url,taxa,max_participantes,dias_semana,data_inicio,data_fim,status,parks(id,nome)',
        )
        .eq('id', id!)
        .single(),
      supabase
        .from('applications')
        .select('id,user_id,data_escolhida,status,businesses(nome)')
        .eq('fair_id', id!)
        .order('data_escolhida'),
    ])

    if (fairRes.error || !fairRes.data) {
      console.error('CuradoriaFeiraDetalhe: falha ao carregar feira', fairRes.error)
      setErro('Feira não encontrada.')
      setLoading(false)
      return
    }

    const f = fairRes.data as unknown as Fair
    setFair(f)
    setForm(fairParaForm(f))
    const lista = (appsRes.data ?? []) as unknown as Inscricao[]
    setInscricoes(lista)

    const datas = [...new Set(lista.map((a) => a.data_escolhida))].sort()
    setDataFiltro((prev) => prev || datas[0] || '')

    const userIds = [...new Set(lista.map((a) => a.user_id))]
    if (userIds.length) {
      const { data: perfisData, error: perfisError } = await supabase
        .from('profiles')
        .select('id,nome,email,telefone')
        .in('id', userIds)
      if (perfisError) {
        console.error('CuradoriaFeiraDetalhe: falha ao carregar perfis', perfisError)
      } else {
        const mapa: Record<string, Perfil> = {}
        for (const p of (perfisData ?? []) as Perfil[]) mapa[p.id] = p
        setPerfis(mapa)
      }
    }

    setLoading(false)
  }, [id, nova])

  useEffect(() => {
    carregar()
  }, [carregar])

  const kpis = useMemo(() => {
    const pendentes = inscricoes.filter((i) => i.status === 'pendente' || i.status === 'em_analise').length
    const aprovados = inscricoes.filter((i) => i.status === 'aprovado').length
    const confirmados = inscricoes.filter((i) => i.status === 'confirmado' || i.status === 'realizada').length
    return { total: inscricoes.length, pendentes, aprovados, confirmados }
  }, [inscricoes])

  const datasDisponiveis = useMemo(
    () => [...new Set(inscricoes.map((i) => i.data_escolhida))].sort(),
    [inscricoes],
  )

  const inscritosNaData = useMemo(
    () => (dataFiltro ? inscricoes.filter((i) => i.data_escolhida === dataFiltro) : inscricoes),
    [inscricoes, dataFiltro],
  )

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleDia(d: number) {
    setForm((prev) => {
      const set = new Set(prev.dias_semana)
      if (set.has(d)) set.delete(d)
      else set.add(d)
      return { ...prev, dias_semana: [...set].sort((a, b) => a - b) }
    })
  }

  async function salvar() {
    setErro(null)
    setOk(null)
    if (!form.nome.trim() || !form.park_id) {
      setErro('Nome e parque são obrigatórios.')
      return
    }
    if (form.dias_semana.length === 0) {
      setErro('Selecione ao menos um dia da semana.')
      return
    }
    setSalvando(true)
    const payload = {
      park_id: form.park_id,
      nome: form.nome.trim(),
      local: form.local.trim() || null,
      descricao: form.descricao.trim() || null,
      regras: form.regras.trim() || null,
      taxa: Number(form.taxa) || 0,
      max_participantes: form.max_participantes ? Number(form.max_participantes) : null,
      dias_semana: form.dias_semana,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      status: form.status,
    }

    if (nova) {
      const { data, error } = await supabase.from('fairs').insert(payload).select('id').single()
      setSalvando(false)
      if (error || !data) {
        setErro('Falha ao criar feira: ' + (error?.message ?? 'desconhecido'))
        return
      }
      navigate(`/curadoria/feiras/${data.id}`, { replace: true })
      return
    }

    const { error } = await supabase.from('fairs').update(payload).eq('id', id!)
    setSalvando(false)
    if (error) {
      setErro('Falha ao salvar: ' + error.message)
      return
    }
    setOk('Feira atualizada.')
    await carregar()
  }

  function exportarPng() {
    if (!fair || !dataFiltro) return
    setExportando(true)
    setErro(null)
    const linhas: LinhaListaFeira[] = inscritosNaData.map((i) => {
      const p = perfis[i.user_id]
      return {
        negocio: i.businesses?.nome ?? '—',
        comerciante: p?.nome ?? p?.email ?? i.user_id,
        status: i.status,
        telefone: p?.telefone,
      }
    })
    const exportaveis = filtrarLinhasExportaveis(linhas)
    const dataUrl = gerarPngListaFeira(
      {
        feira: fair.nome,
        parque: fair.parks?.nome ?? '—',
        data: formatarDataBR(dataFiltro),
        geradoEm: new Date().toLocaleString('pt-BR'),
      },
      exportaveis,
    )
    setExportando(false)
    if (!dataUrl) {
      setErro('Não foi possível gerar o PNG neste ambiente.')
      return
    }
    const slug = fair.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    baixarDataUrl(dataUrl, `lista-${slug}-${dataFiltro}.png`)
  }

  if (loading) return <p className="text-sm text-marca-ink/60">Carregando…</p>

  return (
    <div className={ui.page}>
      <div>
        <Link
          to="/curadoria/feiras"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-marca-acao hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar às feiras
        </Link>
        <h2 className={ui.titulo}>{nova ? 'Nova feira' : fair?.nome}</h2>
        {!nova && fair && (
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-marca-ink/60">
            <MapPin className="h-3.5 w-3.5" />
            {fair.parks?.nome ?? '—'}
            {fair.local ? ` · ${fair.local}` : ''}
            {' · '}
            {rotuloDiasSemana(fair.dias_semana)}
            {' · '}
            {formatarMoeda(fair.taxa)}
          </p>
        )}
      </div>

      {erro && <p className={ui.erro}>{erro}</p>}
      {ok && <p className="text-sm text-[#0B7A54]">{ok}</p>}

      <Tabs.Root defaultValue={nova ? 'editar' : 'visao'}>
        <Tabs.List className="flex gap-1 border-b border-marca-ink/10">
          {!nova && (
            <Tabs.Trigger value="visao" className={ui.tabTrigger}>
              Visão geral
            </Tabs.Trigger>
          )}
          {!nova && (
            <Tabs.Trigger value="inscritos" className={ui.tabTrigger}>
              Inscritos
            </Tabs.Trigger>
          )}
          <Tabs.Trigger value="editar" className={ui.tabTrigger}>
            {nova ? 'Cadastro' : 'Editar'}
          </Tabs.Trigger>
        </Tabs.List>

        {!nova && (
          <Tabs.Content value="visao" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard label="Inscrições" valor={kpis.total} icon={ClipboardList} tone="azul" />
              <KpiCard label="Pendentes" valor={kpis.pendentes} icon={AlertTriangle} tone="amarelo" />
              <KpiCard label="Aprovadas" valor={kpis.aprovados} icon={Users} tone="roxo" />
              <KpiCard label="Confirmadas" valor={kpis.confirmados} icon={BadgeCheck} tone="verde" />
            </div>
            {fair?.descricao && (
              <div className={`${ui.card} ${ui.cardBody}`}>
                <h3 className="font-display font-semibold text-marca-ink">Descrição</h3>
                <p className="text-sm text-marca-ink/70 whitespace-pre-wrap">{fair.descricao}</p>
              </div>
            )}
            {fair?.regras && (
              <div className={`${ui.card} ${ui.cardBody}`}>
                <h3 className="font-display font-semibold text-marca-ink">Regras</h3>
                <p className="text-sm text-marca-ink/70 whitespace-pre-wrap">{fair.regras}</p>
              </div>
            )}
          </Tabs.Content>
        )}

        {!nova && (
          <Tabs.Content value="inscritos" className="space-y-4 pt-4">
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm">
                <span className="mb-1 block text-marca-ink/60">Data da feira</span>
                <select
                  className={ui.select}
                  value={dataFiltro}
                  onChange={(e) => setDataFiltro(e.target.value)}
                >
                  {datasDisponiveis.length === 0 && <option value="">Sem datas</option>}
                  {datasDisponiveis.map((d) => (
                    <option key={d} value={d}>
                      {formatarDataBR(d)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className={`${ui.botaoPrimario} inline-flex items-center gap-1.5`}
                disabled={!dataFiltro || exportando || inscritosNaData.length === 0}
                onClick={exportarPng}
              >
                <Download className="h-4 w-4" />
                {exportando ? 'Gerando…' : 'Exportar PNG'}
              </button>
            </div>
            <p className={ui.subtitulo}>
              O PNG lista aprovados/confirmados da data selecionada, com checkbox para presença no dia.
            </p>

            {inscritosNaData.length === 0 && <p className={ui.empty}>Nenhum inscrito nesta data.</p>}

            <div className="space-y-2">
              {inscritosNaData.map((i) => {
                const p = perfis[i.user_id]
                const st = STATUS_LABELS[i.status]
                return (
                  <div key={i.id} className={`${ui.card} ${ui.cardBody} !space-y-1 py-3`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-display font-semibold text-marca-ink">
                        {i.businesses?.nome ?? '—'}
                      </p>
                      <span className={`${ui.badge} ${st.cor}`}>{st.label}</span>
                    </div>
                    <p className="text-[13px] text-marca-ink/60">
                      {p?.nome ?? p?.email ?? i.user_id}
                      {p?.telefone ? ` · ${p.telefone}` : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          </Tabs.Content>
        )}

        <Tabs.Content value="editar" className="space-y-4 pt-4">
          <div className={`${ui.card} ${ui.cardBody} grid gap-3 md:grid-cols-2`}>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-marca-ink/60">Nome *</span>
              <input
                className={ui.input}
                value={form.nome}
                onChange={(e) => patchForm('nome', e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-marca-ink/60">Parque *</span>
              <select
                className={`${ui.select} w-full`}
                value={form.park_id}
                onChange={(e) => patchForm('park_id', e.target.value)}
              >
                {parks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-marca-ink/60">Local</span>
              <input
                className={ui.input}
                value={form.local}
                onChange={(e) => patchForm('local', e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-marca-ink/60">Taxa (R$)</span>
              <input
                className={ui.input}
                type="number"
                min="0"
                step="0.01"
                value={form.taxa}
                onChange={(e) => patchForm('taxa', e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-marca-ink/60">Máx. participantes</span>
              <input
                className={ui.input}
                type="number"
                min="1"
                value={form.max_participantes}
                onChange={(e) => patchForm('max_participantes', e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-marca-ink/60">Início</span>
              <input
                className={ui.input}
                type="date"
                value={form.data_inicio}
                onChange={(e) => patchForm('data_inicio', e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-marca-ink/60">Fim</span>
              <input
                className={ui.input}
                type="date"
                value={form.data_fim}
                onChange={(e) => patchForm('data_fim', e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-marca-ink/60">Status</span>
              <select
                className={`${ui.select} w-full`}
                value={form.status}
                onChange={(e) => patchForm('status', e.target.value as 'aberto' | 'inativo')}
              >
                <option value="aberto">Aberta</option>
                <option value="inativo">Inativa</option>
              </select>
            </label>
            <div className="text-sm md:col-span-2">
              <span className="mb-1 block text-marca-ink/60">Dias da semana *</span>
              <div className="flex flex-wrap gap-2">
                {DIAS_OPTS.map((d) => {
                  const on = form.dias_semana.includes(d.v)
                  return (
                    <button
                      key={d.v}
                      type="button"
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        on
                          ? 'bg-marca-acao text-white shadow-glow'
                          : 'border border-marca-ink/15 text-marca-ink/60 hover:bg-marca-ink/5'
                      }`}
                      onClick={() => toggleDia(d.v)}
                    >
                      {d.l}
                    </button>
                  )
                })}
              </div>
            </div>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-marca-ink/60">Descrição</span>
              <textarea
                className={ui.textarea}
                rows={3}
                value={form.descricao}
                onChange={(e) => patchForm('descricao', e.target.value)}
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-marca-ink/60">Regras</span>
              <textarea
                className={ui.textarea}
                rows={3}
                value={form.regras}
                onChange={(e) => patchForm('regras', e.target.value)}
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="button"
                className={ui.botaoPrimario}
                disabled={salvando}
                onClick={salvar}
              >
                {salvando ? 'Salvando…' : nova ? 'Criar feira' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
