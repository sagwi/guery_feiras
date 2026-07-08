import { describe, it, expect } from 'vitest'
import { pagarme, type DadosCartao } from './pagarme'

const cartaoOk: DadosCartao = { numero: '4111 1111 1111 1111', nome: 'Fulano', validade: '12/28', cvv: '123' }

describe('pagarme fake', () => {
  it('PIX nasce pendente e vira pago só após simular', async () => {
    const p = await pagarme.criarPedidoPix({ valor: 200, refId: 'abc12345' })
    expect(p.status).toBe('pendente')
    expect(p.pixCopiaECola).toContain('GUERYFEIRAS-FAKE-abc12345')
    pagarme.simularPagamentoPix(p.id)
    expect((await pagarme.consultarPedido(p.id)).status).toBe('pago')
  })
  it('cartão válido é pago na hora; inválido falha', async () => {
    expect((await pagarme.criarPedidoCartao({ valor: 200, refId: 'x', cartao: cartaoOk })).status).toBe('pago')
    const ruim = await pagarme.criarPedidoCartao({ valor: 200, refId: 'x', cartao: { ...cartaoOk, cvv: 'ab' } })
    expect(ruim.status).toBe('falhou')
  })
  it('consultar pedido inexistente lança', async () => {
    await expect(pagarme.consultarPedido('nao_existe')).rejects.toThrow()
  })
})
