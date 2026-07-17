/**
 * Lista de presença da feira — dados puros + render PNG via canvas.
 * Usado em Gestão de Feiras → detalhe → aba Inscritos.
 */

export type LinhaListaFeira = {
  negocio: string
  comerciante: string
  status: string
  telefone?: string | null
}

export type ListaFeiraMeta = {
  feira: string
  parque: string
  data: string // já formatada dd/mm/yyyy
  geradoEm: string
}

export function filtrarLinhasExportaveis(
  linhas: LinhaListaFeira[],
  statusPermitidos: string[] = ['aprovado', 'confirmado', 'realizada'],
): LinhaListaFeira[] {
  const ok = new Set(statusPermitidos)
  return linhas.filter((l) => ok.has(l.status))
}

export function ordenarLinhasLista(linhas: LinhaListaFeira[]): LinhaListaFeira[] {
  return [...linhas].sort((a, b) =>
    a.negocio.localeCompare(b.negocio, 'pt-BR', { sensitivity: 'base' }),
  )
}

/** Monta o texto de cada linha (sem canvas) — testável. */
export function textoLinhaLista(linha: LinhaListaFeira, i: number): string {
  const tel = linha.telefone?.trim() ? ` · ${linha.telefone}` : ''
  return `${String(i + 1).padStart(2, '0')}. ${linha.negocio} — ${linha.comerciante}${tel}`
}

const LARGURA = 900
const MARGEM = 40
const LINHA_H = 36
const CABECALHO_H = 140

/** Gera PNG (data URL) da lista. Retorna null se canvas indisponível. */
export function gerarPngListaFeira(
  meta: ListaFeiraMeta,
  linhas: LinhaListaFeira[],
  canvasFactory?: () => HTMLCanvasElement | null,
): string | null {
  const ordenadas = ordenarLinhasLista(linhas)
  const altura = CABECALHO_H + Math.max(ordenadas.length, 1) * LINHA_H + MARGEM * 2

  const factory =
    canvasFactory ??
    (() => (typeof document !== 'undefined' ? document.createElement('canvas') : null))
  const canvas = factory()
  if (!canvas) return null

  canvas.width = LARGURA
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#FAF6EF'
  ctx.fillRect(0, 0, LARGURA, altura)

  ctx.fillStyle = '#241150'
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText(meta.feira, MARGEM, MARGEM + 28)

  ctx.font = '16px sans-serif'
  ctx.fillStyle = '#24115099'
  ctx.fillText(`${meta.parque} · ${meta.data}`, MARGEM, MARGEM + 56)
  ctx.fillText(`Gerado em ${meta.geradoEm} · Guery Feiras`, MARGEM, MARGEM + 80)

  ctx.strokeStyle = '#24115022'
  ctx.beginPath()
  ctx.moveTo(MARGEM, CABECALHO_H - 10)
  ctx.lineTo(LARGURA - MARGEM, CABECALHO_H - 10)
  ctx.stroke()

  if (ordenadas.length === 0) {
    ctx.fillStyle = '#24115099'
    ctx.font = '16px sans-serif'
    ctx.fillText('Nenhum inscrito confirmado nesta data.', MARGEM, CABECALHO_H + 24)
  } else {
    ordenadas.forEach((linha, i) => {
      const y = CABECALHO_H + i * LINHA_H
      // checkbox
      ctx.strokeStyle = '#6D28D9'
      ctx.lineWidth = 2
      ctx.strokeRect(MARGEM, y, 18, 18)

      ctx.fillStyle = '#241150'
      ctx.font = '16px sans-serif'
      ctx.fillText(textoLinhaLista(linha, i), MARGEM + 32, y + 15)
    })
  }

  return canvas.toDataURL('image/png')
}

export function baixarDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
