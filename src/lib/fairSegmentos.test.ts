import { describe, expect, it } from 'vitest'
import { feiraAceitaSegmento } from './fairSegmentos'

describe('feiraAceitaSegmento', () => {
  it('aceita todos quando a feira não restringe', () => {
    expect(feiraAceitaSegmento([], null)).toBe(true)
    expect(feiraAceitaSegmento([], 's1')).toBe(true)
  })

  it('exige o segmento do negócio quando há restrição', () => {
    expect(feiraAceitaSegmento(['s1', 's2'], 's1')).toBe(true)
    expect(feiraAceitaSegmento(['s1'], 's9')).toBe(false)
    expect(feiraAceitaSegmento(['s1'], null)).toBe(false)
  })
})
