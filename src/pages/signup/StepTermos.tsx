import { useState } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'

export type TermosData = { aceitouTermos: boolean; aceitouPrivacidade: boolean }

const linha = 'flex items-start gap-2'
const check =
  'mt-0.5 h-5 w-5 shrink-0 rounded-[6px] border border-marca-ink/30 flex items-center justify-center transition-colors data-[state=checked]:border-marca-acao data-[state=checked]:bg-marca-acao'
const link = 'font-semibold text-marca-acao underline underline-offset-2 hover:text-marca-acaoHover'

export default function StepTermos({
  onSubmit,
  onBack,
  loading,
  erro,
}: {
  onSubmit: (data: TermosData) => void
  onBack: () => void
  loading?: boolean
  erro?: string | null
}) {
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false)
  const podeEnviar = aceitouTermos && aceitouPrivacidade && !loading

  return (
    <div className="space-y-4">
      <div className={linha}>
        <Checkbox.Root
          id="aceitouTermos"
          checked={aceitouTermos}
          onCheckedChange={(v) => setAceitouTermos(v === true)}
          className={check}
        >
          <Checkbox.Indicator>
            <Check className="h-4 w-4 text-white" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label htmlFor="aceitouTermos" className="text-sm text-marca-ink">
          Li e aceito os{' '}
          <a href="/VendorManual" className={link} target="_blank" rel="noreferrer">
            Termos de Uso
          </a>
        </label>
      </div>

      <div className={linha}>
        <Checkbox.Root
          id="aceitouPrivacidade"
          checked={aceitouPrivacidade}
          onCheckedChange={(v) => setAceitouPrivacidade(v === true)}
          className={check}
        >
          <Checkbox.Indicator>
            <Check className="h-4 w-4 text-white" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label htmlFor="aceitouPrivacidade" className="text-sm text-marca-ink">
          Li e aceito a{' '}
          <a href="#" className={link} target="_blank" rel="noreferrer">
            Política de Privacidade
          </a>
        </label>
      </div>

      {erro && <p className="text-sm text-marca-coral">{erro}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 rounded-xl border border-marca-acao/25 py-2.5 font-semibold text-marca-acao transition hover:bg-marca-acao/5 disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          disabled={!podeEnviar}
          onClick={() => onSubmit({ aceitouTermos, aceitouPrivacidade })}
          className="flex-1 rounded-xl bg-marca-amarelo py-2.5 font-bold text-marca-ink shadow-amber transition hover:-translate-y-0.5 hover:brightness-[1.04] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </div>
    </div>
  )
}
