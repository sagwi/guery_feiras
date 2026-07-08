import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { MessageSquareWarning, X } from 'lucide-react'

const input = 'w-full rounded-lg border border-marca-roxo/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-marca-amarelo'
const label = 'block text-sm font-medium text-marca-roxo mb-1'

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
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-marca-roxo px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-marca-roxoClaro"
        >
          <MessageSquareWarning className="h-5 w-5" />
          Reportar problema
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-marca-roxo font-semibold">Reportar problema</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Fechar" className="text-marca-roxo/60 hover:text-marca-roxo">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {enviado ? (
            <p className="text-sm text-marca-roxo">Problema recebido. Obrigado pelo aviso!</p>
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
                <input className={`${input} bg-marca-roxo/5`} value={location.pathname} readOnly />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-marca-roxo py-2 font-semibold text-white hover:bg-marca-roxoClaro"
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
