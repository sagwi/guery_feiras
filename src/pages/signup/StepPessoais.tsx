import { z } from 'zod'
import { useForm } from 'react-hook-form'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { validarCPF } from '../../lib/cpf'

function idade(nascimento: string): number {
  const nasc = new Date(nascimento)
  if (Number.isNaN(nasc.getTime())) return -1
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const aindaNaoFezAniversario =
    hoje.getMonth() < nasc.getMonth() ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())
  if (aindaNaoFezAniversario) idade--
  return idade
}

export const pessoaisSchema = z.object({
  nome: z.string().min(1, 'Informe seu nome'),
  cpf: z.string().refine(validarCPF, 'CPF inválido'),
  nascimento: z.string().refine((d) => idade(d) >= 18, 'É preciso ser maior de 18 anos'),
  telefone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

export type PessoaisData = z.infer<typeof pessoaisSchema>

function maskCPF(v: string) {
  return v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskTelefone(v: string) {
  return v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

function withMask(field: UseFormRegisterReturn, mask: (v: string) => string) {
  return {
    ...field,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = mask(e.target.value)
      return field.onChange(e)
    },
  }
}

const input = 'w-full rounded-lg border border-marca-roxo/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-marca-amarelo'
const label = 'block text-sm font-medium text-marca-roxo mb-1'
const erro = 'text-sm text-red-600 mt-1'

export default function StepPessoais({
  defaultValues,
  onNext,
}: {
  defaultValues?: Partial<PessoaisData>
  onNext: (data: PessoaisData) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PessoaisData>({ resolver: zodResolver(pessoaisSchema), defaultValues })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onNext)}>
      <div>
        <label className={label}>Nome completo</label>
        <input className={input} {...register('nome')} />
        {errors.nome && <p className={erro}>{errors.nome.message}</p>}
      </div>
      <div>
        <label className={label}>CPF</label>
        <input className={input} inputMode="numeric" {...withMask(register('cpf'), maskCPF)} />
        {errors.cpf && <p className={erro}>{errors.cpf.message}</p>}
      </div>
      <div>
        <label className={label}>Data de nascimento</label>
        <input className={input} type="date" {...register('nascimento')} />
        {errors.nascimento && <p className={erro}>{errors.nascimento.message}</p>}
      </div>
      <div>
        <label className={label}>Telefone</label>
        <input className={input} inputMode="numeric" {...withMask(register('telefone'), maskTelefone)} />
        {errors.telefone && <p className={erro}>{errors.telefone.message}</p>}
      </div>
      <div>
        <label className={label}>E-mail</label>
        <input className={input} type="email" {...register('email')} />
        {errors.email && <p className={erro}>{errors.email.message}</p>}
      </div>
      <div>
        <label className={label}>Senha</label>
        <input className={input} type="password" {...register('senha')} />
        {errors.senha && <p className={erro}>{errors.senha.message}</p>}
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-marca-roxo text-white py-2 font-semibold hover:bg-marca-roxoClaro transition"
      >
        Próximo
      </button>
    </form>
  )
}
