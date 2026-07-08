import { describe, it, expect } from 'vitest'
import { validarCPF } from './cpf'

describe('validarCPF', () => {
  it('aceita CPF válido com máscara', () => expect(validarCPF('529.982.247-25')).toBe(true))
  it('aceita CPF válido sem máscara', () => expect(validarCPF('52998224725')).toBe(true))
  it('rejeita checksum inválido', () => expect(validarCPF('529.982.247-24')).toBe(false))
  it('rejeita dígitos repetidos', () => expect(validarCPF('111.111.111-11')).toBe(false))
  it('rejeita tamanho errado', () => expect(validarCPF('123')).toBe(false))
})
