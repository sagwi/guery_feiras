import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, MapPin, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { curadoriaUi } from '../../components/curadoria/curadoriaUi'

type Park = {
  id: string
  nome: string
  endereco: string | null
  regras: string | null
}

type Segmento = { id: string; nome: string; ativo: boolean }
type Nicho = { id: string; segmento_id: string; nome: string; ativo: boolean }

type Aba = 'locais' | 'segmentos'

export default function CuradoriaDefinicoes() {
  const [aba, setAba] = useState<Aba>('locais')
  const [parks, setParks] = useState<Park[]>([])
  const [segmentos, setSegmentos] = useState<Segmento[]>([])
  const [nichos, setNichos] = useState<Nicho[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [modalPark, setModalPark] = useState(false)
  const [editPark, setEditPark] = useState<Park | null>(null)
  const [parkForm, setParkForm] = useState({ nome: '', endereco: '', regras: '' })
  const [salvando, setSalvando] = useState(false)

  const [novoSegmento, setNovoSegmento] = useState('')
  const [aberto, setAberto] = useState<Record<string, boolean>>({})
  const [novoNicho, setNovoNicho] = useState<Record<string, string>>({})

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const [p, s, n] = await Promise.all([
      supabase.from('parks').select('id,nome,endereco,regras').order('nome'),
      supabase.from('segmentos').select('id,nome,ativo').order('nome'),
      supabase.from('nichos').select('id,segmento_id,nome,ativo').order('nome'),
    ])
    if (p.error) {
      console.error('CuradoriaDefinicoes: falha ao carregar locais', p.error)
      setErro('Falha ao carregar locais: ' + p.error.message)
    } else {
      setParks((p.data ?? []) as Park[])
    }
    if (s.error) {
      console.error('CuradoriaDefinicoes: falha ao carregar segmentos', s.error)
      setErro((e) => e ?? 'Falha ao carregar segmentos: ' + s.error.message)
    } else {
      setSegmentos((s.data ?? []) as Segmento[])
    }
    if (n.error) {
      console.error('CuradoriaDefinicoes: falha ao carregar nichos', n.error)
    } else {
      setNichos((n.data ?? []) as Nicho[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  function abrirNovoPark() {
    setEditPark(null)
    setParkForm({ nome: '', endereco: '', regras: '' })
    setModalPark(true)
  }

  function abrirEditPark(park: Park) {
    setEditPark(park)
    setParkForm({
      nome: park.nome,
      endereco: park.endereco ?? '',
      regras: park.regras ?? '',
    })
    setModalPark(true)
  }

  async function salvarPark() {
    if (!parkForm.nome.trim()) {
      setErro('Nome *')
      return
    }
    setSalvando(true)
    setErro(null)
    const row = {
      nome: parkForm.nome.trim(),
      endereco: parkForm.endereco.trim() || null,
      regras: parkForm.regras.trim() || null,
    }
    const { error } = editPark
      ? await supabase.from('parks').update(row).eq('id', editPark.id)
      : await supabase.from('parks').insert(row)
    setSalvando(false)
    if (error) {
      setErro(error.message)
      return
    }
    setModalPark(false)
    setToast(editPark ? 'Local atualizado' : 'Local criado')
    carregar()
  }

  async function criarSegmento() {
    const nome = novoSegmento.trim()
    if (!nome) return
    setSalvando(true)
    const { error } = await supabase.from('segmentos').insert({ nome })
    setSalvando(false)
    if (error) {
      setErro('Falha ao criar segmento: ' + error.message)
      return
    }
    setNovoSegmento('')
    setToast('Segmento criado')
    carregar()
  }

  async function toggleSegmento(seg: Segmento) {
    const { error } = await supabase
      .from('segmentos')
      .update({ ativo: !seg.ativo })
      .eq('id', seg.id)
    if (error) {
      setErro(error.message)
      return
    }
    carregar()
  }

  async function adicionarNicho(segmentoId: string) {
    const nome = (novoNicho[segmentoId] ?? '').trim()
    if (!nome) return
    const { error } = await supabase
      .from('nichos')
      .insert({ segmento_id: segmentoId, nome })
    if (error) {
      setErro(error.message)
      return
    }
    setNovoNicho((m) => ({ ...m, [segmentoId]: '' }))
    carregar()
  }

  async function toggleNicho(nicho: Nicho) {
    const { error } = await supabase
      .from('nichos')
      .update({ ativo: !nicho.ativo })
      .eq('id', nicho.id)
    if (error) {
      setErro(error.message)
      return
    }
    carregar()
  }

  const nichosPorSeg = (segmentoId: string) =>
    nichos.filter((n) => n.segmento_id === segmentoId)

  return (
    <div className={curadoriaUi.page}>
      <div>
        <h1 className={curadoriaUi.titulo}>Definições</h1>
        <p className={curadoriaUi.subtitulo}>Locais físicos e catálogo de segmentos/nichos.</p>
      </div>

      {toast && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          {toast}
        </p>
      )}
      {erro && <p className={curadoriaUi.erro}>{erro}</p>}

      <div className={curadoriaUi.segmentWrap}>
        <button
          type="button"
          className={aba === 'locais' ? curadoriaUi.segmentAtivo : curadoriaUi.segmentInativo}
          onClick={() => setAba('locais')}
        >
          Locais
        </button>
        <button
          type="button"
          className={aba === 'segmentos' ? curadoriaUi.segmentAtivo : curadoriaUi.segmentInativo}
          onClick={() => setAba('segmentos')}
        >
          Segmentos
        </button>
      </div>

      {loading && <p className={curadoriaUi.empty}>Carregando…</p>}

      {!loading && aba === 'locais' && (
        <div className="space-y-4">
          <button type="button" className={curadoriaUi.botaoPrimario} onClick={abrirNovoPark}>
            <Plus className="h-4 w-4" /> Novo local
          </button>
          {parks.length === 0 && <p className={curadoriaUi.empty}>Nenhum local ainda.</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parks.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => abrirEditPark(p)}
                className={`${curadoriaUi.card} ${curadoriaUi.cardBody} text-left`}
              >
                <div className="mb-2 flex items-center gap-2 text-marca-acao">
                  <MapPin className="h-4 w-4" />
                  <span className="font-bold text-marca-ink">{p.nome}</span>
                </div>
                {p.endereco && (
                  <p className="text-sm text-marca-ink/70">{p.endereco}</p>
                )}
                {p.regras && (
                  <p className="mt-2 line-clamp-3 text-xs text-marca-ink/55">{p.regras}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && aba === 'segmentos' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              className={`${curadoriaUi.input} max-w-xs flex-1`}
              placeholder="Novo segmento…"
              value={novoSegmento}
              onChange={(e) => setNovoSegmento(e.target.value)}
            />
            <button
              type="button"
              className={curadoriaUi.botaoPrimario}
              disabled={salvando}
              onClick={criarSegmento}
            >
              Adicionar
            </button>
          </div>
          {segmentos.length === 0 && (
            <p className={curadoriaUi.empty}>Nenhum segmento. Crie o primeiro.</p>
          )}
          <div className="space-y-2">
            {segmentos.map((seg) => {
              const lista = nichosPorSeg(seg.id)
              const isOpen = aberto[seg.id] ?? false
              return (
                <div key={seg.id} className={`${curadoriaUi.card} ${curadoriaUi.cardBody}`}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <button
                      type="button"
                      className="flex items-center gap-2 font-bold text-marca-ink"
                      onClick={() => setAberto((m) => ({ ...m, [seg.id]: !isOpen }))}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className={seg.ativo ? '' : 'text-marca-ink/40 line-through'}>
                        {seg.nome}
                      </span>
                      <span className="text-xs font-semibold text-marca-ink/50">
                        {lista.length} nicho{lista.length === 1 ? '' : 's'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={curadoriaUi.botaoSecundario}
                      onClick={() => toggleSegmento(seg)}
                    >
                      {seg.ativo ? 'Inativar' : 'Ativar'}
                    </button>
                  </div>
                  {isOpen && (
                    <div className="mt-3 space-y-2 border-t border-[#E7E0D2] pt-3">
                      {lista.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className={n.ativo ? '' : 'text-marca-ink/40 line-through'}>
                            {n.nome}
                          </span>
                          <button
                            type="button"
                            className={curadoriaUi.botaoSecundario}
                            onClick={() => toggleNicho(n)}
                          >
                            {n.ativo ? 'Inativar' : 'Ativar'}
                          </button>
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <input
                          className={`${curadoriaUi.input} max-w-xs flex-1`}
                          placeholder="Novo nicho"
                          value={novoNicho[seg.id] ?? ''}
                          onChange={(e) =>
                            setNovoNicho((m) => ({ ...m, [seg.id]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          className={curadoriaUi.botaoSecundario}
                          onClick={() => adicionarNicho(seg.id)}
                        >
                          Adicionar nicho
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modalPark && (
        <div className={curadoriaUi.overlay} role="dialog" aria-modal="true">
          <div className={curadoriaUi.modal}>
            <div className={curadoriaUi.modalHeader}>
              <h2 className="font-display text-lg font-bold text-marca-ink">
                {editPark ? 'Editar local' : 'Novo local'}
              </h2>
              <button type="button" onClick={() => setModalPark(false)}>
                Fechar
              </button>
            </div>
            <div className={`${curadoriaUi.modalBody} space-y-3`}>
              <div>
                <label className={curadoriaUi.label}>Nome *</label>
                <input
                  className={curadoriaUi.input}
                  value={parkForm.nome}
                  onChange={(e) => setParkForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex.: Parque Dona Lindu"
                />
              </div>
              <div>
                <label className={curadoriaUi.label}>Endereço</label>
                <input
                  className={curadoriaUi.input}
                  value={parkForm.endereco}
                  onChange={(e) => setParkForm((f) => ({ ...f, endereco: e.target.value }))}
                  placeholder="Av. …, Recife"
                />
              </div>
              <div>
                <label className={curadoriaUi.label}>Regras do Local</label>
                <textarea
                  className={`${curadoriaUi.textarea} min-h-[88px]`}
                  value={parkForm.regras}
                  onChange={(e) => setParkForm((f) => ({ ...f, regras: e.target.value }))}
                  placeholder="Normas do lugar físico (acesso, montagem, etc.)"
                />
              </div>
            </div>
            <div className={curadoriaUi.modalFooter}>
              <button
                type="button"
                className={curadoriaUi.botaoSecundario}
                onClick={() => setModalPark(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={curadoriaUi.botaoPrimario}
                disabled={salvando}
                onClick={salvarPark}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
