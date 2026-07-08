export type StatusInscricao =
  | 'pendente' | 'em_analise' | 'aprovado' | 'confirmado' | 'realizada'
  | 'reprovado' | 'cancelado_pagamento' | 'cancelado_organizador' | 'expirado'

// label + classes de badge por status (fonte única; reaproveitável em PropostaCard/curadoria).
export const STATUS_LABELS: Record<StatusInscricao, { label: string; cor: string }> = {
  pendente: { label: 'Pendente', cor: 'bg-amber-100 text-amber-800' },
  em_analise: { label: 'Em análise', cor: 'bg-blue-100 text-blue-800' },
  aprovado: { label: 'Aprovado', cor: 'bg-green-100 text-green-800' },
  confirmado: { label: 'Confirmado', cor: 'bg-green-100 text-green-800' },
  realizada: { label: 'Realizada', cor: 'bg-gray-100 text-gray-700' },
  reprovado: { label: 'Reprovado', cor: 'bg-red-100 text-red-800' },
  cancelado_pagamento: { label: 'Cancelado por falta de pagamento', cor: 'bg-red-100 text-red-800' },
  cancelado_organizador: { label: 'Cancelado pelo organizador', cor: 'bg-gray-100 text-gray-700' },
  expirado: { label: 'Expirado', cor: 'bg-gray-100 text-gray-700' },
}

// O curador só pode agir sobre inscrições ainda em análise.
export function podeCurar(status: StatusInscricao): boolean {
  return status === 'pendente' || status === 'em_analise'
}

// Transição de curadoria. Lança se o status não é curável (evita mexer em estado terminal).
export function transicaoCuradoria(
  atual: StatusInscricao,
  decisao: 'aprovar' | 'reprovar',
): StatusInscricao {
  if (!podeCurar(atual)) throw new Error(`Inscrição em '${atual}' não pode ser curada`)
  return decisao === 'aprovar' ? 'aprovado' : 'reprovado'
}

// Só inscrições aprovadas (e ainda não pagas) podem ser pagas.
export function podePagar(status: StatusInscricao): boolean {
  return status === 'aprovado'
}

// Transição de pagamento: aprovado -> confirmado. Lança se não pagável.
export function transicaoPagamento(atual: StatusInscricao): StatusInscricao {
  if (!podePagar(atual)) throw new Error(`Inscrição em '${atual}' não pode ser paga`)
  return 'confirmado'
}

// Organizador só cancela data ainda ativa (aprovada ou confirmada).
export function podeCancelarOrganizador(status: StatusInscricao): boolean {
  return status === 'aprovado' || status === 'confirmado'
}

// Cancelamento pelo organizador -> cancelado_organizador. Lança se não cancelável.
export function transicaoCancelamentoOrganizador(atual: StatusInscricao): StatusInscricao {
  if (!podeCancelarOrganizador(atual)) throw new Error(`Inscrição em '${atual}' não pode ser cancelada pelo organizador`)
  return 'cancelado_organizador'
}

// Gera crédito só se a data já estava paga (confirmada) ao ser cancelada.
export function geraCreditoAoCancelar(atual: StatusInscricao): boolean {
  return atual === 'confirmado'
}
