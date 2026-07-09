# Guery Feiras — CLAUDE.md do projeto

Complementa o CLAUDE.md global do Breno. Em conflito, este arquivo (projeto) vence.

## O que é este projeto

Marketplace de feiras de rua/parques: comerciante se cadastra, passa por curadoria,
se inscreve em datas de feira, paga (Stripe Checkout) e gerencia carteira de crédito.
Dois papéis: **comerciante** (rotas `/Vendor*`) e **curador/admin** (rotas `/curadoria`,
flag `gf_admin`). Produção real com usuários reais: https://guery-feiras.vercel.app

- Especificação do produto: `vivafeiras-vendorpanel-specs.md` (as "§" nos comentários referem-se a ela)
- Estado atual + contas de acesso: `HANDOFF.md`
- Rollback, E2E, contas demo e pós-incidente: `docs/runbook.md`
- Planos por fatia (histórico de como o app foi construído): `docs/superpowers/plans/`

## Stack e comandos

Vite + React 18 + TypeScript + Tailwind + react-hook-form/zod + Supabase + Vercel + Stripe (test mode) + Sentry.

- `npm run dev` — dev server em :5173
- `npm run build` — type-check (`tsc -b`) + build. **Tem que passar antes de qualquer commit.**
- `npm run test` — vitest (testes unitários de `src/lib` e schemas zod)
- `npm run test:e2e` — Playwright, **sob demanda apenas** (ver regra abaixo)

CI (GitHub Actions, Node 24) roda `build` + `test` em todo push na `main`, com env
placeholder — o CI nunca toca rede/banco. E2E fica fora do CI de propósito.

## Mapa de arquitetura (onde mexer)

- Rotas: **todas** registradas em `src/App.tsx`. Tela nova de comerciante entra dentro de
  `<ProtectedRoute>` + `AppLayout`; tela de curadoria dentro de `<AdminRoute>` + `AdminLayout`.
  Nunca fora deles. `/` e 404 redirecionam para `/VendorPanel`. Item de menu novo entra em
  `src/layouts/Sidebar.tsx`.
- Sessão/papel: `src/auth/AuthProvider.tsx` (carrega profile; `gf_admin` decide redirect
  para `/curadoria` vs `/VendorPanel`).
- Status de inscrição/pagamento: `src/lib/statusInscricao.ts` é o único ponto de decisão —
  não duplicar essa lógica em telas.
- Carteira de crédito: `src/lib/carteira.ts` (exemplo canônico de lógica pura + teste).
- Sentry: init em `src/main.tsx`; só reporta em produção e captura `console.error` como
  evento — usar `console.error` para erro que precisa aparecer no Sentry.
- Fluxo de pagamento (fim a fim): tela `VendorPayments` → Edge Function `stripe-checkout`
  (cria a session; valor recalculado no servidor via RLS, nunca confia no client) →
  Stripe hospeda o checkout → Edge Function `stripe-webhook` → RPC `confirmar_pagamento`
  no schema `guery_feiras`. Bug de pagamento: rastrear essa cadeia inteira antes de editar.

## Banco de dados (CRÍTICO — ler antes de qualquer SQL)

- Projeto Supabase: `pyyyrzwdidcronhidkwb` (BreninjaDB). É **compartilhado com clientes
  reais em produção** em outros schemas (`guery`, `nails_*`, `daniele`, `fyado`...).
- Este app usa **exclusivamente o schema `guery_feiras`**. Nunca rodar SQL em `public`
  ou em outro schema sem confirmação explícita do Breno.
- Migrations: arquivos numerados em `supabase/migrations/` (próximo número = maior
  existente + 1), aplicadas via MCP Supabase `apply_migration`. São **forward-only e
  aditivas** — nunca `drop table`/`drop schema`. Rollback é manual e pontual (ver runbook).
- Toda tabela nova sai com RLS habilitado + policies. Depois de mudança de banco,
  rodar os Advisors do Supabase (security + performance) escopados a `guery_feiras`.
- Gotcha: o schema `guery_feiras` precisa estar em **Settings → API → Exposed schemas**,
  senão `supabase.from(...)` retorna 404. O client já fixa `db: { schema: 'guery_feiras' }`
  em `src/lib/supabase.ts`.
- Cuidado com o MCP: existe outro servidor Supabase apontando para `tqwpnrhgpmlsxccewnfm`
  ("Guery Burguer"). Confirmar o `project_ref` antes de executar qualquer coisa.

## Edge Functions (Stripe)

- Vivem em `supabase/functions/` (`stripe-checkout`, `stripe-webhook`), rodam em Deno.
- **Deploy é separado do app**: push na Vercel NÃO atualiza Edge Function. Mudou função →
  deploy via MCP Supabase `deploy_edge_function` (confirmar `project_ref` antes).
- Secrets delas (`STRIPE_SECRET_KEY`, webhook secret) vivem nos secrets do Supabase,
  não nas env vars `VITE_*` da Vercel.
- Regra de ouro: valor e dono da cobrança são recalculados no servidor;
  nunca aceitar preço vindo do client.

## Convenções de código (o que o repo já faz — seguir igual)

- **Vocabulário de domínio em português** nos nomes: `carteira.ts`, `temCredito`,
  `confirmar_pagamento`, `CuradoriaInscricoes.tsx`. Termos genéricos de engenharia em
  inglês (`ProtectedRoute`, `AuthProvider`). Esta é a exceção consciente à regra global
  "código em inglês" — não renomear o que existe.
- Lógica pura (cálculo, validação, máquina de estados) vai em `src/lib/` como função
  pura, com teste colocalizado `*.test.ts` (vitest). Componentes só orquestram.
  Exemplo canônico: `src/lib/carteira.ts` + `carteira.test.ts`.
- Estrutura: `pages/` (uma tela = um arquivo; curadoria em `pages/curadoria/`),
  `components/` (reutilizáveis), `layouts/` (AppLayout comerciante, AdminLayout curadoria),
  `routes/` (`ProtectedRoute`, `AdminRoute`), `auth/` (sessão).
- Simplificação deliberada leva comentário `// ponytail: ...` explicando o teto e o
  caminho de upgrade. Manter esse padrão.
- Commits convencionais em inglês no prefixo, descrição pode ser pt-BR
  (padrão real do repo: `feat: aba de Indicadores na curadoria`).

## Regras de segurança do projeto

- Secrets só em env vars (`.env.local` local, Vercel em produção). Nunca em código,
  nunca em arquivo versionado. Env vars do app: `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_DSN` (ver `.env.example`).
- Rotas protegidas passam por `ProtectedRoute`/`AdminRoute` — tela nova de comerciante
  ou curadoria nunca é registrada fora deles (ver Mapa de arquitetura).
- Stripe está em **test mode**. Não ativar live mode sem ordem explícita.
- Contas de demo para teste: ver `docs/runbook.md`. Não criar usuários no Auth de
  produção sem autorização (o Auth é global do projeto Supabase compartilhado).

## E2E (regra dura)

`npm run test:e2e` faz **login real contra o Supabase de produção** com contas demo.
Por isso NÃO roda em CI nem "por via das dúvidas". Rodar somente antes de mexer em:
login/redirect por papel, RLS, ou navegação do menu. Precisa de dev server em :5173.
Contas e detalhes no runbook.

## Deploy

Push na `main` → deploy automático na Vercel (projeto `guery-feiras`).
Depois de todo deploy: smoke test na URL de produção — home carrega, login de
comerciante cai em `/VendorPanel`, login de curador cai em `/curadoria`.
Só então mandar o link pro Breno. Rollback: promote de deployment anterior (runbook).
Lembrete: Edge Function alterada precisa de deploy próprio (seção acima).

## Definition of done — checar antes de dizer "pronto"

1. `npm run build` passa (inclui type-check).
2. `npm run test` passa; lógica nova em `src/lib` tem teste.
3. Fluxo tocado foi exercitado de verdade no browser (dev server ou produção) — não
   só "compilou". "Deve funcionar" é proibido.
4. Mexeu em banco? Migration numerada commitada + Advisors verificados + RLS na tabela nova.
5. Mexeu em auth/RLS/menu? `npm run test:e2e` rodado e verde.
6. Mexeu em Edge Function? `deploy_edge_function` feito e fluxo de pagamento testado.
7. Deploy feito? Smoke test em produção feito.
8. Trabalho relevante fechado? `HANDOFF.md` atualizado (estado, contas, pendências).

## Como retomar o projeto

Ler `HANDOFF.md` + `git log --oneline -15` antes de qualquer código; apresentar
estado + próximos passos primeiro. (Skill `retomar-projeto` cobre isso.)
