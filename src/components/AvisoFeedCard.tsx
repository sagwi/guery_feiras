import type { ReactNode } from 'react'
import { Pin } from 'lucide-react'

const cardClass =
  'animate-fadeUp flex w-[260px] max-w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-[14px] border border-marca-ink/[.07] bg-white shadow-card'

export const avisoFeedRowClass =
  'flex flex-row gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] snap-x snap-mandatory'

type Props = {
  titulo: string
  corpo: string
  imagem_url: string | null
  fixo: boolean
  criado_em: string
  footer?: ReactNode
}

export default function AvisoFeedCard({
  titulo,
  corpo,
  imagem_url,
  fixo,
  criado_em,
  footer,
}: Props) {
  return (
    <article className={cardClass}>
      <div className="relative aspect-square w-full bg-marca-creme">
        {imagem_url ? (
          <img
            src={imagem_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : null}
        {fixo && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-marca-acao shadow-sm">
            <Pin className="h-3 w-3" /> Fixo
          </span>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-marca-ink">{titulo}</h3>
        <p className="line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-marca-ink/70">
          {corpo}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="truncate text-[10px] text-marca-ink/45">
            {new Date(criado_em).toLocaleString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {footer}
        </div>
      </div>
    </article>
  )
}
