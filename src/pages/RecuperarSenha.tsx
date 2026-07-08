import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const input = 'w-full rounded-lg border border-marca-roxo/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-marca-amarelo'
const label = 'block text-sm font-medium text-marca-roxo mb-1'
const link = 'text-marca-roxo underline underline-offset-2'

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
      <div className="text-center space-y-3">
        <h2 className="text-lg font-semibold text-marca-roxo">Verifique seu e-mail</h2>
        <p className="text-sm text-marca-roxo/80">Enviamos um link de redefinição para seu e-mail.</p>
        <Link to="/login" className={`block text-sm ${link}`}>
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm text-marca-roxo/80">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

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
        className="w-full rounded-lg bg-marca-roxo text-white py-2 font-semibold hover:bg-marca-roxoClaro transition disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar link'}
      </button>

      <p className="text-center text-sm text-marca-roxo/80">
        <Link to="/login" className={link}>
          Voltar para o login
        </Link>
      </p>
    </form>
  )
}
