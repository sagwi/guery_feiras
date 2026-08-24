/** Nicho é obrigatório quando o segmento escolhido tem ao menos um nicho ativo. */

export type NichoCatalogo = {
  segmento_id: string
  ativo: boolean
}

export function nichoObrigatorio(
  segmentoId: string | null | undefined,
  nichos: NichoCatalogo[],
): boolean {
  if (!segmentoId) return false
  return nichos.some((n) => n.segmento_id === segmentoId && n.ativo)
}

export function validarNicho(
  segmentoId: string | null | undefined,
  nichoId: string | null | undefined,
  nichos: NichoCatalogo[],
): string | null {
  if (!nichoObrigatorio(segmentoId, nichos)) return null
  if (!nichoId) return 'Selecione um nicho.'
  const ok = nichos.some(
    (n) => n.ativo && n.segmento_id === segmentoId && (n as { id?: string }).id === nichoId,
  )
  // se o caller não passou id no tipo, só exige nichoId preenchido
  if (!nichos.some((n) => 'id' in n)) return null
  return ok ? null : 'Selecione um nicho válido deste segmento.'
}

export type NichoComId = NichoCatalogo & { id: string }

export function validarNichoComId(
  segmentoId: string | null | undefined,
  nichoId: string | null | undefined,
  nichos: NichoComId[],
): string | null {
  if (!nichoObrigatorio(segmentoId, nichos)) return null
  if (!nichoId) return 'Selecione um nicho.'
  return nichos.some((n) => n.ativo && n.segmento_id === segmentoId && n.id === nichoId)
    ? null
    : 'Selecione um nicho válido deste segmento.'
}
