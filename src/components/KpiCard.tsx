import type { LucideIcon } from 'lucide-react'

export default function KpiCard({
  label,
  valor,
  icon: Icon,
}: {
  label: string
  valor: number | string
  icon?: LucideIcon
}) {
  return (
    <div className="rounded-lg border-l-4 border-marca-roxo bg-white px-4 py-3 shadow-sm flex items-center gap-3">
      {Icon && <Icon className="h-6 w-6 shrink-0 text-marca-roxo" />}
      <div>
        <p className="text-2xl font-bold text-marca-roxo">{valor}</p>
        <p className="text-sm text-marca-roxo/70">{label}</p>
      </div>
    </div>
  )
}
