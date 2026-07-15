// Job agendável: marca inscrições aprovadas sem pagamento como cancelado_pagamento.
// Chama RPC service_role. Agendar no Supabase Dashboard (cron) ou invocar manualmente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { db: { schema: 'guery_feiras' } },
)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const auth = req.headers.get('Authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response('Não autorizado', { status: 401, headers: cors })
    }
  }

  const dias = 7
  const { data, error } = await admin.rpc('expirar_inscricoes_sem_pagamento', { p_dias: dias })
  if (error) {
    return new Response(error.message, { status: 500, headers: cors })
  }

  return Response.json({ expiradas: data }, { headers: cors })
})
