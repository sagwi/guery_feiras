-- Migration: hardening_seguranca_performance
-- Aplicada via Supabase MCP apply_migration em BreninjaDB (pyyyrzwdidcronhidkwb).
-- Responde aos achados do Supabase Advisor (security + performance), 100% escopados
-- a guery_feiras — nenhuma tabela/função/policy de outro schema é tocada.
--
-- 1) search_path mutável em 3 funções (WARN security) -> fixado, mesmo corpo/comportamento.
-- 2) auth.uid() reavaliado por linha nas policies (WARN performance) -> trocado por
--    (select auth.uid()), mesma semântica de autorização, uma avaliação só por query.
-- 3) policies duplicadas (dono + admin) em profiles/applications UPDATE -> colapsadas
--    em uma só com OR, mesma permissão resultante.
-- 4) 3 foreign keys sem índice de cobertura -> índice adicionado.

-- 1) search_path
create or replace function guery_feiras.uid() returns uuid
  language sql stable
  set search_path = guery_feiras, public
  as $$ select auth.uid() $$;

create or replace function guery_feiras.is_admin() returns boolean
  language sql stable
  set search_path = guery_feiras, public
  as $$
    select coalesce((auth.jwt() -> 'app_metadata' ->> 'gf_admin')::boolean, false)
  $$;

create or replace function guery_feiras.touch_updated_at() returns trigger
  language plpgsql
  set search_path = guery_feiras, public
  as $$ begin new.updated_at = now(); return new; end $$;

-- 2)+3) profiles
drop policy "profiles: dono lê" on guery_feiras.profiles;
create policy "profiles: dono lê" on guery_feiras.profiles for select
  using (id = (select auth.uid()) or guery_feiras.is_admin());

drop policy "profiles: dono atualiza" on guery_feiras.profiles;
drop policy "profiles: admin atualiza" on guery_feiras.profiles;
create policy "profiles: dono ou admin atualiza" on guery_feiras.profiles for update
  using (id = (select auth.uid()) or guery_feiras.is_admin())
  with check (id = (select auth.uid()) or guery_feiras.is_admin());

-- 2) businesses
drop policy "businesses: dono lê" on guery_feiras.businesses;
create policy "businesses: dono lê" on guery_feiras.businesses for select
  using (user_id = (select auth.uid()) or guery_feiras.is_admin());

drop policy "businesses: dono insere" on guery_feiras.businesses;
create policy "businesses: dono insere" on guery_feiras.businesses for insert
  with check (user_id = (select auth.uid()));

drop policy "businesses: dono atualiza" on guery_feiras.businesses;
create policy "businesses: dono atualiza" on guery_feiras.businesses for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 2) termos_aceite
drop policy "termos: dono lê" on guery_feiras.termos_aceite;
create policy "termos: dono lê" on guery_feiras.termos_aceite for select
  using (user_id = (select auth.uid()) or guery_feiras.is_admin());

drop policy "termos: dono insere" on guery_feiras.termos_aceite;
create policy "termos: dono insere" on guery_feiras.termos_aceite for insert
  with check (user_id = (select auth.uid()));

-- 2) parks/fairs (só a leitura autenticada usa auth.uid() direto; "admin escreve" já usa is_admin())
drop policy "parks: autenticado lê" on guery_feiras.parks;
create policy "parks: autenticado lê" on guery_feiras.parks for select
  using ((select auth.uid()) is not null);

drop policy "fairs: autenticado lê" on guery_feiras.fairs;
create policy "fairs: autenticado lê" on guery_feiras.fairs for select
  using ((select auth.uid()) is not null);

-- 2)+3) applications
drop policy "apps: dono lê" on guery_feiras.applications;
create policy "apps: dono lê" on guery_feiras.applications for select
  using (user_id = (select auth.uid()) or guery_feiras.is_admin());

drop policy "apps: dono insere" on guery_feiras.applications;
create policy "apps: dono insere" on guery_feiras.applications for insert
  with check (user_id = (select auth.uid()));

drop policy "apps: dono atualiza" on guery_feiras.applications;
drop policy "apps: admin atualiza" on guery_feiras.applications;
create policy "apps: dono ou admin atualiza" on guery_feiras.applications for update
  using (user_id = (select auth.uid()) or guery_feiras.is_admin())
  with check (user_id = (select auth.uid()) or guery_feiras.is_admin());

-- 2) notifications
drop policy "notif: dono lê" on guery_feiras.notifications;
create policy "notif: dono lê" on guery_feiras.notifications for select
  using (user_id = (select auth.uid()));

drop policy "notif: dono marca lida" on guery_feiras.notifications;
create policy "notif: dono marca lida" on guery_feiras.notifications for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 2) payments
drop policy "pay: dono lê" on guery_feiras.payments;
create policy "pay: dono lê" on guery_feiras.payments for select
  using (user_id = (select auth.uid()) or guery_feiras.is_admin());

drop policy "pay: dono insere" on guery_feiras.payments;
create policy "pay: dono insere" on guery_feiras.payments for insert
  with check (user_id = (select auth.uid()));

-- 2) wallet_transactions
drop policy "wt: dono lê" on guery_feiras.wallet_transactions;
create policy "wt: dono lê" on guery_feiras.wallet_transactions for select
  using (user_id = (select auth.uid()) or guery_feiras.is_admin());

drop policy "wt: dono/admin insere" on guery_feiras.wallet_transactions;
create policy "wt: dono/admin insere" on guery_feiras.wallet_transactions for insert
  with check (user_id = (select auth.uid()) or guery_feiras.is_admin());

-- 4) índices em FKs sem cobertura
create index if not exists applications_fair_id_idx on guery_feiras.applications(fair_id);
create index if not exists termos_aceite_user_id_idx on guery_feiras.termos_aceite(user_id);
create index if not exists wallet_transactions_application_id_idx on guery_feiras.wallet_transactions(application_id);
