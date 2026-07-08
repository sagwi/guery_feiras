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

  if (loading) return <p className="text-sm text-marca-roxo/60">Carregando…</p>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-marca-roxo">Minha Carteira</h1>
        <p className="text-sm text-marca-roxo/70">Créditos não expiram e valem para qualquer feira da plataforma.</p>
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Saldo atual" valor={formatarMoeda(saldo(txns))} icon={Wallet} />
        <KpiCard label="Total recebido" valor={formatarMoeda(totalRecebido(txns))} icon={ArrowDownCircle} />
        <KpiCard label="Total utilizado" valor={formatarMoeda(totalUtilizado(txns))} icon={ArrowUpCircle} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-marca-roxo">Extrato</h2>
        {txns.length === 0 && (
          <p className="py-6 text-center text-sm text-marca-roxo/60">Nenhuma movimentação ainda.</p>
        )}
        <div className="space-y-2">
          {txns.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-marca-roxo/10 bg-white p-4">
              <div>
                <p className="font-semibold text-marca-roxo">{t.referencia}</p>
                <p className="text-sm text-marca-roxo/60">{formatarDataHoraBR(t.criado_em)}</p>
              </div>
              <span className={`shrink-0 font-semibold ${t.tipo === 'entrada' ? 'text-green-700' : 'text-red-600'}`}>
                {t.tipo === 'entrada' ? '+' : '−'} {formatarMoeda(Number(t.valor))}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
