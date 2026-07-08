// Edge function Pagar.me — ESQUELETO (não deployado). Rumo à integração real.
// Duas responsabilidades no fluxo real:
//   1) POST /pagarme/pedido    → cria a cobrança no Pagar.me (secret key server-side) e devolve
//      { id, status, pixCopiaECola }. O client (criarPagarmeReal) chama isto no lugar do fake.
//   2) POST /pagarme/webhook   → recebe charge.paid do Pagar.me e confirma no banco via a RPC
//      transacional guery_feiras.confirmar_pagamento (numa VARIANTE service-role que recebe o
//      user_id explicitamente, pois auth.uid() é null aqui).
//
// FALTA p/ ativar: secrets PAGARME_SECRET_KEY (test/prod) + PAGARME_WEBHOOK_SECRET no projeto
// (supabase secrets set ...), deploy (supabase functions deploy pagarme) e apontar o webhook no
// painel do Pagar.me. Ver seam em src/lib/pagarme.ts (trocar `pagarme` por criarPagarmeReal()).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAGARME_API = 'https://api.pagar.me/core/v5'

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const secret = Deno.env.get('PAGARME_SECRET_KEY')
  if (!secret) return new Response('PAGARME_SECRET_KEY não configurada', { status: 501 })

  // Auth Basic: secret key como usuário, senha vazia (padrão Pagar.me v5).
  const authHeader = 'Basic ' + btoa(secret + ':')

  if (url.pathname.endsWith('/pedido') && req.method === 'POST') {
    const { valor, metodo, cartaoToken } = await req.json()
    const body =
      metodo === 'pix'
        ? { items: [{ amount: valor, description: 'Inscrição feira', quantity: 1 }], payments: [{ payment_method: 'pix', pix: { expires_in: 3600 } }] }
        : { items: [{ amount: valor, description: 'Inscrição feira', quantity: 1 }], payments: [{ payment_method: 'credit_card', credit_card: { card_token: cartaoToken } }] }
    const r = await fetch(`${PAGARME_API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(body),
    })
    const order = await r.json()
    // TODO: normalizar order → { id, status, pixCopiaECola } (shape do type Pedido).
    return Response.json(order)
  }

  if (url.pathname.endsWith('/webhook') && req.method === 'POST') {
    // TODO: validar assinatura (PAGARME_WEBHOOK_SECRET). Ler charge.paid → application_id (metadata),
    // metodo, valor. Confirmar no banco:
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    void admin // TODO: admin.rpc('confirmar_pagamento_admin', { p_user_id, p_application_id, p_metodo, p_valor })
    return new Response('ok')
  }

  return new Response('Not found', { status: 404 })
})
