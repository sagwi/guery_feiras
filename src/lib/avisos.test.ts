import { describe, expect, it } from 'vitest'
import { sortAvisos, validateAvisoPayload } from './avisos'

describe('sortAvisos', () => {
  it('prioriza fixos e depois data desc', () => {
    const sorted = sortAvisos([
      { fixo: false, criado_em: '2026-08-02T10:00:00Z', id: 'a' },
      { fixo: true, criado_em: '2026-08-01T10:00:00Z', id: 'b' },
      { fixo: false, criado_em: '2026-08-03T10:00:00Z', id: 'c' },
      { fixo: true, criado_em: '2026-08-04T10:00:00Z', id: 'd' },
    ])
    expect(sorted.map((x) => x.id)).toEqual(['d', 'b', 'c', 'a'])
  })
})

describe('validateAvisoPayload', () => {
  it('exige titulo e corpo', () => {
    expect(validateAvisoPayload({ titulo: '  ', corpo: 'oi' })).toEqual({
      error: 'Título é obrigatório.',
    })
    expect(validateAvisoPayload({ titulo: 'Oi', corpo: '  ' })).toEqual({
      error: 'Texto do aviso é obrigatório.',
    })
  })

  it('rejeita data URL', () => {
    expect(
      validateAvisoPayload({
        titulo: 'Aviso',
        corpo: 'Texto',
        imagem_url: 'data:image/png;base64,xxx',
      }),
    ).toEqual({ error: 'Imagem deve ser URL do Storage, não base64.' })
  })

  it('normaliza payload válido', () => {
    expect(
      validateAvisoPayload({
        titulo: '  Feira  ',
        corpo: ' Domingo ',
        imagem_url: ' https://cdn.example/a.png ',
        fixo: true,
      }),
    ).toEqual({
      titulo: 'Feira',
      corpo: 'Domingo',
      imagem_url: 'https://cdn.example/a.png',
      fixo: true,
    })
  })
})
