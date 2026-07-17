import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Store } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  STATUS_LABELS,
  transicaoCuradoria,
  transicaoCancelamentoOrganizador,
  geraCreditoAoCancelar,
  type StatusInscricao,
} from '../../lib/statusInscricao'
import { formatarDataBR, formatarMoeda } from '../../lib/formatacao'
import { curadoriaUi as ui, statusBadge } from '../../components/curadoria/curadoriaUi'
import { BarraBusca, BulkBar, Contadores, Segmented } from '../../components/curadoria/CuradoriaToolbar'
import MotivoReprovacaoModal from '../../components/curadoria/MotivoReprovacaoModal'
import CuradoriaToast from '../../components/curadoria/CuradoriaToast'

type Inscricao = {
  id: string
  user_id: string
  data_escolhida: string
  status: StatusInscricao
  criado_em: string
  businesses: { nome: string } | null
  fairs: { nome: string; taxa: number; parks: { nome: string } | null } | null
}

type Perfil = { id: string; nome: string | null; email: string | null }

type Filtro = 'todos' | 'pendente' | 'em_analise'

export default function CuradoriaInscricoes() {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([])
  const [ativas, setAtivas] = useState<Inscricao[]>([])
  const [perfis, setPerfis] = useState<Record<string, Perfil>>({})
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [sortDesc, setSortDesc] = useState(true)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [detail, setDetail] = useState<Inscricao | null>(null)
  const [rejectIds, setRejectIds] = useState<string[] | null>(null)
  const [motivo, setMotivo] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const [pendentesRes, ativasRes] = await Promise.all([
      supabase
        .from('applications')
        .select('*, businesses(nome), fairs(nome,taxa,parks(nome))')
        .in('status', ['pendente', 'em_analise'])
        .order('criado_em', { ascending: false }),
      supabase
        .from('applications')
        .select('*, businesses(nome), fairs(nome,taxa,parks(nome))')
        .in('status', ['aprovado', 'confirmado'])
        .order('criado_em', { ascending: false }),
    ])
    if (pendentesRes.error || ativasRes.error) {
      const e = pendentesRes.error ?? ativasRes.error!
      console.error('CuradoriaInscricoes: falha ao carregar', e)
      setErro('Falha ao carregar inscrições: ' + e.message)
      setInscricoes([])
      setAtivas([])
      setLoading(false)
      return
    }
    const lista = (pendentesRes.data ?? []) as Inscricao[]
    const listaAtivas = (ativasRes.data ?? []) as Inscricao[]
    setInscricoes(lista)
    setAtivas(listaAtivas)
    setErro(null)

    const userIds = [...new Set([...lista, ...listaAtivas].map((i) => i.user_id))]
    if (userIds.length) {
      const { data, error } = await supabase.from('profiles').select('id,nome,email').in('id', userIds)
      if (!error) {
        const mapa: Record<string, Perfil> = {}
        for (const p of (data ?? []) as Perfil[]) mapa[p.id] = p
        setPerfis(mapa)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const contPend = inscricoes.filter((i) => i.status === 'pendente').length
  const contAnalise = inscricoes.filter((i) => i.status === 'em_analise').length

  const filtrados = useMemo(() => {
    let list = inscricoes
    if (filtro !== 'todos') list = list.filter((i) => i.status === filtro)
    const q = busca.trim().toLowerCase()
    if (q) {
      list = list.filter((i) => {
        const p = perfis[i.user_id]
        return (
          (i.businesses?.nome ?? '').toLowerCase().includes(q) ||
          (p?.nome ?? '').toLowerCase().includes(q) ||
          (p?.email ?? '').toLowerCase().includes(q) ||
          (i.fairs?.nome ?? '').toLowerCase().includes(q)
        )
      })
    }
    return [...list].sort((a, b) => {
      const da = new Date(a.criado_em).getTime()
      const db = new Date(b.criado_em).getTime()
      return sortDesc ? db - da : da - db
    })
  }, [inscricoes, filtro, busca, perfis, sortDesc])

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected],
  )

  async function decidir(ids: string[], decisao: 'aprovar' | 'reprovar', motivoReprovacao?: string) {
    setProcessando(true)
    setErro(null)
    const alvos = inscricoes.filter((i) => ids.includes(i.id))
    for (const inscricao of alvos) {
      const novoStatus = transicaoCuradoria(inscricao.status, decisao)
      const { error } = await supabase.from('applications').update({ status: novoStatus }).eq('id', inscricao.id)
      if (error) {
        setErro('Falha ao atualizar inscrição: ' + error.message)
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
    setInscricoes((prev) => prev.filter((i) => !ids.includes(i.id)))
    setSelected({})
    setDetail(null)
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

  async function cancelarPeloOrganizador(inscricao: Inscricao) {
    setProcessando(true)
    setErro(null)
    const novoStatus = transicaoCancelamentoOrganizador(inscricao.status)
    const { error } = await supabase.from('applications').update({ status: novoStatus }).eq('id', inscricao.id)
    if (error) {
      setErro('Falha ao cancelar data: ' + error.message)
      setProcessando(false)
      return
    }
    if (geraCreditoAoCancelar(inscricao.status)) {
      const { data: pags } = await supabase
        .from('payments')
        .select('valor')
        .eq('application_id', inscricao.id)
        .eq('status', 'confirmado')
      const valor = (pags ?? []).reduce((acc, p) => acc + Number(p.valor), 0)
      if (valor > 0) {
        await supabase.from('wallet_transactions').insert({
          user_id: inscricao.user_id,
          tipo: 'entrada',
          valor,
          referencia: `Crédito: ${inscricao.fairs?.nome ?? 'feira'} cancelada pelo organizador`,
          application_id: inscricao.id,
        })
      }
    }
    await supabase.from('notifications').insert({
      user_id: inscricao.user_id,
      tipo: 'feira_cancelada',
      titulo: 'Feira cancelada pelo organizador',
      corpo: geraCreditoAoCancelar(inscricao.status)
        ? 'Uma data que você pagou foi cancelada. Um crédito foi gerado na sua carteira.'
        : 'Uma data da sua inscrição foi cancelada pelo organizador.',
    })
    setAtivas((prev) => prev.filter((i) => i.id !== inscricao.id))
    setProcessando(false)
    setToast('Data cancelada')
  }

  function nomeInscrito(i: Inscricao) {
    const p = perfis[i.user_id]
    return p?.nome ?? p?.email ?? i.user_id
  }

  if (loading) return <p className="text-sm text-marca-ink/60">Carregando…</p>

  return (
    <div className={ui.page}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={ui.titulo}>Inscrições pendentes</h2>
          <p className={ui.subtitulo}>Analise e libere expositores para suas feiras</p>
        </div>
        <Contadores
          items={[
            { valor: contPend, label: 'Pendentes', cor: 'text-marca-acao' },
            { valor: contAnalise, label: 'Em análise', cor: 'text-[#2563EB]' },
          ]}
        />
      </div>

      {erro && <p className={ui.erro}>{erro}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={filtro}
          onChange={setFiltro}
          options={[
            { id: 'todos', label: 'Todos' },
            { id: 'pendente', label: 'Pendente', activeClass: 'text-[#B45309]' },
            { id: 'em_analise', label: 'Em análise', activeClass: 'text-[#2563EB]' },
          ]}
        />
        <div className="min-w-[220px] flex-1">
          <BarraBusca
            value={busca}
            onChange={setBusca}
            placeholder="Buscar inscrito ou negócio"
            sortLabel={sortDesc ? 'Mais recentes' : 'Mais antigas'}
            onToggleSort={() => setSortDesc((v) => !v)}
          />
        </div>
      </div>

      <BulkBar
        count={selectedIds.length}
        onApprove={() => decidir(selectedIds, 'aprovar')}
        onReject={() => {
          setMotivo('')
          setRejectIds(selectedIds)
        }}
        onClear={() => setSelected({})}
      />

      {filtrados.length === 0 && <p className={ui.empty}>Nenhuma inscrição pendente.</p>}

      <div className="space-y-3">
        {filtrados.map((i) => {
          const st = STATUS_LABELS[i.status]
          const badgeClass =
            i.status === 'em_analise' ? statusBadge.em_analise : statusBadge.pendente
          return (
            <article
              key={i.id}
              className={`${ui.card} grid grid-cols-[24px_52px_1fr_auto] items-center gap-4 px-5 py-4`}
            >
              <input
                type="checkbox"
                className="h-[18px] w-[18px] accent-marca-acao"
                checked={!!selected[i.id]}
                onChange={(e) => setSelected((s) => ({ ...s, [i.id]: e.target.checked }))}
              />
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-gradient-to-br from-[#F3EEFF] to-[#E9E1FB]">
                <Store className="h-6 w-6 text-marca-acao" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-marca-ink">{i.fairs?.nome ?? '—'}</h3>
                  <span className={`${ui.badge} ${badgeClass}`}>{st.label}</span>
                </div>
                <div className="mt-2 grid gap-2 text-[13px] sm:grid-cols-3">
                  <div>
                    <p className={ui.labelUpper}>Negócio</p>
                    <p className="font-semibold text-marca-ink">{i.businesses?.nome ?? '—'}</p>
                  </div>
                  <div>
                    <p className={ui.labelUpper}>Inscrito</p>
                    <p className="font-semibold text-marca-ink">{nomeInscrito(i)}</p>
                  </div>
                  <div>
                    <p className={ui.labelUpper}>Parque</p>
                    <p className="font-semibold text-marca-ink">{i.fairs?.parks?.nome ?? '—'}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-[17px] font-extrabold text-marca-ink">
                    {i.fairs ? formatarMoeda(i.fairs.taxa) : '—'}
                  </p>
                  <p className="text-xs text-marca-ink/50">{formatarDataBR(i.data_escolhida)}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" className={ui.botaoSecundario} onClick={() => setDetail(i)}>
                    <Eye className="h-4 w-4" /> Detalhes
                  </button>
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
              </div>
            </article>
          )
        })}
      </div>

      <div className="pt-2">
        <h2 className={ui.titulo}>Datas ativas</h2>
        <p className={ui.subtitulo}>
          Cancelar uma data já paga gera crédito automático na carteira do comerciante.
        </p>
      </div>

      {ativas.length === 0 && <p className={ui.empty}>Nenhuma data ativa.</p>}

      <div className="space-y-3">
        {ativas.map((i) => {
          const st = STATUS_LABELS[i.status]
          return (
            <article key={i.id} className={`${ui.card} ${ui.cardBody} flex flex-wrap items-center justify-between gap-3`}>
              <div>
                <p className="font-display font-semibold text-marca-ink">{i.fairs?.nome ?? '—'}</p>
                <p className="text-[13px] text-marca-ink/60">
                  {nomeInscrito(i)} · {formatarDataBR(i.data_escolhida)} ·{' '}
                  <span className={`${ui.badge} ${st.cor}`}>{st.label}</span>
                </p>
              </div>
              <button
                type="button"
                className={ui.botaoReprovar}
                disabled={processando}
                onClick={() => cancelarPeloOrganizador(i)}
              >
                Cancelar data
              </button>
            </article>
          )
        })}
      </div>

      {detail && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} max-w-[480px]`}>
            <div className={ui.modalHeader}>
              <p className="font-display text-lg font-bold text-marca-ink">{detail.fairs?.nome}</p>
              <button type="button" className={ui.botaoSecundario} onClick={() => setDetail(null)}>
                Fechar
              </button>
            </div>
            <div className={`${ui.modalBody} space-y-2 text-sm`}>
              <p><span className="text-marca-ink/50">Negócio:</span> {detail.businesses?.nome}</p>
              <p><span className="text-marca-ink/50">Inscrito:</span> {nomeInscrito(detail)}</p>
              <p><span className="text-marca-ink/50">Parque:</span> {detail.fairs?.parks?.nome}</p>
              <p><span className="text-marca-ink/50">Data:</span> {formatarDataBR(detail.data_escolhida)}</p>
              <p><span className="text-marca-ink/50">Taxa:</span> {detail.fairs ? formatarMoeda(detail.fairs.taxa) : '—'}</p>
              <p><span className="text-marca-ink/50">Status:</span> {STATUS_LABELS[detail.status].label}</p>
            </div>
            <div className={`${ui.modalFooter} justify-end`}>
              <button
                type="button"
                className={ui.botaoReprovar}
                onClick={() => {
                  setMotivo('')
                  setRejectIds([detail.id])
                }}
              >
                Reprovar
              </button>
              <button type="button" className={ui.botaoAprovar} onClick={() => decidir([detail.id], 'aprovar')}>
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}

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

      <CuradoriaToast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
