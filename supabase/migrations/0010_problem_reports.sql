-- Migration: problem_reports (canal de suporte real — botão "Reportar problema")
-- Aplicada via Supabase MCP apply_migration em BreninjaDB (pyyyrzwdidcronhidkwb).
-- Escopada a guery_feiras. Antes disso o botão só fazia console.info (nada persistia).

create table guery_feiras.problem_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  descricao text not null,
  pagina text,
  status text not null default 'aberto' check (status in ('aberto', 'resolvido')),
  criado_em timestamptz not null default now(),
  resolvido_em timestamptz
);
alter table guery_feiras.problem_reports enable row level security;
create index on guery_feiras.problem_reports(user_id);
create index on guery_feiras.problem_reports(status);

-- dono lê/insere os próprios; admin lê e atualiza (marca resolvido) todos.
create policy "reports: dono lê" on guery_feiras.problem_reports for select
  using (user_id = (select auth.uid()) or guery_feiras.is_admin());
create policy "reports: dono insere" on guery_feiras.problem_reports for insert
  with check (user_id = (select auth.uid()));
create policy "reports: admin atualiza" on guery_feiras.problem_reports for update
  using (guery_feiras.is_admin()) with check (guery_feiras.is_admin());

grant select, insert, update on guery_feiras.problem_reports to authenticated;
