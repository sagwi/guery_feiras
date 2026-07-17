import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, BadgeCheck, Phone, Mail, IdCard, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { iniciais } from '../../lib/formatacao'
import { curadoriaUi as ui, statusBadge } from '../../components/curadoria/curadoriaUi'
import { BarraBusca, BulkBar, Contadores } from '../../components/curadoria/CuradoriaToolbar'
import MotivoReprovacaoModal from '../../components/curadoria/MotivoReprovacaoModal'
import CuradoriaToast from '../../components/curadoria/CuradoriaToast'

type Cadastro = {
  id: string
  nome: string | null
  cpf: string | null
  email: string | null
  telefone: string | null
  curadoria_status: string
  criado_em: string
}

function formatarRecebido(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export default function CuradoriaCadastros() {
  const [cadastros, setCadastros] = useState<Cadastro[]>([])
  const [aprovadosCount, setAprovadosCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [sortDesc, setSortDesc] = useState(true)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [detail, setDetail] = useState<Cadastro | null>(null)
  const [rejectIds, setRejectIds] = useState<string[] | null>(null)
  const [motivo, setMotivo] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const [pendRes, aprRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,nome,cpf,email,telefone,curadoria_status,criado_em')
        .eq('curadoria_status', 'pendente')
        .order('criado_em', { ascending: false }),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('curadoria_status', 'aprovado'),
    ])
    if (pendRes.error) {
      console.error('CuradoriaCadastros: falha ao carregar', pendRes.error)
      setErro('Falha ao carregar cadastros: ' + pendRes.error.message)
      setCadastros([])
    } else {
      setCadastros((pendRes.data ?? []) as Cadastro[])
      setErro(null)
    }
    setAprovadosCount(aprRes.count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    let list = cadastros
    if (q) {
      list = list.filter(
        (c) =>
          (c.nome ?? '').toLowerCase().includes(q) ||
          (c.cpf ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q),
      )
    }
    list = [...list].sort((a, b) => {
      const da = new Date(a.criado_em).getTime()
      const db = new Date(b.criado_em).getTime()
      return sortDesc ? db - da : da - db
    })
    return list
  }, [cadastros, busca, sortDesc])

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected],
  )

  async function aprovarIds(ids: string[]) {
    if (!ids.length) return
    setProcessando(true)
    setErro(null)
    for (const id of ids) {
      const { error } = await supabase.from('profiles').update({ curadoria_status: 'aprovado' }).eq('id', id)
      if (error) {
        setErro('Falha ao aprovar: ' + error.message)
        setProcessando(false)
        return
      }
      await supabase.from('notifications').insert({
        user_id: id,
        tipo: 'cadastro_aprovado',
        titulo: 'Cadastro aprovado ✅',
        corpo: 'Seu cadastro foi aprovado pela curadoria. Você já pode participar das feiras.',
      })
    }
    setCadastros((prev) => prev.filter((c) => !ids.includes(c.id)))
    setAprovadosCount((n) => n + ids.length)
    setSelected({})
    setDetail(null)
    setProcessando(false)
    setToast(ids.length === 1 ? 'Cadastro aprovado' : `${ids.length} cadastros aprovados`)
  }

  async function confirmarReprovacao() {
    if (!rejectIds?.length || !motivo.trim()) return
    setProcessando(true)
    setErro(null)
    for (const id of rejectIds) {
      const { error } = await supabase
        .from('profiles')
        .update({ curadoria_status: 'reprovado', curadoria_motivo: motivo })
        .eq('id', id)
      if (error) {
        setErro('Falha ao reprovar: ' + error.message)
        setProcessando(false)
        return
      }
      await supabase.from('notifications').insert({
        user_id: id,
        tipo: 'cadastro_reprovado',
        titulo: 'Cadastro reprovado',
        corpo: motivo,
      })
    }
    setCadastros((prev) => prev.filter((c) => !rejectIds.includes(c.id)))
    setSelected({})
    setDetail(null)
    setRejectIds(null)
    setMotivo('')
    setProcessando(false)
    setToast(rejectIds.length === 1 ? 'Cadastro reprovado' : `${rejectIds.length} cadastros reprovados`)
  }

  function toggleAll(on: boolean) {
    const next: Record<string, boolean> = {}
    if (on) for (const c of filtrados) next[c.id] = true
    setSelected(next)
  }

  if (loading) return <p className="text-sm text-marca-ink/60">Carregando…</p>

  return (
    <div className={ui.page}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={ui.titulo}>Cadastros pendentes</h2>
          <p className={ui.subtitulo}>Aprove novos participantes da plataforma</p>
        </div>
        <Contadores
          items={[
            { valor: cadastros.length, label: 'Pendentes', cor: 'text-marca-acao' },
            { valor: aprovadosCount, label: 'Aprovados', cor: 'text-[#16A34A]' },
          ]}
        />
      </div>

      {erro && <p className={ui.erro}>{erro}</p>}

      <BarraBusca
        value={busca}
        onChange={setBusca}
        placeholder="Buscar por nome, CPF ou e-mail"
        sortLabel={sortDesc ? 'Mais recentes' : 'Mais antigos'}
        onToggleSort={() => setSortDesc((v) => !v)}
      />

      <BulkBar
        count={selectedIds.length}
        onApprove={() => aprovarIds(selectedIds)}
        onReject={() => {
          setMotivo('')
          setRejectIds(selectedIds)
        }}
        onClear={() => setSelected({})}
      />

      {filtrados.length === 0 && <p className={ui.empty}>Nenhum cadastro pendente.</p>}

      <div className="mb-1 flex items-center gap-2 text-[13px] text-marca-ink/50">
        <input
          type="checkbox"
          className="h-[18px] w-[18px] accent-marca-acao"
          checked={filtrados.length > 0 && selectedIds.length === filtrados.length}
          onChange={(e) => toggleAll(e.target.checked)}
        />
        Selecionar todos
      </div>

      <div className="grid gap-3.5 md:grid-cols-2">
        {filtrados.map((c) => (
          <article key={c.id} className={`${ui.card} ${ui.cardBody} !p-[18px_20px]`}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-[18px] w-[18px] accent-marca-acao"
                checked={!!selected[c.id]}
                onChange={(e) => setSelected((s) => ({ ...s, [c.id]: e.target.checked }))}
              />
              <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#EFE9FB] to-[#E3D8FA] text-sm font-bold text-marca-acao">
                {iniciais(c.nome)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[15.5px] font-bold text-marca-ink">{c.nome ?? 'Sem nome'}</p>
                    <p className="text-[12px] text-marca-ink/50">
                      Cadastro recebido em {formatarRecebido(c.criado_em)}
                    </p>
                  </div>
                  <span className={`${ui.badge} ${statusBadge.novo}`}>
                    <Sparkles className="h-3.5 w-3.5" /> Novo
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#FAF7F0] p-3 text-[13px]">
              <div>
                <p className={ui.labelUpper}>CPF</p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 font-medium tabular-nums text-marca-ink">
                  <IdCard className="h-3.5 w-3.5 text-marca-ink/40" /> {c.cpf ?? '—'}
                </p>
              </div>
              <div>
                <p className={ui.labelUpper}>Telefone</p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 font-medium tabular-nums text-marca-ink">
                  <Phone className="h-3.5 w-3.5 text-marca-ink/40" /> {c.telefone ?? '—'}
                </p>
              </div>
              <div className="col-span-2">
                <p className={ui.labelUpper}>E-mail</p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 font-medium text-marca-ink">
                  <Mail className="h-3.5 w-3.5 text-marca-ink/40" /> {c.email ?? '—'}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button type="button" className={ui.botaoSecundario} onClick={() => setDetail(c)}>
                <Eye className="h-4 w-4" /> Detalhes
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={ui.botaoAprovar}
                  disabled={processando}
                  onClick={() => aprovarIds([c.id])}
                >
                  <BadgeCheck className="h-4 w-4" /> Aprovar
                </button>
                <button
                  type="button"
                  className={ui.botaoReprovar}
                  disabled={processando}
                  onClick={() => {
                    setMotivo('')
                    setRejectIds([c.id])
                  }}
                >
                  Reprovar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {detail && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} max-w-[480px]`}>
            <div className={ui.modalHeader}>
              <p className="font-display text-lg font-bold text-marca-ink">{detail.nome}</p>
              <button type="button" className={ui.botaoSecundario} onClick={() => setDetail(null)}>
                Fechar
              </button>
            </div>
            <div className={`${ui.modalBody} space-y-2 text-sm`}>
              <p><span className="text-marca-ink/50">CPF:</span> {detail.cpf}</p>
              <p><span className="text-marca-ink/50">E-mail:</span> {detail.email}</p>
              <p><span className="text-marca-ink/50">Telefone:</span> {detail.telefone}</p>
              <p><span className="text-marca-ink/50">Recebido em:</span> {formatarRecebido(detail.criado_em)}</p>
            </div>
            <div className={`${ui.modalFooter} justify-end`}>
              <button
                type="button"
                className={ui.botaoReprovar}
                onClick={() => {
                  setMotivo('')
                  setRejectIds([detail.id])
                }}
              >
                Reprovar
              </button>
              <button type="button" className={ui.botaoAprovar} onClick={() => aprovarIds([detail.id])}>
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectIds && (
        <MotivoReprovacaoModal
          titulo={`Reprovar ${rejectIds.length > 1 ? `${rejectIds.length} cadastros` : 'cadastro'}`}
          motivo={motivo}
          onMotivo={setMotivo}
          onConfirm={confirmarReprovacao}
          onClose={() => {
            setRejectIds(null)
            setMotivo('')
          }}
          processando={processando}
        />
      )}

      <CuradoriaToast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
