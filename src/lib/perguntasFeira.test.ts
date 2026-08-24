import { describe, expect, it } from 'vitest'
import {
  montarRespostas,
  novaPergunta,
  sanitizarPerguntas,
  validarPerguntas,
} from './perguntasFeira'

describe('perguntasFeira', () => {
  it('sanitiza e limita a 10', () => {
    expect(sanitizarPerguntas(null)).toEqual([])
    expect(sanitizarPerguntas([{ rotulo: '  Olá  ', id: 'a' }])).toEqual([
      { id: 'a', rotulo: 'Olá' },
    ])
    const many = Array.from({ length: 12 }, (_, i) => ({ id: String(i), rotulo: `P${i}` }))
    expect(sanitizarPerguntas(many)).toHaveLength(10)
  })

  it('valida enunciados e teto', () => {
    expect(validarPerguntas([{ id: '1', rotulo: 'Ok' }])).toBeNull()
    expect(validarPerguntas([{ id: '1', rotulo: '  ' }])).toBe(
      'Toda pergunta precisa de um enunciado.',
    )
    const many = Array.from({ length: 11 }, (_, i) => novaPergunta(`P${i}`))
    expect(validarPerguntas(many)).toBe('No máximo 10 perguntas.')
  })

  it('monta respostas exigindo todas', () => {
    const ps = [{ id: 'a', rotulo: 'Voltagem' }]
    expect(montarRespostas(ps, {})).toEqual({ ok: false, error: 'Responda: Voltagem' })
    expect(montarRespostas(ps, { a: '  220V  ' })).toEqual({ ok: true, respostas: { a: '220V' } })
  })
})
