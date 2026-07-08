import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import * as Checkbox from '@radix-ui/react-checkbox'
import { X, Plus, Store, Clock, Check, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { datasDisponiveis } from '../lib/datasFeira'
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

function formatarDataBR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const cardBase =
  'w-full rounded-lg border p-4 text-left transition space-y-2'
const cardSelecionavel = 'border-marca-roxo/10 bg-white hover:border-marca-roxo/40'
const cardSelecionado = 'border-marca-roxo bg-marca-roxo/5 ring-1 ring-marca-roxo'
const inputBase = 'w-full rounded-lg border border-marca-roxo/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-marca-amarelo'
const btnPrimario = 'rounded-lg bg-marca-roxo px-5 py-2 text-sm font-semibold text-white hover:bg-marca-roxoClaro transition disabled:opacity-40 disabled:cursor-not-allowed'
const btnSecundario = 'flex items-center gap-1 rounded-lg border border-marca-roxo text-marca-roxo px-4 py-2 text-sm font-semibold hover:bg-marca-roxo/5 transition'
const btnVoltar = 'rounded-lg px-5 py-2 text-sm font-semibold text-marca-roxo/70 hover:text-marca-roxo transition disabled:opacity-0'
const checkboxRow = 'flex items-center gap-2'
const checkboxRoot = 'h-5 w-5 rounded border border-marca-roxo/40 flex items-center justify-center data-[state=checked]:bg-marca-roxo shrink-0'

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
      <div className="mx-auto max-w-lg space-y-4 rounded-lg border border-marca-roxo/10 bg-white p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <h1 className="text-lg font-bold text-marca-roxo">Inscrição enviada!</h1>
        <p className="text-sm text-marca-roxo/70">Sua inscrição está pendente de análise.</p>
        {selectedFair && (
          <div className="space-y-1 rounded-lg bg-marca-roxo/5 p-4 text-left text-sm text-marca-roxo">
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
        <h1 className="text-xl font-bold text-marca-roxo">Nova Inscrição</h1>
        <p className="text-sm text-marca-roxo/70">Inscreva sua marca em uma feira em 3 passos.</p>
      </div>

      <div className="flex items-center gap-2">
        {PASSOS.map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i <= step ? 'bg-marca-roxo text-white' : 'bg-marca-roxo/10 text-marca-roxo/50'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'font-semibold text-marca-roxo' : 'text-marca-roxo/50'}`}>
              {p}
            </span>
            {i < PASSOS.length - 1 && <div className="h-px w-8 bg-marca-roxo/10" />}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-marca-roxo/10 bg-white p-6 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-marca-roxo">Você deseja se inscrever com qual marca?</h2>
            {loadingBusinesses && <p className="text-sm text-marca-roxo/60">Carregando...</p>}
            {!loadingBusinesses && businesses.length === 0 && (
              <p className="text-sm text-marca-roxo/70">
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
                      <img src={b.imagem_url} alt={b.nome} className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-marca-roxo/5">
                        <Store className="h-5 w-5 text-marca-roxo/30" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-marca-roxo">{b.nome}</p>
                      <p className="text-sm text-marca-roxo/70">{b.segmento}</p>
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
            <h2 className="text-lg font-semibold text-marca-roxo">Escolha a feira e a data</h2>
            {loadingFairs && <p className="text-sm text-marca-roxo/60">Carregando feiras...</p>}
            {!loadingFairs && fairsVisiveis.length === 0 && (
              <p className="text-sm text-marca-roxo/70">Nenhuma feira disponível para inscrição no momento.</p>
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
                    <p className="font-semibold text-marca-roxo">{f.nome}</p>
                    <p className="text-sm text-marca-roxo/70">{f.parks?.nome ?? '—'}{f.local ? ` — ${f.local}` : ''}</p>
                    <p className="text-sm text-marca-roxo/70">
                      Taxa: {formatarMoeda(f.taxa)} · Vagas: {f.max_participantes ?? '—'}
                    </p>
                  </button>

                  {selectedFairId === f.id && (
                    <div className="space-y-2 border-t border-marca-roxo/10 pt-3">
                      <label htmlFor={`data-${f.id}`} className="block text-sm font-medium text-marca-roxo">
                        Data
                      </label>
                      {allowedDates.length === 0 ? (
                        <p className="text-sm text-red-600">Nenhuma data disponível para esta feira.</p>
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
                          <p className="text-xs text-marca-roxo/60">Dias: {diasLabel(f.dias_semana)}</p>
                          {selectedDate !== '' && !dateValido && (
                            <p className="text-sm text-red-600">
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
            <h2 className="text-lg font-semibold text-marca-roxo">Termos e envio</h2>
            {selectedFair && (
              <div className="space-y-1 rounded-lg border border-marca-roxo/10 bg-marca-roxo/5 p-4 text-sm text-marca-roxo">
                <p><strong>Feira:</strong> {selectedFair.nome}</p>
                <p><strong>Parque:</strong> {selectedFair.parks?.nome ?? '—'}</p>
                <p><strong>Data:</strong> {formatarDataBR(selectedDate)}</p>
                <p><strong>Taxa:</strong> {formatarMoeda(selectedFair.taxa)}</p>
              </div>
            )}
            {profile?.curadoria_status !== 'aprovado' && (
              // ponytail: gate real (bloquear submit) fica p/ Fatia 3 — aqui só avisa
              <div className="flex items-center gap-3 rounded-lg border border-marca-amarelo bg-marca-amarelo/10 px-4 py-3">
                <Clock className="h-5 w-5 shrink-0 text-marca-roxo" />
                <p className="text-sm text-marca-roxo">
                  Seu cadastro ainda está em análise; a inscrição será avaliada após a aprovação.
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
              <label htmlFor="aceite" className="text-sm text-marca-roxo">
                Li e aceito os termos de participação e o regulamento da feira
              </label>
            </div>
            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          </div>
        )}

        <div className="mt-6 flex justify-between border-t border-marca-roxo/10 pt-4">
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
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-marca-roxo">Adicionar negócio</Dialog.Title>
              <Dialog.Close className="text-marca-roxo/60 hover:text-marca-roxo">
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
