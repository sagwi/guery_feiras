import type { ReactNode } from 'react'
import { curadoriaUi } from './curadoriaUi'
import { iniciais } from '../../lib/formatacao'

const AVATAR_DEFAULT =
  'flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#F3EEFF] to-[#E9E1FB] text-sm font-bold text-marca-acao'

export function AvatarIniciais({
  nome,
  className = AVATAR_DEFAULT,
}: {
  nome: string | null | undefined
  className?: string
}) {
  return <div className={className}>{iniciais(nome)}</div>
}

export function MetaChip({ children }: { children: ReactNode }) {
  return <span className={curadoriaUi.chip}>{children}</span>
}
