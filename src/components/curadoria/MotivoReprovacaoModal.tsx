import { X } from 'lucide-react'
import { curadoriaUi as ui } from './curadoriaUi'

export default function MotivoReprovacaoModal({
  titulo,
  motivo,
  onMotivo,
  onConfirm,
  onClose,
  processando,
}: {
  titulo: string
  motivo: string
  onMotivo: (v: string) => void
  onConfirm: () => void
  onClose: () => void
  processando?: boolean
}) {
  return (
    <div className={ui.overlay} role="dialog" aria-modal="true">
      <div className={`${ui.modal} max-w-[480px]`}>
        <div className={ui.modalHeader}>
          <div>
            <p className="font-display text-[19px] font-bold text-marca-ink">{titulo}</p>
            <p className="text-[13px] text-marca-ink/60">O motivo será enviado ao solicitante</p>
          </div>
          <button type="button" className="rounded-full p-2 hover:bg-marca-ink/5" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5 text-marca-ink/50" />
          </button>
        </div>
        <div className={ui.modalBody}>
          <label className={ui.label}>Motivo da reprovação *</label>
          <textarea
            className={ui.textarea}
            rows={4}
            placeholder="Descreva o motivo…"
            value={motivo}
            onChange={(e) => onMotivo(e.target.value)}
            autoFocus
          />
        </div>
        <div className={`${ui.modalFooter} justify-end`}>
          <button type="button" className={ui.botaoSecundario} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className={ui.botaoReprovar}
            disabled={!motivo.trim() || processando}
            onClick={onConfirm}
          >
            {processando ? 'Reprovando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
