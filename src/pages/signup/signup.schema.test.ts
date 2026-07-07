import { describe, it, expect } from 'vitest'
import { pessoaisSchema } from './StepPessoais'

const base = { nome:'Ana', cpf:'529.982.247-25', nascimento:'2000-01-01', telefone:'81999999999', email:'a@b.com', senha:'123456' }
describe('pessoaisSchema', () => {
  it('aceita válido', () => expect(pessoaisSchema.safeParse(base).success).toBe(true))
  it('rejeita CPF inválido', () => expect(pessoaisSchema.safeParse({...base, cpf:'111.111.111-11'}).success).toBe(false))
  it('rejeita menor de 18', () => {
    const hoje = new Date(); const d = `${hoje.getFullYear()-10}-01-01`
    expect(pessoaisSchema.safeParse({...base, nascimento:d}).success).toBe(false)
  })
})
