// Gateway de pagamento. HOJE: implementação FAKE que mimetiza a forma da API Pagar.me v5
// (pedidos/cobranças: PIX assíncrono pendente→pago, cartão síncrono). O resto do app fala só
// com a interface `Pagarme` — trocar o fake pelo cliente real é mudar UMA linha (ver fim do arquivo).
//
// ponytail: interface COM duas implementações previstas (fake agora, real depois — pedido do user),
// então o seam se justifica. Não é abstração especulativa.

export type MetodoPagarme = 'pix' | 'cartao'
export type StatusPedido = 'pendente' | 'pago' | 'falhou'

export type Pedido = {
  id: string
  status: StatusPedido
  metodo: MetodoPagarme
  valor: number
  // Só PIX:
  pixCopiaECola?: string
  pixExpiraEm?: string // ISO — QR expira em 1h (§8)
}

export type DadosCartao = { numero: string; nome: string; validade: string; cvv: string }

export interface Pagarme {
  criarPedidoPix(input: { valor: number; refId: string }): Promise<Pedido>
  criarPedidoCartao(input: { valor: number; refId: string; cartao: DadosCartao }): Promise<Pedido>
  consultarPedido(id: string): Promise<Pedido>
  // dev-only: simula o pagador concluindo o PIX no app bancário. No real isso vem do webhook.
  simularPagamentoPix(id: string): void
}

// --- Implementação FAKE ---------------------------------------------------
// Estado em memória (some no reload — aceitável p/ stub; o real é stateless + webhook).
function criarPagarmeFake(): Pagarme {
  const pedidos = new Map<string, Pedido>()
  let seq = 0
  const novoId = () => `fake_ord_${Date.now()}_${seq++}`

  const cartaoValido = (c: DadosCartao) =>
    c.numero.replace(/\s/g, '').length >= 13 && c.nome.trim().length > 0 &&
    /^\d{2}\/\d{2}$/.test(c.validade) && /^\d{3,4}$/.test(c.cvv)

  return {
    async criarPedidoPix({ valor, refId }) {
      const id = novoId()
      const pedido: Pedido = {
        id,
        status: 'pendente',
        metodo: 'pix',
        valor,
        pixCopiaECola: `00020126580014BR.GOV.BCB.PIX0136GUERYFEIRAS-FAKE-${refId.slice(0, 8)}5204000053039865802BR6009SAO PAULO`,
        pixExpiraEm: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }
      pedidos.set(id, pedido)
      return pedido
    },
    async criarPedidoCartao({ valor, cartao }) {
      // Cartão é síncrono: no real, tokeniza no client e cobra na hora. Fake aprova se os dados batem.
      const id = novoId()
      const pedido: Pedido = {
        id,
        status: cartaoValido(cartao) ? 'pago' : 'falhou',
        metodo: 'cartao',
        valor,
      }
      pedidos.set(id, pedido)
      return pedido
    },
    async consultarPedido(id) {
      const p = pedidos.get(id)
      if (!p) throw new Error(`Pedido ${id} não encontrado`)
      return p
    },
    simularPagamentoPix(id) {
      const p = pedidos.get(id)
      if (p && p.status === 'pendente') pedidos.set(id, { ...p, status: 'pago' })
    },
  }
}

// Troca-me pelo cliente real: `export const pagarme = criarPagarmeReal()` — que chama uma edge
// function Supabase (secret key server-side) p/ criar o pedido e recebe confirmação por webhook.
// No real, o webhook (não o client) escreve payment + application confirmado via RPC transacional;
// o client só faz polling de consultarPedido até 'pago' e recarrega.
export const pagarme: Pagarme = criarPagarmeFake()
