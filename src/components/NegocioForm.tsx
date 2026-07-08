import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { SEGMENTOS, FAIXAS_FATURAMENTO } from '../lib/segmentos'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

export const negocioFormSchema = z.object({
  nome: z.string().min(1, 'Informe o nome do negócio'),
  segmento: z.enum(SEGMENTOS, { error: 'Selecione um segmento' }),
  descricao: z.string().min(1, 'Descreva seu negócio'),
  autoral: z.boolean(),
  cnpj: z.boolean(),
  possuiInstagram: z.boolean(),
  instagram: z.string().optional(),
  faixaFaturamento: z.enum(FAIXAS_FATURAMENTO, { error: 'Selecione uma faixa' }),
  imagemUrl: z.string().url('URL inválida').optional().or(z.literal('')),
}).refine((d) => !d.possuiInstagram || !!d.instagram?.trim(), {
  message: 'Informe o @ do Instagram',
  path: ['instagram'],
})

export type NegocioFormData = z.infer<typeof negocioFormSchema>

const input = 'w-full rounded-lg border border-marca-roxo/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-marca-amarelo'
const label = 'block text-sm font-medium text-marca-roxo mb-1'
const erro = 'text-sm text-red-600 mt-1'
const checkboxRow = 'flex items-center gap-2'
const checkboxRoot = 'h-5 w-5 rounded border border-marca-roxo/40 flex items-center justify-center data-[state=checked]:bg-marca-roxo'

export default function NegocioForm({
  initial,
  businessId,
  onSaved,
}: {
  initial?: Partial<NegocioFormData>
  businessId?: string
  onSaved: () => void
}) {
  const { user } = useAuth()
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NegocioFormData>({
    resolver: zodResolver(negocioFormSchema),
    defaultValues: { possuiInstagram: false, autoral: false, cnpj: false, imagemUrl: '', ...initial },
  })

  const possuiInstagram = watch('possuiInstagram')

  const onSubmit = async (data: NegocioFormData) => {
    setErroSalvar(null)
    const payload = {
      nome: data.nome,
      segmento: data.segmento,
      descricao: data.descricao,
      autoral: data.autoral,
      cnpj: data.cnpj,
      instagram: data.possuiInstagram ? (data.instagram || null) : null,
      faixa_faturamento: data.faixaFaturamento,
      imagem_url: data.imagemUrl || null,
    }
    const { error } = businessId
      ? await supabase.from('businesses').update(payload).eq('id', businessId)
      : await supabase.from('businesses').insert({ ...payload, user_id: user?.id })
    if (error) { setErroSalvar(error.message); return }
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
        <select className={input} {...register('segmento')}>
          <option value="">Selecione...</option>
          {SEGMENTOS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {errors.segmento && <p className={erro}>{errors.segmento.message}</p>}
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
        {/* ponytail: imagem_url é URL de texto — upload p/ Storage fica p/ polish. */}
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
        <label htmlFor="autoral" className="text-sm text-marca-roxo">Produção autoral</label>
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
        <label htmlFor="cnpj" className="text-sm text-marca-roxo">Possuo CNPJ</label>
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
        <label htmlFor="possuiInstagram" className="text-sm text-marca-roxo">Possuo Instagram</label>
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
        className="w-full rounded-lg bg-marca-roxo text-white py-2 font-semibold hover:bg-marca-roxoClaro transition disabled:opacity-60"
      >
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  )
}
