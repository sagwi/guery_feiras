/** Lista vazia = a feira aceita qualquer segmento. */

export function feiraAceitaSegmento(
  segmentoIdsDaFeira: string[],
  segmentoIdNegocio: string | null | undefined,
): boolean {
  if (segmentoIdsDaFeira.length === 0) return true
  if (!segmentoIdNegocio) return false
  return segmentoIdsDaFeira.includes(segmentoIdNegocio)
}
