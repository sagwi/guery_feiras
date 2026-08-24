/** Perguntas customizadas da feira (máx. 10) e respostas da inscrição. */

export type PerguntaFeira = { id: string; rotulo: string }

export function novaPergunta(rotulo = ''): PerguntaFeira {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return { id, rotulo }
}

export function sanitizarPerguntas(raw: unknown): PerguntaFeira[] {
  if (!Array.isArray(raw)) return []
  const out: PerguntaFeira[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const rec = item as { id?: unknown; rotulo?: unknown }
    const rotulo = typeof rec.rotulo === 'string' ? rec.rotulo.trim() : ''
    const id = typeof rec.id === 'string' && rec.id ? rec.id : novaPergunta().id
    if (!rotulo) continue
    out.push({ id, rotulo })
    if (out.length >= 10) break
  }
  return out
}

export function validarPerguntas(perguntas: PerguntaFeira[]): string | null {
  if (perguntas.length > 10) return 'No máximo 10 perguntas.'
  for (const p of perguntas) {
    if (!p.rotulo.trim()) return 'Toda pergunta precisa de um enunciado.'
  }
  return null
}

export type ResultadoRespostas =
  | { ok: true; respostas: Record<string, string> }
  | { ok: false; error: string }

export function montarRespostas(
  perguntas: PerguntaFeira[],
  answers: Record<string, string>,
): ResultadoRespostas {
  const out: Record<string, string> = {}
  for (const p of perguntas) {
    const v = (answers[p.id] ?? '').trim()
    if (!v) return { ok: false, error: `Responda: ${p.rotulo}` }
    out[p.id] = v
  }
  return { ok: true, respostas: out }
}
