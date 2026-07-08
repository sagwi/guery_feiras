-- Migration: payments (Fatia 4 — pagamentos STUB)
-- Aplicada via Supabase MCP apply_migration em BreninjaDB (pyyyrzwdidcronhidkwb).
-- Registro de pagamento de uma inscrição. Nesta fatia o pagamento é simulado (sem Pagar.me real).

create table guery_feiras.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references guery_feiras.applications(id) on delete cascade,
  valor numeric(10,2) not null,
  metodo text not null check (metodo in ('pix','cartao','credito')),
  status text not null default 'confirmado' check (status in ('pendente','confirmado','falhou')),
  pago_em timestamptz,
  criado_em timestamptz not null default now()
);
alter table guery_feiras.payments enable row level security;
create index on guery_feiras.payments(user_id);
create index on guery_feiras.payments(application_id);

create policy "pay: dono lê" on guery_feiras.payments for select
  using (user_id = auth.uid() or guery_feiras.is_admin());
create policy "pay: dono insere" on guery_feiras.payments for insert
  with check (user_id = auth.uid());

grant select, insert, update on all tables in schema guery_feiras to authenticated;
