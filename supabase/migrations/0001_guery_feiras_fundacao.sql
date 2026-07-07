-- Migration: guery_feiras_fundacao
-- Aplicada via Supabase MCP apply_migration em BreninjaDB (pyyyrzwdidcronhidkwb).
-- Schema-por-cliente: guery_feiras é independente de guery/fyado/demo/daniele.
-- NOTA: expor guery_feiras em Settings > API > Exposed schemas (PostgREST) — ver README.

create schema if not exists guery_feiras;

-- helpers
create or replace function guery_feiras.uid() returns uuid
  language sql stable as $$ select auth.uid() $$;

-- admin = flag em app_metadata (setado manualmente no curador; nenhum comerciante é admin)
create or replace function guery_feiras.is_admin() returns boolean
  language sql stable as $$
    select coalesce((auth.jwt() -> 'app_metadata' ->> 'gf_admin')::boolean, false)
  $$;

-- profiles
create table guery_feiras.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  cpf text,
  nascimento date,
  telefone text,
  email text,
  curadoria_status text not null default 'pendente'
    check (curadoria_status in ('pendente','aprovado','reprovado')),
  curadoria_motivo text,
  avatar_url text,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table guery_feiras.profiles enable row level security;

-- businesses (negócios)
create table guery_feiras.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  segmento text not null check (segmento in (
    'Acessórios de Moda','Artes Plásticas','Artesanato','Autocuidado',
    'Bebidas Alcoólicas','Bem-Estar Pessoal','Brinquedos','Calçados e Bolsas',
    'Confeitaria','Costura Criativa','Crochês, tapeçaria, renda e bordado',
    'Cultura Geek','Empório de Frios','Esotérico','Gastronomia','Moda Circular',
    'Moda Fitness','Moda Praia','Papelaria','Pet','Plantas Ornamentais e Reais',
    'Produtos Naturais','Sebo e Vinil','Serviços','Sorvetes','Vestuário')),
  descricao text,
  imagem_url text,
  autoral boolean not null default false,
  cnpj boolean not null default false,
  instagram text,
  faixa_faturamento text check (faixa_faturamento in (
    'Até R$ 1.000','R$ 1.001 a R$ 3.000','R$ 3.001 a R$ 5.000',
    'R$ 5.001 a R$ 10.000','Acima de R$ 10.000')),
  aprovado boolean not null default true,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table guery_feiras.businesses enable row level security;
create index on guery_feiras.businesses(user_id);

-- termos_aceite (LGPD)
create table guery_feiras.termos_aceite (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('uso','privacidade')),
  versao text not null default 'v1',
  aceito_em timestamptz not null default now()
);
alter table guery_feiras.termos_aceite enable row level security;

-- RLS: profiles
create policy "profiles: dono lê" on guery_feiras.profiles for select
  using (id = auth.uid() or guery_feiras.is_admin());
create policy "profiles: dono atualiza" on guery_feiras.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- RLS: businesses
create policy "businesses: dono lê" on guery_feiras.businesses for select
  using (user_id = auth.uid() or guery_feiras.is_admin());
create policy "businesses: dono insere" on guery_feiras.businesses for insert
  with check (user_id = auth.uid());
create policy "businesses: dono atualiza" on guery_feiras.businesses for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- RLS: termos
create policy "termos: dono lê" on guery_feiras.termos_aceite for select
  using (user_id = auth.uid() or guery_feiras.is_admin());
create policy "termos: dono insere" on guery_feiras.termos_aceite for insert
  with check (user_id = auth.uid());

-- trigger: cria profile ao criar auth.user
create or replace function guery_feiras.handle_new_user()
  returns trigger language plpgsql security definer set search_path = guery_feiras as $$
begin
  insert into guery_feiras.profiles (id, nome, email, cpf, nascimento, telefone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nome',
    new.email,
    new.raw_user_meta_data ->> 'cpf',
    (new.raw_user_meta_data ->> 'nascimento')::date,
    new.raw_user_meta_data ->> 'telefone'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created_gf on auth.users;
create trigger on_auth_user_created_gf
  after insert on auth.users
  for each row execute function guery_feiras.handle_new_user();

grant usage on schema guery_feiras to authenticated, anon;
grant select, insert, update on all tables in schema guery_feiras to authenticated;
