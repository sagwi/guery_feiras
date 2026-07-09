import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

export type KpiTone = 'roxo' | 'azul' | 'amarelo' | 'coral' | 'verde'

const toneChip: Record<KpiTone, string> = {
  roxo: 'bg-[#EDE7FB] text-marca-acao',
  azul: 'bg-[#E5EEFE] text-[#2563EB]',
  amarelo: 'bg-[#FFEFCC] text-[#B47C00]',
  coral: 'bg-[#FFE6DE] text-[#E1502A]',
  verde: 'bg-[#D6F5E9] text-[#0B7A54]',
}

// Conta de 0 até o alvo em ~0.9s (easing cúbico). Só roda quando o valor é numérico.
function useCountUp(target: number, run: boolean): number {
  const [v, setV] = useState(0)
  const raf = useRef<number>()
  useEffect(() => {
    if (!run) return
    const start = performance.now()
    const dur = 900
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const e = 1 - Math.pow(1 - t, 3)
      setV(Math.round(target * e))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [target, run])
  return v
}

export default function KpiCard({
  label,
  valor,
  icon: Icon,
  tone = 'roxo',
  hint,
}: {
  label: string
  valor: number | string
  icon?: LucideIcon
  tone?: KpiTone
  hint?: string
}) {
  const isNum = typeof valor === 'number'
  const contado = useCountUp(isNum ? (valor as number) : 0, isNum)

  return (
    <div className="animate-fadeUp rounded-card border border-marca-ink/[.06] bg-white p-[18px] shadow-card transition-transform duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="mb-3.5 flex items-center justify-between">
        <div
          className={`flex h-[42px] w-[42px] items-center justify-center rounded-[13px] ${toneChip[tone]}`}
        >
          {Icon && <Icon className="h-5 w-5" strokeWidth={1.9} />}
        </div>
        {hint && (
          <span className="rounded-full bg-[#D6F5E9] px-2 py-0.5 text-[11px] font-semibold text-[#0B7A54]">
            {hint}
          </span>
        )}
      </div>
      <p className="font-display text-[34px] font-bold leading-none text-marca-ink">
        {isNum ? contado : valor}
      </p>
      <p className="mt-1 text-[13px] text-marca-ink/60">{label}</p>
    </div>
  )
}
