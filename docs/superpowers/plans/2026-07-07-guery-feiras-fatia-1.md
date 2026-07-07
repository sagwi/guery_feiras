# Guery Feiras — Fatia 1 (Fundação + Auth + Layout) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um comerciante consegue se cadastrar (wizard 3 passos), confirmar e-mail, logar e cair no Painel com estado "curadoria pendente", tudo sobre Supabase real.

**Architecture:** SPA React/Vite consumindo o schema `guery_feiras` no Supabase (BreninjaDB). Auth nativa do Supabase (email+senha, confirmação por e-mail). Estado de auth num context provider; rotas protegidas por curadoria/sessão. Schema segue as convenções do schema `guery` existente (profiles→auth.users, RLS + helpers SECURITY DEFINER).

**Tech Stack:** Vite, React 18, TypeScript, Tailwind, Radix UI, @supabase/supabase-js v2, react-router-dom v6, react-hook-form + zod, vitest.

## Global Constraints

- Schema Postgres: `guery_feiras` (nunca tocar em `guery`, `fyado`, `demo`, `daniele`).
- Supabase project id: `pyyyrzwdidcronhidkwb` (BreninjaDB).
- Colunas pt-br snake_case; `timestamptz default now()`; RLS habilitado em TODA tabela.
- IDs: UUID `gen_random_uuid()` p/ entidades; `bigint identity` p/ transacionais; `profiles.id = auth.users.id`.
- Branding: "Guery Feiras", paleta amarelo + roxo escuro, sidebar branca.
- Segredos só em `.env.local` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY); nunca commitar.
- Nada de Pagar.me nem fluxo admin nesta fatia (fatias 4 e 3).
- Migrations aplicadas via Supabase MCP `apply_migration` (name em snake_case) — não via Bash psql.

---

### Task 0: Scaffold do projeto

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.env.example`
- Create: `src/lib/supabase.ts`

**Interfaces:**
- Produces: `supabase` (SupabaseClient configurado com `db: { schema: 'guery_feiras' }`) exportado de `src/lib/supabase.ts`.

- [ ] **Step 1:** Scaffold Vite. Run: `npm create vite@latest . -- --template react-ts` (na pasta atual; aceitar sobrescrever nada essencial). Depois `npm i @supabase/supabase-js react-router-dom react-hook-form zod @hookform/resolvers @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-checkbox @radix-ui/react-dialog lucide-react` e `npm i -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom`.
- [ ] **Step 2:** `npx tailwindcss init -p`. Em `tailwind.config.ts` set `content: ['./index.html','./src/**/*.{ts,tsx}']` e cores da marca:

```ts
// theme.extend.colors
colors: { marca: { amarelo: '#F5B400', roxo: '#2E1065', roxoClaro: '#5B21B6' } }
```

- [ ] **Step 3:** `src/index.css` com as 3 diretivas tailwind (`@tailwind base; @tailwind components; @tailwind utilities;`).
- [ ] **Step 4:** Criar `.env.example`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Pedir ao usuário a URL + anon key do BreninjaDB e gravar em `.env.local` (obter via Supabase MCP `get_project_url` / `get_publishable_keys`).

- [ ] **Step 5:** `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!url || !anon) throw new Error('Faltam VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')

export const supabase = createClient(url, anon, {
  db: { schema: 'guery_feiras' },
  auth: { persistSession: true, autoRefreshToken: true },
})
```

- [ ] **Step 6:** Rodar `npm run dev` e confirmar app em branco carrega sem erro de console. Commit:

```bash
git add -A && git commit -m "chore: scaffold Vite+React+TS+Tailwind+Supabase"
```

---

### Task 1: Migration do schema `guery_feiras`

**Files:**
- Create (registro local): `supabase/migrations/0001_guery_feiras_fundacao.sql` (cópia do SQL aplicado, para versionar)

**Interfaces:**
- Produces: tabelas `guery_feiras.profiles`, `guery_feiras.businesses`, `guery_feiras.termos_aceite`; funções `guery_feiras.uid()`, `guery_feiras.is_admin()`, `guery_feiras.handle_new_user()`.

- [ ] **Step 1:** Aplicar via Supabase MCP `apply_migration` (project_id `pyyyrzwdidcronhidkwb`, name `guery_feiras_fundacao`) com o SQL abaixo. Gravar o mesmo SQL em `supabase/migrations/0001_guery_feiras_fundacao.sql`.

```sql
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
```

- [ ] **Step 2:** Verificar via MCP `execute_sql`: `select table_name from information_schema.tables where table_schema='guery_feiras';` → deve listar profiles, businesses, termos_aceite.
- [ ] **Step 3:** Expor `guery_feiras` na API: confirmar no painel Supabase (Settings > API > Exposed schemas) que `guery_feiras` está na lista. Se não, pedir ao usuário para adicionar (ou aplicar `ALTER ROLE ... set pgrst.db_schemas`). Documentar no README.
- [ ] **Step 4:** Commit:

```bash
git add supabase/ && git commit -m "feat(db): schema guery_feiras (profiles, businesses, termos, RLS, trigger)"
```

**NOTA:** o trigger cria o profile; o app NÃO deve inserir profile manualmente. O app só faz UPDATE em profiles e INSERT em businesses/termos.

---

### Task 2: Validador de CPF (TDD)

**Files:**
- Create: `src/lib/cpf.ts`
- Test: `src/lib/cpf.test.ts`

**Interfaces:**
- Produces: `validarCPF(cpf: string): boolean` (aceita com ou sem máscara; false p/ dígitos repetidos e checksum inválido).

- [ ] **Step 1: Teste que falha** — `src/lib/cpf.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validarCPF } from './cpf'

describe('validarCPF', () => {
  it('aceita CPF válido com máscara', () => expect(validarCPF('529.982.247-25')).toBe(true))
  it('aceita CPF válido sem máscara', () => expect(validarCPF('52998224725')).toBe(true))
  it('rejeita checksum inválido', () => expect(validarCPF('529.982.247-24')).toBe(false))
  it('rejeita dígitos repetidos', () => expect(validarCPF('111.111.111-11')).toBe(false))
  it('rejeita tamanho errado', () => expect(validarCPF('123')).toBe(false))
})
```

- [ ] **Step 2:** Rodar `npx vitest run src/lib/cpf.test.ts` → FAIL ("validarCPF is not defined"). (Adicionar `"test": "vitest run"` em package.json scripts; config `test: { environment: 'jsdom', globals: true }` em vite.config.ts.)
- [ ] **Step 3: Implementação** — `src/lib/cpf.ts`:

```ts
export function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const calc = (len: number) => {
    let soma = 0
    for (let i = 0; i < len; i++) soma += parseInt(d[i]) * (len + 1 - i)
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10])
}
```

- [ ] **Step 4:** `npx vitest run src/lib/cpf.test.ts` → PASS.
- [ ] **Step 5:** Commit: `git add src/lib/cpf.* && git commit -m "feat: validador de CPF com teste"`

---

### Task 3: Auth context + sessão + expiração por inatividade

**Files:**
- Create: `src/auth/AuthProvider.tsx`, `src/auth/useAuth.ts`, `src/auth/useIdleLogout.ts`
- Modify: `src/main.tsx` (envolver App no `<AuthProvider>` e `<BrowserRouter>`)

**Interfaces:**
- Consumes: `supabase` (Task 0).
- Produces: `useAuth()` → `{ session, user, profile, loading, signOut }`; `profile` inclui `curadoria_status`, `nome`.

- [ ] **Step 1:** `AuthProvider.tsx` — carrega sessão via `supabase.auth.getSession()`, assina `onAuthStateChange`, e após ter user busca `profile` (`supabase.from('profiles').select('*').eq('id', user.id).single()`). Expõe context. Full code:

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Profile = { id: string; nome: string | null; curadoria_status: string; email: string | null }
type Ctx = { session: Session|null; user: User|null; profile: Profile|null; loading: boolean; signOut: ()=>Promise<void> }
const AuthCtx = createContext<Ctx>(null!)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session|null>(null)
  const [profile, setProfile] = useState<Profile|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setProfile(null); return }
    supabase.from('profiles').select('id,nome,curadoria_status,email').eq('id', session.user.id).single()
      .then(({ data }) => setProfile(data as Profile))
  }, [session?.user?.id])

  const signOut = async () => { await supabase.auth.signOut() }
  return <AuthCtx.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut }}>{children}</AuthCtx.Provider>
}
```

- [ ] **Step 2:** `useIdleLogout.ts` — desloga após 30 min sem eventos de mouse/teclado:

```ts
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
export function useIdleLogout(minutos = 30) {
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const reset = () => { clearTimeout(t); t = setTimeout(() => supabase.auth.signOut(), minutos*60_000) }
    const evts = ['mousemove','keydown','click','scroll']
    evts.forEach(e => window.addEventListener(e, reset))
    reset()
    return () => { clearTimeout(t); evts.forEach(e => window.removeEventListener(e, reset)) }
  }, [minutos])
}
```

- [ ] **Step 3:** `main.tsx` envolve `<BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter>`.
- [ ] **Step 4:** `npm run dev` sem erros. Commit: `git commit -am "feat(auth): provider de sessão + idle logout"`

---

### Task 4: Rotas + guarda de rota + layouts

**Files:**
- Create: `src/routes/ProtectedRoute.tsx`, `src/layouts/AppLayout.tsx`, `src/layouts/AuthLayout.tsx`, `src/pages/Placeholder.tsx`
- Modify: `src/App.tsx` (definição das rotas)

**Interfaces:**
- Consumes: `useAuth()` (Task 3).
- Produces: rotas `/login`, `/signup`, `/recuperar-senha`, `/VendorPanel`, `/VendorBusinesses`, `/VendorApply`, `/VendorPayments`, `/VendorWallet`, `/ChangePassword`, `/VendorManual`. `AppLayout` renderiza sidebar+topbar+`<Outlet/>`.

- [ ] **Step 1:** `ProtectedRoute.tsx` — se `loading` mostra spinner; se sem `session` → `<Navigate to="/login">`; senão renderiza children.
- [ ] **Step 2:** `App.tsx` com `<Routes>`: rotas públicas dentro de `AuthLayout`; rotas privadas dentro de `ProtectedRoute > AppLayout`. Páginas ainda-não-implementadas usam `<Placeholder titulo="..."/>` (Meus Negócios, Nova Inscrição, Pagamentos, Carteira, Manual → fatias futuras). `/` redireciona p/ `/VendorPanel`.
- [ ] **Step 3:** `Placeholder.tsx` — card centralizado "Em breve — {titulo}" com estilo da marca.
- [ ] **Step 4:** `npm run dev`, navegar manualmente: `/login` acessível, `/VendorPanel` redireciona p/ login quando deslogado. Commit.

---

### Task 5: Wizard de cadastro (3 passos)

**Files:**
- Create: `src/pages/Signup.tsx`, `src/pages/signup/StepPessoais.tsx`, `src/pages/signup/StepNegocio.tsx`, `src/pages/signup/StepTermos.tsx`, `src/lib/segmentos.ts`
- Test: `src/pages/signup/signup.schema.test.ts`

**Interfaces:**
- Consumes: `validarCPF` (Task 2), `supabase` (Task 0).
- Produces: rota `/signup` que ao concluir chama `supabase.auth.signUp({ email, password, options: { data: { nome, cpf, nascimento, telefone } } })`, depois (na 1ª sessão, ver Task 9) insere business + termos.

- [ ] **Step 1:** `src/lib/segmentos.ts` exporta o array das 26 opções (copiar da spec, item 6) e as 5 faixas de faturamento.
- [ ] **Step 2: Teste do schema zod** — `signup.schema.test.ts` valida: CPF inválido rejeitado, menor de 18 rejeitado, email inválido rejeitado, feliz-caminho aceito. Definir `signupSchema` (zod) em `Signup.tsx` e importar no teste.

```ts
import { describe, it, expect } from 'vitest'
import { pessoaisSchema } from './StepPessoais'

const base = { nome:'Ana', cpf:'529.982.247-25', nascimento:'2000-01-01', telefone:'81999999999', email:'a@b.com', senha:'123456' }
describe('pessoaisSchema', () => {
  it('aceita válido', () => expect(pessoaisSchema.safeParse(base).success).toBe(true))
  it('rejeita CPF inválido', () => expect(pessoaisSchema.safeParse({...base, cpf:'111.111.111-11'}).success).toBe(false))
  it('rejeita menor de 18', () => {
    const hoje = new Date(); const d = `${hoje.getFullYear()-10}-01-01`
    expect(pessoaisSchema.safeParse({...base, nascimento:d}).success).toBe(false)
  })
})
```

- [ ] **Step 3:** Rodar teste → FAIL. Implementar `pessoaisSchema` em `StepPessoais.tsx` (zod + `.refine(validarCPF)` no cpf; refine nascimento ≥18 anos). Rodar → PASS.
- [ ] **Step 4:** `StepPessoais.tsx` — form (react-hook-form + zodResolver) dos campos pessoais; máscara de CPF/telefone via input controlado simples.
- [ ] **Step 5:** `StepNegocio.tsx` — nome marca, checkbox "possui Instagram" (revela campo @ condicional), select segmento (26 opções), textarea descrição, select faixa faturamento. `negocioSchema` zod.
- [ ] **Step 6:** `StepTermos.tsx` — 2 checkboxes (Termos de Uso, Política de Privacidade) com links (`/VendorManual` ou `#` placeholder); ambos obrigatórios. Botão "Criar conta" desabilitado até aceitar.
- [ ] **Step 7:** `Signup.tsx` — máquina de 3 passos (useState step 0..2), barra de progresso, guarda os dados dos passos, no submit final chama `supabase.auth.signUp(...)` com metadata; guarda `nome/negócio/termos` pendentes em `localStorage` chave `gf_onboarding` (para completar após confirmação de e-mail, Task 9); mostra tela "Confirme seu e-mail para ativar a conta".
- [ ] **Step 8:** `npx vitest run` verde. Testar manualmente: preencher wizard cria user no Supabase (verificar via MCP `execute_sql` `select id,email from auth.users order by created_at desc limit 1`; e `select * from guery_feiras.profiles` — trigger criou o profile). Commit.

---

### Task 6: Login + esqueci a senha

**Files:**
- Create: `src/pages/Login.tsx`, `src/pages/RecuperarSenha.tsx`

**Interfaces:**
- Consumes: `supabase`, `useAuth`.
- Produces: `/login`, `/recuperar-senha`.

- [ ] **Step 1:** `Login.tsx` — email, senha (com olho de revelar), "Lembrar de mim" (checkbox; quando desmarcado, não persistir — usar `supabase.auth` default persist; documentar limitação como aceitável nesta fatia), link "Esqueceu a senha?". Submit `supabase.auth.signInWithPassword`. Tratar erro `email_not_confirmed` com mensagem clara. Ao logar → `navigate('/VendorPanel')`.
- [ ] **Step 2:** `RecuperarSenha.tsx` — input email → `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/ChangePassword' })`; mostra "enviamos um link".
- [ ] **Step 3:** Testar manualmente login com o user criado (após confirmar e-mail no painel Supabase ou desativar confirmação em dev). Commit.

---

### Task 7: Alterar senha

**Files:**
- Create: `src/pages/ChangePassword.tsx`

**Interfaces:**
- Consumes: `supabase`.
- Produces: `/ChangePassword` (protegida).

- [ ] **Step 1:** Form: nova senha (mín. 6) + confirmar + olho de revelar; valida igualdade e tamanho; `supabase.auth.updateUser({ password })`; toast de sucesso. Também serve para o fluxo de reset (a sessão de recovery já vem autenticada pelo link).
- [ ] **Step 2:** Testar manualmente. Commit.

---

### Task 8: App layout (sidebar, topbar, report stub, cookies)

**Files:**
- Create: `src/layouts/Sidebar.tsx`, `src/layouts/Topbar.tsx`, `src/components/ReportarProblemaButton.tsx`, `src/components/CookieBanner.tsx`
- Modify: `src/layouts/AppLayout.tsx`

**Interfaces:**
- Consumes: `useAuth` (nome, signOut), `useIdleLogout`.
- Produces: layout completo em volta do `<Outlet/>`.

- [ ] **Step 1:** `Sidebar.tsx` — branca, logo "Guery Feiras", 8 `NavLink` (Painel, Meus negócios, Nova Inscrição, Pagamentos, Minha Carteira, Alterar Senha, Manual) + "Sair" no rodapé (chama `signOut` → `/login`). Item ativo em roxo.
- [ ] **Step 2:** `Topbar.tsx` — botão recolher sidebar (estado no AppLayout), sino de notificações (badge fixo "0" por enquanto), nome do usuário.
- [ ] **Step 3:** `ReportarProblemaButton.tsx` — botão flutuante canto inferior direito; ao clicar abre `<Dialog>` (Radix) com Título+Descrição e campo readonly "Página: {location.pathname}". Nesta fatia o submit só faz `console.info` + toast "recebido" (persistência real na Fatia 6). Marcar com `// ponytail: stub — persiste em problem_reports na Fatia 6`.
- [ ] **Step 4:** `CookieBanner.tsx` — banner LGPD fixo no rodapé até aceitar; grava `localStorage.gf_cookies='1'`. Cita Lei 13.709/2018.
- [ ] **Step 5:** `AppLayout.tsx` monta Sidebar + Topbar + `<main><Outlet/></main>` + ReportarProblema + CookieBanner; chama `useIdleLogout()`.
- [ ] **Step 6:** Commit.

---

### Task 9: Painel + completar onboarding pós-confirmação

**Files:**
- Create: `src/pages/VendorPanel.tsx`, `src/components/KpiCard.tsx`, `src/components/CuradoriaBanner.tsx`, `src/lib/completarOnboarding.ts`

**Interfaces:**
- Consumes: `useAuth` (profile), `supabase`, `localStorage.gf_onboarding` (Task 5).
- Produces: `/VendorPanel`.

- [ ] **Step 1:** `completarOnboarding.ts` — `export async function completarOnboarding(userId: string)`: se existir `localStorage.gf_onboarding`, faz `supabase.from('businesses').insert({...negócio, user_id})` e `supabase.from('termos_aceite').insert([{tipo:'uso'},{tipo:'privacidade'}].map(t=>({...t,user_id})))`, depois remove a chave. Idempotente (checa se já há business do user antes de inserir).
- [ ] **Step 2:** `VendorPanel.tsx` — no mount chama `completarOnboarding(user.id)`. Renderiza saudação "Olá, {profile.nome}! 👋 — Gerencie suas inscrições e participações", `CuradoriaBanner` quando `curadoria_status==='pendente'` ("Seu cadastro está em análise pela curadoria (até 48h úteis)"), 4 `KpiCard` (Contratos ativos, Inscrições, Pendências, Participações — todos 0), abas Radix "Minhas Propostas" | "Últimas Participações" com empty states ("Nenhuma proposta ainda" / "Nenhuma participação registrada").
- [ ] **Step 3:** `KpiCard.tsx` — card com label + valor grande + ícone lucide, borda/realce roxo.
- [ ] **Step 4:** Verificar: após login de um user recém-confirmado, o business aparece no banco (MCP `select count(*) from guery_feiras.businesses`) e o painel mostra "curadoria pendente" + KPIs zerados. Commit.

---

### Task 10: Verificação ponta-a-ponta da fatia

- [ ] **Step 1:** Rodar `npx vitest run` — todos verdes.
- [ ] **Step 2:** Fluxo manual completo no browser (usar a skill `verify` / preview): signup wizard → (confirmar e-mail via painel Supabase em dev) → login → painel com curadoria pendente. Conferir no banco via MCP: 1 row em profiles (curadoria_status=pendente), 1 em businesses, 2 em termos_aceite.
- [ ] **Step 3:** Conferir RLS: logado como user A, `supabase.from('businesses').select()` retorna só os do A (testar criando 2 users). 
- [ ] **Step 4:** `npm run build` sem erros de tipo. Commit final da fatia: `git commit -am "feat: Fatia 1 completa (fundação + auth + layout)"`.

---

## Notas de execução
- Confirmação de e-mail: em dev pode-se desativar em Supabase Auth settings para agilizar; reativar antes de produção.
- Exposição do schema na API PostgREST é pré-requisito da Task 5 em diante (Task 1 Step 3).
- Hook de Write quebrado no ambiente: corrigir `settings.json` (aspas no comando do hook) antes de executar, senão toda escrita de arquivo precisa de workaround por shell.
