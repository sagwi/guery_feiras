import { describe, expect, it } from 'vitest'
import { nichoObrigatorio, validarNichoComId } from './nichoObrigatorio'

const nichos = [
  { id: 'n1', segmento_id: 's1', ativo: true },
  { id: 'n2', segmento_id: 's1', ativo: false },
  { id: 'n3', segmento_id: 's2', ativo: true },
]

describe('nichoObrigatorio', () => {
  it('é false sem segmento ou sem nicho ativo', () => {
    expect(nichoObrigatorio(null, nichos)).toBe(false)
    expect(nichoObrigatorio('s9', nichos)).toBe(false)
    expect(nichoObrigatorio('s1', [{ segmento_id: 's1', ativo: false }])).toBe(false)
  })

  it('é true quando o segmento tem nicho ativo', () => {
    expect(nichoObrigatorio('s1', nichos)).toBe(true)
  })
})

describe('validarNichoComId', () => {
  it('passa quando nicho não é obrigatório', () => {
    expect(validarNichoComId('s9', null, nichos)).toBeNull()
  })

  it('exige nicho do segmento', () => {
    expect(validarNichoComId('s1', null, nichos)).toBe('Selecione um nicho.')
    expect(validarNichoComId('s1', 'n3', nichos)).toBe(
      'Selecione um nicho válido deste segmento.',
    )
    expect(validarNichoComId('s1', 'n1', nichos)).toBeNull()
  })
})
