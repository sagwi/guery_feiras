import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { STATUS_LABELS, transicaoCuradoria, transicaoCancelamentoOrganizador, geraCreditoAoCancelar, type StatusInscricao } from '../../lib/statusInscricao'

type Inscricao = {
  id: string
  user_id: string
  data_escolhida: string
  status: StatusInscricao
  businesses: { nome: string } | null
  fairs: { nome: string; taxa: number; parks: { nome: string } | null } | null
}

type Perfil = { id: string; nome: string | null; email: string | null }

const card =
  'animate-fadeUp space-y-3 rounded-card border border-marca-ink/[.07] bg-white p-5 shadow-card'
const badge = 'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold'
const botaoAprovar =
  'rounded-xl bg-marca-acao px-4 py-2 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover disabled:opacity-50'
const botaoReprovar =
  'rounded-xl border border-marca-coral/50 px-4 py-2 text-sm font-semibold text-marca-coral transition hover:bg-marca-coral/5 disabled:opacity-50'
const textarea =
  'w-full rounded-xl border border-marca-ink/15 px-3.5 py-2.5 outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10'
const erroClasse = 'text-sm text-marca-coral'

function formatarDataBR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

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

  useEffect(() => { carregar() }, [carregar])

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

    // Crédito só se a data estava paga (confirmada): valor exato do pagamento confirmado.
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

  if (loading) return <p className="text-sm text-marca-ink/60">Carregando…</p>

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-marca-ink">Inscrições pendentes</h2>

      {erro && <p className={erroClasse}>{erro}</p>}

      {inscricoes.length === 0 && (
        <p className="py-6 text-center text-sm text-marca-ink/60">Nenhuma inscrição pendente.</p>
      )}

      <div className="space-y-3">
        {inscricoes.map((i) => {
          const statusInfo = STATUS_LABELS[i.status]
          const perfil = perfis[i.user_id]
          return (
            <div key={i.id} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display font-semibold text-marca-ink">{i.fairs?.nome ?? '—'}</p>
                <span className={`${badge} ${statusInfo.cor}`}>{statusInfo.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-marca-ink md:grid-cols-4">
                <div><span className="text-marca-ink/50">Parque:</span> {i.fairs?.parks?.nome ?? '—'}</div>
                <div><span className="text-marca-ink/50">Negócio:</span> {i.businesses?.nome ?? '—'}</div>
                <div><span className="text-marca-ink/50">Inscrito:</span> {perfil?.nome ?? perfil?.email ?? i.user_id}</div>
                <div><span className="text-marca-ink/50">Data:</span> {formatarDataBR(i.data_escolhida)}</div>
                {i.fairs && <div><span className="text-marca-ink/50">Taxa:</span> {formatarMoeda(i.fairs.taxa)}</div>}
              </div>

              {reprovandoId === i.id ? (
                <div className="space-y-2">
                  <textarea
                    className={textarea}
                    rows={2}
                    placeholder="Motivo da reprovação"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={botaoReprovar}
                      disabled={!motivo.trim() || processandoId === i.id}
                      onClick={() => decidir(i, 'reprovar', motivo)}
                    >
                      {processandoId === i.id ? 'Reprovando...' : 'Confirmar reprovação'}
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-marca-ink/60 hover:text-marca-ink"
                      onClick={() => { setReprovandoId(null); setMotivo('') }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={botaoAprovar}
                    disabled={processandoId === i.id}
                    onClick={() => decidir(i, 'aprovar')}
                  >
                    {processandoId === i.id ? 'Aprovando...' : 'Aprovar'}
                  </button>
                  <button
                    type="button"
                    className={botaoReprovar}
                    disabled={processandoId === i.id}
                    onClick={() => setReprovandoId(i.id)}
                  >
                    Reprovar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <h2 className="pt-4 font-display text-xl font-bold text-marca-ink">Datas ativas</h2>
      <p className="text-sm text-marca-ink/60">Cancelar uma data já paga gera crédito automático na carteira do comerciante.</p>

      {ativas.length === 0 && (
        <p className="py-6 text-center text-sm text-marca-ink/60">Nenhuma data ativa.</p>
      )}

      <div className="space-y-3">
        {ativas.map((i) => {
          const statusInfo = STATUS_LABELS[i.status]
          const perfil = perfis[i.user_id]
          return (
            <div key={i.id} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display font-semibold text-marca-ink">{i.fairs?.nome ?? '—'}</p>
                <span className={`${badge} ${statusInfo.cor}`}>{statusInfo.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-marca-ink md:grid-cols-4">
                <div><span className="text-marca-ink/50">Parque:</span> {i.fairs?.parks?.nome ?? '—'}</div>
                <div><span className="text-marca-ink/50">Inscrito:</span> {perfil?.nome ?? perfil?.email ?? i.user_id}</div>
                <div><span className="text-marca-ink/50">Data:</span> {formatarDataBR(i.data_escolhida)}</div>
                {i.fairs && <div><span className="text-marca-ink/50">Taxa:</span> {formatarMoeda(i.fairs.taxa)}</div>}
              </div>
              <button
                type="button"
                className={botaoReprovar}
                disabled={processandoId === i.id}
                onClick={() => cancelarPeloOrganizador(i)}
              >
                {processandoId === i.id ? 'Cancelando...' : 'Cancelar data'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
