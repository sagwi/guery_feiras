import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Cadastro = {
  id: string
  nome: string | null
  cpf: string | null
  email: string | null
  telefone: string | null
  curadoria_status: string
  curadoria_motivo: string | null
}

const card = 'rounded-lg border border-marca-roxo/10 bg-white p-4 space-y-3'
const botaoAprovar = 'rounded-lg bg-marca-roxo px-4 py-2 text-sm font-semibold text-white hover:bg-marca-roxoClaro transition disabled:opacity-50'
const botaoReprovar = 'rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50'
const textarea = 'w-full rounded-lg border border-marca-roxo/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-marca-amarelo'
const erroClasse = 'text-sm text-red-600'

export default function CuradoriaCadastros() {
  const [cadastros, setCadastros] = useState<Cadastro[]>([])
  const [loading, setLoading] = useState(true)
  const [reprovandoId, setReprovandoId] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [processandoId, setProcessandoId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id,nome,cpf,email,telefone,curadoria_status,curadoria_motivo')
      .eq('curadoria_status', 'pendente')
      .order('criado_em')
    if (error) { console.error('CuradoriaCadastros: falha ao carregar cadastros', error); setCadastros([]); setLoading(false); return }
    setCadastros((data ?? []) as Cadastro[])
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function aprovar(id: string) {
    setErro(null)
    setProcessandoId(id)
    const { error } = await supabase.from('profiles').update({ curadoria_status: 'aprovado' }).eq('id', id)
    if (error) { setErro('Falha ao aprovar cadastro: ' + error.message); setProcessandoId(null); return }
    await supabase.from('notifications').insert({
      user_id: id,
      tipo: 'cadastro_aprovado',
      titulo: 'Cadastro aprovado ✅',
      corpo: 'Seu cadastro foi aprovado pela curadoria. Você já pode participar das feiras.',
    })
    setCadastros((prev) => prev.filter((c) => c.id !== id))
    setProcessandoId(null)
  }

  async function confirmarReprovacao(id: string) {
    if (!motivo.trim()) return
    setErro(null)
    setProcessandoId(id)
    const { error } = await supabase
      .from('profiles')
      .update({ curadoria_status: 'reprovado', curadoria_motivo: motivo })
      .eq('id', id)
    if (error) { setErro('Falha ao reprovar cadastro: ' + error.message); setProcessandoId(null); return }
    await supabase.from('notifications').insert({
      user_id: id,
      tipo: 'cadastro_reprovado',
      titulo: 'Cadastro reprovado',
      corpo: motivo,
    })
    setCadastros((prev) => prev.filter((c) => c.id !== id))
    setProcessandoId(null)
    setReprovandoId(null)
    setMotivo('')
  }

  if (loading) return <p className="text-sm text-marca-roxo/60">Carregando…</p>

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-marca-roxo">Cadastros pendentes</h2>

      {erro && <p className={erroClasse}>{erro}</p>}

      {cadastros.length === 0 && (
        <p className="py-6 text-center text-sm text-marca-roxo/60">Nenhum cadastro pendente.</p>
      )}

      <div className="space-y-3">
        {cadastros.map((c) => (
          <div key={c.id} className={card}>
            <div className="grid grid-cols-2 gap-2 text-sm text-marca-roxo md:grid-cols-4">
              <div><span className="text-marca-roxo/60">Nome:</span> {c.nome}</div>
              <div><span className="text-marca-roxo/60">CPF:</span> {c.cpf}</div>
              <div><span className="text-marca-roxo/60">E-mail:</span> {c.email}</div>
              <div><span className="text-marca-roxo/60">Telefone:</span> {c.telefone}</div>
            </div>

            {reprovandoId === c.id ? (
              <div className="space-y-2">
                <textarea
                  className={textarea}
                  rows={2}
                  placeholder="Motivo da reprovação"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={botaoReprovar}
                    disabled={!motivo.trim() || processandoId === c.id}
                    onClick={() => confirmarReprovacao(c.id)}
                  >
                    {processandoId === c.id ? 'Reprovando...' : 'Confirmar reprovação'}
                  </button>
                  <button
                    type="button"
                    className="text-sm text-marca-roxo/70 hover:text-marca-roxo"
                    onClick={() => { setReprovandoId(null); setMotivo('') }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  className={botaoAprovar}
                  disabled={processandoId === c.id}
                  onClick={() => aprovar(c.id)}
                >
                  {processandoId === c.id ? 'Aprovando...' : 'Aprovar'}
                </button>
                <button
                  type="button"
                  className={botaoReprovar}
                  disabled={processandoId === c.id}
                  onClick={() => setReprovandoId(c.id)}
                >
                  Reprovar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
