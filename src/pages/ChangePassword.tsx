import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

const input =
  'w-full rounded-xl border border-marca-ink/15 px-3.5 py-2.5 outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10'
const label = 'mb-1.5 block text-sm font-semibold text-marca-ink'
const erroClasse = 'mt-1 text-sm text-marca-coral'

export default function ChangePassword() {
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (senha.length < 6) return setErro('A senha deve ter no mínimo 6 caracteres.')
    if (senha !== confirmar) return setErro('As senhas não coincidem.')

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setLoading(false)
    if (error) return setErro('Não foi possível alterar a senha. Tente novamente.')
    setOk(true)
    setSenha('')
    setConfirmar('')
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 font-display text-2xl font-bold text-marca-ink">Alterar senha</h1>
      <p className="mb-6 text-sm text-marca-ink/60">Defina uma nova senha para sua conta.</p>
      <form
        className="animate-fadeUp space-y-4 rounded-card border border-marca-ink/[.07] bg-white p-6 shadow-card"
        onSubmit={handleSubmit}
      >
        <div>
          <label className={label}>Nova senha</label>
          <div className="relative">
            <input
              className={`${input} pr-10`}
              type={mostrar ? 'text' : 'password'}
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setMostrar((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-marca-ink/50 hover:text-marca-ink"
              aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrar ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className={label}>Confirmar nova senha</label>
          <input
            className={input}
            type={mostrar ? 'text' : 'password'}
            required
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
          />
        </div>

        {erro && <p className={erroClasse}>{erro}</p>}
        {ok && <p className="text-sm font-semibold text-[#0B7A54]">Senha alterada com sucesso.</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-marca-acao py-3 font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}
