import { useCallback, useEffect, useState } from 'react'
import { Heart, Pin, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabase'
import { sortAvisos, validateAvisoPayload } from '../../lib/avisos'
import AvisoFeedCard, { avisoFeedRowClass } from '../../components/AvisoFeedCard'
import { curadoriaUi } from '../../components/curadoria/curadoriaUi'

type Aviso = {
  id: string
  autor_id: string
  titulo: string
  corpo: string
  imagem_url: string | null
  fixo: boolean
  criado_em: string
}

const vazio = { titulo: '', corpo: '', imagem_url: null as string | null, fixo: false }

export default function CuradoriaAvisos() {
  const { user } = useAuth()
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [contagens, setContagens] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(vazio)
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('avisos')
      .select('id,autor_id,titulo,corpo,imagem_url,fixo,criado_em')
      .order('fixo', { ascending: false })
      .order('criado_em', { ascending: false })
    if (error) {
      console.error('CuradoriaAvisos: falha ao carregar', error)
      setErro('Falha ao carregar avisos: ' + error.message)
      setAvisos([])
      setLoading(false)
      return
    }
    const lista = sortAvisos((data ?? []) as Aviso[])
    setAvisos(lista)
    setErro(null)

    const ids = lista.map((a) => a.id)
    if (ids.length > 0) {
      const { data: reac, error: reacErr } = await supabase
        .from('aviso_reacoes')
        .select('aviso_id')
        .in('aviso_id', ids)
      if (reacErr) {
        console.error('CuradoriaAvisos: falha ao carregar reações', reacErr)
      } else {
        const mapa: Record<string, number> = {}
        for (const r of reac ?? []) {
          mapa[r.aviso_id] = (mapa[r.aviso_id] ?? 0) + 1
        }
        setContagens(mapa)
      }
    } else {
      setContagens({})
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  function abrirNovo() {
    setForm(vazio)
    setErro(null)
    setModalAberto(true)
  }

  async function publicar() {
    if (!user?.id) return
    const payload = validateAvisoPayload(form)
    if ('error' in payload) {
      setErro(payload.error)
      return
    }
    setSalvando(true)
    setErro(null)
    const { error } = await supabase.from('avisos').insert({ autor_id: user.id, ...payload })
    setSalvando(false)
    if (error) {
      console.error('CuradoriaAvisos: falha ao publicar', error)
      setErro('Falha ao publicar: ' + error.message)
      return
    }
    setModalAberto(false)
    setToast('Aviso publicado.')
    carregar()
  }

  async function toggleFixo(aviso: Aviso) {
    const { error } = await supabase
      .from('avisos')
      .update({ fixo: !aviso.fixo })
      .eq('id', aviso.id)
    if (error) {
      setErro('Falha ao fixar: ' + error.message)
      return
    }
    carregar()
  }

  async function excluir(aviso: Aviso) {
    if (!confirm(`Excluir o aviso "${aviso.titulo}"?`)) return
    const { error } = await supabase.from('avisos').delete().eq('id', aviso.id)
    if (error) {
      setErro('Falha ao excluir: ' + error.message)
      return
    }
    setToast('Aviso excluído.')
    carregar()
  }

  return (
    <div className={curadoriaUi.page}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={curadoriaUi.titulo}>Avisos</h1>
          <p className={curadoriaUi.subtitulo}>
            Publique no feed da Home do expositor (imagem + texto). Sem comentários.
          </p>
        </div>
        <button type="button" className={curadoriaUi.botaoPrimario} onClick={abrirNovo}>
          <Plus className="h-4 w-4" /> Novo aviso
        </button>
      </div>

      {toast && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          {toast}
        </p>
      )}
      {erro && !modalAberto && <p className={curadoriaUi.erro}>{erro}</p>}

      {loading && <p className={curadoriaUi.empty}>Carregando avisos…</p>}
      {!loading && avisos.length === 0 && (
        <p className={curadoriaUi.empty}>Nenhum aviso ainda. Publique o primeiro.</p>
      )}

      <div className={avisoFeedRowClass}>
        {avisos.map((a) => (
          <AvisoFeedCard
            key={a.id}
            titulo={a.titulo}
            corpo={a.corpo}
            imagem_url={a.imagem_url}
            fixo={a.fixo}
            criado_em={a.criado_em}
            footer={
              <div className="flex shrink-0 items-center gap-1">
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-marca-ink/50">
                  <Heart className="h-3 w-3" />
                  {contagens[a.id] ?? 0}
                </span>
                <button
                  type="button"
                  className="rounded-xl p-1.5 text-marca-acao hover:bg-[#F3EEFF]"
                  onClick={() => toggleFixo(a)}
                  title={a.fixo ? 'Desafixar' : 'Fixar no topo'}
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded-xl p-1.5 text-marca-coral hover:bg-orange-50"
                  onClick={() => excluir(a)}
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            }
          />
        ))}
      </div>

      {modalAberto && (
        <div className={curadoriaUi.overlay} role="dialog" aria-modal="true">
          <div className={curadoriaUi.modal}>
            <div className={curadoriaUi.modalHeader}>
              <h2 className="font-display text-lg font-bold text-marca-ink">Novo aviso</h2>
              <button
                type="button"
                className="text-marca-ink/50 hover:text-marca-ink"
                onClick={() => setModalAberto(false)}
              >
                Fechar
              </button>
            </div>
            <div className={`${curadoriaUi.modalBody} space-y-4`}>
              {erro && <p className={curadoriaUi.erro}>{erro}</p>}
              <div>
                <label className={curadoriaUi.label} htmlFor="aviso-titulo">
                  Título *
                </label>
                <input
                  id="aviso-titulo"
                  className={curadoriaUi.input}
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ex.: Feira de domingo"
                />
              </div>
              <div>
                <label className={curadoriaUi.label} htmlFor="aviso-corpo">
                  Mensagem *
                </label>
                <textarea
                  id="aviso-corpo"
                  className={`${curadoriaUi.textarea} min-h-[100px]`}
                  value={form.corpo}
                  onChange={(e) => setForm((f) => ({ ...f, corpo: e.target.value }))}
                  placeholder="Mensagem para os expositores…"
                />
              </div>
              <div>
                <label className={curadoriaUi.label} htmlFor="aviso-img">
                  URL da imagem (opcional, 1:1)
                </label>
                {/* ponytail: upload Storage fica para depois; demo aceita URL pública */}
                <input
                  id="aviso-img"
                  className={curadoriaUi.input}
                  value={form.imagem_url ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imagem_url: e.target.value || null }))
                  }
                  placeholder="https://…"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-marca-ink">
                <input
                  type="checkbox"
                  checked={form.fixo}
                  onChange={(e) => setForm((f) => ({ ...f, fixo: e.target.checked }))}
                />
                Fixar no topo
              </label>
            </div>
            <div className={curadoriaUi.modalFooter}>
              <button
                type="button"
                className={curadoriaUi.botaoSecundario}
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={curadoriaUi.botaoPrimario}
                disabled={salvando}
                onClick={publicar}
              >
                {salvando ? 'Publicando…' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
