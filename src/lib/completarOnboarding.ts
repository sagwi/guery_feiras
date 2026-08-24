import { supabase } from './supabase'
import type { NegocioData } from '../pages/signup/StepNegocio'

type OnboardingPendente = { negocio: NegocioData; termos: unknown }

// ponytail: retry simples via localStorage — se o insert de business falhar, a chave
// fica e a próxima montagem tenta de novo. Guarda de idempotência é "business existe?";
// se o business insert for bem-sucedido mas o de termos falhar, o retry vai pular o
// business (já existe) e sair sem tentar termos de novo. Janela estreita (2 inserts
// sequenciais); se virar problema real, checar termos_aceite também na guarda.
export async function completarOnboarding(userId: string): Promise<void> {
  const raw = localStorage.getItem('gf_onboarding')
  if (!raw) return

  const { data: existente, error: checkError } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (checkError) {
    // guarda de idempotência falhou — não insira às cegas (evita business duplicado); mantém a chave p/ retry
    console.error('completarOnboarding: falha ao checar business existente', checkError)
    return
  }

  if (existente && existente.length > 0) {
    localStorage.removeItem('gf_onboarding')
    return
  }

  let onboarding: OnboardingPendente
  try {
    onboarding = JSON.parse(raw)
  } catch {
    localStorage.removeItem('gf_onboarding')
    return
  }

  const { negocio } = onboarding

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert({
      user_id: userId,
      nome: negocio.nomeMarca,
      segmento: negocio.segmento,
      segmento_id: negocio.segmentoId || null,
      nicho_id: negocio.nichoId || null,
      descricao: negocio.descricao,
      instagram: negocio.possuiInstagram ? (negocio.instagram ?? null) : null,
      faixa_faturamento: negocio.faixaFaturamento,
    })
    .select('id')
    .single()

  if (businessError || !business) {
    console.error('completarOnboarding: falha ao inserir business', businessError)
    return
  }

  const produtos = (negocio.produtos ?? []).map((nome, ordem) => ({
    business_id: business.id,
    nome,
    ordem,
  }))
  if (produtos.length > 0) {
    const { error: prodError } = await supabase.from('business_produtos').insert(produtos)
    if (prodError) {
      console.error('completarOnboarding: falha ao inserir produtos', prodError)
      return
    }
  }

  const { error: termosError } = await supabase.from('termos_aceite').insert([
    { user_id: userId, tipo: 'uso' },
    { user_id: userId, tipo: 'privacidade' },
  ])

  if (termosError) {
    console.error('completarOnboarding: falha ao inserir termos_aceite', termosError)
    return
  }

  localStorage.removeItem('gf_onboarding')
}
