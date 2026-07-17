import { useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'

/** Toast inferior-centro (design handoff). */
export default function CuradoriaToast({
  message,
  onDone,
  ms = 2800,
}: {
  message: string | null
  onDone: () => void
  ms?: number
}) {
  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(onDone, ms)
    return () => window.clearTimeout(t)
  }, [message, onDone, ms])

  if (!message) return null

  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-[60] -translate-x-1/2 animate-fadeUp">
      <div className="flex items-center gap-2.5 rounded-xl bg-[#241154] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(20,7,46,.4)]">
        <CheckCircle2 className="h-5 w-5 text-[#4ADE80]" />
        {message}
      </div>
    </div>
  )
}
