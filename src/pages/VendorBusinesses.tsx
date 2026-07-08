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
          <h1 className="text-xl font-bold text-marca-roxo">Meus Negócios</h1>
          <p className="text-sm text-marca-roxo/70">
            Gerencie seus negócios e segmentos. Cada negócio passa por curadoria individualmente.
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-marca-roxo px-4 py-2 text-sm font-semibold text-white hover:bg-marca-roxoClaro transition"
        >
          <Plus className="h-4 w-4" /> Adicionar negócio
        </button>
      </div>

      {!loading && negocios.length === 0 && (
        <p className="py-10 text-center text-sm text-marca-roxo/60">
          Você ainda não cadastrou nenhum negócio.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {negocios.map((b) => (
          <div key={b.id} className="rounded-lg border border-marca-roxo/10 bg-white p-4 shadow-sm space-y-3">
            {b.imagem_url ? (
              <img src={b.imagem_url} alt={b.nome} className="h-32 w-full rounded-md object-cover" />
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-md bg-marca-roxo/5">
                <Store className="h-8 w-8 text-marca-roxo/30" />
              </div>
            )}
            <div className="flex items-center gap-2">
              {b.aprovado && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  Aprovado
                </span>
              )}
              <span className={`h-2 w-2 rounded-full ${b.ativo ? 'bg-green-500' : 'bg-gray-300'}`} title={b.ativo ? 'Ativo' : 'Inativo'} />
            </div>
            <div>
              <p className="font-semibold text-marca-roxo">{b.nome}</p>
              <p className="text-sm text-marca-roxo/70">{b.segmento}</p>
            </div>
            <button
              onClick={() => abrirEdicao(b)}
              className="w-full rounded-lg border border-marca-roxo text-marca-roxo py-1.5 text-sm font-semibold hover:bg-marca-roxo/5 transition"
            >
              Editar
            </button>
          </div>
        ))}
      </div>

      <Dialog.Root open={dialogAberto} onOpenChange={setDialogAberto}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-marca-roxo">
                {editando ? 'Editar negócio' : 'Adicionar negócio'}
              </Dialog.Title>
              <Dialog.Close className="text-marca-roxo/60 hover:text-marca-roxo">
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
