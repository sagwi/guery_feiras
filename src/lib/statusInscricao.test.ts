import { describe, it, expect } from 'vitest'
import { podeCurar, transicaoCuradoria, podePagar, transicaoPagamento, STATUS_LABELS } from './statusInscricao'

describe('podeCurar', () => {
  it('true p/ pendente e em_analise', () => {
    expect(podeCurar('pendente')).toBe(true)
    expect(podeCurar('em_analise')).toBe(true)
  })
  it('false p/ status terminais', () => {
    expect(podeCurar('aprovado')).toBe(false)
    expect(podeCurar('realizada')).toBe(false)
    expect(podeCurar('reprovado')).toBe(false)
  })
})

describe('transicaoCuradoria', () => {
  it('aprovar -> aprovado', () => expect(transicaoCuradoria('pendente', 'aprovar')).toBe('aprovado'))
  it('reprovar -> reprovado', () => expect(transicaoCuradoria('em_analise', 'reprovar')).toBe('reprovado'))
  it('lança em status não-curável', () => expect(() => transicaoCuradoria('realizada', 'aprovar')).toThrow())
})

describe('podePagar / transicaoPagamento', () => {
  it('podePagar só p/ aprovado', () => {
    expect(podePagar('aprovado')).toBe(true)
    expect(podePagar('pendente')).toBe(false)
    expect(podePagar('confirmado')).toBe(false)
  })
  it('aprovado -> confirmado', () => expect(transicaoPagamento('aprovado')).toBe('confirmado'))
  it('lança se não pagável', () => expect(() => transicaoPagamento('pendente')).toThrow())
})

describe('STATUS_LABELS', () => {
  it('cobre todos os 9 status', () => expect(Object.keys(STATUS_LABELS)).toHaveLength(9))
})
