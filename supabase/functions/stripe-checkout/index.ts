// Cria uma Stripe Checkout Session (hospedada) p/ pagar a taxa de uma inscrição aprovada.
// O client só chama isto e redireciona pra session.url — Stripe cuida do form de cartão.
// valor e dono são recalculados aqui via RLS (JWT do caller), nunca confiamos no client p/ isso.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(), // obrigatório em Deno — o cliente padrão usa o módulo http do Node
})

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { application_id, origin } = await req.json()
    if (!application_id || !origin) throw new Error('application_id e origin são obrigatórios')

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      db: { schema: 'guery_feiras' },
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Não autenticado', { status: 401, headers: cors })

    const { data: application, error } = await supabase
      .from('applications')
      .select('id, status, fairs(nome, taxa)')
      .eq('id', application_id)
      .single()
    if (error || !application) return new Response('Inscrição não encontrada', { status: 404, headers: cors })
    if (application.status !== 'aprovado') return new Response('Inscrição não está aprovada', { status: 400, headers: cors })

    const fair = application.fairs as unknown as { nome: string; taxa: number }
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'], // MVP: só cartão, PIX fica pra depois (decisão do user)
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { name: `Inscrição — ${fair.nome}` },
          unit_amount: Math.round(fair.taxa * 100),
        },
        quantity: 1,
      }],
      metadata: { application_id, user_id: user.id },
      success_url: `${origin}/VendorPayments?pago=1`,
      cancel_url: `${origin}/VendorPayments?cancelado=1`,
    })

    return Response.json({ url: session.url }, { headers: cors })
  } catch (e) {
    return new Response(e instanceof Error ? e.message : 'Erro desconhecido', { status: 500, headers: cors })
  }
})
