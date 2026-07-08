import { describe, it, expect } from 'vitest'
import { totalRecebido, totalUtilizado, saldo, temCredito, type WalletTx } from './carteira'

const txns: WalletTx[] = [
  { tipo: 'entrada', valor: 200 },
  { tipo: 'entrada', valor: 50 },
  { tipo: 'saida', valor: 175 },
]

describe('carteira', () => {
  it('soma entradas e saídas', () => {
    expect(totalRecebido(txns)).toBe(250)
    expect(totalUtilizado(txns)).toBe(175)
  })
  it('saldo = recebido - utilizado', () => {
    expect(saldo(txns)).toBe(75)
  })
  it('carteira vazia é tudo zero', () => {
    expect(saldo([])).toBe(0)
    expect(totalRecebido([])).toBe(0)
  })
  it('temCredito cobre exatamente o saldo, recusa acima', () => {
    expect(temCredito(txns, 75)).toBe(true)
    expect(temCredito(txns, 75.01)).toBe(false)
  })
})
