/** Avisos do feed (home do expositor) — lógica pura. */

export type AvisoSortable = {
  fixo: boolean
  criado_em: string
}

export type AvisoPayloadInput = {
  titulo: string
  corpo: string
  imagem_url?: string | null
  fixo?: boolean
}

export type AvisoPayload =
  | { error: string }
  | { titulo: string; corpo: string; imagem_url: string | null; fixo: boolean }

export function sortAvisos<T extends AvisoSortable>(avisos: T[]): T[] {
  return [...avisos].sort((a, b) => {
    if (a.fixo === b.fixo) {
      return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
    }
    return a.fixo ? -1 : 1
  })
}

export function validateAvisoPayload(input: AvisoPayloadInput): AvisoPayload {
  const titulo = input.titulo.trim()
  const corpo = input.corpo.trim()
  if (!titulo) return { error: 'Título é obrigatório.' }
  if (!corpo) return { error: 'Texto do aviso é obrigatório.' }
  const imagem_url = input.imagem_url?.trim() || null
  if (imagem_url?.startsWith('data:')) {
    return { error: 'Imagem deve ser URL do Storage, não base64.' }
  }
  return { titulo, corpo, imagem_url, fixo: !!input.fixo }
}
