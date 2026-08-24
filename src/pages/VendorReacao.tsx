import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import {
  FAIXAS_FATURAMENTO,
  buildReacaoInsert,
  podeAvaliar,
} from '../lib/reacoesFeira'

type Inscricao = {
  id: string
  user_id: string
  fair_id: string
  status: string
  data_escolhida: string
  fairs: { nome: string } | null
  businesses: { nome: string } | null
}

function formatarData(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR')
}

const input =
  'w-full rounded-xl border border-marca-ink/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-marca-acao focus:ring-4 focus:ring-marca-acao/10'
const label = 'mb-1.5 block text-sm font-semibold text-marca-ink'
const botao =
  'rounded-xl bg-marca-acao px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-marca-acaoHover disabled:opacity-50'

export default function VendorReacao() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [inscricao, setInscricao] = useState<Inscricao | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [notaFeira, setNotaFeira] = useState<number | null>(null)
  const [comentario, setComentario] = useState('')
  const [notaIndicacao, setNotaIndicacao] = useState<number | null>(null)
  const [faixa, setFaixa] = useState('')

  const carregar = useCallback(async () => {
    if (!user?.id || !applicationId) return
    setLoading(true)
    setErro(null)
    const [appRes, reacRes] = await Promise.all([
      supabase
        .from('applications')
        .select('id,user_id,fair_id,status,data_escolhida,fairs(nome),businesses(nome)')
        .eq('id', applicationId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('reacoes_feira')
        .select('id')
        .eq('application_id', applicationId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ])
    if (appRes.error) {
      console.error('VendorReacao: falha ao carregar inscrição', appRes.error)
      setErro('Não foi possível carregar a inscrição.')
      setLoading(false)
      return
    }
    if (!appRes.data) {
      setErro('Inscrição não encontrada.')
      setLoading(false)
      return
    }
    const app = appRes.data as unknown as Inscricao
    const jaAvaliou = !!reacRes.data
    if (
      !podeAvaliar({
        status: app.status,
        data_escolhida: app.data_escolhida,
        jaAvaliou,
      })
    ) {
      setErro(
        jaAvaliou
          ? 'Você já enviou a reação desta feira.'
          : 'Só quem participou desta data pode responder, após o dia da feira.',
      )
      setInscricao(app)
      setLoading(false)
      return
    }
    setInscricao(app)
    setLoading(false)
  }, [user?.id, applicationId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id || !inscricao || notaFeira === null || notaIndicacao === null) {
      setErro('Preencha todas as perguntas obrigatórias.')
      return
    }
    const payload = buildReacaoInsert({
      applicationId: inscricao.id,
      userId: user.id,
      fairId: inscricao.fair_id,
      notaFeira,
      comentario,
      notaIndicacao,
      faixaFaturamento: faixa,
    })
    if ('error' in payload) {
      setErro(payload.error)
      return
    }
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.from('reacoes_feira').insert(payload)
    setEnviando(false)
    if (error) {
      console.error('VendorReacao: falha ao salvar reação', error)
      setErro('Falha ao enviar reação: ' + error.message)
      return
    }
    setSucesso(true)
    setTimeout(() => navigate('/VendorPanel'), 1600)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-6" aria-label="Carregando avaliação">
        <div className="h-5 w-32 animate-pulse rounded bg-marca-ink/10" />
        <div className="h-40 animate-pulse rounded-card bg-marca-ink/10" />
        <div className="h-56 animate-pulse rounded-card bg-marca-ink/10" />
      </div>
    )
  }

  const elegivel =
    !!inscricao &&
    !sucesso &&
    !erro?.includes('já enviou') &&
    podeAvaliar({
      status: inscricao.status,
      data_escolhida: inscricao.data_escolhida,
      jaAvaliou: false,
    })

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        to="/VendorPanel"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-marca-acao hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Painel
      </Link>

      <div>
        <h1 className="font-display text-[26px] font-semibold text-marca-ink">
          Reação da feira
        </h1>
        <p className="mt-1 text-sm text-marca-ink/60">
          {inscricao?.fairs?.nome ?? 'Feira'} ·{' '}
          {inscricao ? formatarData(inscricao.data_escolhida) : '—'}
          {inscricao?.businesses?.nome ? ` · ${inscricao.businesses.nome}` : ''}
        </p>
      </div>

      {sucesso && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          Obrigado! Sua reação foi registrada.
        </p>
      )}
      {erro && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>
      )}

      {elegivel && (
        <form
          onSubmit={enviar}
          className="space-y-5 rounded-card border border-marca-ink/[.07] bg-white p-5 shadow-card"
        >
          <fieldset>
            <legend className={label}>Como foi a feira? (0 a 10)</legend>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 11 }, (_, n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNotaFeira(n)}
                  className={`h-9 w-9 rounded-lg text-sm font-bold transition ${
                    notaFeira === n
                      ? 'bg-marca-acao text-white shadow-glow'
                      : 'bg-[#F3EEFF] text-marca-ink hover:bg-[#EDE7FB]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label className={label} htmlFor="comentario">
              Breve comentário sobre a feira
            </label>
            <textarea
              id="comentario"
              className={`${input} min-h-[88px] resize-y`}
              maxLength={1000}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <fieldset>
            <legend className={label}>
              Chance de indicar a Guery Feiras a um amigo expositor (0 a 10)
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 11 }, (_, n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNotaIndicacao(n)}
                  className={`h-9 w-9 rounded-lg text-sm font-bold transition ${
                    notaIndicacao === n
                      ? 'bg-marca-acao text-white shadow-glow'
                      : 'bg-[#F3EEFF] text-marca-ink hover:bg-[#EDE7FB]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label className={label} htmlFor="faixa">
              Faturamento no evento
            </label>
            <select
              id="faixa"
              className={input}
              value={faixa}
              onChange={(e) => setFaixa(e.target.value)}
              required
            >
              <option value="">Selecione…</option>
              {FAIXAS_FATURAMENTO.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className={botao} disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar reação'}
          </button>
        </form>
      )}
    </div>
  )
}
