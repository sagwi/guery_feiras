-- Migration: avisos + definições (segmentos/nichos) + reações de feira
-- Demo Guery Feiras alinhado às features da Vamo (produção intocável).
-- Schema exclusivo: guery_feiras. Forward-only / aditiva.

-- Locais: endereço e regras (Definições → Locais)
alter table guery_feiras.parks
  add column if not exists endereco text,
  add column if not exists regras text;

-- Segmentos e nichos (catálogo gerenciável na curadoria)
create table if not exists guery_feiras.segmentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table guery_feiras.segmentos enable row level security;

create table if not exists guery_feiras.nichos (
  id uuid primary key default gen_random_uuid(),
  segmento_id uuid not null references guery_feiras.segmentos(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table guery_feiras.nichos enable row level security;
create index if not exists nichos_segmento_id_idx on guery_feiras.nichos(segmento_id);

-- Produtos do negócio (lista ordenada)
create table if not exists guery_feiras.business_produtos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references guery_feiras.businesses(id) on delete cascade,
  nome text not null,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);
alter table guery_feiras.business_produtos enable row level security;
create index if not exists business_produtos_business_id_idx
  on guery_feiras.business_produtos(business_id);

-- Feed de avisos da curadoria → home do expositor
create table if not exists guery_feiras.avisos (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  corpo text not null,
  imagem_url text,
  fixo boolean not null default false,
  criado_em timestamptz not null default now()
);
alter table guery_feiras.avisos enable row level security;
create index if not exists avisos_fixo_criado_idx
  on guery_feiras.avisos(fixo desc, criado_em desc);

create table if not exists guery_feiras.aviso_reacoes (
  aviso_id uuid not null references guery_feiras.avisos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (aviso_id, user_id)
);
alter table guery_feiras.aviso_reacoes enable row level security;

-- Reação pós-feira (NPS + faturamento declarado)
create table if not exists guery_feiras.reacoes_feira (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references guery_feiras.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  fair_id uuid not null references guery_feiras.fairs(id) on delete cascade,
  nota_feira int not null check (nota_feira between 0 and 10),
  comentario text,
  nota_indicacao int not null check (nota_indicacao between 0 and 10),
  faixa_faturamento text not null check (faixa_faturamento in (
    'Até R$ 1.000','R$ 1.001 a R$ 3.000','R$ 3.001 a R$ 5.000',
    'R$ 5.001 a R$ 10.000','Acima de R$ 10.000')),
  criado_em timestamptz not null default now(),
  unique (application_id, user_id)
);
alter table guery_feiras.reacoes_feira enable row level security;
create index if not exists reacoes_feira_fair_id_idx on guery_feiras.reacoes_feira(fair_id);

-- RLS: segmentos / nichos
create policy "segmentos: autenticado lê" on guery_feiras.segmentos for select
  to authenticated using (true);
create policy "segmentos: admin escreve" on guery_feiras.segmentos for all
  to authenticated using (guery_feiras.is_admin()) with check (guery_feiras.is_admin());

create policy "nichos: autenticado lê" on guery_feiras.nichos for select
  to authenticated using (true);
create policy "nichos: admin escreve" on guery_feiras.nichos for all
  to authenticated using (guery_feiras.is_admin()) with check (guery_feiras.is_admin());

-- RLS: business_produtos
create policy "produtos: dono ou admin lê" on guery_feiras.business_produtos for select
  to authenticated using (
    guery_feiras.is_admin()
    or exists (
      select 1 from guery_feiras.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  );
create policy "produtos: dono escreve" on guery_feiras.business_produtos for all
  to authenticated using (
    exists (
      select 1 from guery_feiras.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from guery_feiras.businesses b
      where b.id = business_id and b.user_id = auth.uid()
    )
  );

-- RLS: avisos
create policy "avisos: autenticado lê" on guery_feiras.avisos for select
  to authenticated using (true);
create policy "avisos: admin escreve" on guery_feiras.avisos for all
  to authenticated using (guery_feiras.is_admin()) with check (guery_feiras.is_admin());

create policy "aviso_reacoes: autenticado lê" on guery_feiras.aviso_reacoes for select
  to authenticated using (true);
create policy "aviso_reacoes: dono insere" on guery_feiras.aviso_reacoes for insert
  to authenticated with check (user_id = auth.uid());
create policy "aviso_reacoes: dono apaga" on guery_feiras.aviso_reacoes for delete
  to authenticated using (user_id = auth.uid());

-- RLS: reacoes_feira
create policy "reacoes: dono ou admin lê" on guery_feiras.reacoes_feira for select
  to authenticated using (user_id = auth.uid() or guery_feiras.is_admin());
create policy "reacoes: dono insere" on guery_feiras.reacoes_feira for insert
  to authenticated with check (user_id = auth.uid());

grant select, insert, update, delete on guery_feiras.segmentos to authenticated;
grant select, insert, update, delete on guery_feiras.nichos to authenticated;
grant select, insert, update, delete on guery_feiras.business_produtos to authenticated;
grant select, insert, update, delete on guery_feiras.avisos to authenticated;
grant select, insert, delete on guery_feiras.aviso_reacoes to authenticated;
grant select, insert on guery_feiras.reacoes_feira to authenticated;
