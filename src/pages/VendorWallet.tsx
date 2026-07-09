import { useEffect, useState } from 'react'
import { Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import KpiCard from '../components/KpiCard'
import { saldo, totalRecebido, totalUtilizado, type WalletTx } from '../lib/carteira'

type Extrato = WalletTx & { id: string; referencia: string; criado_em: string }

function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarDataHoraBR(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function VendorWallet() {
  const { user } = useAuth()
  const [txns, setTxns] = useState<Extrato[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('id,tipo,valor,referencia,criado_em')
        .eq('user_id', user.id)
        .order('criado_em', { ascending: false })
      if (error) {
        console.error('VendorWallet: falha ao carregar extrato', error)
        setErro('Falha ao carregar carteira: ' + error.message)
      } else {
        setTxns((data ?? []) as Extrato[])
      }
      setLoading(false)
    })()
  }, [user?.id])

  if (loading) return <p className="text-sm text-marca-ink/60">Carregando…</p>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-marca-ink">Minha Carteira</h1>
        <p className="mt-0.5 text-sm text-marca-ink/60">
          Créditos não expiram e valem para qualquer feira da plataforma.
        </p>
      </div>

      {erro && <p className="text-sm text-marca-coral">{erro}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Saldo atual" valor={formatarMoeda(saldo(txns))} icon={Wallet} tone="verde" />
        <KpiCard label="Total recebido" valor={formatarMoeda(totalRecebido(txns))} icon={ArrowDownCircle} tone="azul" />
        <KpiCard label="Total utilizado" valor={formatarMoeda(totalUtilizado(txns))} icon={ArrowUpCircle} tone="coral" />
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-marca-ink">Extrato</h2>
        {txns.length === 0 && (
          <p className="py-6 text-center text-sm text-marca-ink/60">Nenhuma movimentação ainda.</p>
        )}
        <div className="space-y-2">
          {txns.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-card border border-marca-ink/[.07] bg-white p-4 shadow-card transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-[11px] ${
                    t.tipo === 'entrada' ? 'bg-[#D6F5E9] text-[#0B7A54]' : 'bg-[#FFE6DE] text-[#E1502A]'
                  }`}
                >
                  {t.tipo === 'entrada' ? (
                    <ArrowDownCircle className="h-5 w-5" strokeWidth={1.9} />
                  ) : (
                    <ArrowUpCircle className="h-5 w-5" strokeWidth={1.9} />
                  )}
                </span>
                <div>
                  <p className="font-semibold text-marca-ink">{t.referencia}</p>
                  <p className="text-sm text-marca-ink/50">{formatarDataHoraBR(t.criado_em)}</p>
                </div>
              </div>
              <span
                className={`shrink-0 font-display font-bold ${
                  t.tipo === 'entrada' ? 'text-[#0B7A54]' : 'text-marca-coral'
                }`}
              >
                {t.tipo === 'entrada' ? '+' : '−'} {formatarMoeda(Number(t.valor))}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
