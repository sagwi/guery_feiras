import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

const input = 'w-full rounded-lg border border-marca-roxo/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-marca-amarelo'
const label = 'block text-sm font-medium text-marca-roxo mb-1'
const erroClasse = 'text-sm text-red-600 mt-1'
const check =
  'mt-0.5 h-5 w-5 shrink-0 rounded border border-marca-roxo/40 flex items-center justify-center data-[state=checked]:bg-marca-roxo'
const link = 'text-marca-roxo underline underline-offset-2'

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
      if (error.code === 'email_not_confirmed' || error.message.toLowerCase().includes('email not confirmed')) {
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
            className="absolute inset-y-0 right-0 flex items-center px-3 text-marca-roxo/60 hover:text-marca-roxo"
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
          <label htmlFor="lembrar" className="text-sm text-marca-roxo">
            Lembrar de mim
          </label>
        </div>
        <Link to="/recuperar-senha" className={`text-sm ${link}`}>
          Esqueceu a senha?
        </Link>
      </div>

      {erro && <p className={erroClasse}>{erro}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-marca-roxo text-white py-2 font-semibold hover:bg-marca-roxoClaro transition disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

      <p className="text-center text-sm text-marca-roxo/80">
        Não tem conta?{' '}
        <Link to="/signup" className={link}>
          Criar conta
        </Link>
      </p>
    </form>
  )
}
