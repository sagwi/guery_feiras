import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as Tabs from '@radix-ui/react-tabs'
import {
  ArrowLeft,
  Download,
  Edit2,
  MapPin,
  CalendarDays,
  Clock,
  DollarSign,
  Users,
  AlertTriangle,
  TrendingUp,
  BadgeCheck,
  ClipboardList,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatarDataBR, formatarMoeda, iniciais } from '../../lib/formatacao'
import {
  baixarDataUrl,
  filtrarLinhasExportaveis,
  gerarPngListaFeira,
  type LinhaListaFeira,
  type ListaFeiraMeta,
} from '../../lib/exportListaFeira'
import { STATUS_LABELS, transicaoCuradoria, type StatusInscricao } from '../../lib/statusInscricao'
import { curadoriaUi as ui, statusBadge } from '../../components/curadoria/curadoriaUi'
import CapaSlot from '../../components/curadoria/CapaSlot'
import CuradoriaToast from '../../components/curadoria/CuradoriaToast'
import MotivoReprovacaoModal from '../../components/curadoria/MotivoReprovacaoModal'
import KpiCard from '../../components/KpiCard'

// ─── Types ───────────────────────────────────────────────────────────────────

type FairStatus = 'aberto' | 'rascunho' | 'encerrada' | 'inativo'

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
  horario: string | null
  categorias: string[] | null
  status: FairStatus
  parks: { id: string; nome: string } | null
}

type Inscricao = {
  id: string
  user_id: string
  data_escolhida: string
  status: StatusInscricao
  businesses: { nome: string; segmento: string | null } | null
}

type Perfil = {
  id: string
  nome: string | null
  email: string | null
  telefone: string | null
}

type Payment = {
  id: string
  application_id: string
  valor: number
  status: string
  criado_em: string
}

type Park = { id: string; nome: string }

type FormState = {
  nome: string
  park_id: string
  local: string
  data_inicio: string
  horario: string
  taxa: string
  max_participantes: string
  categorias: string
  descricao: string
  status: FairStatus
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fairStatusBadge(s: FairStatus): { label: string; cls: string } {
  if (s === 'aberto') return { label: 'Aberta', cls: statusBadge.aberto }
  if (s === 'rascunho') return { label: 'Rascunho', cls: statusBadge.rascunho }
  return { label: 'Encerrada', cls: statusBadge.encerrada }
}

function fairParaForm(f: Fair): FormState {
  return {
    nome: f.nome,
    park_id: f.park_id,
    local: f.local ?? '',
    data_inicio: f.data_inicio,
    horario: f.horario ?? '',
    taxa: String(f.taxa),
    max_participantes: f.max_participantes != null ? String(f.max_participantes) : '',
    categorias: (f.categorias ?? []).join(', '),
    descricao: f.descricao ?? '',
    status: f.status,
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CuradoriaFeiraDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [fair, setFair] = useState<Fair | null>(null)
  const [parks, setParks] = useState<Park[]>([])
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([])
  const [perfis, setPerfis] = useState<Record<string, Perfil>>({})
  const [payments, setPayments] = useState<Payment[]>([])
  const [form, setForm] = useState<FormState>({
    nome: '',
    park_id: '',
    local: '',
    data_inicio: '',
    horario: '',
    taxa: '',
    max_participantes: '',
    categorias: '',
    descricao: '',
    status: 'aberto',
  })

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('visao')
  const [rejectIds, setRejectIds] = useState<string[] | null>(null)
  const [motivo, setMotivo] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [exportDataUrl, setExportDataUrl] = useState<string | null>(null)

  // ─── Data loading ─────────────────────────────────────────────────────────

  const carregar = useCallback(async () => {
    if (!id) {
      navigate('/curadoria/feiras', { replace: true })
      return
    }

    setLoading(true)
    setErro(null)

    const [fairRes, appsRes, parksRes] = await Promise.all([
      supabase
        .from('fairs')
        .select(
          'id,park_id,nome,local,descricao,regras,imagem_url,taxa,max_participantes,dias_semana,data_inicio,data_fim,horario,categorias,status,parks(id,nome)',
        )
        .eq('id', id)
        .single(),
      supabase
        .from('applications')
        .select('id,user_id,data_escolhida,status,businesses(nome,segmento)')
        .eq('fair_id', id)
        .order('criado_em', { ascending: false }),
      supabase.from('parks').select('id,nome').order('nome'),
    ])

    if (fairRes.error || !fairRes.data) {
      console.error('CuradoriaFeiraDetalhe: feira não encontrada', fairRes.error)
      navigate('/curadoria/feiras', { replace: true })
      return
    }

    const f = fairRes.data as unknown as Fair
    setFair(f)
    setForm(fairParaForm(f))
    setParks((parksRes.data ?? []) as Park[])

    const lista = (appsRes.data ?? []) as unknown as Inscricao[]
    setInscricoes(lista)

    const userIds = [...new Set(lista.map((a) => a.user_id))]
    const appIds = lista.map((a) => a.id)

    await Promise.all([
      userIds.length > 0
        ? supabase
            .from('profiles')
            .select('id,nome,email,telefone')
            .in('id', userIds)
            .then(({ data, error }) => {
              if (error) {
                console.error('CuradoriaFeiraDetalhe: falha ao carregar perfis', error)
                return
              }
              const mapa: Record<string, Perfil> = {}
              for (const p of (data ?? []) as Perfil[]) mapa[p.id] = p
              setPerfis(mapa)
            })
        : Promise.resolve(),
      appIds.length > 0
        ? supabase
            .from('payments')
            .select('id,application_id,valor,status,criado_em')
            .in('application_id', appIds)
            .then(({ data, error }) => {
              if (error) {
                console.error('CuradoriaFeiraDetalhe: falha ao carregar pagamentos', error)
                return
              }
              setPayments((data ?? []) as Payment[])
            })
        : Promise.resolve(),
    ])

    setLoading(false)
  }, [id, navigate])

  useEffect(() => {
    carregar()
  }, [carregar])

  // ─── Computed ─────────────────────────────────────────────────────────────

  const inscritosConfirmados = useMemo(
    () => inscricoes.filter((i) => ['aprovado', 'confirmado', 'realizada'].includes(i.status)),
    [inscricoes],
  )

  const inscritosPendentes = useMemo(
    () => inscricoes.filter((i) => i.status === 'pendente' || i.status === 'em_analise'),
    [inscricoes],
  )

  // aprovado = approved but payment still pending → Pendências
  const pendencias = useMemo(
    () => inscricoes.filter((i) => i.status === 'aprovado'),
    [inscricoes],
  )

  const pagamentosConfirmados = useMemo(
    () => payments.filter((p) => p.status === 'confirmado'),
    [payments],
  )

  const paymentsByAppId = useMemo(() => {
    const m: Record<string, Payment> = {}
    for (const p of payments) m[p.application_id] = p
    return m
  }, [payments])

  const vagas = fair?.max_participantes ?? 0

  const confirmadosCount = useMemo(
    () => inscricoes.filter((i) => i.status === 'confirmado' || i.status === 'realizada').length,
    [inscricoes],
  )

  const vagasRestantes = Math.max(0, vagas - confirmadosCount)
  const ocupacaoPct = vagas > 0 ? Math.min(100, Math.round((confirmadosCount / vagas) * 100)) : 0

  const arrecadado = useMemo(
    () => pagamentosConfirmados.reduce((acc, p) => acc + Number(p.valor), 0),
    [pagamentosConfirmados],
  )

  const aReceber = useMemo(
    () => pendencias.length * (fair?.taxa ?? 0),
    [pendencias, fair],
  )

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function nomeInscrito(i: Inscricao): string {
    const p = perfis[i.user_id]
    return p?.nome ?? p?.email ?? '—'
  }

  function categoriaInscrito(i: Inscricao): string {
    if (i.businesses?.segmento) return i.businesses.segmento
    return fair?.categorias?.[0] ?? '—'
  }

  async function handleCapaChange(url: string | null) {
    if (!fair) return
    const { error } = await supabase.from('fairs').update({ imagem_url: url }).eq('id', fair.id)
    if (error) {
      console.error('CuradoriaFeiraDetalhe: falha ao salvar capa', error)
    } else {
      setFair((prev) => (prev ? { ...prev, imagem_url: url } : null))
    }
  }

  async function salvar() {
    if (!fair) return
    setErro(null)
    if (!form.nome.trim() || !form.park_id) {
      setErro('Nome e parque são obrigatórios.')
      return
    }
    setSalvando(true)
    const cats = form.categorias
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
    const payload = {
      nome: form.nome.trim(),
      park_id: form.park_id,
      local: form.local.trim() || null,
      data_inicio: form.data_inicio,
      horario: form.horario.trim() || null,
      taxa: Number(form.taxa) || 0,
      max_participantes: form.max_participantes ? Number(form.max_participantes) : null,
      categorias: cats,
      descricao: form.descricao.trim() || null,
      status: form.status,
    }
    const { error } = await supabase.from('fairs').update(payload).eq('id', fair.id)
    setSalvando(false)
    if (error) {
      setErro('Falha ao salvar: ' + error.message)
      console.error('CuradoriaFeiraDetalhe: falha ao salvar', error)
      return
    }
    setToast('Feira atualizada')
    await carregar()
  }

  async function decidir(
    ids: string[],
    decisao: 'aprovar' | 'reprovar',
    motivoReprovacao?: string,
  ) {
    setProcessando(true)
    setErro(null)
    for (const appId of ids) {
      const inscricao = inscricoes.find((i) => i.id === appId)
      if (!inscricao) continue
      const novoStatus = transicaoCuradoria(inscricao.status, decisao)
      const { error } = await supabase
        .from('applications')
        .update({ status: novoStatus })
        .eq('id', appId)
      if (error) {
        setErro('Falha ao atualizar inscrição: ' + error.message)
        console.error('CuradoriaFeiraDetalhe: falha ao decidir', error)
        setProcessando(false)
        return
      }
      await supabase.from('notifications').insert(
        decisao === 'aprovar'
          ? {
              user_id: inscricao.user_id,
              tipo: 'inscricao_aprovada',
              titulo: 'Inscrição aprovada ✅',
              corpo: 'Sua inscrição foi aprovada. Realize o pagamento para confirmar.',
            }
          : {
              user_id: inscricao.user_id,
              tipo: 'inscricao_reprovada',
              titulo: 'Inscrição reprovada',
              corpo: motivoReprovacao ?? '',
            },
      )
    }
    // Reflect status changes locally without refetch
    setInscricoes((prev) =>
      prev.map((i) => {
        if (!ids.includes(i.id)) return i
        const novoStatus = transicaoCuradoria(i.status, decisao)
        return { ...i, status: novoStatus }
      }),
    )
    setRejectIds(null)
    setMotivo('')
    setProcessando(false)
    setToast(
      decisao === 'aprovar'
        ? ids.length === 1
          ? 'Inscrição aprovada'
          : `${ids.length} inscrições aprovadas`
        : ids.length === 1
          ? 'Inscrição reprovada'
          : `${ids.length} inscrições reprovadas`,
    )
  }

  function abrirExport() {
    if (!fair) return
    const linhas: LinhaListaFeira[] = inscritosConfirmados.map((i) => {
      const p = perfis[i.user_id]
      return {
        negocio: i.businesses?.nome ?? '—',
        comerciante: p?.nome ?? p?.email ?? i.user_id,
        status: i.status,
        telefone: p?.telefone,
      }
    })
    const exportaveis = filtrarLinhasExportaveis(linhas)
    const meta: ListaFeiraMeta = {
      feira: fair.nome,
      parque: fair.parks?.nome ?? '—',
      data: formatarDataBR(fair.data_inicio),
      horario: fair.horario,
      geradoEm: new Date().toLocaleString('pt-BR'),
      inscritos: inscricoes.length,
      vagasRestantes,
      confirmados: confirmadosCount,
      pendentes: inscritosPendentes.length,
    }
    const dataUrl = gerarPngListaFeira(meta, exportaveis)
    setExportDataUrl(dataUrl)
    setExportOpen(true)
  }

  function baixarExport() {
    if (!exportDataUrl || !fair) return
    const slug = fair.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    baixarDataUrl(exportDataUrl, `lista-${slug}-${fair.data_inicio}.png`)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) return <p className="text-sm text-marca-ink/60">Carregando…</p>
  if (!fair) return null

  const { label: statusLabel, cls: statusCls } = fairStatusBadge(fair.status)

  return (
    <div className={ui.page}>
      {/* Back link */}
      <Link
        to="/curadoria/feiras"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-marca-acao hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Feiras
      </Link>

      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className={ui.titulo}>{fair.nome}</h2>
          <span className={`${ui.badge} ${statusCls}`}>{statusLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={ui.botaoSecundario} onClick={abrirExport}>
            <Download className="h-4 w-4" /> Exportar PNG
          </button>
          <button
            type="button"
            className={ui.botaoPrimario}
            onClick={() => setActiveTab('detalhes')}
          >
            <Edit2 className="h-4 w-4" /> Editar feira
          </button>
        </div>
      </div>

      {erro && <p className={ui.erro}>{erro}</p>}

      {/* Cover banner — 190 px, saves immediately on change */}
      <CapaSlot
        value={fair.imagem_url}
        onChange={handleCapaChange}
        height={190}
        placeholder="Arraste a imagem de capa da feira ou clique para escolher"
      />

      {/* KPI grid — 6 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Inscritos" valor={inscricoes.length} icon={Users} tone="azul" />
        <KpiCard label="Vagas restantes" valor={vagasRestantes} icon={BadgeCheck} tone="verde" />
        <KpiCard
          label="Inscrições pendentes"
          valor={inscritosPendentes.length}
          icon={Clock}
          tone="amarelo"
        />
        <KpiCard
          label="Ocupação %"
          valor={`${ocupacaoPct}%`}
          icon={TrendingUp}
          tone="roxo"
        />
        <KpiCard
          label="Arrecadado"
          valor={formatarMoeda(arrecadado)}
          icon={DollarSign}
          tone="verde"
        />
        <KpiCard
          label="Pendências"
          valor={pendencias.length}
          icon={AlertTriangle}
          tone="coral"
        />
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex flex-wrap gap-1 border-b border-marca-ink/10">
          <Tabs.Trigger value="visao" className={ui.tabTrigger}>
            Visão geral
          </Tabs.Trigger>
          <Tabs.Trigger value="inscritos" className={ui.tabTrigger}>
            Inscritos
            {inscritosConfirmados.length > 0 && (
              <span className="ml-1 rounded-full bg-marca-ink/10 px-1.5 py-0.5 text-[10px] font-bold">
                {inscritosConfirmados.length}
              </span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="pendentes" className={ui.tabTrigger}>
            Inscrições pendentes
            {inscritosPendentes.length > 0 && (
              <span className="ml-1 rounded-full bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-bold text-[#B45309]">
                {inscritosPendentes.length}
              </span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="pendencias" className={ui.tabTrigger}>
            Pendências
            {pendencias.length > 0 && (
              <span className="ml-1 rounded-full bg-[#FFE6DE] px-1.5 py-0.5 text-[10px] font-bold text-[#E1502A]">
                {pendencias.length}
              </span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="financeiro" className={ui.tabTrigger}>
            Financeiro
          </Tabs.Trigger>
          <Tabs.Trigger value="detalhes" className={ui.tabTrigger}>
            Detalhes
          </Tabs.Trigger>
        </Tabs.List>

        {/* ── VISÃO GERAL ─────────────────────────────────────────────────── */}
        <Tabs.Content value="visao" className="grid gap-6 pt-5 md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <div className={`${ui.card} ${ui.cardBody}`}>
              <h3 className="mb-2 font-display text-[15px] font-bold text-marca-ink">
                Sobre a feira
              </h3>
              {fair.descricao ? (
                <p className="whitespace-pre-wrap text-sm text-marca-ink/70">{fair.descricao}</p>
              ) : (
                <p className="text-sm italic text-marca-ink/40">Sem descrição cadastrada.</p>
              )}
            </div>

            {(fair.categorias ?? []).length > 0 && (
              <div className={`${ui.card} ${ui.cardBody}`}>
                <h3 className="mb-3 font-display text-[15px] font-bold text-marca-ink">
                  Categorias permitidas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(fair.categorias ?? []).map((cat) => (
                    <span key={cat} className={ui.chip}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className={`${ui.card} ${ui.cardBody} space-y-3`}>
              <h3 className="font-display text-[15px] font-bold text-marca-ink">Informações</h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-marca-acao" />
                  <div>
                    <dt className={ui.labelUpper}>Local</dt>
                    <dd className="font-semibold text-marca-ink">
                      {fair.parks?.nome ?? '—'}
                      {fair.local ? ` · ${fair.local}` : ''}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-marca-acao" />
                  <div>
                    <dt className={ui.labelUpper}>Data</dt>
                    <dd className="font-semibold text-marca-ink">
                      {formatarDataBR(fair.data_inicio)}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-marca-acao" />
                  <div>
                    <dt className={ui.labelUpper}>Taxa</dt>
                    <dd className="font-semibold text-marca-ink">{formatarMoeda(fair.taxa)}</dd>
                  </div>
                </div>
                {fair.horario && (
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-marca-acao" />
                    <div>
                      <dt className={ui.labelUpper}>Horário</dt>
                      <dd className="font-semibold text-marca-ink">{fair.horario}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            <div className={`${ui.card} ${ui.cardBody}`}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-[15px] font-bold text-marca-ink">Ocupação</h3>
                <span className="text-sm font-bold text-marca-ink">
                  {confirmadosCount}/{vagas || '—'}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#EDE7FB]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all duration-700"
                  style={{ width: `${ocupacaoPct}%` }}
                />
              </div>
              <p className="mt-2 text-[12.5px] text-marca-ink/60">
                {vagasRestantes} vaga{vagasRestantes !== 1 ? 's' : ''} restante
                {vagasRestantes !== 1 ? 's' : ''} · {ocupacaoPct}% ocupado
              </p>
            </div>
          </div>
        </Tabs.Content>

        {/* ── INSCRITOS ───────────────────────────────────────────────────── */}
        <Tabs.Content value="inscritos" className="space-y-4 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-[17px] font-bold text-marca-ink">
              Expositores confirmados · {inscritosConfirmados.length}
            </h3>
            <button type="button" className={ui.botaoSecundario} onClick={abrirExport}>
              <Download className="h-4 w-4" /> Exportar lista
            </button>
          </div>

          {inscritosConfirmados.length === 0 && (
            <p className={ui.empty}>Nenhum expositor confirmado ainda.</p>
          )}

          <div className="space-y-2">
            {inscritosConfirmados.map((i) => {
              const nome = nomeInscrito(i)
              const cat = categoriaInscrito(i)
              const isConfirmado = i.status === 'confirmado' || i.status === 'realizada'
              return (
                <article
                  key={i.id}
                  className={`${ui.card} ${ui.cardBody} flex items-center gap-4`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#F3EEFF] to-[#E9E1FB] text-sm font-bold text-marca-acao">
                    {iniciais(i.businesses?.nome ?? nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-semibold text-marca-ink">
                      {i.businesses?.nome ?? '—'}
                    </p>
                    <p className="truncate text-[13px] text-marca-ink/60">{nome}</p>
                    <p className="mt-0.5 text-[11.5px] text-marca-ink/40">{cat}</p>
                  </div>
                  <span
                    className={`${ui.badge} shrink-0 ${isConfirmado ? statusBadge.confirmado : statusBadge.pendente}`}
                  >
                    {isConfirmado ? 'Confirmado' : 'Pendente'}
                  </span>
                </article>
              )
            })}
          </div>
        </Tabs.Content>

        {/* ── INSCRIÇÕES PENDENTES ─────────────────────────────────────────── */}
        <Tabs.Content value="pendentes" className="space-y-4 pt-5">
          <h3 className="font-display text-[17px] font-bold text-marca-ink">
            Aguardando análise · {inscritosPendentes.length}
          </h3>

          {inscritosPendentes.length === 0 && (
            <p className={ui.empty}>Nenhuma inscrição aguardando análise.</p>
          )}

          <div className="space-y-2">
            {inscritosPendentes.map((i) => {
              const nome = nomeInscrito(i)
              const st = STATUS_LABELS[i.status]
              const badgeCls =
                i.status === 'em_analise' ? statusBadge.em_analise : statusBadge.pendente
              return (
                <article
                  key={i.id}
                  className={`${ui.card} ${ui.cardBody} flex flex-wrap items-center gap-4`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#F3EEFF] to-[#E9E1FB] text-sm font-bold text-marca-acao">
                    {iniciais(i.businesses?.nome ?? nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display font-semibold text-marca-ink">
                        {i.businesses?.nome ?? '—'}
                      </p>
                      <span className={`${ui.badge} ${badgeCls}`}>{st.label}</span>
                    </div>
                    <p className="text-[13px] text-marca-ink/60">{nome}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      className={ui.botaoAprovar}
                      disabled={processando}
                      onClick={() => decidir([i.id], 'aprovar')}
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      className={ui.botaoReprovar}
                      disabled={processando}
                      onClick={() => {
                        setMotivo('')
                        setRejectIds([i.id])
                      }}
                    >
                      Reprovar
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </Tabs.Content>

        {/* ── PENDÊNCIAS ──────────────────────────────────────────────────── */}
        <Tabs.Content value="pendencias" className="space-y-4 pt-5">
          <h3 className="font-display text-[17px] font-bold text-marca-ink">
            Pendências · {pendencias.length}
          </h3>

          {pendencias.length === 0 && (
            <p className={ui.empty}>Nenhuma pendência de pagamento.</p>
          )}

          <div className="space-y-2">
            {pendencias.map((i) => {
              const nome = nomeInscrito(i)
              return (
                <article
                  key={i.id}
                  className={`${ui.card} ${ui.cardBody} flex items-center gap-4 border-l-4 border-l-[#F97316]`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-marca-ink">
                      {i.businesses?.nome ?? '—'}
                    </p>
                    <p className="text-[13px] text-marca-ink/60">{nome}</p>
                    <p className="mt-0.5 text-[12px] text-[#F97316]">
                      Pagamento da taxa em atraso · {formatarMoeda(fair.taxa)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${ui.botaoReprovar} shrink-0`}
                    onClick={() => setToast('Lembrete enviado (em breve)')}
                  >
                    {/* ponytail: notificação real de cobrança ainda não implementada */}
                    Cobrar
                  </button>
                </article>
              )
            })}
          </div>
        </Tabs.Content>

        {/* ── FINANCEIRO ──────────────────────────────────────────────────── */}
        <Tabs.Content value="financeiro" className="space-y-5 pt-5">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className={`${ui.card} ${ui.cardBody}`}>
              <p className={ui.labelUpper}>Confirmado</p>
              <p className="mt-1 font-display text-[26px] font-bold text-[#16A34A]">
                {formatarMoeda(arrecadado)}
              </p>
              <p className="text-[12px] text-marca-ink/50">
                {pagamentosConfirmados.length} pagamento
                {pagamentosConfirmados.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className={`${ui.card} ${ui.cardBody}`}>
              <p className={ui.labelUpper}>A receber</p>
              <p className="mt-1 font-display text-[26px] font-bold text-[#F97316]">
                {formatarMoeda(aReceber)}
              </p>
              <p className="text-[12px] text-marca-ink/50">
                {pendencias.length} aprovado{pendencias.length !== 1 ? 's' : ''} aguardando
              </p>
            </div>
            <div className={`${ui.card} ${ui.cardBody}`}>
              <p className={ui.labelUpper}>Previsto</p>
              <p className="mt-1 font-display text-[26px] font-bold text-marca-ink">
                {formatarMoeda(arrecadado + aReceber)}
              </p>
              <p className="text-[12px] text-marca-ink/50">confirmado + a receber</p>
            </div>
          </div>

          {/* Table */}
          <div className={`${ui.card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-marca-ink/10 bg-[#F9F7F3]">
                    <th className="px-5 py-3 text-left font-semibold text-marca-ink/60">
                      Expositor
                    </th>
                    <th className="px-5 py-3 text-left font-semibold text-marca-ink/60">Data</th>
                    <th className="px-5 py-3 text-right font-semibold text-marca-ink/60">Valor</th>
                    <th className="px-5 py-3 text-right font-semibold text-marca-ink/60">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inscritosConfirmados.map((i) => {
                    const pag = paymentsByAppId[i.id]
                    const pago = pag?.status === 'confirmado'
                    return (
                      <tr
                        key={i.id}
                        className="border-b border-marca-ink/[.04] hover:bg-[#F9F7F3]"
                      >
                        <td className="px-5 py-3 font-medium text-marca-ink">
                          {i.businesses?.nome ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-marca-ink/60">
                          {pag ? formatarDataBR(pag.criado_em.slice(0, 10)) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-marca-ink">
                          {pag ? formatarMoeda(Number(pag.valor)) : formatarMoeda(fair.taxa)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={`${ui.badge} ${pago ? statusBadge.confirmado : statusBadge.pendente}`}
                          >
                            {pago ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {inscritosConfirmados.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-sm text-marca-ink/40"
                      >
                        Nenhum registro financeiro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Tabs.Content>

        {/* ── DETALHES (edit form) ─────────────────────────────────────────── */}
        <Tabs.Content value="detalhes" className="space-y-4 pt-5">
          <div className={`${ui.card} ${ui.cardBody}`}>
            <h3 className="mb-4 font-display text-[15px] font-bold text-marca-ink">
              Editar feira
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {/* Capa */}
              <div className="md:col-span-2">
                <label className={ui.label}>Imagem de capa</label>
                <CapaSlot value={fair.imagem_url} onChange={handleCapaChange} height={140} />
              </div>

              {/* Nome */}
              <div className="md:col-span-2">
                <label className={ui.label}>Nome da feira *</label>
                <input
                  className={ui.input}
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                />
              </div>

              {/* Parque */}
              <div>
                <label className={ui.label}>Parque *</label>
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

              {/* Local */}
              <div>
                <label className={ui.label}>Local</label>
                <input
                  className={ui.input}
                  placeholder="área central"
                  value={form.local}
                  onChange={(e) => setForm((f) => ({ ...f, local: e.target.value }))}
                />
              </div>

              {/* Data */}
              <div>
                <label className={ui.label}>Data</label>
                <input
                  className={ui.input}
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
                />
              </div>

              {/* Horário */}
              <div>
                <label className={ui.label}>Horário</label>
                <input
                  className={ui.input}
                  placeholder="09h – 18h"
                  value={form.horario}
                  onChange={(e) => setForm((f) => ({ ...f, horario: e.target.value }))}
                />
              </div>

              {/* Taxa */}
              <div>
                <label className={ui.label}>Taxa (R$)</label>
                <input
                  className={ui.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.taxa}
                  onChange={(e) => setForm((f) => ({ ...f, taxa: e.target.value }))}
                />
              </div>

              {/* Vagas */}
              <div>
                <label className={ui.label}>Vagas</label>
                <input
                  className={ui.input}
                  type="number"
                  min="1"
                  value={form.max_participantes}
                  onChange={(e) => setForm((f) => ({ ...f, max_participantes: e.target.value }))}
                />
              </div>

              {/* Categorias */}
              <div className="md:col-span-2">
                <label className={ui.label}>Categorias (separadas por vírgula)</label>
                <input
                  className={ui.input}
                  placeholder="Alimentação, Vestuário, Artesanato"
                  value={form.categorias}
                  onChange={(e) => setForm((f) => ({ ...f, categorias: e.target.value }))}
                />
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className={ui.label}>Descrição</label>
                <textarea
                  className={ui.textarea}
                  rows={3}
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                />
              </div>

              {/* Status */}
              <div>
                <label className={ui.label}>Status</label>
                <select
                  className={`${ui.select} w-full`}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FairStatus }))}
                >
                  <option value="aberto">Aberta</option>
                  <option value="rascunho">Rascunho</option>
                  <option value="encerrada">Encerrada</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              {/* Save button */}
              <div className="flex items-end">
                <button
                  type="button"
                  className={ui.botaoPrimario}
                  disabled={salvando}
                  onClick={salvar}
                >
                  {salvando ? 'Salvando…' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* ── Reprovação modal ──────────────────────────────────────────────── */}
      {rejectIds && (
        <MotivoReprovacaoModal
          titulo={`Reprovar ${rejectIds.length > 1 ? `${rejectIds.length} inscrições` : 'inscrição'}`}
          motivo={motivo}
          onMotivo={setMotivo}
          onConfirm={() => decidir(rejectIds, 'reprovar', motivo)}
          onClose={() => {
            setRejectIds(null)
            setMotivo('')
          }}
          processando={processando}
        />
      )}

      {/* ── Export PNG modal ──────────────────────────────────────────────── */}
      {exportOpen && (
        <div className={ui.overlay} role="dialog" aria-modal="true">
          <div className={`${ui.modal} max-w-[680px]`}>
            <div className={ui.modalHeader}>
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-marca-acao" />
                <p className="font-display text-[18px] font-bold text-marca-ink">
                  Prévia da exportação (PNG)
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-marca-ink/5"
                onClick={() => setExportOpen(false)}
                aria-label="Fechar"
              >
                <X className="h-5 w-5 text-marca-ink/50" />
              </button>
            </div>
            <div className={`${ui.modalBody} flex flex-col items-center gap-4`}>
              {exportDataUrl ? (
                <img
                  src={exportDataUrl}
                  alt="Prévia da lista de inscritos"
                  className="w-full rounded-[12px] border border-marca-ink/10 shadow-sm"
                />
              ) : (
                <p className="py-6 text-sm text-marca-ink/60">
                  Não foi possível gerar a prévia neste ambiente.
                </p>
              )}
            </div>
            <div className={`${ui.modalFooter} justify-end`}>
              <button
                type="button"
                className={ui.botaoSecundario}
                onClick={() => setExportOpen(false)}
              >
                Fechar
              </button>
              <button
                type="button"
                className={ui.botaoPrimario}
                disabled={!exportDataUrl}
                onClick={() => {
                  baixarExport()
                  setExportOpen(false)
                }}
              >
                <Download className="h-4 w-4" /> Baixar PNG
              </button>
            </div>
          </div>
        </div>
      )}

      <CuradoriaToast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
