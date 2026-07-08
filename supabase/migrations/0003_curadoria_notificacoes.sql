-- Migration: curadoria_notificacoes (Fatia 3)
-- Aplicada via Supabase MCP apply_migration em BreninjaDB (pyyyrzwdidcronhidkwb).
-- notifications = avisos p/ o comerciante (curador insere na transição). Policies admin de UPDATE
-- em profiles/applications p/ o curador curar. Triggers touch_updated_at.

create table guery_feiras.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('cadastro_aprovado','cadastro_reprovado',
    'inscricao_aprovada','inscricao_reprovada','geral')),
  titulo text not null,
  corpo text,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);
alter table guery_feiras.notifications enable row level security;
create index on guery_feiras.notifications(user_id, lida);

-- dono lê/marca-lida as suas; admin (curador) insere p/ o comerciante
create policy "notif: dono lê" on guery_feiras.notifications for select
  using (user_id = auth.uid());
create policy "notif: dono marca lida" on guery_feiras.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notif: admin insere" on guery_feiras.notifications for insert
  with check (guery_feiras.is_admin());

-- curador atualiza cadastros e inscrições alheios (SELECT admin já existia via 'or is_admin()')
create policy "profiles: admin atualiza" on guery_feiras.profiles for update
  using (guery_feiras.is_admin()) with check (guery_feiras.is_admin());
create policy "apps: admin atualiza" on guery_feiras.applications for update
  using (guery_feiras.is_admin()) with check (guery_feiras.is_admin());

-- touch updated_at
create or replace function guery_feiras.touch_updated_at() returns trigger
  language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger touch_apps before update on guery_feiras.applications
  for each row execute function guery_feiras.touch_updated_at();
create trigger touch_profiles before update on guery_feiras.profiles
  for each row execute function guery_feiras.touch_updated_at();
create trigger touch_businesses before update on guery_feiras.businesses
  for each row execute function guery_feiras.touch_updated_at();

grant select, insert, update on all tables in schema guery_feiras to authenticated;
