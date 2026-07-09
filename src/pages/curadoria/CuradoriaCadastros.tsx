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

const card =
  'animate-fadeUp space-y-3 rounded-card border border-marca-ink/[.07] bg-white p-5 shadow-card'
const botaoAprovar =
  'rounded-xl bg-marca-acao px-4 py-2 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover disabled:opacity-50'
const botaoReprovar =
  'rounded-xl border border-marca-coral/50 px-4 py-2 text-sm font-semibold text-marca-coral transition hover:bg-marca-coral/5 disabled:opacity-50'
const textarea =
  'w-full rounded-xl border border-marca-ink/15 px-3.5 py-2.5 outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10'
const erroClasse = 'text-sm text-marca-coral'

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

  if (loading) return <p className="text-sm text-marca-ink/60">Carregando…</p>

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-marca-ink">Cadastros pendentes</h2>

      {erro && <p className={erroClasse}>{erro}</p>}

      {cadastros.length === 0 && (
        <p className="py-6 text-center text-sm text-marca-ink/60">Nenhum cadastro pendente.</p>
      )}

      <div className="space-y-3">
        {cadastros.map((c) => (
          <div key={c.id} className={card}>
            <div className="grid grid-cols-2 gap-2 text-sm text-marca-ink md:grid-cols-4">
              <div><span className="text-marca-ink/50">Nome:</span> {c.nome}</div>
              <div><span className="text-marca-ink/50">CPF:</span> {c.cpf}</div>
              <div><span className="text-marca-ink/50">E-mail:</span> {c.email}</div>
              <div><span className="text-marca-ink/50">Telefone:</span> {c.telefone}</div>
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
                    className="text-sm font-semibold text-marca-ink/60 hover:text-marca-ink"
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
