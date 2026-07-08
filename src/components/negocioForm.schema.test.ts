import { describe, it, expect } from 'vitest'
import { negocioFormSchema } from './NegocioForm'

const base = {
  nome: 'Loja da Ana',
  segmento: 'Artesanato',
  descricao: 'Peças artesanais',
  autoral: true,
  cnpj: false,
  possuiInstagram: false,
  instagram: '',
  faixaFaturamento: 'Até R$ 1.000',
  imagemUrl: '',
}

describe('negocioFormSchema', () => {
  it('aceita objeto válido completo', () => {
    expect(negocioFormSchema.safeParse(base).success).toBe(true)
  })

  it('rejeita sem nome', () => {
    expect(negocioFormSchema.safeParse({ ...base, nome: '' }).success).toBe(false)
  })

  it('rejeita possuiInstagram=true com instagram vazio', () => {
    expect(negocioFormSchema.safeParse({ ...base, possuiInstagram: true, instagram: '' }).success).toBe(false)
  })

  it('aceita imagemUrl vazia', () => {
    expect(negocioFormSchema.safeParse({ ...base, imagemUrl: '' }).success).toBe(true)
  })

  it('rejeita imagemUrl inválida', () => {
    expect(negocioFormSchema.safeParse({ ...base, imagemUrl: 'not a url' }).success).toBe(false)
  })
})
