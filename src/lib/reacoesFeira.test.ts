import { describe, expect, it } from 'vitest'
import { buildReacaoInsert, podeAvaliar } from './reacoesFeira'

describe('podeAvaliar', () => {
  it('bloqueia se já avaliou ou status inválido ou data futura', () => {
    expect(
      podeAvaliar(
        { status: 'confirmado', data_escolhida: '2026-08-01', jaAvaliou: true },
        '2026-08-10',
      ),
    ).toBe(false)
    expect(
      podeAvaliar(
        { status: 'aprovado', data_escolhida: '2026-08-01', jaAvaliou: false },
        '2026-08-10',
      ),
    ).toBe(false)
    expect(
      podeAvaliar(
        { status: 'confirmado', data_escolhida: '2026-08-20', jaAvaliou: false },
        '2026-08-10',
      ),
    ).toBe(false)
  })

  it('permite após o dia da feira com status confirmado/realizada', () => {
    expect(
      podeAvaliar(
        { status: 'confirmado', data_escolhida: '2026-08-01', jaAvaliou: false },
        '2026-08-10',
      ),
    ).toBe(true)
    expect(
      podeAvaliar(
        { status: 'realizada', data_escolhida: '2026-08-10', jaAvaliou: false },
        '2026-08-10',
      ),
    ).toBe(true)
  })
})

describe('buildReacaoInsert', () => {
  const base = {
    applicationId: 'app-1',
    userId: 'user-1',
    fairId: 'fair-1',
    notaFeira: 8,
    notaIndicacao: 9,
    faixaFaturamento: 'R$ 1.001 a R$ 3.000',
  }

  it('monta payload válido', () => {
    expect(buildReacaoInsert({ ...base, comentario: '  ótimo  ' })).toEqual({
      application_id: 'app-1',
      user_id: 'user-1',
      fair_id: 'fair-1',
      nota_feira: 8,
      comentario: 'ótimo',
      nota_indicacao: 9,
      faixa_faturamento: 'R$ 1.001 a R$ 3.000',
    })
  })

  it('valida notas e faixa', () => {
    expect(buildReacaoInsert({ ...base, notaFeira: 11 })).toEqual({
      error: 'Nota da feira deve ser de 0 a 10.',
    })
    expect(buildReacaoInsert({ ...base, faixaFaturamento: 'xxx' })).toEqual({
      error: 'Selecione a faixa de faturamento no evento.',
    })
  })
})
