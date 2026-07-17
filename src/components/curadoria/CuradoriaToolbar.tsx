import { Search, ArrowUpDown } from 'lucide-react'
import { curadoriaUi as ui } from './curadoriaUi'

export function Contadores({
  items,
}: {
  items: { valor: number | string; label: string; cor?: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c) => (
        <div key={c.label} className={ui.contador}>
          <div className={`text-xl font-extrabold ${c.cor ?? 'text-marca-ink'}`}>{c.valor}</div>
          <div className="text-[11.5px] text-marca-ink/60">{c.label}</div>
        </div>
      ))}
    </div>
  )
}

export function BarraBusca({
  value,
  onChange,
  placeholder,
  sortLabel,
  onToggleSort,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  sortLabel?: string
  onToggleSort?: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className={ui.buscaWrap}>
        <Search className="h-4 w-4 shrink-0 text-marca-ink/40" />
        <input
          className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none placeholder:text-[#A8A2B8]"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {onToggleSort && (
        <button type="button" className={ui.botaoSecundario} onClick={onToggleSort}>
          <ArrowUpDown className="h-4 w-4" />
          {sortLabel ?? 'Mais recentes'}
        </button>
      )}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { id: T; label: string; activeClass?: string }[]
}) {
  return (
    <div className={ui.segmentWrap}>
      {options.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            className={
              active
                ? `${ui.segmentAtivo} ${o.activeClass ?? 'text-marca-acao'}`
                : ui.segmentInativo
            }
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function BulkBar({
  count,
  onApprove,
  onReject,
  onClear,
}: {
  count: number
  onApprove: () => void
  onReject: () => void
  onClear: () => void
}) {
  if (count < 1) return null
  return (
    <div className={ui.bulkBar}>
      <span>{count} selecionado{count === 1 ? '' : 's'}</span>
      <button type="button" className={ui.botaoAprovar} onClick={onApprove}>
        Aprovar
      </button>
      <button type="button" className={ui.botaoReprovar} onClick={onReject}>
        Reprovar
      </button>
      <button type="button" className="text-sm font-semibold text-[#4C1D95]/70 hover:underline" onClick={onClear}>
        Limpar
      </button>
    </div>
  )
}
