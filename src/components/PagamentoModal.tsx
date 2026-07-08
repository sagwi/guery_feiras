import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { transicaoPagamento, type StatusInscricao } from '../lib/statusInscricao'
import { saldo, type WalletTx } from '../lib/carteira'

export type AplicacaoPagavel = {
  id: string
  status: StatusInscricao
  fairs: { nome: string; taxa: number } | null
}

type Metodo = 'pix' | 'cartao' | 'credito'

const metodoBtn = (ativo: boolean) =>
  `flex-1 rounded-lg border py-2 text-sm font-semibold transition ${
    ativo ? 'border-marca-roxo bg-marca-roxo/5 text-marca-roxo' : 'border-marca-roxo/20 text-marca-roxo/60'
  }`

function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ponytail: stub — Pagar.me real em fatia futura. QR e copia-e-cola são placeholders visuais.
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
  const [metodo, setMetodo] = useState<Metodo>('pix')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [saldoDisponivel, setSaldoDisponivel] = useState(0)

  const taxa = application.fairs?.taxa ?? 0
  const temCreditoSuficiente = saldoDisponivel >= taxa
  const copiaECola = `00020126580014BR.GOV.BCB.PIX0136GUERYFEIRAS-FAKE-${application.id.slice(0, 8)}5204000053039865802BR6009SAO PAULO`

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('wallet_transactions')
      .select('tipo,valor')
      .eq('user_id', user.id)
      .then(({ data }) => setSaldoDisponivel(saldo((data ?? []) as WalletTx[])))
  }, [user?.id])

  async function simularPagamento() {
    if (!user?.id) return
    setErro(null)
    setProcessando(true)
    try {
      const novoStatus = transicaoPagamento(application.status)

      const { error: pagamentoError } = await supabase.from('payments').insert({
        user_id: user.id,
        application_id: application.id,
        valor: taxa,
        metodo,
        status: 'confirmado',
        pago_em: new Date().toISOString(),
      })
      if (pagamentoError) throw pagamentoError

      // Pagamento com crédito debita a carteira (saída).
      if (metodo === 'credito') {
        const { error: saidaError } = await supabase.from('wallet_transactions').insert({
          user_id: user.id,
          tipo: 'saida',
          valor: taxa,
          referencia: `Uso de crédito: ${application.fairs?.nome ?? 'feira'}`,
          application_id: application.id,
        })
        if (saidaError) throw saidaError
      }

      const { error: aplicacaoError } = await supabase
        .from('applications')
        .update({ status: novoStatus })
        .eq('id', application.id)
      if (aplicacaoError) throw aplicacaoError

      // ponytail: sem notif de pagamento (policy admin-only) — comerciante vê status confirmado direto.
      onPago()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao processar pagamento')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-bold text-marca-roxo">
              Pagar {application.fairs?.nome ?? ''}
            </Dialog.Title>
            <Dialog.Close className="text-marca-roxo/60 hover:text-marca-roxo">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <p className="mb-4 text-center text-2xl font-bold text-marca-roxo">{formatarMoeda(taxa)}</p>

          <div className="mb-4 flex gap-2">
            <button type="button" className={metodoBtn(metodo === 'pix')} onClick={() => setMetodo('pix')}>
              PIX
            </button>
            <button type="button" className={metodoBtn(metodo === 'cartao')} onClick={() => setMetodo('cartao')}>
              Cartão
            </button>
            {temCreditoSuficiente && (
              <button type="button" className={metodoBtn(metodo === 'credito')} onClick={() => setMetodo('credito')}>
                Crédito
              </button>
            )}
          </div>

          {metodo === 'credito' && (
            <div className="mb-4 rounded-lg border border-marca-roxo/20 bg-marca-roxo/5 p-3 text-sm text-marca-roxo/80">
              Usar meu crédito disponível ({formatarMoeda(saldoDisponivel)}). O valor será abatido da sua carteira, sem cobrança PIX/cartão.
            </div>
          )}

          {metodo === 'pix' && (
            <div className="mb-4 space-y-3">
              {/* QR fake — placeholder visual, não é um QR code real */}
              <svg viewBox="0 0 100 100" className="mx-auto h-40 w-40 rounded-md border border-marca-roxo/10">
                <rect width="100" height="100" fill="white" />
                {Array.from({ length: 8 }).map((_, row) =>
                  Array.from({ length: 8 }).map((_, col) =>
                    (row + col) % 2 === 0 ? (
                      <rect key={`${row}-${col}`} x={col * 12.5} y={row * 12.5} width="12.5" height="12.5" fill="#2E1065" />
                    ) : null,
                  ),
                )}
              </svg>
              <div>
                <label className="mb-1 block text-xs font-semibold text-marca-roxo/70">Pix copia e cola</label>
                <input
                  readOnly
                  value={copiaECola}
                  className="w-full truncate rounded-lg border border-marca-roxo/20 bg-marca-roxo/5 px-3 py-2 text-xs text-marca-roxo/70"
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </div>
          )}

          {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}

          <button
            type="button"
            disabled={processando}
            onClick={simularPagamento}
            className="w-full rounded-lg bg-marca-amarelo px-4 py-2 text-sm font-semibold text-marca-roxo hover:brightness-95 transition disabled:opacity-50"
          >
            {processando ? 'Processando...' : metodo === 'credito' ? 'Pagar com crédito' : 'Simular pagamento (dev)'}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
