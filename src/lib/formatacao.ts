/** Formatação compartilhada (pt-BR) — curadoria e painel. */

export function formatarDataBR(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

export function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function iniciais(nome: string | null | undefined, fallback = '?'): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return fallback
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

export function rotuloDiasSemana(dias: number[]): string {
  if (!dias.length) return '—'
  return [...dias].sort((a, b) => a - b).map((d) => DIAS[d] ?? String(d)).join(', ')
}
