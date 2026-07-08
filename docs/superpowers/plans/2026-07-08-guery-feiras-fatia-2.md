# Guery Feiras — Fatia 2 (Meus Negócios + Nova Inscrição) — Implementation Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.
> Base: branch `fatia-2` (off `fatia-1`). Spec-fonte: `vivafeiras-vendorpanel-specs.md` itens 6, 7, 13.

**Goal:** Comerciante gerencia seus negócios (listar/adicionar/editar) e faz uma Nova Inscrição
(marca → escolher feira + data via calendário inteligente → termos) que grava uma `application`
com status **pendente**, e a vê na aba "Minhas Propostas" do Painel.

**Architecture:** Continua o SPA React/Vite sobre schema `guery_feiras`. Novas tabelas
`parks`, `fairs`, `applications`. `fairs`/`parks` são leitura pública p/ autenticados
(admin/curador as gerencia na Fatia 3 — aqui vêm por SEED). `applications` é escrita do dono.

## Global Constraints
- Schema `guery_feiras` só (nunca guery/fyado/demo/daniele). Project `pyyyrzwdidcronhidkwb`.
- Colunas pt-br snake_case; `timestamptz default now()`; RLS em TODA tabela.
- UUID `gen_random_uuid()` p/ entidades; `bigint identity` p/ transacionais.
- Migrations via Supabase MCP `apply_migration` (controller aplica) + gravar `.sql` em `supabase/migrations/`.
- Reutilizar padrões da Fatia 1: `import { useAuth } from '../auth/AuthProvider'`, `supabase` de `lib/supabase`, paleta `marca.*`, class-strings de input/label, Radix.
- Nada de Pagar.me/pagamento, curadoria admin, avaliações, carteira, notificações reais (fatias 3-6).

## Simplificações deliberadas (ponytail)
- **Imagem do negócio:** sem upload p/ Storage nesta fatia — `imagem_url` é campo de URL opcional
  (texto). Upload real fica p/ polish. `// ponytail: URL só; upload Storage depois`.
- **Gate de curadoria:** a spec diz que só comerciante aprovado se inscreve, mas o fluxo de
  aprovação é admin (Fatia 3) e ainda não existe. Nesta fatia a inscrição é permitida mesmo com
  `curadoria_status='pendente'`, exibindo um aviso suave. `// ponytail: gate real na Fatia 3`.
- **Seleção múltipla de feiras:** a spec permite marcar várias feiras numa inscrição. Aqui: 1
  feira + 1 data por envio (o mais simples que fecha o fluxo). Multi-feira/combo → Fatia 4.
- Sem "usar crédito" no passo 3 (carteira é Fatia 5).

---

### Task 0: Migration — parks, fairs, applications (+ seed)

**Files:** Create `supabase/migrations/0002_feiras_inscricoes.sql` (cópia do SQL aplicado).

**Interfaces:** Produz tabelas `guery_feiras.parks`, `guery_feiras.fairs`,
`guery_feiras.applications` + policies. Seed: >=2 parks, >=3 fairs com recorrência semanal.

- [ ] **Step 1:** Aplicar via MCP `apply_migration` (name `feiras_inscricoes`) e gravar em `0002_...sql`:

```sql
-- parks
create table guery_feiras.parks (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);
alter table guery_feiras.parks enable row level security;

-- fairs
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
  -- recorrência: dias da semana (0=domingo .. 6=sábado), array
  dias_semana smallint[] not null default '{}',
  data_inicio date not null,
  data_fim date not null,
  status text not null default 'aberto' check (status in ('aberto','inativo')),
  criado_em timestamptz not null default now()
);
alter table guery_feiras.fairs enable row level security;
create index on guery_feiras.fairs(park_id);

-- applications (inscrições/propostas)
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

-- RLS: parks/fairs — leitura p/ autenticado (catálogo público interno)
create policy "parks: autenticado lê" on guery_feiras.parks for select
  using (auth.uid() is not null);
create policy "fairs: autenticado lê" on guery_feiras.fairs for select
  using (auth.uid() is not null);
-- admin gerencia parks/fairs (Fatia 3); helpers já existem
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
```

- [ ] **Step 2 (seed):** inserir 2 parks + 3 fairs (recorrência semanal, período amplo cobrindo
  hoje..+90d). Ex.: Parque da Jaqueira / Parque Dona Lindu; feiras aos sábados (dias_semana `{6}`)
  e domingos (`{0}`), taxa 200, max 50. Gravar o SQL de seed no mesmo arquivo de migration.
- [ ] **Step 3:** Verificar via MCP `execute_sql`: contagem de parks/fairs/applications e que
  `select data_inicio<=current_date+90` bate. Reload schema (`notify pgrst,'reload schema'`).
- [ ] **Step 4:** Commit `feat(db): parks, fairs, applications + seed`.

---

### Task 1: Meus Negócios (/VendorBusinesses)

**Files:** Create `src/pages/VendorBusinesses.tsx`, `src/components/NegocioForm.tsx`.
Modify `src/App.tsx` (rota real). Test: `src/components/negocioForm.schema.test.ts`.

**Interfaces:** Consome `supabase`, `useAuth`, `SEGMENTOS`/`FAIXAS_FATURAMENTO`. Produz CRUD de businesses.

- [ ] **Step 1:** Extrair o schema/campos de negócio p/ um form reutilizável `NegocioForm`
  (nome, segmento, descricao, autoral bool, cnpj bool, possuiInstagram→instagram, faixa_faturamento,
  imagem_url opcional). Reaproveitar `negocioSchema` de `StepNegocio` onde fizer sentido (adicionar
  `autoral`, `cnpj`, `imagem_url`). Test do schema (aceita válido; rejeita sem nome/segmento).
- [ ] **Step 2:** `VendorBusinesses.tsx` — lista os businesses do user (`select * where user_id`),
  cada card: imagem (ou placeholder), nome, badge "Aprovado", "Ativo", segmento, botão Editar.
  Botão "+ Adicionar negócio" abre `NegocioForm` (Dialog ou seção). Insert/update em `businesses`
  (RLS já garante escopo). Após salvar, recarrega a lista.
- [ ] **Step 3:** Wire `/VendorBusinesses` → `<VendorBusinesses/>` em App.tsx (remove Placeholder).
- [ ] **Step 4:** `npm run build` + `npm run test` verdes. Commit.

---

### Task 2: Calendário inteligente (helper puro, TDD)

**Files:** Create `src/lib/datasFeira.ts`. Test `src/lib/datasFeira.test.ts`.

**Interfaces:** Produz `datasDisponiveis(fair: { dias_semana: number[]; data_inicio: string; data_fim: string }, hoje: Date): string[]`
— retorna datas `YYYY-MM-DD` que caem nos `dias_semana`, dentro de [data_inicio, data_fim],
não no passado (>= hoje), ordenadas.

- [ ] **Step 1 (RED):** teste cobrindo: só devolve dias da recorrência (ex só sábados);
  exclui datas passadas; respeita data_fim; array vazio se período todo no passado;
  recorrência multi-dia (`{0,6}`) devolve sáb+dom.
- [ ] **Step 2 (GREEN):** implementar. Cuidado com timezone — trabalhar em data local `YYYY-MM-DD`
  sem `Date` UTC-shift (construir com `new Date(y,m,d)` ou comparar strings). `// ponytail:` se usar heurística.
- [ ] **Step 3:** `npm run test` verde. Commit.

---

### Task 3: Nova Inscrição (/VendorApply) — wizard 3 passos → application pendente

**Files:** Create `src/pages/VendorApply.tsx` (+ steps inline ou em `src/pages/apply/`).
Modify `src/App.tsx`.

**Interfaces:** Consome `supabase`, `useAuth`, `datasDisponiveis`, `NegocioForm` (adicionar negócio inline).

- [ ] **Step 1 — Passo Marca:** lista os businesses do user; "inscrever com a mesma marca?"
  selecionar um; botão "Adicionar novo negócio" abre `NegocioForm` (Task 1) e usa o recém-criado.
  Se o user não tem negócio, força criar um.
- [ ] **Step 2 — Passo Feira+Data:** lista `fairs` com `status='aberto'` **ocultando** feiras onde
  o user já tem application ativa (pendente/aprovado/confirmado) na mesma feira. Selecionar 1 feira →
  card expande com calendário: `<input type="date">` cujo `min`/`max` e validação usam
  `datasDisponiveis(fair, hoje)` (rejeitar data fora da lista). Mostrar taxa e vagas.
- [ ] **Step 3 — Passo Termos:** checkbox obrigatório "Li e aceito os termos de participação e o
  regulamento da feira". Botão label dinâmico ("Selecione a data" → "Enviar inscrição"), desabilitado
  até ter negócio+feira+data+aceite. Submit → `insert applications { user_id, business_id, fair_id,
  data_escolhida, status:'pendente', aceite_termos:true }`. Tela de confirmação/resumo + "inscrição
  enviada, pendente de análise". Se `curadoria_status==='pendente'`, mostrar aviso suave (permite mesmo assim).
- [ ] **Step 4:** Wire `/VendorApply` → `<VendorApply/>`. `npm run build` + test verdes. Commit.

---

### Task 4: Minhas Propostas — Painel mostra applications reais

**Files:** Modify `src/pages/VendorPanel.tsx`. Create `src/components/PropostaCard.tsx`.

**Interfaces:** Consome `supabase`, `useAuth`. Lê applications do user + join fair/park/business.

- [ ] **Step 1:** Na aba "Minhas Propostas", buscar
  `applications` do user com join (`select *, fairs(nome,local,taxa,parks(nome)), businesses(nome)`),
  renderizar `PropostaCard` (imagem/nome da feira, parque+local, badge do negócio, badge de status
  colorido, data escolhida, taxa). Link "+ Nova inscrição" → `/VendorApply`. Empty state se vazio.
- [ ] **Step 2:** Atualizar os KPIs do Painel a partir de contagens reais simples: Inscrições =
  count applications; Pendências = count status pendente; Contratos ativos / Participações = 0 por
  ora (pagamento/realizada vêm depois). `// ponytail: KPIs de pagamento/participação nas fatias 4-6`.
- [ ] **Step 3:** `npm run build` + test verdes. Commit.

---

### Task 5: Verificação ponta-a-ponta da fatia

- [ ] **Step 1:** `npm run test` — todos verdes (inclui datasFeira + negocioForm schema).
- [ ] **Step 2:** Browser (preview): logar (ou seed de user aprovado via MCP), criar/editar negócio,
  fazer Nova Inscrição (calendário só habilita dias válidos), enviar → ver a proposta pendente no Painel.
- [ ] **Step 3:** Conferir no banco (MCP): 1 row em applications (status pendente) do user; RLS —
  user só vê as suas.
- [ ] **Step 4:** `npm run build` sem erro de tipo. Commit final `feat: Fatia 2 completa`.

## Notas de execução
- PostgREST já expõe `guery_feiras`; após criar tabelas, `notify pgrst,'reload schema'`.
- Para e2e de inscrição é preciso um user autenticado; em dev pode-se aprovar/confirmar um user de
  teste via MCP (auth) ou desligar confirmação de e-mail temporariamente.
