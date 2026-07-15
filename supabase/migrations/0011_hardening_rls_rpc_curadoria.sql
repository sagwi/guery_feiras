-- Migration: hardening RLS + RPCs de curadoria + taxa real no pagamento
-- Escopo exclusivo guery_feiras. Fecha brechas: dono alterando status, insert direto em payments/wallet.

-- 1) applications: só admin atualiza (status/curadoria); dono não altera inscrição após insert
drop policy if exists "apps: dono ou admin atualiza" on guery_feiras.applications;
create policy "apps: admin atualiza" on guery_feiras.applications for update
  using (guery_feiras.is_admin())
  with check (guery_feiras.is_admin());

-- 2) payments / wallet: insert só via RPC security definer (revoga client direto)
drop policy if exists "pay: dono insere" on guery_feiras.payments;
revoke insert on guery_feiras.payments from authenticated;

drop policy if exists "wt: dono/admin insere" on guery_feiras.wallet_transactions;
revoke insert on guery_feiras.wallet_transactions from authenticated;

-- 3) confirmar_pagamento: valor vem da taxa da feira no banco (ignora p_valor do client)
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
  v_taxa numeric;
  v_saldo numeric;
begin
  if p_metodo not in ('pix','cartao','credito') then
    raise exception 'Método inválido: %', p_metodo;
  end if;

  select a.status, a.user_id, f.taxa
    into v_status, v_owner, v_taxa
  from guery_feiras.applications a
  join guery_feiras.fairs f on f.id = a.fair_id
  where a.id = p_application_id
  for update of a;

  if v_owner is null then raise exception 'Inscrição não encontrada'; end if;
  if v_owner <> v_uid then raise exception 'Não autorizado'; end if;
  if v_status <> 'aprovado' then raise exception 'Inscrição em % não pode ser paga', v_status; end if;

  if p_metodo = 'credito' then
    select coalesce(sum(case when tipo='entrada' then valor else -valor end), 0)
      into v_saldo from guery_feiras.wallet_transactions where user_id = v_uid;
    if v_saldo < v_taxa then raise exception 'Saldo insuficiente'; end if;
    insert into guery_feiras.wallet_transactions(user_id, tipo, valor, referencia, application_id)
    values (v_uid, 'saida', v_taxa, 'Uso de crédito', p_application_id);
  end if;

  insert into guery_feiras.payments(user_id, application_id, valor, metodo, status, pago_em)
  values (v_uid, p_application_id, v_taxa, p_metodo, 'confirmado', now());

  update guery_feiras.applications set status = 'confirmado' where id = p_application_id;
end $$;

-- 4) confirmar_pagamento_admin: mesma regra de taxa (webhook Stripe)
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
  v_taxa numeric;
  v_saldo numeric;
begin
  if p_metodo not in ('pix','cartao','credito') then
    raise exception 'Método inválido: %', p_metodo;
  end if;

  select a.status, a.user_id, f.taxa
    into v_status, v_owner, v_taxa
  from guery_feiras.applications a
  join guery_feiras.fairs f on f.id = a.fair_id
  where a.id = p_application_id
  for update of a;

  if v_owner is null then raise exception 'Inscrição não encontrada'; end if;
  if v_owner <> p_user_id then raise exception 'Não autorizado'; end if;
  if v_status <> 'aprovado' then raise exception 'Inscrição em % não pode ser paga', v_status; end if;

  if p_metodo = 'credito' then
    select coalesce(sum(case when tipo='entrada' then valor else -valor end), 0)
      into v_saldo from guery_feiras.wallet_transactions where user_id = p_user_id;
    if v_saldo < v_taxa then raise exception 'Saldo insuficiente'; end if;
    insert into guery_feiras.wallet_transactions(user_id, tipo, valor, referencia, application_id)
    values (p_user_id, 'saida', v_taxa, 'Uso de crédito', p_application_id);
  end if;

  insert into guery_feiras.payments(user_id, application_id, valor, metodo, status, pago_em)
  values (p_user_id, p_application_id, v_taxa, p_metodo, 'confirmado', now());

  update guery_feiras.applications set status = 'confirmado' where id = p_application_id;
end $$;

-- 5) curadoria: aprovar/reprovar inscrição + notificação (transacional)
create or replace function guery_feiras.curar_inscricao(
  p_application_id uuid,
  p_decisao text,
  p_motivo text default null
) returns void
language plpgsql
security definer
set search_path = guery_feiras, public
as $$
declare
  v_status text;
  v_user_id uuid;
  v_novo_status text;
begin
  if not guery_feiras.is_admin() then raise exception 'Não autorizado'; end if;
  if p_decisao not in ('aprovar','reprovar') then raise exception 'Decisão inválida: %', p_decisao; end if;
  if p_decisao = 'reprovar' and coalesce(trim(p_motivo), '') = '' then
    raise exception 'Motivo obrigatório para reprovação';
  end if;

  select status, user_id into v_status, v_user_id
  from guery_feiras.applications where id = p_application_id for update;

  if v_user_id is null then raise exception 'Inscrição não encontrada'; end if;
  if v_status not in ('pendente','em_analise') then
    raise exception 'Inscrição em % não pode ser curada', v_status;
  end if;

  v_novo_status := case when p_decisao = 'aprovar' then 'aprovado' else 'reprovado' end;
  update guery_feiras.applications set status = v_novo_status where id = p_application_id;

  if p_decisao = 'aprovar' then
    insert into guery_feiras.notifications(user_id, tipo, titulo, corpo)
    values (v_user_id, 'inscricao_aprovada', 'Inscrição aprovada ✅',
      'Sua inscrição foi aprovada. Realize o pagamento para confirmar.');
  else
    insert into guery_feiras.notifications(user_id, tipo, titulo, corpo)
    values (v_user_id, 'inscricao_reprovada', 'Inscrição reprovada', p_motivo);
  end if;
end $$;

grant execute on function guery_feiras.curar_inscricao(uuid, text, text) to authenticated;

-- 6) curadoria: cancelar data pelo organizador + crédito + notificação (transacional)
create or replace function guery_feiras.cancelar_data_organizador(
  p_application_id uuid
) returns void
language plpgsql
security definer
set search_path = guery_feiras, public
as $$
declare
  v_status text;
  v_user_id uuid;
  v_fair_nome text;
  v_valor numeric := 0;
begin
  if not guery_feiras.is_admin() then raise exception 'Não autorizado'; end if;

  select a.status, a.user_id, f.nome
    into v_status, v_user_id, v_fair_nome
  from guery_feiras.applications a
  join guery_feiras.fairs f on f.id = a.fair_id
  where a.id = p_application_id
  for update of a;

  if v_user_id is null then raise exception 'Inscrição não encontrada'; end if;
  if v_status not in ('aprovado','confirmado') then
    raise exception 'Inscrição em % não pode ser cancelada pelo organizador', v_status;
  end if;

  if v_status = 'confirmado' then
    select coalesce(sum(valor), 0) into v_valor
    from guery_feiras.payments
    where application_id = p_application_id and status = 'confirmado';
    if v_valor > 0 then
      insert into guery_feiras.wallet_transactions(user_id, tipo, valor, referencia, application_id)
      values (v_user_id, 'entrada', v_valor,
        'Crédito: ' || coalesce(v_fair_nome, 'feira') || ' cancelada pelo organizador',
        p_application_id);
    end if;
  end if;

  update guery_feiras.applications set status = 'cancelado_organizador' where id = p_application_id;

  insert into guery_feiras.notifications(user_id, tipo, titulo, corpo)
  values (
    v_user_id,
    'feira_cancelada',
    'Feira cancelada pelo organizador',
    case when v_status = 'confirmado' and v_valor > 0
      then 'Uma data que você pagou foi cancelada. Um crédito foi gerado na sua carteira.'
      else 'Uma data da sua inscrição foi cancelada pelo organizador.'
    end
  );
end $$;

grant execute on function guery_feiras.cancelar_data_organizador(uuid) to authenticated;

-- 7) cron: expirar inscrições aprovadas sem pagamento (chamada service_role / Edge Function)
create or replace function guery_feiras.expirar_inscricoes_sem_pagamento(
  p_dias integer default 7
) returns integer
language plpgsql
security definer
set search_path = guery_feiras, public
as $$
declare
  v_count integer := 0;
  r record;
begin
  if p_dias < 1 then raise exception 'p_dias deve ser >= 1'; end if;

  for r in
    update guery_feiras.applications
    set status = 'cancelado_pagamento'
    where status = 'aprovado'
      and criado_em < now() - (p_dias || ' days')::interval
    returning user_id
  loop
    v_count := v_count + 1;
    insert into guery_feiras.notifications(user_id, tipo, titulo, corpo)
    values (r.user_id, 'geral', 'Inscrição cancelada por falta de pagamento',
      'Sua inscrição aprovada expirou sem pagamento dentro do prazo.');
  end loop;

  return v_count;
end $$;

revoke all on function guery_feiras.expirar_inscricoes_sem_pagamento(integer) from public, authenticated;
grant execute on function guery_feiras.expirar_inscricoes_sem_pagamento(integer) to service_role;
