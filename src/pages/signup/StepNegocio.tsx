import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { SEGMENTOS, FAIXAS_FATURAMENTO } from '../../lib/segmentos'

export const negocioSchema = z.object({
  nomeMarca: z.string().min(1, 'Informe o nome da marca'),
  possuiInstagram: z.boolean(),
  instagram: z.string().optional(),
  segmento: z.enum(SEGMENTOS, { error: 'Selecione um segmento' }),
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

export default function StepNegocio({
  defaultValues,
  onNext,
  onBack,
}: {
  defaultValues?: Partial<NegocioData>
  onNext: (data: NegocioData) => void
  onBack: () => void
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<NegocioData>({
    resolver: zodResolver(negocioSchema),
    defaultValues: { possuiInstagram: false, ...defaultValues },
  })

  const possuiInstagram = watch('possuiInstagram')

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onNext)}>
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
    </form>
  )
}
