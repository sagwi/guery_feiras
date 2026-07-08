import { describe, it, expect } from 'vitest'
import { datasDisponiveis } from './datasFeira'

// Terça-feira 2026-01-06 como "hoje" fixo (getDay(): dom=0..sáb=6).
const hoje = new Date(2026, 0, 6)

describe('datasDisponiveis', () => {
  it('só devolve dias da recorrência (sábados)', () => {
    const r = datasDisponiveis({ dias_semana: [6], data_inicio: '2026-01-01', data_fim: '2026-01-31' }, hoje)
    // sábados de jan/2026 a partir de 06: 10, 17, 24, 31
    expect(r).toEqual(['2026-01-10', '2026-01-17', '2026-01-24', '2026-01-31'])
  })

  it('exclui datas passadas (antes de hoje)', () => {
    const r = datasDisponiveis({ dias_semana: [6], data_inicio: '2026-01-01', data_fim: '2026-01-31' }, hoje)
    expect(r).not.toContain('2026-01-03') // sábado antes de hoje
  })

  it('respeita data_fim', () => {
    const r = datasDisponiveis({ dias_semana: [6], data_inicio: '2026-01-01', data_fim: '2026-01-20' }, hoje)
    expect(r).toEqual(['2026-01-10', '2026-01-17'])
  })

  it('array vazio se período todo no passado', () => {
    const r = datasDisponiveis({ dias_semana: [6], data_inicio: '2025-01-01', data_fim: '2025-12-31' }, hoje)
    expect(r).toEqual([])
  })

  it('recorrência multi-dia devolve sáb+dom ordenados', () => {
    const r = datasDisponiveis({ dias_semana: [0, 6], data_inicio: '2026-01-06', data_fim: '2026-01-18' }, hoje)
    // dom=4=? jan 2026: sáb 10, dom 11, sáb 17, dom 18
    expect(r).toEqual(['2026-01-10', '2026-01-11', '2026-01-17', '2026-01-18'])
  })

  it('vazio se dias_semana vazio', () => {
    expect(datasDisponiveis({ dias_semana: [], data_inicio: '2026-01-01', data_fim: '2026-12-31' }, hoje)).toEqual([])
  })
})
