/** Classes e tokens compartilhados — curadoria hifi (design handoff). */

export const curadoriaUi = {
  page: 'flex flex-col gap-[18px]',
  titulo: 'font-display text-[26px] font-bold leading-tight text-marca-ink',
  subtitulo: 'text-sm text-marca-ink/60',
  card:
    'animate-fadeUp rounded-[16px] border border-[rgba(30,10,60,.06)] bg-white shadow-[0_6px_18px_rgba(30,10,60,.05)] transition hover:-translate-y-0.5 hover:border-[#D9C9FF] hover:shadow-[0_12px_28px_rgba(109,40,217,.12)]',
  cardBody: 'p-5',
  badge: 'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold',
  botaoAprovar:
    'inline-flex items-center gap-1.5 rounded-[10px] bg-marca-acao px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(109,40,217,.26)] transition hover:bg-[#5B21B6] disabled:opacity-50',
  botaoReprovar:
    'inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-[#FDBA74] bg-white px-4 py-2.5 text-[13px] font-bold text-[#F97316] transition hover:bg-[#FFF7ED] disabled:opacity-50',
  botaoSecundario:
    'inline-flex items-center gap-1.5 rounded-[10px] border border-[#E7E0D2] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-marca-ink/60 transition hover:bg-[#F6F1E7] disabled:opacity-50',
  botaoPrimario:
    'inline-flex items-center gap-1.5 rounded-xl bg-marca-acao px-5 py-3 text-[14.5px] font-bold text-white shadow-[0_6px_16px_rgba(109,40,217,.28)] transition hover:bg-[#5B21B6] disabled:opacity-50',
  input:
    'h-11 w-full rounded-[11px] border border-[#E7E0D2] bg-white px-3.5 text-sm text-marca-ink outline-none transition placeholder:text-[#A8A2B8] focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10',
  textarea:
    'w-full rounded-[11px] border border-[#E7E0D2] bg-white px-3.5 py-2.5 text-sm text-marca-ink outline-none transition placeholder:text-[#A8A2B8] focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10',
  select:
    'h-11 rounded-[11px] border border-[#E7E0D2] bg-white px-3 text-sm text-marca-ink outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10',
  label: 'mb-1.5 block text-[12.5px] font-semibold text-marca-ink/60',
  labelUpper: 'text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[#8B849E]',
  erro: 'text-sm text-marca-coral',
  empty: 'py-10 text-center text-sm text-marca-ink/60',
  chip: 'rounded-[9px] bg-[#F3EEFF] px-3 py-1.5 text-[13px] font-semibold text-marca-acao',
  tabTrigger:
    'inline-flex items-center gap-1.5 border-b-[2.5px] border-transparent px-4 py-3 text-sm font-semibold text-marca-ink/60 transition hover:text-marca-ink data-[state=active]:border-marca-acao data-[state=active]:font-bold data-[state=active]:text-marca-acao',
  contador:
    'min-w-[96px] rounded-[14px] border border-[rgba(30,10,60,.06)] bg-white px-4 py-2.5 text-center',
  buscaWrap:
    'flex h-11 flex-1 items-center gap-2 rounded-[11px] border border-[#E7E0D2] bg-white px-3.5',
  segmentWrap: 'inline-flex gap-1 rounded-[12px] bg-[#EDE7FB]/[.45] p-1',
  segmentAtivo:
    'rounded-[9px] bg-white px-4 py-2 text-[13.5px] font-bold shadow-[0_2px_6px_rgba(30,10,60,.08)]',
  segmentInativo:
    'rounded-[9px] bg-transparent px-4 py-2 text-[13.5px] font-semibold text-marca-ink/60 hover:text-marca-ink',
  bulkBar:
    'flex flex-wrap items-center gap-3 rounded-xl border border-[#D9C9FF] bg-[#F3EEFF] px-4 py-3 text-sm font-semibold text-[#4C1D95]',
  overlay:
    'fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,7,46,.55)] p-6 backdrop-blur-[3px]',
  modal:
    'flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[22px] bg-[#F6F1E7] shadow-[0_40px_100px_rgba(20,7,46,.4)]',
  modalHeader: 'flex items-center justify-between border-b border-[#F1ECE0] bg-white px-6 py-4',
  modalBody: 'overflow-y-auto px-6 py-5',
  modalFooter: 'flex flex-wrap items-center justify-between gap-2 border-t border-[#F1ECE0] bg-white px-6 py-4',
} as const

export const statusBadge = {
  pendente: 'bg-[#FEF3C7] text-[#B45309]',
  em_analise: 'bg-[#DBEAFE] text-[#2563EB]',
  aprovado: 'bg-[#DCFCE7] text-[#16A34A]',
  confirmado: 'bg-[#DCFCE7] text-[#16A34A]',
  realizado: 'bg-[#EDEAF3] text-[#5B5470]',
  realizada: 'bg-[#EDEAF3] text-[#5B5470]',
  reprovado: 'bg-[#FEE7E0] text-[#C43D1C]',
  novo: 'bg-[#DCFCE7] text-[#16A34A]',
  aberto: 'bg-[#DCFCE7] text-[#16A34A]',
  rascunho: 'bg-[#FEF3C7] text-[#B45309]',
  encerrada: 'bg-[#EDE7DD] text-[#6B6480]',
  inativo: 'bg-[#EDE7DD] text-[#6B6480]',
} as const
