import { describe, expect, it } from 'vitest'
import { formatarDataBR, formatarMoeda, iniciais, rotuloDiasSemana } from './formatacao'

describe('formatacao', () => {
  it('formatarDataBR', () => {
    expect(formatarDataBR('2026-07-17')).toBe('17/07/2026')
    expect(formatarDataBR('ruim')).toBe('ruim')
  })

  it('formatarMoeda', () => {
    expect(formatarMoeda(200)).toMatch(/R\$\s*200/)
  })

  it('iniciais', () => {
    expect(iniciais('Breno Oliveira')).toBe('BO')
    expect(iniciais('Ana')).toBe('AN')
    expect(iniciais(null)).toBe('?')
    expect(iniciais('  ')).toBe('?')
  })

  it('rotuloDiasSemana', () => {
    expect(rotuloDiasSemana([6])).toBe('Sáb')
    expect(rotuloDiasSemana([0, 6])).toBe('Dom, Sáb')
    expect(rotuloDiasSemana([])).toBe('—')
  })
})
