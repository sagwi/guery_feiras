-- Migration: feiras_inscricoes (Fatia 2)
-- Aplicada via Supabase MCP apply_migration em BreninjaDB (pyyyrzwdidcronhidkwb).
-- parks/fairs = catálogo (leitura p/ autenticado; escrita admin na Fatia 3, aqui via SEED).
-- applications = inscrições do comerciante (RLS por dono).

create table guery_feiras.parks (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);
alter table guery_feiras.parks enable row level security;

create table guery_feiras.fairs (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references guery_feiras.parks(id) on delete cascade,
  nome text not null,
  local text,
  descricao text,
  regras text,
  imagem_url text,
  taxa numeric(10,2) not null default 0,
  max_participantes int,
  dias_semana smallint[] not null default '{}',   -- 0=domingo .. 6=sábado
  data_inicio date not null,
  data_fim date not null,
  status text not null default 'aberto' check (status in ('aberto','inativo')),
  criado_em timestamptz not null default now()
);
alter table guery_feiras.fairs enable row level security;
create index on guery_feiras.fairs(park_id);

create table guery_feiras.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references guery_feiras.businesses(id) on delete cascade,
  fair_id uuid not null references guery_feiras.fairs(id) on delete cascade,
  data_escolhida date not null,
  status text not null default 'pendente'
    check (status in ('pendente','em_analise','aprovado','confirmado','realizada',
                      'reprovado','cancelado_pagamento','cancelado_organizador','expirado')),
  aceite_termos boolean not null default false,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, fair_id, data_escolhida)
);
alter table guery_feiras.applications enable row level security;
create index on guery_feiras.applications(user_id);

-- RLS: catálogo (parks/fairs) — leitura p/ autenticado; escrita só admin
create policy "parks: autenticado lê" on guery_feiras.parks for select
  using (auth.uid() is not null);
create policy "fairs: autenticado lê" on guery_feiras.fairs for select
  using (auth.uid() is not null);
create policy "parks: admin escreve" on guery_feiras.parks for all
  using (guery_feiras.is_admin()) with check (guery_feiras.is_admin());
create policy "fairs: admin escreve" on guery_feiras.fairs for all
  using (guery_feiras.is_admin()) with check (guery_feiras.is_admin());

-- RLS: applications — dono lê/insere/atualiza as suas; admin vê tudo
create policy "apps: dono lê" on guery_feiras.applications for select
  using (user_id = auth.uid() or guery_feiras.is_admin());
create policy "apps: dono insere" on guery_feiras.applications for insert
  with check (user_id = auth.uid());
create policy "apps: dono atualiza" on guery_feiras.applications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on all tables in schema guery_feiras to authenticated;

-- SEED: 2 parques + 3 feiras com recorrência semanal, período hoje..+90d
with p as (
  insert into guery_feiras.parks (nome) values
    ('Parque da Jaqueira'), ('Parque Dona Lindu')
  returning id, nome
)
insert into guery_feiras.fairs (park_id, nome, local, descricao, regras, taxa, max_participantes, dias_semana, data_inicio, data_fim)
select
  p.id, f.nome, f.local, f.descricao, f.regras, f.taxa, f.maxp, f.dias, current_date, current_date + 90
from p
join (values
  ('Parque da Jaqueira', 'Feira de Sábado da Jaqueira', 'área central do parque', 'Feira de artesanato e gastronomia aos sábados.', 'Chegar 1h antes. Montar até 8h.', 200.00, 50, array[6]::smallint[]),
  ('Parque da Jaqueira', 'Feira de Domingo da Jaqueira', 'próximo ao lago', 'Feira de moda circular e produtos naturais aos domingos.', 'Espaço 2x2m. Energia não incluída.', 180.00, 40, array[0]::smallint[]),
  ('Parque Dona Lindu', 'Feira Criativa Dona Lindu', 'esplanada', 'Feira criativa aos fins de semana (sábado e domingo).', 'Produtos autorais preferenciais.', 150.00, 30, array[0,6]::smallint[])
) as f(park_nome, nome, local, descricao, regras, taxa, maxp, dias)
  on f.park_nome = p.nome;
