import { useCallback, useEffect, useState } from 'react'
import { Mail, Phone, IdCard, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { iniciais } from '../../lib/formatacao'
import { curadoriaUi as ui } from '../../components/curadoria/curadoriaUi'

type Cadastro = {
  id: string
  nome: string | null
  cpf: string | null
  email: string | null
  telefone: string | null
  curadoria_status: string
  curadoria_motivo: string | null
  criado_em?: string
}

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
      .select('id,nome,cpf,email,telefone,curadoria_status,curadoria_motivo,criado_em')
      .eq('curadoria_status', 'pendente')
      .order('criado_em')
    if (error) {
      console.error('CuradoriaCadastros: falha ao carregar cadastros', error)
      setCadastros([])
      setLoading(false)
      return
    }
    setCadastros((data ?? []) as Cadastro[])
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function aprovar(id: string) {
    setErro(null)
    setProcessandoId(id)
    const { error } = await supabase.from('profiles').update({ curadoria_status: 'aprovado' }).eq('id', id)
    if (error) {
      setErro('Falha ao aprovar cadastro: ' + error.message)
      setProcessandoId(null)
      return
    }
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
    if (error) {
      setErro('Falha ao reprovar cadastro: ' + error.message)
      setProcessandoId(null)
      return
    }
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
    <div className={ui.page}>
      <div>
        <h2 className={ui.titulo}>Cadastros pendentes</h2>
        <p className={ui.subtitulo}>
          {cadastros.length === 0
            ? 'Fila vazia — nenhum comerciante aguardando análise.'
            : `${cadastros.length} comerciante${cadastros.length === 1 ? '' : 's'} na fila de curadoria.`}
        </p>
      </div>

      {erro && <p className={ui.erro}>{erro}</p>}

      {cadastros.length === 0 && <p className={ui.empty}>Nenhum cadastro pendente.</p>}

      <div className="space-y-3">
        {cadastros.map((c) => (
          <article key={c.id} className={ui.card}>
            <div className={ui.cardBody}>
              <div className="flex flex-wrap items-start gap-4">
                <div className={ui.avatar}>{iniciais(c.nome)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-[17px] font-semibold text-marca-ink">
                      {c.nome ?? 'Sem nome'}
                    </h3>
                    <span className={`${ui.badge} bg-[#FFEFCC] text-[#8A6300]`}>
                      <Clock className="h-3 w-3" /> Pendente
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-marca-ink/70">
                    {c.email && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {c.email}
                      </span>
                    )}
                    {c.telefone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" /> {c.telefone}
                      </span>
                    )}
                    {c.cpf && (
                      <span className="inline-flex items-center gap-1.5">
                        <IdCard className="h-3.5 w-3.5 shrink-0" /> {c.cpf}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {reprovandoId === c.id ? (
                <div className="space-y-2 border-t border-marca-ink/[.06] pt-3">
                  <textarea
                    className={ui.textarea}
                    rows={2}
                    placeholder="Motivo da reprovação (obrigatório)"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={ui.botaoReprovar}
                      disabled={!motivo.trim() || processandoId === c.id}
                      onClick={() => confirmarReprovacao(c.id)}
                    >
                      {processandoId === c.id ? 'Reprovando...' : 'Confirmar reprovação'}
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-marca-ink/60 hover:text-marca-ink"
                      onClick={() => {
                        setReprovandoId(null)
                        setMotivo('')
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 border-t border-marca-ink/[.06] pt-3">
                  <button
                    type="button"
                    className={ui.botaoAprovar}
                    disabled={processandoId === c.id}
                    onClick={() => aprovar(c.id)}
                  >
                    {processandoId === c.id ? 'Aprovando...' : 'Aprovar'}
                  </button>
                  <button
                    type="button"
                    className={ui.botaoReprovar}
                    disabled={processandoId === c.id}
                    onClick={() => setReprovandoId(c.id)}
                  >
                    Reprovar
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
