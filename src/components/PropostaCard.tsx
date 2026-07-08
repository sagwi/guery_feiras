import { Store } from 'lucide-react'

export type Proposta = {
  id: string
  data_escolhida: string
  status: string
  fairs: {
    nome: string
    local: string | null
    imagem_url: string | null
    taxa: number
    parks: { nome: string } | null
  } | null
  businesses: { nome: string } | null
}

const STATUS: Record<string, { label: string; classes: string }> = {
  pendente: { label: 'Pendente', classes: 'bg-amber-100 text-amber-700' },
  em_analise: { label: 'Em análise', classes: 'bg-blue-100 text-blue-700' },
  aprovado: { label: 'Aprovado', classes: 'bg-green-100 text-green-700' },
  confirmado: { label: 'Confirmado', classes: 'bg-green-100 text-green-700' },
  realizada: { label: 'Realizada', classes: 'bg-gray-100 text-gray-700' },
  reprovado: { label: 'Reprovado', classes: 'bg-red-100 text-red-700' },
  cancelado_pagamento: { label: 'Cancelado por falta de pagamento', classes: 'bg-red-100 text-red-700' },
  cancelado_organizador: { label: 'Cancelado pelo organizador', classes: 'bg-gray-100 text-gray-700' },
  expirado: { label: 'Expirado', classes: 'bg-gray-100 text-gray-700' },
}

function formatarDataBR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PropostaCard({ proposta }: { proposta: Proposta }) {
  const fair = proposta.fairs
  const status = STATUS[proposta.status] ?? { label: proposta.status, classes: 'bg-gray-100 text-gray-700' }

  return (
    <div className="flex gap-4 rounded-lg border border-marca-roxo/10 bg-white p-4 shadow-sm">
      {fair?.imagem_url ? (
        <img src={fair.imagem_url} alt={fair.nome} className="h-20 w-20 shrink-0 rounded-md object-cover" />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-marca-roxo/5">
          <Store className="h-8 w-8 text-marca-roxo/30" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-marca-roxo">{fair?.nome ?? '—'}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${status.classes}`}>
            {status.label}
          </span>
        </div>
        <p className="text-sm text-marca-roxo/70">
          {fair?.parks?.nome ?? '—'}
          {fair?.local ? ` · ${fair.local}` : ''}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-marca-roxo/70">
          <span className="rounded-full bg-marca-roxo/5 px-2 py-0.5 text-xs font-semibold text-marca-roxo">
            {proposta.businesses?.nome ?? '—'}
          </span>
          <span>Data: {formatarDataBR(proposta.data_escolhida)}</span>
          {fair && <span>Taxa: {formatarMoeda(fair.taxa)}</span>}
        </div>
      </div>
    </div>
  )
}
