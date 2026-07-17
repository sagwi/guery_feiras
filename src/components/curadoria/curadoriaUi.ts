/** Classes compartilhadas das telas de curadoria (cards inteligentes). */

export const curadoriaUi = {
  page: 'space-y-5',
  titulo: 'font-display text-xl font-bold text-marca-ink',
  subtitulo: 'text-sm text-marca-ink/60',
  card:
    'animate-fadeUp overflow-hidden rounded-card border border-marca-ink/[.07] bg-white shadow-card transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lift',
  cardBody: 'space-y-3 p-5',
  badge: 'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
  botaoAprovar:
    'rounded-xl bg-marca-acao px-4 py-2 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover disabled:opacity-50',
  botaoReprovar:
    'rounded-xl border border-marca-coral/50 px-4 py-2 text-sm font-semibold text-marca-coral transition hover:bg-marca-coral/5 disabled:opacity-50',
  botaoSecundario:
    'rounded-xl border border-marca-ink/15 px-4 py-2 text-sm font-semibold text-marca-ink/70 transition hover:bg-marca-ink/5 disabled:opacity-50',
  botaoPrimario:
    'rounded-xl bg-marca-acao px-4 py-2 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover disabled:opacity-50',
  textarea:
    'w-full rounded-xl border border-marca-ink/15 px-3.5 py-2.5 outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10',
  input:
    'w-full rounded-xl border border-marca-ink/15 px-3.5 py-2.5 text-sm outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10',
  select:
    'rounded-xl border border-marca-ink/15 px-3 py-2 text-sm outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10',
  erro: 'text-sm text-marca-coral',
  avatar:
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-marca-acao to-marca-roxoDark font-display text-sm font-bold text-white',
  meta: 'text-[13px] text-marca-ink/70',
  chip: 'rounded-full bg-[#EDE7FB] px-2.5 py-1 text-xs font-semibold text-marca-acao',
  empty: 'py-10 text-center text-sm text-marca-ink/60',
  tabTrigger:
    'px-4 py-2.5 text-sm font-semibold text-marca-ink/50 border-b-2 border-transparent transition-colors hover:text-marca-ink data-[state=active]:border-marca-acao data-[state=active]:text-marca-acao',
} as const
