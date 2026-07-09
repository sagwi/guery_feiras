import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { type StatusInscricao } from '../lib/statusInscricao'
import { saldo, type WalletTx } from '../lib/carteira'

export type AplicacaoPagavel = {
  id: string
  status: StatusInscricao
  fairs: { nome: string; taxa: number } | null
}

type Metodo = 'gateway' | 'credito'

const metodoBtn = (ativo: boolean) =>
  `flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
    ativo
      ? 'border-marca-acao bg-marca-acao/5 text-marca-acao'
      : 'border-marca-ink/15 text-marca-ink/60 hover:border-marca-ink/30'
  }`

function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PagamentoModal({
  application,
  onPago,
  onClose,
}: {
  application: AplicacaoPagavel
  onPago: () => void
  onClose: () => void
}) {
  const { user } = useAuth()
  const [metodo, setMetodo] = useState<Metodo>('gateway')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [saldoDisponivel, setSaldoDisponivel] = useState(0)

  const taxa = application.fairs?.taxa ?? 0
  const temCreditoSuficiente = saldoDisponivel >= taxa

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('wallet_transactions')
      .select('tipo,valor')
      .eq('user_id', user.id)
      .then(({ data }) => setSaldoDisponivel(saldo((data ?? []) as WalletTx[])))
  }, [user?.id])

  // Cartão/PIX: Stripe Checkout hospedado — cria a sessão e redireciona.
  async function pagarComGateway() {
    setErro(null)
    setProcessando(true)
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { application_id: application.id, origin: window.location.origin },
      })
      if (error) throw error
      window.location.href = data.url
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao iniciar pagamento')
      setProcessando(false)
    }
  }

  // Crédito: fora do gateway, debita a carteira interna direto via RPC transacional.
  async function pagarComCredito() {
    if (!user?.id) return
    setErro(null)
    setProcessando(true)
    try {
      const { error } = await supabase.rpc('confirmar_pagamento', {
        p_application_id: application.id,
        p_metodo: 'credito',
        p_valor: taxa,
      })
      if (error) throw error
      onPago()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao processar pagamento')
      setProcessando(false)
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-marca-roxoDeep/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-card bg-white shadow-lift">
          <div className="relative bg-gradient-to-br from-marca-roxoDark via-marca-acao to-marca-acaoHover px-6 pb-5 pt-5 text-white">
            <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_90%_10%,rgba(245,180,0,.35),transparent_50%)]" />
            <div className="relative flex items-start justify-between">
              <Dialog.Title className="font-display text-base font-semibold">
                Pagar {application.fairs?.nome ?? ''}
              </Dialog.Title>
              <Dialog.Close className="text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <p className="relative mt-3 font-display text-3xl font-bold">{formatarMoeda(taxa)}</p>
          </div>

          <div className="p-6">
            <div className="mb-4 flex gap-2">
              <button type="button" className={metodoBtn(metodo === 'gateway')} onClick={() => setMetodo('gateway')}>
                Cartão / PIX
              </button>
              {temCreditoSuficiente && (
                <button type="button" className={metodoBtn(metodo === 'credito')} onClick={() => setMetodo('credito')}>
                  Crédito
                </button>
              )}
            </div>

            {metodo === 'gateway' && (
              <p className="mb-4 text-center text-xs text-marca-ink/50">
                Você será redirecionado pro checkout seguro da Stripe.
              </p>
            )}

            {metodo === 'credito' && (
              <div className="mb-4 rounded-xl border border-marca-acao/15 bg-marca-acao/5 p-3 text-sm text-marca-ink/80">
                Usar meu crédito disponível ({formatarMoeda(saldoDisponivel)}). O valor será abatido da sua carteira, sem cobrança no cartão.
              </div>
            )}

            {erro && <p className="mb-3 text-sm text-marca-coral">{erro}</p>}

            <button
              type="button"
              disabled={processando}
              onClick={metodo === 'gateway' ? pagarComGateway : pagarComCredito}
              className="w-full rounded-xl bg-marca-amarelo px-4 py-3 text-sm font-bold text-marca-ink shadow-amber transition hover:-translate-y-0.5 hover:brightness-[1.04] disabled:opacity-50"
            >
              {processando ? 'Processando...' : metodo === 'gateway' ? 'Ir para pagamento' : 'Pagar com crédito'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
