-- Migration: wallet_transactions (Fatia 5 — carteira/crédito §9)
-- Aplicada via Supabase MCP apply_migration em BreninjaDB (pyyyrzwdidcronhidkwb).
-- Crédito gerado quando organizador cancela uma data já paga; usado como método de pagamento.

create table guery_feiras.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','saida')),
  valor numeric(10,2) not null check (valor > 0),
  referencia text not null,
  application_id uuid references guery_feiras.applications(id) on delete set null,
  criado_em timestamptz not null default now()
);
alter table guery_feiras.wallet_transactions enable row level security;
create index on guery_feiras.wallet_transactions(user_id);

-- dono lê as próprias; admin lê todas.
create policy "wt: dono lê" on guery_feiras.wallet_transactions for select
  using (user_id = auth.uid() or guery_feiras.is_admin());
-- saída (usar crédito) é inserida pelo próprio dono; entrada (crédito por cancelamento) é inserida pelo admin p/ o comerciante.
create policy "wt: dono/admin insere" on guery_feiras.wallet_transactions for insert
  with check (user_id = auth.uid() or guery_feiras.is_admin());

grant select, insert on guery_feiras.wallet_transactions to authenticated;

-- Novo tipo de notificação p/ cancelamento pelo organizador (§10).
alter table guery_feiras.notifications drop constraint notifications_tipo_check;
alter table guery_feiras.notifications add constraint notifications_tipo_check
  check (tipo in ('cadastro_aprovado','cadastro_reprovado','inscricao_aprovada','inscricao_reprovada','feira_cancelada','geral'));
