import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const input =
  'w-full rounded-xl border border-marca-ink/15 px-3.5 py-2.5 outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10'
const label = 'mb-1.5 block text-sm font-semibold text-marca-ink'
const link = 'font-semibold text-marca-acao hover:text-marca-acaoHover'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/ChangePassword',
    })
    // não revelamos se o e-mail existe ou não — mesma mensagem em qualquer caso
    setLoading(false)
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="space-y-3 text-center">
        <h2 className="font-display text-xl font-semibold text-marca-ink">Verifique seu e-mail</h2>
        <p className="text-sm text-marca-ink/70">Enviamos um link de redefinição para seu e-mail.</p>
        <Link to="/login" className={`block text-sm ${link}`}>
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="font-display text-[26px] font-semibold text-marca-ink">Recuperar senha</h2>
        <p className="mt-1 text-sm text-marca-ink/60">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <div>
        <label className={label}>E-mail</label>
        <input
          className={input}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-marca-acao py-3 font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar link'}
      </button>

      <p className="text-center text-sm text-marca-ink/70">
        <Link to="/login" className={link}>
          Voltar para o login
        </Link>
      </p>
    </form>
  )
}
