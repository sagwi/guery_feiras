import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check, X } from 'lucide-react'
import { FAIXAS_FATURAMENTO } from '../lib/segmentos'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { nichoObrigatorio, validarNichoComId } from '../lib/nichoObrigatorio'
import { negocioFormSchema, type NegocioFormData } from './negocioForm.schema'

export { negocioFormSchema, type NegocioFormData }

type SegmentoRow = { id: string; nome: string; ativo: boolean }
type NichoRow = { id: string; segmento_id: string; nome: string; ativo: boolean }

const input =
  'w-full rounded-xl border border-marca-ink/15 px-3.5 py-2.5 outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10'
const label = 'mb-1.5 block text-sm font-semibold text-marca-ink'
const erro = 'mt-1 text-sm text-marca-coral'
const checkboxRow = 'flex items-center gap-2'
const checkboxRoot =
  'h-5 w-5 shrink-0 rounded-[6px] border border-marca-ink/30 flex items-center justify-center transition-colors data-[state=checked]:border-marca-acao data-[state=checked]:bg-marca-acao'

async function substituirProdutos(businessId: string, nomes: string[]) {
  const { error: delErr } = await supabase.from('business_produtos').delete().eq('business_id', businessId)
  if (delErr) return delErr
  const rows = nomes.map((nome, ordem) => ({ business_id: businessId, nome, ordem }))
  if (rows.length === 0) return null
  const { error } = await supabase.from('business_produtos').insert(rows)
  return error
}

export default function NegocioForm({
  initial,
  businessId,
  onSaved,
}: {
  initial?: Partial<NegocioFormData> & { segmentoId?: string; nichoId?: string; produtos?: string[] }
  businessId?: string
  onSaved: () => void
}) {
  const { user } = useAuth()
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  const [segmentos, setSegmentos] = useState<SegmentoRow[]>([])
  const [nichos, setNichos] = useState<NichoRow[]>([])
  const [segmentoId, setSegmentoId] = useState(initial?.segmentoId ?? '')
  const [nichoId, setNichoId] = useState(initial?.nichoId ?? '')
  const [produtos, setProdutos] = useState<string[]>(initial?.produtos ?? [])
  const [novoProduto, setNovoProduto] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NegocioFormData>({
    resolver: zodResolver(negocioFormSchema),
    defaultValues: { possuiInstagram: false, autoral: false, cnpj: false, imagemUrl: '', ...initial },
  })

  const possuiInstagram = watch('possuiInstagram')

  useEffect(() => {
    let vivo = true
    Promise.all([
      supabase.from('segmentos').select('id,nome,ativo').eq('ativo', true).order('nome'),
      supabase.from('nichos').select('id,segmento_id,nome,ativo').eq('ativo', true).order('nome'),
    ]).then(([s, n]) => {
      if (!vivo) return
      if (s.error) console.error('NegocioForm: segmentos', s.error)
      if (n.error) console.error('NegocioForm: nichos', n.error)
      setSegmentos((s.data ?? []) as SegmentoRow[])
      setNichos((n.data ?? []) as NichoRow[])
    })
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    if (!businessId) return
    let vivo = true
    Promise.all([
      supabase.from('businesses').select('segmento_id,nicho_id').eq('id', businessId).maybeSingle(),
      supabase.from('business_produtos').select('nome,ordem').eq('business_id', businessId).order('ordem'),
    ]).then(([b, p]) => {
      if (!vivo) return
      if (b.data?.segmento_id) setSegmentoId(b.data.segmento_id as string)
      if (b.data?.nicho_id) setNichoId(b.data.nicho_id as string)
      if (p.data) setProdutos(p.data.map((row) => row.nome as string))
    })
    return () => {
      vivo = false
    }
  }, [businessId])

  const nichosDoSegmento = useMemo(
    () => nichos.filter((n) => n.segmento_id === segmentoId && n.ativo),
    [nichos, segmentoId],
  )
  const exigeNicho = nichoObrigatorio(segmentoId, nichos)

  function escolherSegmento(id: string) {
    setSegmentoId(id)
    setNichoId('')
    const nome = segmentos.find((s) => s.id === id)?.nome ?? ''
    setValue('segmento', nome, { shouldValidate: true })
  }

  function addProduto() {
    const nome = novoProduto.trim()
    if (!nome) return
    if (produtos.includes(nome)) {
      setNovoProduto('')
      return
    }
    setProdutos((prev) => [...prev, nome])
    setNovoProduto('')
  }

  const onSubmit = async (data: NegocioFormData) => {
    setErroSalvar(null)
    const nichoErro = validarNichoComId(segmentoId || null, nichoId || null, nichos)
    if (nichoErro) {
      setErroSalvar(nichoErro)
      return
    }
    if (produtos.length === 0) {
      setErroSalvar('Inclua pelo menos um produto.')
      return
    }
    const payload = {
      nome: data.nome,
      segmento: data.segmento,
      segmento_id: segmentoId || null,
      nicho_id: nichoId || null,
      descricao: data.descricao,
      autoral: data.autoral,
      cnpj: data.cnpj,
      instagram: data.possuiInstagram ? (data.instagram || null) : null,
      faixa_faturamento: data.faixaFaturamento,
      imagem_url: data.imagemUrl || null,
    }
    let id = businessId
    if (businessId) {
      const { error } = await supabase.from('businesses').update(payload).eq('id', businessId)
      if (error) {
        setErroSalvar(error.message)
        return
      }
    } else {
      const { data: row, error } = await supabase
        .from('businesses')
        .insert({ ...payload, user_id: user?.id })
        .select('id')
        .single()
      if (error || !row) {
        setErroSalvar(error?.message ?? 'Falha ao criar negócio')
        return
      }
      id = row.id as string
    }
    const prodErr = await substituirProdutos(id!, produtos)
    if (prodErr) {
      setErroSalvar(prodErr.message)
      return
    }
    onSaved()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className={label}>Nome do negócio</label>
        <input className={input} {...register('nome')} />
        {errors.nome && <p className={erro}>{errors.nome.message}</p>}
      </div>

      <div>
        <label className={label}>Segmento</label>
        <select
          className={input}
          value={segmentoId}
          onChange={(e) => escolherSegmento(e.target.value)}
        >
          <option value="">Selecione...</option>
          {segmentos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
        <input type="hidden" {...register('segmento')} />
        {errors.segmento && <p className={erro}>{errors.segmento.message}</p>}
      </div>

      {exigeNicho && (
        <div>
          <label className={label}>Nicho</label>
          <select className={input} value={nichoId} onChange={(e) => setNichoId(e.target.value)}>
            <option value="">Selecione...</option>
            {nichosDoSegmento.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={label}>Produtos</label>
        <div className="flex gap-2">
          <input
            className={input}
            value={novoProduto}
            placeholder="Ex.: vela de soja"
            onChange={(e) => setNovoProduto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addProduto()
              }
            }}
          />
          <button
            type="button"
            onClick={addProduto}
            className="shrink-0 rounded-xl border border-marca-acao/30 px-3 text-sm font-semibold text-marca-acao"
          >
            Adicionar
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {produtos.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 rounded-full bg-marca-acao/10 px-2.5 py-1 text-xs font-semibold text-marca-acao"
            >
              {p}
              <button type="button" aria-label={`Remover ${p}`} onClick={() => setProdutos((xs) => xs.filter((x) => x !== p))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className={label}>Descrição do negócio</label>
        <textarea className={input} rows={3} {...register('descricao')} />
        {errors.descricao && <p className={erro}>{errors.descricao.message}</p>}
      </div>

      <div>
        <label className={label}>Faixa de faturamento mensal</label>
        <select className={input} {...register('faixaFaturamento')}>
          <option value="">Selecione...</option>
          {FAIXAS_FATURAMENTO.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        {errors.faixaFaturamento && <p className={erro}>{errors.faixaFaturamento.message}</p>}
      </div>

      <div>
        <label className={label}>Imagem (URL)</label>
        <input className={input} placeholder="https://..." {...register('imagemUrl')} />
        {errors.imagemUrl && <p className={erro}>{errors.imagemUrl.message}</p>}
      </div>

      <div className={checkboxRow}>
        <Controller
          name="autoral"
          control={control}
          render={({ field }) => (
            <Checkbox.Root
              id="autoral"
              checked={field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
              className={checkboxRoot}
            >
              <Checkbox.Indicator><Check className="h-4 w-4 text-white" /></Checkbox.Indicator>
            </Checkbox.Root>
          )}
        />
        <label htmlFor="autoral" className="text-sm text-marca-ink">Produção autoral</label>
      </div>

      <div className={checkboxRow}>
        <Controller
          name="cnpj"
          control={control}
          render={({ field }) => (
            <Checkbox.Root
              id="cnpj"
              checked={field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
              className={checkboxRoot}
            >
              <Checkbox.Indicator><Check className="h-4 w-4 text-white" /></Checkbox.Indicator>
            </Checkbox.Root>
          )}
        />
        <label htmlFor="cnpj" className="text-sm text-marca-ink">Possuo CNPJ</label>
      </div>

      <div className={checkboxRow}>
        <Controller
          name="possuiInstagram"
          control={control}
          render={({ field }) => (
            <Checkbox.Root
              id="possuiInstagram"
              checked={field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
              className={checkboxRoot}
            >
              <Checkbox.Indicator><Check className="h-4 w-4 text-white" /></Checkbox.Indicator>
            </Checkbox.Root>
          )}
        />
        <label htmlFor="possuiInstagram" className="text-sm text-marca-ink">Possuo Instagram</label>
      </div>

      {possuiInstagram && (
        <div>
          <label className={label}>@ do Instagram</label>
          <input className={input} placeholder="@minhamarca" {...register('instagram')} />
          {errors.instagram && <p className={erro}>{errors.instagram.message}</p>}
        </div>
      )}

      {erroSalvar && <p className={erro}>{erroSalvar}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-marca-acao py-2.5 font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover disabled:opacity-60"
      >
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  )
}
