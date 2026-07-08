# Guery Feiras — Fatia 3 (Curadoria + Máquina de Estados + Notificações) — Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps `- [ ]`.
> Base: branch `fatia-3` (off `main`). Spec-fonte: `vivafeiras-vendorpanel-specs.md` §10, §12.

**Goal:** Um curador (admin) vê cadastros e inscrições pendentes, **aprova/reprova** (com motivo),
o `status`/`curadoria_status` transiciona, e o comerciante **recebe uma notificação** (sino no topbar
com contador real). Fecha o loop: comerciante inscreve (F2, pendente) → curador aprova (F3) → comerciante notificado.

**Architecture:** Mesmo SPA. Área de curadoria em rotas `/curadoria/*` guardadas por um novo
`AdminRoute` (checa `user.app_metadata.gf_admin`). Notificações em tabela `notifications`, inseridas
pelo app na transição (não por trigger — mais fácil de raciocinar; a transição já roda em código do app).

## Global Constraints
- Schema `guery_feiras` só. Project `pyyyrzwdidcronhidkwb`. RLS em toda tabela; pt-br snake_case.
- Reutilizar padrões: `useAuth`, `supabase`, paleta `marca.*`, class-strings, Radix, PropostaCard/badges.
- `guery_feiras.is_admin()` já existe (lê `app_metadata.gf_admin`). Um user vira curador setando
  `raw_app_meta_data.gf_admin=true` via MCP (sem tabela de roles nesta fatia).
- Migrations via MCP `apply_migration` (controller aplica) + `.sql` em `supabase/migrations/`.
- Sem Pagar.me/pagamento (F4), carteira (F5), avaliações (F6).

## Decisões (ponytail — "o recomendado")
- **Curadoria no mesmo SPA**, rotas `/curadoria` e `/curadoria/inscricoes`, guard `AdminRoute`. Sem app separado.
- **Admin = flag manual** `app_metadata.gf_admin=true` via MCP. Documentar no README.
- **Notificações inseridas pelo app** na transição de status (curador aprova/reprova). Sino lê a tabela.
- **Gate do comerciante continua permissivo** (Nova Inscrição F2 avisa mas deixa enviar) — não endurecer aqui. `// ponytail: F2 gate segue permissivo`.
- **Estados nesta fatia:** applications `pendente → em_analise → aprovado | reprovado`; cadastro
  `curadoria_status pendente → aprovado | reprovado`. `confirmado/realizada/cancelado_*` dependem de
  pagamento/organizador → fatias 4+. Não implementar aqui.

---

### Task 0: Migration — notifications + updated_at triggers

**Files:** Create `supabase/migrations/0003_curadoria_notificacoes.sql`.

**Interfaces:** Produz `guery_feiras.notifications` + policies + trigger `touch_updated_at` em
applications/profiles/businesses.

- [ ] **Step 1:** Aplicar via MCP `apply_migration` (name `curadoria_notificacoes`) e gravar o `.sql`:

```sql
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

-- dono lê/atualiza (marcar lida) as suas; QUALQUER autenticado insere (o curador cria notif p/ o comerciante)
create policy "notif: dono lê" on guery_feiras.notifications for select
  using (user_id = auth.uid());
create policy "notif: dono marca lida" on guery_feiras.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notif: admin insere" on guery_feiras.notifications for insert
  with check (guery_feiras.is_admin());

-- curador precisa ler/atualizar cadastros e inscrições alheios: as policies de profiles/applications
-- já incluem `or guery_feiras.is_admin()` no SELECT; ADICIONAR update de admin:
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
```

- [ ] **Step 2:** `notify pgrst,'reload schema'`. Verificar tabela + policies via MCP.
- [ ] **Step 3:** Commit `feat(db): notifications + updated_at triggers + policies admin`.

---

### Task 1: AdminRoute + isAdmin no AuthProvider

**Files:** Modify `src/auth/AuthProvider.tsx` (expor `isAdmin`). Create `src/routes/AdminRoute.tsx`.

- [ ] **Step 1:** No AuthProvider, derivar `isAdmin = session?.user?.app_metadata?.gf_admin === true`
  e adicionar ao context type + value.
- [ ] **Step 2:** `AdminRoute.tsx` — igual ao ProtectedRoute mas: se `loading` spinner; se sem session →
  `/login`; se session mas `!isAdmin` → `<Navigate to="/VendorPanel" replace/>` (comerciante comum não entra);
  senão `<Outlet/>`.
- [ ] **Step 3:** build + test verdes. Commit.

---

### Task 2: Máquina de estados (helper puro, TDD)

**Files:** Create `src/lib/statusInscricao.ts` + test.

**Interfaces:** `STATUS_LABELS` (map status→{label,cor}) reaproveitável; `podeCurar(status): boolean`
(true se `pendente`|`em_analise`); `transicaoCuradoria(atual, decisao: 'aprovar'|'reprovar'): Status`
(retorna `aprovado`/`reprovado`, lança se `!podeCurar`). Centraliza o que hoje está espalhado no PropostaCard.

- [ ] **Step 1 (RED):** teste — podeCurar só p/ pendente/em_analise; transicaoCuradoria mapeia
  aprovar→aprovado, reprovar→reprovado; lança em status terminal (ex 'realizada').
- [ ] **Step 2 (GREEN):** implementar. Refatorar `PropostaCard` p/ usar `STATUS_LABELS` se reduzir duplicação.
- [ ] **Step 3:** test verde. Commit.

---

### Task 3: Curadoria de Cadastros (/curadoria)

**Files:** Create `src/pages/curadoria/CuradoriaCadastros.tsx` (+ layout admin simples). Modify `App.tsx`.

- [ ] **Step 1:** Rota `/curadoria` sob `<AdminRoute>`. Página lista `profiles` com
  `curadoria_status='pendente'` (RLS admin SELECT já permite). Cada linha: nome, cpf, email, negócios
  do user (opcional). Botões **Aprovar** / **Reprovar** (reprovar abre campo `curadoria_motivo`).
- [ ] **Step 2:** Aprovar → `update profiles set curadoria_status='aprovado'` + `insert notifications
  {user_id, tipo:'cadastro_aprovado', titulo:'Cadastro aprovado ✅', corpo}`. Reprovar → `'reprovado'`
  + `curadoria_motivo` + notif `cadastro_reprovado`. Recarrega lista.
- [ ] **Step 3:** build + test verdes. Commit.

---

### Task 4: Curadoria de Inscrições (/curadoria/inscricoes)

**Files:** Create `src/pages/curadoria/CuradoriaInscricoes.tsx`. Modify `App.tsx`.

- [ ] **Step 1:** Lista `applications` onde `podeCurar(status)` (pendente/em_analise), join
  `businesses(nome), fairs(nome,taxa,parks(nome))` e o dono (email do profile). Card: feira, parque,
  negócio, data, taxa, status badge (STATUS_LABELS).
- [ ] **Step 2:** **Aprovar** → `update applications set status='aprovado'` + notif `inscricao_aprovada`
  ("Inscrição aprovada ✅ — realize o pagamento para confirmar"). **Reprovar** → `status='reprovado'`
  + notif `inscricao_reprovada` (com motivo). Usar `transicaoCuradoria`. Recarrega.
- [ ] **Step 3:** build + test verdes. Commit.

---

### Task 5: Notificações do comerciante (sino topbar real)

**Files:** Modify `src/layouts/Topbar.tsx`. Create `src/components/NotificacoesDropdown.tsx`.

- [ ] **Step 1:** Buscar `notifications` do user (`eq user_id`, order criado_em desc). Badge = count
  `lida=false`. Clicar no sino abre dropdown (Radix) com a lista (título, corpo, timestamp relativo)
  + botão **"Marcar todas"** (`update notifications set lida=true where user_id=... and lida=false`).
- [ ] **Step 2:** Substituir o badge stub "0" pelo count real. Empty state "Nenhuma notificação".
- [ ] **Step 3:** build + test verdes. Commit.

---

### Task 6: Verificação ponta-a-ponta

- [ ] **Step 1:** `npm run test` + `npm run build` verdes.
- [ ] **Step 2:** e2e (preview): criar 1 comerciante confirmado + 1 curador (setar `gf_admin` via MCP);
  comerciante inscreve (pendente) → curador loga em `/curadoria/inscricoes` e aprova → comerciante vê
  sino com 1 não lida + status "Aprovado" no painel. Testar reprovação de cadastro com motivo.
- [ ] **Step 3:** Conferir no banco: application status=aprovado, 1 notification não lida do user; RLS —
  comerciante NÃO vê `/curadoria` (redireciona), curador vê tudo.
- [ ] **Step 4:** build final. Commit `feat: Fatia 3 completa`. Limpar dados de teste.

## Notas
- Criar curador de teste: `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"gf_admin":true}' where email=...` (via MCP) — o flag entra no JWT no próximo login.
- Gotcha user-de-teste-confirmado via SQL: ver memória `guery-feiras-projeto` (identities + tokens '').
