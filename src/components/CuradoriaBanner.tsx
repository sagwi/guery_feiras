import { Clock } from 'lucide-react'

export default function CuradoriaBanner() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-marca-amarelo bg-marca-amarelo/10 px-4 py-3">
      <Clock className="h-5 w-5 shrink-0 text-marca-roxo" />
      <p className="text-sm text-marca-roxo">
        Seu cadastro está em análise pela curadoria (até 48h úteis).
      </p>
    </div>
  )
}
