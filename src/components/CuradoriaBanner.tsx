import { Clock } from 'lucide-react'

export default function CuradoriaBanner() {
  return (
    <div className="flex animate-fadeUp items-center gap-3 rounded-card border border-marca-amarelo/60 bg-marca-amarelo/10 px-4 py-3.5 shadow-card">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-marca-amarelo/25 text-[#B47C00]">
        <Clock className="h-5 w-5" strokeWidth={2} />
      </span>
      <p className="text-sm font-medium text-marca-ink">
        Seu cadastro está em análise pela curadoria (até 48h úteis).
      </p>
    </div>
  )
}
