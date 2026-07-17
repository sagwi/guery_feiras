/**
 * Lista de presença / export PNG — dados puros + render canvas (folha do handoff).
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
  data: string
  horario?: string | null
  geradoEm: string
  inscritos: number
  vagasRestantes: number
  confirmados: number
  pendentes: number
}

export function filtrarLinhasExportaveis(
  linhas: LinhaListaFeira[],
  statusPermitidos: string[] = ['aprovado', 'confirmado', 'realizada', 'pendente', 'em_analise'],
): LinhaListaFeira[] {
  const ok = new Set(statusPermitidos)
  return linhas.filter((l) => ok.has(l.status))
}

export function ordenarLinhasLista(linhas: LinhaListaFeira[]): LinhaListaFeira[] {
  return [...linhas].sort((a, b) =>
    a.negocio.localeCompare(b.negocio, 'pt-BR', { sensitivity: 'base' }),
  )
}

export function textoLinhaLista(linha: LinhaListaFeira, i: number): string {
  const tel = linha.telefone?.trim() ? ` · ${linha.telefone}` : ''
  return `${String(i + 1).padStart(2, '0')}. ${linha.negocio} — ${linha.comerciante}${tel}`
}

function labelStatus(s: string): string {
  if (s === 'confirmado' || s === 'aprovado' || s === 'realizada') return 'Confirmado'
  return 'Pendente'
}

const LARGURA = 900
const MARGEM = 28

/** Gera PNG (data URL) da lista no layout do handoff. */
export function gerarPngListaFeira(
  meta: ListaFeiraMeta,
  linhas: LinhaListaFeira[],
  canvasFactory?: () => HTMLCanvasElement | null,
): string | null {
  const ordenadas = ordenarLinhasLista(linhas)
  const headerH = 110
  const statsH = 72
  const rowH = 40
  const tableHeadH = 36
  const footerH = 40
  const altura =
    headerH + statsH + tableHeadH + Math.max(ordenadas.length, 1) * rowH + footerH + MARGEM

  const factory =
    canvasFactory ??
    (() => (typeof document !== 'undefined' ? document.createElement('canvas') : null))
  const canvas = factory()
  if (!canvas) return null

  canvas.width = LARGURA
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // header
  const grad = ctx.createLinearGradient(0, 0, LARGURA, 0)
  grad.addColorStop(0, '#241154')
  grad.addColorStop(1, '#3A1E7A')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, LARGURA, headerH)

  // GF logo
  const lg = ctx.createLinearGradient(MARGEM, 28, MARGEM + 46, 74)
  lg.addColorStop(0, '#FB923C')
  lg.addColorStop(1, '#F43F5E')
  ctx.fillStyle = lg
  roundRect(ctx, MARGEM, 32, 46, 46, 13)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 17px sans-serif'
  ctx.fillText('GF', MARGEM + 12, 61)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 18px sans-serif'
  ctx.fillText(meta.feira, MARGEM + 60, 50)
  ctx.fillStyle = '#B7ADD6'
  ctx.font = '13px sans-serif'
  ctx.fillText('Lista de inscritos · Guery Feiras', MARGEM + 60, 72)

  ctx.textAlign = 'right'
  ctx.fillStyle = '#B7ADD6'
  ctx.font = '12px sans-serif'
  ctx.fillText(
    `${meta.data}${meta.horario ? ` · ${meta.horario}` : ''}`,
    LARGURA - MARGEM,
    50,
  )
  ctx.fillText(meta.parque, LARGURA - MARGEM, 70)
  ctx.textAlign = 'left'

  // stats
  const yStats = headerH
  ctx.fillStyle = '#EFE9DD'
  ctx.fillRect(0, yStats, LARGURA, statsH)
  const cells = [
    { l: 'Inscritos', v: String(meta.inscritos), c: '#2A1A5E' },
    { l: 'Vagas restantes', v: String(meta.vagasRestantes), c: '#16A34A' },
    { l: 'Confirmados', v: String(meta.confirmados), c: '#6D28D9' },
    { l: 'Pendentes', v: String(meta.pendentes), c: '#B45309' },
  ]
  const cellW = LARGURA / 4
  cells.forEach((cell, i) => {
    const x = i * cellW
    ctx.fillStyle = '#FAF7F0'
    ctx.fillRect(x + 1, yStats + 1, cellW - 2, statsH - 2)
    ctx.fillStyle = '#8B849E'
    ctx.font = '600 11.5px sans-serif'
    ctx.fillText(cell.l, x + 18, yStats + 26)
    ctx.fillStyle = cell.c
    ctx.font = '800 20px sans-serif'
    ctx.fillText(cell.v, x + 18, yStats + 52)
  })

  // table head
  const yHead = yStats + statsH
  ctx.fillStyle = '#2A1A5E'
  ctx.fillRect(0, yHead, LARGURA, tableHeadH)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 11px sans-serif'
  const cols = [
    { t: '#', x: MARGEM },
    { t: 'NEGÓCIO', x: 70 },
    { t: 'RESPONSÁVEL', x: 420 },
    { t: 'STATUS', x: 700 },
  ]
  cols.forEach((c) => ctx.fillText(c.t, c.x, yHead + 23))

  // rows
  let y = yHead + tableHeadH
  if (ordenadas.length === 0) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, y, LARGURA, rowH)
    ctx.fillStyle = '#8B849E'
    ctx.font = '14px sans-serif'
    ctx.fillText('Nenhum inscrito nesta lista.', MARGEM, y + 25)
    y += rowH
  } else {
    ordenadas.forEach((linha, i) => {
      ctx.fillStyle = i % 2 === 0 ? '#fff' : '#FAF7F0'
      ctx.fillRect(0, y, LARGURA, rowH)
      ctx.fillStyle = '#8B849E'
      ctx.font = '600 13px sans-serif'
      ctx.fillText(String(i + 1), MARGEM, y + 25)
      ctx.fillStyle = '#2A1A5E'
      ctx.font = '600 13.5px sans-serif'
      ctx.fillText(linha.negocio.slice(0, 40), 70, y + 25)
      ctx.fillStyle = '#6B6480'
      ctx.font = '13px sans-serif'
      ctx.fillText(linha.comerciante.slice(0, 28), 420, y + 25)

      const conf = labelStatus(linha.status) === 'Confirmado'
      ctx.fillStyle = conf ? '#DCFCE7' : '#FEF3C7'
      roundRect(ctx, 700, y + 10, 110, 22, 999)
      ctx.fill()
      ctx.fillStyle = conf ? '#16A34A' : '#B45309'
      ctx.font = 'bold 11.5px sans-serif'
      ctx.fillText(labelStatus(linha.status), 718, y + 25)
      y += rowH
    })
  }

  // footer
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, y, LARGURA, footerH)
  ctx.fillStyle = '#9A93A8'
  ctx.font = '11.5px sans-serif'
  ctx.fillText('Gerado pelo Painel do Curador · Guery Feiras', MARGEM, y + 24)
  ctx.textAlign = 'right'
  ctx.fillText(meta.geradoEm, LARGURA - MARGEM, y + 24)
  ctx.textAlign = 'left'

  return canvas.toDataURL('image/png')
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export function baixarDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
