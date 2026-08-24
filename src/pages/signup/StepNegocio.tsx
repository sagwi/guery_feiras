import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check, X } from 'lucide-react'
import { FAIXAS_FATURAMENTO } from '../../lib/segmentos'
import { supabase } from '../../lib/supabase'
import { nichoObrigatorio, validarNichoComId } from '../../lib/nichoObrigatorio'

export const negocioSchema = z.object({
  nomeMarca: z.string().min(1, 'Informe o nome da marca'),
  possuiInstagram: z.boolean(),
  instagram: z.string().optional(),
  segmento: z.string().min(1, 'Selecione um segmento'),
  segmentoId: z.string().optional(),
  nichoId: z.string().optional(),
  produtos: z.array(z.string()),
  descricao: z.string().min(1, 'Descreva seu negócio'),
  faixaFaturamento: z.enum(FAIXAS_FATURAMENTO, { error: 'Selecione uma faixa' }),
}).refine((d) => !d.possuiInstagram || !!d.instagram?.trim(), {
  message: 'Informe o @ do Instagram',
  path: ['instagram'],
})

export type NegocioData = z.infer<typeof negocioSchema>

const input =
  'w-full rounded-xl border border-marca-ink/15 px-3.5 py-2.5 outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10'
const label = 'mb-1.5 block text-sm font-semibold text-marca-ink'
const erro = 'mt-1 text-sm text-marca-coral'
const checkboxRoot =
  'h-5 w-5 shrink-0 rounded-[6px] border border-marca-ink/30 flex items-center justify-center transition-colors data-[state=checked]:border-marca-acao data-[state=checked]:bg-marca-acao'

type SegmentoRow = { id: string; nome: string; ativo: boolean }
type NichoRow = { id: string; segmento_id: string; nome: string; ativo: boolean }

export default function StepNegocio({
  defaultValues,
  onNext,
  onBack,
}: {
  defaultValues?: Partial<NegocioData>
  onNext: (data: NegocioData) => void
  onBack: () => void
}) {
  const [segmentos, setSegmentos] = useState<SegmentoRow[]>([])
  const [nichos, setNichos] = useState<NichoRow[]>([])
  const [novoProduto, setNovoProduto] = useState('')
  const [erroExtra, setErroExtra] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NegocioData>({
    resolver: zodResolver(negocioSchema),
    defaultValues: { possuiInstagram: false, produtos: [], ...defaultValues },
  })

  const possuiInstagram = watch('possuiInstagram')
  const segmentoId = watch('segmentoId') ?? ''
  const nichoId = watch('nichoId') ?? ''
  const produtos = watch('produtos') ?? []

  useEffect(() => {
    let vivo = true
    Promise.all([
      supabase.from('segmentos').select('id,nome,ativo').eq('ativo', true).order('nome'),
      supabase.from('nichos').select('id,segmento_id,nome,ativo').eq('ativo', true).order('nome'),
    ]).then(([s, n]) => {
      if (!vivo) return
      setSegmentos((s.data ?? []) as SegmentoRow[])
      setNichos((n.data ?? []) as NichoRow[])
    })
    return () => {
      vivo = false
    }
  }, [])

  const nichosDoSegmento = useMemo(
    () => nichos.filter((n) => n.segmento_id === segmentoId && n.ativo),
    [nichos, segmentoId],
  )
  const exigeNicho = nichoObrigatorio(segmentoId, nichos)

  function escolherSegmento(id: string) {
    setValue('segmentoId', id)
    setValue('nichoId', '')
    setValue('segmento', segmentos.find((s) => s.id === id)?.nome ?? '', { shouldValidate: true })
  }

  function addProduto() {
    const nome = novoProduto.trim()
    if (!nome || produtos.includes(nome)) {
      setNovoProduto('')
      return
    }
    setValue('produtos', [...produtos, nome])
    setNovoProduto('')
  }

  function avancar(data: NegocioData) {
    const nichoErro = validarNichoComId(data.segmentoId || null, data.nichoId || null, nichos)
    if (nichoErro) {
      setErroExtra(nichoErro)
      return
    }
    if ((data.produtos ?? []).length === 0) {
      setErroExtra('Inclua pelo menos um produto.')
      return
    }
    setErroExtra(null)
    onNext(data)
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(avancar)}>
      <div>
        <label className={label}>Nome da marca</label>
        <input className={input} {...register('nomeMarca')} />
        {errors.nomeMarca && <p className={erro}>{errors.nomeMarca.message}</p>}
      </div>

      <div className="flex items-center gap-2">
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
              <Checkbox.Indicator>
                <Check className="h-4 w-4 text-white" />
              </Checkbox.Indicator>
            </Checkbox.Root>
          )}
        />
        <label htmlFor="possuiInstagram" className="text-sm text-marca-ink">
          Possuo Instagram
        </label>
      </div>

      {possuiInstagram && (
        <div>
          <label className={label}>@ do Instagram</label>
          <input className={input} placeholder="@minhamarca" {...register('instagram')} />
          {errors.instagram && <p className={erro}>{errors.instagram.message}</p>}
        </div>
      )}

      <div>
        <label className={label}>Segmento</label>
        <select className={input} value={segmentoId} onChange={(e) => escolherSegmento(e.target.value)}>
          <option value="">Selecione...</option>
          {segmentos.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <input type="hidden" {...register('segmento')} />
        {errors.segmento && <p className={erro}>{errors.segmento.message}</p>}
      </div>

      {exigeNicho && (
        <div>
          <label className={label}>Nicho</label>
          <select
            className={input}
            value={nichoId}
            onChange={(e) => setValue('nichoId', e.target.value)}
          >
            <option value="">Selecione...</option>
            {nichosDoSegmento.map((n) => (
              <option key={n.id} value={n.id}>{n.nome}</option>
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
              <button
                type="button"
                aria-label={`Remover ${p}`}
                onClick={() => setValue('produtos', produtos.filter((x) => x !== p))}
              >
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

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-marca-acao/25 py-2.5 font-semibold text-marca-acao transition hover:bg-marca-acao/5"
        >
          Voltar
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-marca-acao py-2.5 font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover"
        >
          Próximo
        </button>
      </div>
      {erroExtra && <p className={erro}>{erroExtra}</p>}
    </form>
  )
}
