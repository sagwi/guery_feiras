import { Link } from 'react-router-dom'
import { Store, Calendar } from 'lucide-react'

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

const STATUS: Record<string, { label: string; classes: string; dot: string }> = {
  pendente: { label: 'Pendente', classes: 'bg-[#FFEFCC] text-[#8A6300]', dot: 'bg-marca-amarelo' },
  em_analise: { label: 'Em análise', classes: 'bg-[#E5EEFE] text-[#1D4ED8]', dot: 'bg-[#2563EB]' },
  aprovado: { label: 'Aprovado', classes: 'bg-[#D6F5E9] text-[#0B7A54]', dot: 'bg-marca-verde' },
  confirmado: { label: 'Confirmado', classes: 'bg-[#D6F5E9] text-[#0B7A54]', dot: 'bg-marca-verde' },
  realizada: { label: 'Realizada', classes: 'bg-[#EDEAF3] text-[#5B5470]', dot: 'bg-[#9A93AD]' },
  reprovado: { label: 'Reprovado', classes: 'bg-[#FEE7E0] text-[#C43D1C]', dot: 'bg-marca-coral' },
  cancelado_pagamento: {
    label: 'Cancelado por falta de pagamento',
    classes: 'bg-[#FEE7E0] text-[#C43D1C]',
    dot: 'bg-marca-coral',
  },
  cancelado_organizador: {
    label: 'Cancelado pelo organizador',
    classes: 'bg-[#EDEAF3] text-[#5B5470]',
    dot: 'bg-[#9A93AD]',
  },
  expirado: { label: 'Expirado', classes: 'bg-[#EDEAF3] text-[#5B5470]', dot: 'bg-[#9A93AD]' },
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
  const status =
    STATUS[proposta.status] ?? { label: proposta.status, classes: 'bg-[#EDEAF3] text-[#5B5470]', dot: 'bg-[#9A93AD]' }

  return (
    <div className="flex animate-fadeUp overflow-hidden rounded-card border border-marca-ink/[.07] bg-white shadow-card transition-transform duration-300 hover:-translate-y-1 hover:shadow-lift">
      {fair?.imagem_url ? (
        <img
          src={fair.imagem_url}
          alt={fair.nome}
          className="h-auto w-[150px] shrink-0 object-cover"
        />
      ) : (
        <div className="flex w-[150px] shrink-0 items-end bg-gradient-to-br from-marca-acao to-marca-roxoDark p-3 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.06)_0_8px,transparent_8px_16px),linear-gradient(135deg,#6D28D9,#2A1060)]">
          <Store className="h-6 w-6 text-white/40" />
        </div>
      )}

      <div className="min-w-0 flex-1 p-[18px]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-[17px] font-semibold text-marca-ink">
              {fair?.nome ?? '—'}
            </h3>
            <p className="mt-0.5 text-[13.5px] text-marca-ink/60">
              {fair?.parks?.nome ?? '—'}
              {fair?.local ? ` · ${fair.local}` : ''}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.classes}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-[13px] text-marca-ink/70">
          <span className="rounded-full bg-[#EDE7FB] px-2.5 py-1 text-xs font-semibold text-marca-acao">
            {proposta.businesses?.nome ?? '—'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatarDataBR(proposta.data_escolhida)}
          </span>
          {fair && (
            <span>
              Taxa: <strong className="text-marca-ink">{formatarMoeda(fair.taxa)}</strong>
            </span>
          )}
        </div>

        {proposta.status === 'aprovado' && (
          <Link
            to="/VendorPayments"
            className="mt-3.5 inline-block rounded-xl bg-marca-amarelo px-4 py-2 text-xs font-bold text-marca-ink shadow-amber transition hover:-translate-y-0.5 hover:brightness-[1.04]"
          >
            Pagar agora
          </Link>
        )}
      </div>
    </div>
  )
}
