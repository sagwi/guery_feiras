import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

const input = 'w-full rounded-lg border border-marca-roxo/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-marca-amarelo'
const label = 'block text-sm font-medium text-marca-roxo mb-1'
const erroClasse = 'text-sm text-red-600 mt-1'

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
    <div className="mx-auto max-w-sm">
      <h1 className="text-xl font-bold text-marca-roxo mb-4">Alterar senha</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
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
              className="absolute inset-y-0 right-0 flex items-center px-3 text-marca-roxo/60 hover:text-marca-roxo"
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
        {ok && <p className="text-sm text-green-700">Senha alterada com sucesso.</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-marca-roxo text-white py-2 font-semibold hover:bg-marca-roxoClaro transition disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}
