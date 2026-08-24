/** Reação pós-feira — elegibilidade e payload. */

export const FAIXAS_FATURAMENTO = [
  'Até R$ 1.000',
  'R$ 1.001 a R$ 3.000',
  'R$ 3.001 a R$ 5.000',
  'R$ 5.001 a R$ 10.000',
  'Acima de R$ 10.000',
] as const

export type FaixaFaturamento = (typeof FAIXAS_FATURAMENTO)[number]

export type ElegibilidadeReacao = {
  status: string
  data_escolhida: string
  jaAvaliou: boolean
}

export function hojeISO(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function podeAvaliar(e: ElegibilidadeReacao, hoje = hojeISO()): boolean {
  if (e.jaAvaliou) return false
  if (e.status !== 'confirmado' && e.status !== 'realizada') return false
  return e.data_escolhida <= hoje
}

export type ReacaoInput = {
  applicationId: string
  userId: string
  fairId: string
  notaFeira: number
  comentario?: string
  notaIndicacao: number
  faixaFaturamento: string
}

export type ReacaoPayload =
  | { error: string }
  | {
      application_id: string
      user_id: string
      fair_id: string
      nota_feira: number
      comentario: string | null
      nota_indicacao: number
      faixa_faturamento: string
    }

export function buildReacaoInsert(input: ReacaoInput): ReacaoPayload {
  if (!input.applicationId || !input.userId || !input.fairId) {
    return { error: 'Inscrição inválida.' }
  }
  if (!Number.isInteger(input.notaFeira) || input.notaFeira < 0 || input.notaFeira > 10) {
    return { error: 'Nota da feira deve ser de 0 a 10.' }
  }
  if (
    !Number.isInteger(input.notaIndicacao) ||
    input.notaIndicacao < 0 ||
    input.notaIndicacao > 10
  ) {
    return { error: 'Nota de indicação deve ser de 0 a 10.' }
  }
  if (!(FAIXAS_FATURAMENTO as readonly string[]).includes(input.faixaFaturamento)) {
    return { error: 'Selecione a faixa de faturamento no evento.' }
  }
  const comentario = (input.comentario ?? '').trim()
  if (comentario.length > 1000) {
    return { error: 'Comentário deve ter no máximo 1000 caracteres.' }
  }
  return {
    application_id: input.applicationId,
    user_id: input.userId,
    fair_id: input.fairId,
    nota_feira: input.notaFeira,
    comentario: comentario || null,
    nota_indicacao: input.notaIndicacao,
    faixa_faturamento: input.faixaFaturamento,
  }
}
