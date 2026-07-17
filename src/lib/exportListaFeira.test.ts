import { describe, expect, it } from 'vitest'
import {
  filtrarLinhasExportaveis,
  ordenarLinhasLista,
  textoLinhaLista,
  type LinhaListaFeira,
} from './exportListaFeira'

const base: LinhaListaFeira[] = [
  { negocio: 'Zeta Café', comerciante: 'Ana', status: 'confirmado', telefone: '81 99999' },
  { negocio: 'Alpha Burguer', comerciante: 'Breno', status: 'pendente' },
  { negocio: 'Beta Doces', comerciante: 'Carla', status: 'aprovado' },
]

describe('exportListaFeira', () => {
  it('filtra só status exportáveis (aprovado/confirmado/realizada)', () => {
    const out = filtrarLinhasExportaveis(base)
    expect(out.map((l) => l.negocio)).toEqual(['Zeta Café', 'Beta Doces'])
  })

  it('ordena por nome do negócio', () => {
    const out = ordenarLinhasLista(base)
    expect(out.map((l) => l.negocio)).toEqual(['Alpha Burguer', 'Beta Doces', 'Zeta Café'])
  })

  it('monta texto da linha com telefone opcional', () => {
    expect(textoLinhaLista(base[0], 0)).toBe('01. Zeta Café — Ana · 81 99999')
    expect(textoLinhaLista(base[1], 1)).toBe('02. Alpha Burguer — Breno')
  })
})
