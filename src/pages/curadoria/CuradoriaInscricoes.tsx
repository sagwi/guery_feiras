import { useCallback, useEffect, useState } from 'react'
import { Calendar, MapPin, Store } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  STATUS_LABELS,
  transicaoCuradoria,
  transicaoCancelamentoOrganizador,
  geraCreditoAoCancelar,
  type StatusInscricao,
} from '../../lib/statusInscricao'
import { formatarDataBR, formatarMoeda, iniciais } from '../../lib/formatacao'
import { curadoriaUi as ui } from '../../components/curadoria/curadoriaUi'

type Inscricao = {
  id: string
  user_id: string
  data_escolhida: string
  status: StatusInscricao
  businesses: { nome: string } | null
  fairs: { nome: string; taxa: number; parks: { nome: string } | null } | null
}

type Perfil = { id: string; nome: string | null; email: string | null }

export default function CuradoriaInscricoes() {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([])
  const [ativas, setAtivas] = useState<Inscricao[]>([])
  const [perfis, setPerfis] = useState<Record<string, Perfil>>({})
  const [loading, setLoading] = useState(true)
  const [reprovandoId, setReprovandoId] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [processandoId, setProcessandoId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const [pendentesRes, ativasRes] = await Promise.all([
      supabase
        .from('applications')
        .select('*, businesses(nome), fairs(nome,taxa,parks(nome))')
        .in('status', ['pendente', 'em_analise'])
        .order('criado_em'),
      supabase
        .from('applications')
        .select('*, businesses(nome), fairs(nome,taxa,parks(nome))')
        .in('status', ['aprovado', 'confirmado'])
        .order('criado_em'),
    ])
    if (pendentesRes.error || ativasRes.error) {
      const e = pendentesRes.error ?? ativasRes.error!
      console.error('CuradoriaInscricoes: falha ao carregar inscrições', e)
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

    const userIds = [...new Set([...lista, ...listaAtivas].map((i) => i.user_id))]
    if (userIds.length > 0) {
      const { data: perfisData, error: perfisError } = await supabase
        .from('profiles')
        .select('id,nome,email')
        .in('id', userIds)
      if (perfisError) {
        console.error('CuradoriaInscricoes: falha ao carregar perfis dos inscritos', perfisError)
      } else {
        const mapa: Record<string, Perfil> = {}
        for (const p of (perfisData ?? []) as Perfil[]) mapa[p.id] = p
        setPerfis(mapa)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function decidir(inscricao: Inscricao, decisao: 'aprovar' | 'reprovar', motivoReprovacao?: string) {
    setErro(null)
    setProcessandoId(inscricao.id)
    const novoStatus = transicaoCuradoria(inscricao.status, decisao)
    const { error } = await supabase.from('applications').update({ status: novoStatus }).eq('id', inscricao.id)
    if (error) {
      setErro('Falha ao atualizar inscrição: ' + error.message)
      setProcessandoId(null)
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
    setInscricoes((prev) => prev.filter((i) => i.id !== inscricao.id))
    setProcessandoId(null)
    setReprovandoId(null)
    setMotivo('')
  }

  async function cancelarPeloOrganizador(inscricao: Inscricao) {
    setErro(null)
    setProcessandoId(inscricao.id)
    const novoStatus = transicaoCancelamentoOrganizador(inscricao.status)
    const { error } = await supabase.from('applications').update({ status: novoStatus }).eq('id', inscricao.id)
    if (error) {
      setErro('Falha ao cancelar data: ' + error.message)
      setProcessandoId(null)
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
    setProcessandoId(null)
  }

  function CardInscricao({
    i,
    acoes,
  }: {
    i: Inscricao
    acoes: 'curar' | 'cancelar'
  }) {
    const statusInfo = STATUS_LABELS[i.status]
    const perfil = perfis[i.user_id]
    const nome = perfil?.nome ?? perfil?.email ?? i.user_id

    return (
      <article className={ui.card}>
        <div className="flex">
          <div className="flex w-[110px] shrink-0 items-end bg-gradient-to-br from-marca-acao to-marca-roxoDark p-3 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.06)_0_8px,transparent_8px_16px),linear-gradient(135deg,#6D28D9,#2A1060)]">
            <Store className="h-6 w-6 text-white/40" />
          </div>
          <div className="min-w-0 flex-1 space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-[17px] font-semibold text-marca-ink">
                  {i.fairs?.nome ?? '—'}
                </h3>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13.5px] text-marca-ink/60">
                  <MapPin className="h-3.5 w-3.5" />
                  {i.fairs?.parks?.nome ?? '—'}
                </p>
              </div>
              <span className={`${ui.badge} ${statusInfo.cor}`}>{statusInfo.label}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[13px] text-marca-ink/70">
              <span className={ui.chip}>{i.businesses?.nome ?? '—'}</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-marca-ink/5 text-[10px] font-bold text-marca-ink">
                  {iniciais(nome)}
                </span>
                {nome}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatarDataBR(i.data_escolhida)}
              </span>
              {i.fairs && (
                <span>
                  Taxa: <strong className="text-marca-ink">{formatarMoeda(i.fairs.taxa)}</strong>
                </span>
              )}
            </div>

            {acoes === 'curar' &&
              (reprovandoId === i.id ? (
                <div className="space-y-2 border-t border-marca-ink/[.06] pt-3">
                  <textarea
                    className={ui.textarea}
                    rows={2}
                    placeholder="Motivo da reprovação"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={ui.botaoReprovar}
                      disabled={!motivo.trim() || processandoId === i.id}
                      onClick={() => decidir(i, 'reprovar', motivo)}
                    >
                      {processandoId === i.id ? 'Reprovando...' : 'Confirmar reprovação'}
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-marca-ink/60 hover:text-marca-ink"
                      onClick={() => {
                        setReprovandoId(null)
                        setMotivo('')
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 border-t border-marca-ink/[.06] pt-3">
                  <button
                    type="button"
                    className={ui.botaoAprovar}
                    disabled={processandoId === i.id}
                    onClick={() => decidir(i, 'aprovar')}
                  >
                    {processandoId === i.id ? 'Aprovando...' : 'Aprovar'}
                  </button>
                  <button
                    type="button"
                    className={ui.botaoReprovar}
                    disabled={processandoId === i.id}
                    onClick={() => setReprovandoId(i.id)}
                  >
                    Reprovar
                  </button>
                </div>
              ))}

            {acoes === 'cancelar' && (
              <div className="border-t border-marca-ink/[.06] pt-3">
                <button
                  type="button"
                  className={ui.botaoReprovar}
                  disabled={processandoId === i.id}
                  onClick={() => cancelarPeloOrganizador(i)}
                >
                  {processandoId === i.id ? 'Cancelando...' : 'Cancelar data'}
                </button>
              </div>
            )}
          </div>
        </div>
      </article>
    )
  }

  if (loading) return <p className="text-sm text-marca-ink/60">Carregando…</p>

  return (
    <div className={ui.page}>
      <div>
        <h2 className={ui.titulo}>Inscrições pendentes</h2>
        <p className={ui.subtitulo}>
          {inscricoes.length === 0
            ? 'Nenhuma inscrição aguardando curadoria.'
            : `${inscricoes.length} inscrição${inscricoes.length === 1 ? '' : 'ões'} na fila.`}
        </p>
      </div>

      {erro && <p className={ui.erro}>{erro}</p>}

      {inscricoes.length === 0 && <p className={ui.empty}>Nenhuma inscrição pendente.</p>}

      <div className="space-y-3">
        {inscricoes.map((i) => (
          <CardInscricao key={i.id} i={i} acoes="curar" />
        ))}
      </div>

      <div className="pt-2">
        <h2 className={ui.titulo}>Datas ativas</h2>
        <p className={ui.subtitulo}>
          Cancelar uma data já paga gera crédito automático na carteira do comerciante.
        </p>
      </div>

      {ativas.length === 0 && <p className={ui.empty}>Nenhuma data ativa.</p>}

      <div className="space-y-3">
        {ativas.map((i) => (
          <CardInscricao key={i.id} i={i} acoes="cancelar" />
        ))}
      </div>
    </div>
  )
}
