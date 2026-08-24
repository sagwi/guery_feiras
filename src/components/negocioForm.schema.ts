import { z } from 'zod'
import { FAIXAS_FATURAMENTO } from '../lib/segmentos'

export const negocioFormSchema = z.object({
  nome: z.string().min(1, 'Informe o nome do negócio'),
  segmento: z.string().min(1, 'Selecione um segmento'),
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
