import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { MessageSquareWarning, X, CheckCircle2 } from 'lucide-react'

const input =
  'w-full rounded-xl border border-marca-ink/15 px-3.5 py-2.5 outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10'
const label = 'mb-1.5 block text-sm font-semibold text-marca-ink'

export default function ReportarProblemaButton() {
  const location = useLocation()
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [open, setOpen] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setTitulo('')
      setDescricao('')
      setEnviado(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // ponytail: stub — persiste em problem_reports na Fatia 6
    console.info('[reportar-problema]', { titulo, descricao, pagina: location.pathname })
    setEnviado(true)
    setTimeout(() => setOpen(false), 1200)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Reportar problema"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-marca-acao px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover"
        >
          <MessageSquareWarning className="h-5 w-5" />
          Reportar problema
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-marca-roxoDeep/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card bg-white p-6 shadow-lift">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-display text-lg font-bold text-marca-ink">
              Reportar problema
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Fechar" className="text-marca-ink/50 hover:text-marca-ink">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {enviado ? (
            <p className="flex items-center gap-2 text-sm font-medium text-[#0B7A54]">
              <CheckCircle2 className="h-5 w-5" /> Problema recebido. Obrigado pelo aviso!
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className={label}>Título</label>
                <input
                  className={input}
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <div>
                <label className={label}>Descrição</label>
                <textarea
                  className={`${input} min-h-24`}
                  required
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              <div>
                <label className={label}>Página</label>
                <input className={`${input} bg-marca-creme text-marca-ink/60`} value={location.pathname} readOnly />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-marca-acao py-2.5 font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover"
              >
                Enviar
              </button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
