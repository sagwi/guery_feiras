import { useCallback, useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Store, Plus } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import NegocioForm from '../components/NegocioForm'
import type { NegocioFormData } from '../components/NegocioForm'

type Business = {
  id: string
  nome: string
  segmento: string
  descricao: string
  imagem_url: string | null
  autoral: boolean
  cnpj: boolean
  instagram: string | null
  faixa_faturamento: string
  aprovado: boolean
  ativo: boolean
}

export default function VendorBusinesses() {
  const { user } = useAuth()
  const [negocios, setNegocios] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Business | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)

  const carregar = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .order('criado_em')
    if (error) { console.error('VendorBusinesses: falha ao carregar negócios', error); setLoading(false); return }
    setNegocios((data ?? []) as Business[])
    setLoading(false)
  }, [user?.id])

  useEffect(() => { carregar() }, [carregar])

  const abrirNovo = () => { setEditando(null); setDialogAberto(true) }
  const abrirEdicao = (b: Business) => { setEditando(b); setDialogAberto(true) }
  const onSaved = () => { setDialogAberto(false); carregar() }

  const initialForm: Partial<NegocioFormData> | undefined = editando
    ? {
        nome: editando.nome,
        segmento: editando.segmento as NegocioFormData['segmento'],
        descricao: editando.descricao,
        autoral: editando.autoral,
        cnpj: editando.cnpj,
        possuiInstagram: !!editando.instagram,
        instagram: editando.instagram ?? '',
        faixaFaturamento: editando.faixa_faturamento as NegocioFormData['faixaFaturamento'],
        imagemUrl: editando.imagem_url ?? '',
      }
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-marca-ink">Meus Negócios</h1>
          <p className="mt-0.5 text-sm text-marca-ink/60">
            Gerencie seus negócios e segmentos. Cada negócio passa por curadoria individualmente.
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-marca-acao px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover"
        >
          <Plus className="h-4 w-4" /> Adicionar negócio
        </button>
      </div>

      {!loading && negocios.length === 0 && (
        <p className="py-10 text-center text-sm text-marca-ink/60">
          Você ainda não cadastrou nenhum negócio.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {negocios.map((b) => (
          <div
            key={b.id}
            className="animate-fadeUp space-y-3 overflow-hidden rounded-card border border-marca-ink/[.07] bg-white p-4 shadow-card transition-transform duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            {b.imagem_url ? (
              <img src={b.imagem_url} alt={b.nome} className="h-32 w-full rounded-xl object-cover" />
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-xl bg-gradient-to-br from-marca-acao/90 to-marca-roxoDark [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.06)_0_8px,transparent_8px_16px),linear-gradient(135deg,#6D28D9,#2A1060)]">
                <Store className="h-8 w-8 text-white/40" />
              </div>
            )}
            <div className="flex items-center gap-2">
              {b.aprovado && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D6F5E9] px-2.5 py-1 text-xs font-semibold text-[#0B7A54]">
                  <span className="h-1.5 w-1.5 rounded-full bg-marca-verde" /> Aprovado
                </span>
              )}
              <span
                className={`h-2 w-2 rounded-full ${b.ativo ? 'bg-marca-verde' : 'bg-marca-ink/25'}`}
                title={b.ativo ? 'Ativo' : 'Inativo'}
              />
            </div>
            <div>
              <p className="font-display font-semibold text-marca-ink">{b.nome}</p>
              <p className="text-sm text-marca-ink/60">{b.segmento}</p>
            </div>
            <button
              onClick={() => abrirEdicao(b)}
              className="w-full rounded-xl border border-marca-acao/25 py-1.5 text-sm font-semibold text-marca-acao transition hover:bg-marca-acao/5"
            >
              Editar
            </button>
          </div>
        ))}
      </div>

      <Dialog.Root open={dialogAberto} onOpenChange={setDialogAberto}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-marca-roxoDeep/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card bg-white p-6 shadow-lift">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="font-display text-lg font-bold text-marca-ink">
                {editando ? 'Editar negócio' : 'Adicionar negócio'}
              </Dialog.Title>
              <Dialog.Close className="text-marca-ink/50 hover:text-marca-ink">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <NegocioForm initial={initialForm} businessId={editando?.id} onSaved={onSaved} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
