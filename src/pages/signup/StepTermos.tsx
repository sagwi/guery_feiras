import { useState } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'

export type TermosData = { aceitouTermos: boolean; aceitouPrivacidade: boolean }

const linha = 'flex items-start gap-2'
const check =
  'mt-0.5 h-5 w-5 shrink-0 rounded border border-marca-roxo/40 flex items-center justify-center data-[state=checked]:bg-marca-roxo'
const link = 'text-marca-roxo underline underline-offset-2'

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
        <label htmlFor="aceitouTermos" className="text-sm text-marca-roxo">
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
        <label htmlFor="aceitouPrivacidade" className="text-sm text-marca-roxo">
          Li e aceito a{' '}
          <a href="#" className={link} target="_blank" rel="noreferrer">
            Política de Privacidade
          </a>
        </label>
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 rounded-lg border border-marca-roxo text-marca-roxo py-2 font-semibold hover:bg-marca-roxo/5 transition disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          disabled={!podeEnviar}
          onClick={() => onSubmit({ aceitouTermos, aceitouPrivacidade })}
          className="flex-1 rounded-lg bg-marca-amarelo text-marca-roxo py-2 font-semibold hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </div>
    </div>
  )
}
