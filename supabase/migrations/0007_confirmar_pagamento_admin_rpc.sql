-- Migration: variante service-role de confirmar_pagamento, p/ o webhook da Stripe.
-- auth.uid() é null fora de request autenticado (webhook chama com a service role key),
-- então esta variante recebe o user_id explicitamente e roda a mesma checagem/atomicidade.
-- Ver guery_feiras.confirmar_pagamento (migration 0006) — esta é a mesma lógica, sem auth.uid().

create or replace function guery_feiras.confirmar_pagamento_admin(
  p_user_id uuid,
  p_application_id uuid,
  p_metodo text,
  p_valor numeric
) returns void
language plpgsql
security definer
set search_path = guery_feiras, public
as $$
declare
  v_status text;
  v_owner uuid;
  v_saldo numeric;
begin
  if p_metodo not in ('pix','cartao','credito') then
    raise exception 'Método inválido: %', p_metodo;
  end if;

  select status, user_id into v_status, v_owner
  from guery_feiras.applications where id = p_application_id for update;

  if v_owner is null then raise exception 'Inscrição não encontrada'; end if;
  if v_owner <> p_user_id then raise exception 'Não autorizado'; end if;
  if v_status <> 'aprovado' then raise exception 'Inscrição em % não pode ser paga', v_status; end if;

  if p_metodo = 'credito' then
    select coalesce(sum(case when tipo='entrada' then valor else -valor end), 0)
      into v_saldo from guery_feiras.wallet_transactions where user_id = p_user_id;
    if v_saldo < p_valor then raise exception 'Saldo insuficiente'; end if;
    insert into guery_feiras.wallet_transactions(user_id, tipo, valor, referencia, application_id)
    values (p_user_id, 'saida', p_valor, 'Uso de crédito', p_application_id);
  end if;

  insert into guery_feiras.payments(user_id, application_id, valor, metodo, status, pago_em)
  values (p_user_id, p_application_id, p_valor, p_metodo, 'confirmado', now());

  update guery_feiras.applications set status = 'confirmado' where id = p_application_id;
end $$;

-- Só a service role chama isto (webhook), nunca o client autenticado.
revoke all on function guery_feiras.confirmar_pagamento_admin(uuid, uuid, text, numeric) from public, authenticated;
grant execute on function guery_feiras.confirmar_pagamento_admin(uuid, uuid, text, numeric) to service_role;
