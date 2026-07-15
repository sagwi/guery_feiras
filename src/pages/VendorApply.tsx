import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import * as Checkbox from '@radix-ui/react-checkbox'
import { X, Plus, Store, Clock, Check, CheckCircle2, Wallet } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { datasDisponiveis } from '../lib/datasFeira'
import { saldo, type WalletTx } from '../lib/carteira'
import { formatarDataBR, formatarMoeda } from '../lib/formatacao'
import NegocioForm from '../components/NegocioForm'

type Business = {
  id: string
  nome: string
  segmento: string
  imagem_url: string | null
}

type Fair = {
  id: string
  nome: string
  local: string | null
  taxa: number
  max_participantes: number | null
  dias_semana: number[]
  data_inicio: string
  data_fim: string
  parks: { nome: string } | null
}

// statuses de application que "ocupam" a feira p/ o usuário (não pode se inscrever de novo)
const STATUS_ATIVOS = ['pendente', 'em_analise', 'aprovado', 'confirmado']
const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const PASSOS = ['Marca', 'Feira e Data', 'Termos']

function diasLabel(dias: number[]): string {
  return [...dias].sort((a, b) => a - b).map((d) => DIAS_SEMANA[d]).join(', ')
}

const cardBase = 'w-full space-y-2 rounded-card border p-4 text-left transition'
const cardSelecionavel = 'border-marca-ink/[.08] bg-white hover:border-marca-acao/40 hover:shadow-card'
const cardSelecionado = 'border-marca-acao bg-marca-acao/5 ring-1 ring-marca-acao'
const inputBase =
  'w-full rounded-xl border border-marca-ink/15 px-3.5 py-2.5 outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10'
const btnPrimario =
  'rounded-xl bg-marca-acao px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none'
const btnSecundario =
  'flex items-center gap-1.5 rounded-xl border border-marca-acao/25 px-4 py-2 text-sm font-semibold text-marca-acao transition hover:bg-marca-acao/5'
const btnVoltar =
  'rounded-xl px-5 py-2.5 text-sm font-semibold text-marca-ink/60 transition hover:text-marca-ink disabled:opacity-0'
const checkboxRow = 'flex items-center gap-2'
const checkboxRoot =
  'h-5 w-5 shrink-0 rounded-[6px] border border-marca-ink/30 flex items-center justify-center transition-colors data-[state=checked]:border-marca-acao data-[state=checked]:bg-marca-acao'

export default function VendorApply() {
  const { user, profile } = useAuth()

  const [step, setStep] = useState(0)

  // Passo 1: marca
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loadingBusinesses, setLoadingBusinesses] = useState(true)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)

  // Passo 2: feira + data
  const [fairs, setFairs] = useState<Fair[]>([])
  const [loadingFairs, setLoadingFairs] = useState(true)
  const [fairIdsInscritos, setFairIdsInscritos] = useState<Set<string>>(new Set())
  const [selectedFairId, setSelectedFairId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')

  // Passo 3: termos + envio
  const [aceite, setAceite] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [saldoCredito, setSaldoCredito] = useState(0)

  const carregarBusinesses = useCallback(async (): Promise<Business[]> => {
    if (!user?.id) return []
    const { data, error } = await supabase
      .from('businesses')
      .select('id,nome,segmento,imagem_url')
      .eq('user_id', user.id)
      .order('criado_em')
    if (error) { console.error('VendorApply: falha ao carregar negócios', error); return [] }
    return (data ?? []) as Business[]
  }, [user?.id])

  useEffect(() => {
    let ativo = true
    setLoadingBusinesses(true)
    carregarBusinesses().then((lista) => {
      if (!ativo) return
      setBusinesses(lista)
      setLoadingBusinesses(false)
    })
    return () => { ativo = false }
  }, [carregarBusinesses])

  useEffect(() => {
    if (!user?.id) return
    let ativo = true
    setLoadingFairs(true)
    Promise.all([
      supabase.from('fairs').select('*, parks(nome)').eq('status', 'aberto').order('nome'),
      supabase.from('applications').select('fair_id,status').eq('user_id', user.id),
    ]).then(([fairsRes, appsRes]) => {
      if (!ativo) return
      if (fairsRes.error) console.error('VendorApply: falha ao carregar feiras', fairsRes.error)
      if (appsRes.error) console.error('VendorApply: falha ao carregar inscrições', appsRes.error)
      const ativos = new Set(
        (appsRes.data ?? [])
          .filter((a) => STATUS_ATIVOS.includes(a.status))
          .map((a) => a.fair_id as string)
      )
      setFairIdsInscritos(ativos)
      setFairs((fairsRes.data ?? []) as Fair[])
      setLoadingFairs(false)
    })
    return () => { ativo = false }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('wallet_transactions')
      .select('tipo,valor')
      .eq('user_id', user.id)
      .then(({ data }) => setSaldoCredito(saldo((data ?? []) as WalletTx[])))
  }, [user?.id])

  const fairsVisiveis = useMemo(
    () => fairs.filter((f) => !fairIdsInscritos.has(f.id)),
    [fairs, fairIdsInscritos]
  )

  const selectedFair = useMemo(
    () => fairsVisiveis.find((f) => f.id === selectedFairId) ?? null,
    [fairsVisiveis, selectedFairId]
  )

  const allowedDates = useMemo(
    () => (selectedFair ? datasDisponiveis(selectedFair, new Date()) : []),
    [selectedFair]
  )
  const allowedSet = useMemo(() => new Set(allowedDates), [allowedDates])
  const dateValido = selectedDate !== '' && allowedSet.has(selectedDate)

  const onNegocioSalvo = async () => {
    setDialogAberto(false)
    const lista = await carregarBusinesses()
    setBusinesses(lista)
    // ponytail: assume o negócio recém-criado é o último por criado_em (ordem da query) — sem round-trip extra p/ pegar o id do insert
    if (lista.length) setSelectedBusinessId(lista[lista.length - 1].id)
  }

  const selecionarFeira = (fairId: string) => {
    setSelectedFairId(fairId)
    setSelectedDate('')
  }

  const podeAvancar =
    step === 0 ? !!selectedBusinessId : step === 1 ? !!selectedFairId && dateValido : true

  const avancar = () => setStep((s) => Math.min(s + 1, 2))
  const voltar = () => setStep((s) => Math.max(s - 1, 0))

  const enviar = async () => {
    if (!user?.id || !selectedBusinessId || !selectedFairId || !dateValido || !aceite) return
    setSubmitting(true)
    setSubmitError(null)
    const { error } = await supabase.from('applications').insert({
      user_id: user.id,
      business_id: selectedBusinessId,
      fair_id: selectedFairId,
      data_escolhida: selectedDate,
      status: 'pendente',
      aceite_termos: true,
    })
    setSubmitting(false)
    if (error) {
      setSubmitError(
        error.code === '23505'
          ? 'Você já tem uma inscrição nessa feira para essa data.'
          : error.message
      )
      return
    }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="mx-auto max-w-lg animate-fadeUp space-y-4 rounded-card border border-marca-ink/[.07] bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6F5E9] text-[#0B7A54]">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="font-display text-xl font-bold text-marca-ink">Inscrição enviada!</h1>
        <p className="text-sm text-marca-ink/60">Sua inscrição está pendente de análise.</p>
        {selectedFair && (
          <div className="space-y-1 rounded-xl bg-marca-creme p-4 text-left text-sm text-marca-ink">
            <p><strong>Feira:</strong> {selectedFair.nome}</p>
            <p><strong>Parque:</strong> {selectedFair.parks?.nome ?? '—'}</p>
            <p><strong>Data:</strong> {formatarDataBR(selectedDate)}</p>
            <p><strong>Taxa:</strong> {formatarMoeda(selectedFair.taxa)}</p>
          </div>
        )}
        <Link to="/VendorPanel" className={btnPrimario + ' inline-block'}>
          Ver minhas propostas
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-marca-ink">Nova Inscrição</h1>
        <p className="mt-0.5 text-sm text-marca-ink/60">Inscreva sua marca em uma feira em 3 passos.</p>
      </div>

      <div className="flex items-center gap-2">
        {PASSOS.map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < step
                  ? 'bg-marca-acao text-white'
                  : i === step
                    ? 'bg-marca-acao text-white shadow-glow'
                    : 'bg-marca-ink/10 text-marca-ink/50'
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'font-semibold text-marca-ink' : 'text-marca-ink/50'}`}>
              {p}
            </span>
            {i < PASSOS.length - 1 && <div className="h-px w-8 bg-marca-ink/10" />}
          </div>
        ))}
      </div>

      <div className="rounded-card border border-marca-ink/[.07] bg-white p-6 shadow-card">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-marca-ink">Você deseja se inscrever com qual marca?</h2>
            {loadingBusinesses && <p className="text-sm text-marca-ink/60">Carregando...</p>}
            {!loadingBusinesses && businesses.length === 0 && (
              <p className="text-sm text-marca-ink/70">
                Você ainda não tem nenhum negócio cadastrado. Cadastre um negócio para continuar.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {businesses.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={selectedBusinessId === b.id}
                  onClick={() => setSelectedBusinessId(b.id)}
                  className={`${cardBase} ${selectedBusinessId === b.id ? cardSelecionado : cardSelecionavel}`}
                >
                  <div className="flex items-center gap-3">
                    {b.imagem_url ? (
                      <img src={b.imagem_url} alt={b.nome} className="h-10 w-10 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-marca-acao/10">
                        <Store className="h-5 w-5 text-marca-acao/60" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-marca-ink">{b.nome}</p>
                      <p className="text-sm text-marca-ink/60">{b.segmento}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setDialogAberto(true)} className={btnSecundario}>
              <Plus className="h-4 w-4" /> Adicionar novo negócio
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-marca-ink">Escolha a feira e a data</h2>
            {loadingFairs && <p className="text-sm text-marca-ink/60">Carregando feiras...</p>}
            {!loadingFairs && fairsVisiveis.length === 0 && (
              <p className="text-sm text-marca-ink/70">Nenhuma feira disponível para inscrição no momento.</p>
            )}
            <div className="space-y-3">
              {fairsVisiveis.map((f) => (
                <div
                  key={f.id}
                  className={`${cardBase} ${selectedFairId === f.id ? cardSelecionado : cardSelecionavel}`}
                >
                  <button
                    type="button"
                    onClick={() => selecionarFeira(f.id)}
                    aria-pressed={selectedFairId === f.id}
                    className="w-full text-left"
                  >
                    <p className="font-display font-semibold text-marca-ink">{f.nome}</p>
                    <p className="text-sm text-marca-ink/60">{f.parks?.nome ?? '—'}{f.local ? ` — ${f.local}` : ''}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-marca-ink/70">
                      <span className="rounded-full bg-marca-acao/10 px-2.5 py-0.5 text-xs font-semibold text-marca-acao">
                        Taxa: {formatarMoeda(f.taxa)}
                      </span>
                      <span>Vagas: {f.max_participantes ?? '—'}</span>
                    </p>
                  </button>

                  {selectedFairId === f.id && (
                    <div className="space-y-2 border-t border-marca-ink/10 pt-3">
                      <label htmlFor={`data-${f.id}`} className="block text-sm font-semibold text-marca-ink">
                        Data
                      </label>
                      {allowedDates.length === 0 ? (
                        <p className="text-sm text-marca-coral">Nenhuma data disponível para esta feira.</p>
                      ) : (
                        <>
                          <input
                            id={`data-${f.id}`}
                            type="date"
                            className={inputBase}
                            min={allowedDates[0]}
                            max={allowedDates[allowedDates.length - 1]}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                          />
                          <p className="text-xs text-marca-ink/60">Dias: {diasLabel(f.dias_semana)}</p>
                          {selectedDate !== '' && !dateValido && (
                            <p className="text-sm text-marca-coral">
                              Data indisponível para esta feira. Escolha um dos dias permitidos.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-marca-ink">Termos e envio</h2>
            {selectedFair && (
              <div className="space-y-1 rounded-xl border border-marca-ink/[.08] bg-marca-creme p-4 text-sm text-marca-ink">
                <p><strong>Feira:</strong> {selectedFair.nome}</p>
                <p><strong>Parque:</strong> {selectedFair.parks?.nome ?? '—'}</p>
                <p><strong>Data:</strong> {formatarDataBR(selectedDate)}</p>
                <p><strong>Taxa:</strong> {formatarMoeda(selectedFair.taxa)}</p>
              </div>
            )}
            {profile?.curadoria_status !== 'aprovado' && (
              // ponytail: gate real (bloquear submit) fica p/ Fatia 3 — aqui só avisa
              <div className="flex items-center gap-3 rounded-xl border border-marca-amarelo/60 bg-marca-amarelo/10 px-4 py-3">
                <Clock className="h-5 w-5 shrink-0 text-[#B47C00]" />
                <p className="text-sm text-marca-ink">
                  Seu cadastro ainda está em análise; a inscrição será avaliada após a aprovação.
                </p>
              </div>
            )}
            {saldoCredito > 0 && selectedFair && saldoCredito >= selectedFair.taxa && (
              <div className="flex items-center gap-3 rounded-xl border border-marca-acao/20 bg-marca-acao/5 px-4 py-3">
                <Wallet className="h-5 w-5 shrink-0 text-marca-acao" />
                <p className="text-sm text-marca-ink">
                  Você tem {formatarMoeda(saldoCredito)} de crédito. Após aprovação da inscrição,
                  poderá pagar com crédito em <strong>Pagamentos</strong>.
                </p>
              </div>
            )}
            <div className={checkboxRow}>
              <Checkbox.Root
                id="aceite"
                checked={aceite}
                onCheckedChange={(v) => setAceite(v === true)}
                className={checkboxRoot}
              >
                <Checkbox.Indicator><Check className="h-4 w-4 text-white" /></Checkbox.Indicator>
              </Checkbox.Root>
              <label htmlFor="aceite" className="text-sm text-marca-ink">
                Li e aceito os termos de participação e o regulamento da feira
              </label>
            </div>
            {submitError && <p className="text-sm text-marca-coral">{submitError}</p>}
          </div>
        )}

        <div className="mt-6 flex justify-between border-t border-marca-ink/10 pt-4">
          <button type="button" onClick={voltar} disabled={step === 0} className={btnVoltar}>
            Voltar
          </button>
          {step < 2 ? (
            <button type="button" onClick={avancar} disabled={!podeAvancar} className={btnPrimario}>
              Avançar
            </button>
          ) : (
            <button
              type="button"
              onClick={enviar}
              disabled={!dateValido || !aceite || submitting}
              className={btnPrimario}
            >
              {submitting ? 'Enviando...' : dateValido ? 'Enviar inscrição' : 'Selecione a data'}
            </button>
          )}
        </div>
      </div>

      <Dialog.Root open={dialogAberto} onOpenChange={setDialogAberto}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-marca-roxoDeep/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card bg-white p-6 shadow-lift">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="font-display text-lg font-bold text-marca-ink">Adicionar negócio</Dialog.Title>
              <Dialog.Close className="text-marca-ink/50 hover:text-marca-ink">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <NegocioForm onSaved={onNegocioSalvo} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
