-- Migration: RPC transacional confirmar_pagamento (rumo ao Pagar.me real)
-- Aplicada via Supabase MCP apply_migration em BreninjaDB (pyyyrzwdidcronhidkwb).
-- Torna atômico: insere payment + (se crédito) debita carteira + confirma a inscrição.
-- Remove o insert+update não-atômico do stub e move a checagem de saldo p/ o servidor.
-- Contexto: chamada pelo CLIENT (usa auth.uid()). Para o webhook real (service role), criar
-- uma variante que recebe o user_id explicitamente — auth.uid() é null fora de request autenticado.

create or replace function guery_feiras.confirmar_pagamento(
  p_application_id uuid,
  p_metodo text,
  p_valor numeric
) returns void
language plpgsql
security definer
set search_path = guery_feiras, public
as $$
declare
  v_uid uuid := auth.uid();
  v_status text;
  v_owner uuid;
  v_saldo numeric;
begin
  if p_metodo not in ('pix','cartao','credito') then
    raise exception 'Método inválido: %', p_metodo;
  end if;

  -- trava a inscrição p/ evitar corrida (dupla confirmação)
  select status, user_id into v_status, v_owner
  from guery_feiras.applications where id = p_application_id for update;

  if v_owner is null then raise exception 'Inscrição não encontrada'; end if;
  if v_owner <> v_uid then raise exception 'Não autorizado'; end if;
  if v_status <> 'aprovado' then raise exception 'Inscrição em % não pode ser paga', v_status; end if;

  if p_metodo = 'credito' then
    select coalesce(sum(case when tipo='entrada' then valor else -valor end), 0)
      into v_saldo from guery_feiras.wallet_transactions where user_id = v_uid;
    if v_saldo < p_valor then raise exception 'Saldo insuficiente'; end if;
    insert into guery_feiras.wallet_transactions(user_id, tipo, valor, referencia, application_id)
    values (v_uid, 'saida', p_valor, 'Uso de crédito', p_application_id);
  end if;

  insert into guery_feiras.payments(user_id, application_id, valor, metodo, status, pago_em)
  values (v_uid, p_application_id, p_valor, p_metodo, 'confirmado', now());

  update guery_feiras.applications set status = 'confirmado' where id = p_application_id;
end $$;

grant execute on function guery_feiras.confirmar_pagamento(uuid, text, numeric) to authenticated;
