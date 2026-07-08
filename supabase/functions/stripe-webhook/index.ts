// Webhook da Stripe — confirma o pagamento no banco quando o Checkout termina.
// Roda com service role (auth.uid() é null aqui), por isso chama a variante _admin da RPC.
// verify_jwt=false no deploy: quem autentica a chamada é a assinatura Stripe, não um JWT Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(), // obrigatório em Deno — o cliente padrão usa o módulo http do Node
})
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  db: { schema: 'guery_feiras' },
})

Deno.serve(async (req: Request) => {
  const sig = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret)
  } catch (e) {
    return new Response(`Assinatura inválida: ${e instanceof Error ? e.message : e}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { application_id, user_id } = session.metadata ?? {}
    if (!application_id || !user_id) return new Response('metadata ausente', { status: 400 })

    const metodo = session.payment_method_types?.[0] === 'pix' ? 'pix' : 'cartao'
    const valor = (session.amount_total ?? 0) / 100

    const { error } = await admin.rpc('confirmar_pagamento_admin', {
      p_user_id: user_id,
      p_application_id: application_id,
      p_metodo: metodo,
      p_valor: valor,
    })
    // Idempotência: se já confirmado, a RPC lança "não pode ser paga" — não é erro fatal do webhook.
    if (error && !error.message.includes('não pode ser paga')) {
      return new Response(`Falha ao confirmar: ${error.message}`, { status: 500 })
    }
  }

  return new Response('ok')
})
