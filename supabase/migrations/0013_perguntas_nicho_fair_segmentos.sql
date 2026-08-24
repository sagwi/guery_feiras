-- Migration: perguntas da feira, nicho/produtos no negócio, fair_segmentos
-- Schema exclusivo: guery_feiras. Forward-only / aditiva.
-- Não toca public, auth, storage, nem outros schemas.

-- Catálogo público (signup precisa ler segmentos/nichos antes do login)
grant select on guery_feiras.segmentos to anon;
grant select on guery_feiras.nichos to anon;

drop policy if exists "segmentos: anon lê" on guery_feiras.segmentos;
create policy "segmentos: anon lê" on guery_feiras.segmentos for select
  to anon using (true);

drop policy if exists "nichos: anon lê" on guery_feiras.nichos;
create policy "nichos: anon lê" on guery_feiras.nichos for select
  to anon using (true);

-- Negócio: FKs de catálogo. segmento texto deixa de ser CHECK fechado
-- para o curador poder cadastrar nomes novos em Definições.
alter table guery_feiras.businesses drop constraint if exists businesses_segmento_check;

alter table guery_feiras.businesses
  add column if not exists segmento_id uuid references guery_feiras.segmentos(id) on delete set null,
  add column if not exists nicho_id uuid references guery_feiras.nichos(id) on delete set null;

create index if not exists businesses_segmento_id_idx on guery_feiras.businesses(segmento_id);

-- Perguntas da feira + respostas da inscrição
alter table guery_feiras.fairs
  add column if not exists perguntas jsonb not null default '[]'::jsonb;

alter table guery_feiras.applications
  add column if not exists respostas jsonb not null default '{}'::jsonb;

-- Segmentos permitidos na feira (vazio = todos)
create table if not exists guery_feiras.fair_segmentos (
  fair_id uuid not null references guery_feiras.fairs(id) on delete cascade,
  segmento_id uuid not null references guery_feiras.segmentos(id) on delete cascade,
  primary key (fair_id, segmento_id)
);
alter table guery_feiras.fair_segmentos enable row level security;

drop policy if exists "fair_segmentos: autenticado lê" on guery_feiras.fair_segmentos;
create policy "fair_segmentos: autenticado lê" on guery_feiras.fair_segmentos for select
  to authenticated using (true);

drop policy if exists "fair_segmentos: admin escreve" on guery_feiras.fair_segmentos;
create policy "fair_segmentos: admin escreve" on guery_feiras.fair_segmentos for all
  to authenticated using (guery_feiras.is_admin()) with check (guery_feiras.is_admin());

grant select, insert, update, delete on guery_feiras.fair_segmentos to authenticated;

-- Seed de nichos para os 3 segmentos demo (idempotente)
insert into guery_feiras.nichos (segmento_id, nome)
select s.id, n.nome
from guery_feiras.segmentos s
join (values
  ('Artesanato', 'Cerâmica'),
  ('Artesanato', 'Crochê e macramê'),
  ('Gastronomia', 'Doces'),
  ('Gastronomia', 'Salgados e conservas'),
  ('Moda', 'Vestuário autoral'),
  ('Moda', 'Acessórios')
) as n(segmento, nome) on n.segmento = s.nome
where not exists (
  select 1 from guery_feiras.nichos x
  where x.segmento_id = s.id and x.nome = n.nome
);
