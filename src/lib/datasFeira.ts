export type FeiraRecorrencia = {
  dias_semana: number[] // 0=domingo .. 6=sábado
  data_inicio: string // YYYY-MM-DD
  data_fim: string // YYYY-MM-DD
}

// ponytail: trabalha em data local (new Date(y,m,d)) p/ evitar UTC-shift do parse de 'YYYY-MM-DD'.
function parseLocal(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Datas selecionáveis: caem nos dias_semana da recorrência, dentro de [data_inicio, data_fim],
// não no passado (>= hoje), ordenadas asc.
export function datasDisponiveis(fair: FeiraRecorrencia, hoje: Date): string[] {
  const dias = new Set(fair.dias_semana)
  if (dias.size === 0) return []

  const hojeLocal = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const inicio = parseLocal(fair.data_inicio)
  const fim = parseLocal(fair.data_fim)
  const cursor = inicio > hojeLocal ? inicio : hojeLocal

  const out: string[] = []
  for (const d = new Date(cursor); d <= fim; d.setDate(d.getDate() + 1)) {
    if (dias.has(d.getDay())) out.push(toISO(d))
  }
  return out
}
