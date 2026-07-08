import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import PagamentoModal from '../components/PagamentoModal'
import type { AplicacaoPagavel } from '../components/PagamentoModal'

type InscricaoPagavel = AplicacaoPagavel & {
  data_escolhida: string
  businesses: { nome: string } | null
  fairs: { nome: string; taxa: number; parks: { nome: string } | null } | null
}

type PagamentoConfirmado = {
  id: string
  valor: number
  metodo: string
  pago_em: string
  applications: { fairs: { nome: string; parks: { nome: string } | null } | null } | null
}

const card = 'rounded-lg border border-marca-roxo/10 bg-white p-4 space-y-2'
const badgeConfirmado = 'shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700'

function formatarDataBR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatarDataHoraBR(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const metodoLabel: Record<string, string> = { pix: 'PIX', cartao: 'Cartão', credito: 'Crédito' }

export default function VendorPayments() {
  const { user } = useAuth()
  const [pendentes, setPendentes] = useState<InscricaoPagavel[]>([])
  const [confirmados, setConfirmados] = useState<PagamentoConfirmado[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [pagando, setPagando] = useState<InscricaoPagavel | null>(null)

  const carregar = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setErro(null)

    const [pendentesRes, confirmadosRes] = await Promise.all([
      supabase
        .from('applications')
        .select('*, businesses(nome), fairs(nome,taxa,parks(nome))')
        .eq('user_id', user.id)
        .eq('status', 'aprovado'),
      supabase
        .from('payments')
        .select('*, applications(fair_id, fairs(nome,parks(nome)))')
        .eq('user_id', user.id)
        .eq('status', 'confirmado')
        .order('pago_em', { ascending: false }),
    ])

    if (pendentesRes.error) {
      console.error('VendorPayments: falha ao carregar pendentes', pendentesRes.error)
      setErro('Falha ao carregar pagamentos pendentes: ' + pendentesRes.error.message)
    } else {
      setPendentes((pendentesRes.data ?? []) as InscricaoPagavel[])
    }

    if (confirmadosRes.error) {
      console.error('VendorPayments: falha ao carregar confirmados', confirmadosRes.error)
      setErro((prev) => prev ?? 'Falha ao carregar pagamentos confirmados: ' + confirmadosRes.error!.message)
    } else {
      setConfirmados((confirmadosRes.data ?? []) as PagamentoConfirmado[])
    }

    setLoading(false)
  }, [user?.id])

  useEffect(() => { carregar() }, [carregar])

  const onPago = () => { setPagando(null); carregar() }

  if (loading) return <p className="text-sm text-marca-roxo/60">Carregando…</p>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-marca-roxo">Pagamentos</h1>
        <p className="text-sm text-marca-roxo/70">Pague suas inscrições aprovadas e acompanhe pagamentos confirmados.</p>
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-marca-roxo">Pagamentos Pendentes</h2>
        {pendentes.length === 0 && (
          <p className="py-6 text-center text-sm text-marca-roxo/60">Nenhum pagamento pendente.</p>
        )}
        <div className="space-y-3">
          {pendentes.map((i) => (
            <div key={i.id} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-marca-roxo">{i.fairs?.nome ?? '—'}</p>
                {i.fairs && <span className="text-sm font-semibold text-marca-roxo">{formatarMoeda(i.fairs.taxa)}</span>}
              </div>
              <p className="text-sm text-marca-roxo/70">
                {i.fairs?.parks?.nome ?? '—'} · Data: {formatarDataBR(i.data_escolhida)}
              </p>
              <button
                type="button"
                onClick={() => setPagando(i)}
                className="rounded-lg bg-marca-roxo px-4 py-2 text-sm font-semibold text-white hover:bg-marca-roxoClaro transition"
              >
                Pagar
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-marca-roxo">Pagamentos Confirmados</h2>
        {confirmados.length === 0 && (
          <p className="py-6 text-center text-sm text-marca-roxo/60">Nenhum pagamento confirmado.</p>
        )}
        <div className="space-y-3">
          {confirmados.map((p) => (
            <div key={p.id} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-marca-roxo">{p.applications?.fairs?.nome ?? '—'}</p>
                <span className={badgeConfirmado}>Confirmado</span>
              </div>
              <p className="text-sm text-marca-roxo/70">
                {p.applications?.fairs?.parks?.nome ?? '—'} · {formatarMoeda(p.valor)}
              </p>
              <p className="text-sm text-marca-roxo/70">
                Pago em {formatarDataHoraBR(p.pago_em)} · {metodoLabel[p.metodo] ?? p.metodo}
              </p>
            </div>
          ))}
        </div>
      </section>

      {pagando && (
        <PagamentoModal application={pagando} onPago={onPago} onClose={() => setPagando(null)} />
      )}
    </div>
  )
}
