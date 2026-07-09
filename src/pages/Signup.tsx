import { useState } from 'react'
import { MailCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import StepPessoais from './signup/StepPessoais'
import type { PessoaisData } from './signup/StepPessoais'
import StepNegocio from './signup/StepNegocio'
import type { NegocioData } from './signup/StepNegocio'
import StepTermos from './signup/StepTermos'
import type { TermosData } from './signup/StepTermos'

const TITULOS = ['Dados pessoais', 'Seu negócio', 'Termos']

export default function Signup() {
  const [step, setStep] = useState(0)
  const [pessoais, setPessoais] = useState<PessoaisData>()
  const [negocio, setNegocio] = useState<NegocioData>()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  async function finalizar(termos: TermosData) {
    if (!pessoais || !negocio) return
    setLoading(true)
    setErro(null)

    const { error } = await supabase.auth.signUp({
      email: pessoais.email,
      password: pessoais.senha,
      options: {
        emailRedirectTo: window.location.origin + '/VendorPanel',
        data: {
          nome: pessoais.nome,
          cpf: pessoais.cpf,
          nascimento: pessoais.nascimento,
          telefone: pessoais.telefone,
        },
      },
    })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    // ponytail: negócio + termos ficam pendentes até a 1ª sessão pós-confirmação (Task 9 finaliza o insert)
    localStorage.setItem('gf_onboarding', JSON.stringify({ negocio, termos }))
    setLoading(false)
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="space-y-3 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-marca-amarelo to-marca-coral text-marca-ink">
          <MailCheck className="h-7 w-7" />
        </span>
        <h2 className="font-display text-xl font-semibold text-marca-ink">
          Confirme seu e-mail para ativar a conta
        </h2>
        <p className="text-sm text-marca-ink/70">
          Enviamos um link de confirmação para {pessoais?.email}. Abra seu e-mail e clique no link para continuar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[26px] font-semibold text-marca-ink">Criar conta</h2>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-marca-ink/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-marca-acao to-marca-acaoHover transition-all duration-500"
            style={{ width: `${((step + 1) / TITULOS.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-medium text-marca-ink/60">
          Passo {step + 1} de {TITULOS.length} — {TITULOS[step]}
        </p>
      </div>

      {step === 0 && (
        <StepPessoais
          defaultValues={pessoais}
          onNext={(data) => {
            setPessoais(data)
            setStep(1)
          }}
        />
      )}

      {step === 1 && (
        <StepNegocio
          defaultValues={negocio}
          onBack={() => setStep(0)}
          onNext={(data) => {
            setNegocio(data)
            setStep(2)
          }}
        />
      )}

      {step === 2 && (
        <StepTermos onBack={() => setStep(1)} onSubmit={finalizar} loading={loading} erro={erro} />
      )}
    </div>
  )
}
