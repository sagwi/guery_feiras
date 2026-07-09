import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

const input =
  'w-full rounded-xl border border-marca-ink/15 px-3.5 py-3 outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10'
const label = 'mb-1.5 block text-sm font-semibold text-marca-ink'
const erroClasse = 'mt-1 text-sm text-marca-coral'
const check =
  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border border-marca-ink/30 data-[state=checked]:border-marca-acao data-[state=checked]:bg-marca-acao'
const linkCls = 'font-semibold text-marca-acao hover:text-marca-acaoHover'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  // ponytail: "lembrar" é no-op nesta fatia — persistência default do Supabase
  const [lembrar, setLembrar] = useState(true)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      if (
        error.code === 'email_not_confirmed' ||
        error.message.toLowerCase().includes('email not confirmed')
      ) {
        setErro('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.')
      } else {
        setErro('E-mail ou senha inválidos.')
      }
      setLoading(false)
      return
    }

    navigate('/VendorPanel')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="font-display text-[26px] font-semibold text-marca-ink">Entrar</h2>
        <p className="mt-1 text-sm text-marca-ink/60">
          Bem-vindo de volta ao painel do comerciante.
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

      <div>
        <label className={label}>Senha</label>
        <div className="relative">
          <input
            className={`${input} pr-10`}
            type={mostrarSenha ? 'text' : 'password'}
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-marca-ink/50 hover:text-marca-ink"
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox.Root
            id="lembrar"
            checked={lembrar}
            onCheckedChange={(v) => setLembrar(v === true)}
            className={check}
          >
            <Checkbox.Indicator>
              <Check className="h-4 w-4 text-white" />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label htmlFor="lembrar" className="text-sm text-marca-ink">
            Lembrar de mim
          </label>
        </div>
        <Link to="/recuperar-senha" className={`text-sm ${linkCls}`}>
          Esqueceu a senha?
        </Link>
      </div>

      {erro && <p className={erroClasse}>{erro}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-marca-acao py-3 font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

      <p className="text-center text-sm text-marca-ink/70">
        Não tem conta?{' '}
        <Link to="/signup" className={linkCls}>
          Criar conta
        </Link>
      </p>
    </form>
  )
}
