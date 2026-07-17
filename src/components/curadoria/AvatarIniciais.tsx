import type { ReactNode } from 'react'
import { curadoriaUi } from './curadoriaUi'
import { iniciais } from '../../lib/formatacao'

export function AvatarIniciais({
  nome,
  className = curadoriaUi.avatar,
}: {
  nome: string | null | undefined
  className?: string
}) {
  return <div className={className}>{iniciais(nome)}</div>
}

export function MetaChip({ children }: { children: ReactNode }) {
  return <span className={curadoriaUi.chip}>{children}</span>
}
