# Guery Feiras - HANDOFF

Atualizado em 2026-07-15 (roadmap implementado).

## Consulta rápida do código

- Grafo estrutural versionado em `docs/graph/` (`GRAPH_REPORT.md`, `graph.html`, `graph.json`).
- Mapa de arquitetura: `CLAUDE.md`. Specs de produto: `vivafeiras-vendorpanel-specs.md`.

## Estado atual

- Repo: `/Users/brenooliveira/Downloads/Claude code`
- Branch: `main`
- Remoto: `origin/main`
- Produção: https://guery-feiras.vercel.app
- Vercel project: `guery-feiras`
- Supabase usado pelo app: `pyyyrzwdidcronhidkwb`
- Schema do app: `guery_feiras`

## Segurança de produção

Este Supabase é compartilhado com outras operações em produção. Não tratar como sandbox.

Regras antes de qualquer mudança:

- Não alterar `public`, outros schemas, secrets, Storage, Edge Functions ou Auth global sem confirmação explícita.
- Para Guery Feiras, mudanças de banco devem ficar no schema `guery_feiras`.
- Preferir alterações reversíveis e pequenas.
- Auth settings como `Site URL` são globais do projeto. Evitar mudar. Se necessário para e-mail, adicionar somente allowlist em `Additional Redirect URLs`.

## Feito em 2026-07-09

- `d3b49c9` — canal de suporte real: tabela `problem_reports` (migration `0010`, RLS) +
  botão "Reportar problema" no app + aba **Suporte** na curadoria.
- `cddd4c1` — E2E Playwright (`e2e/auth-redirect.spec.ts`): login/redirect por papel,
  sob demanda apenas (nunca em CI — login real contra produção). Ver `docs/runbook.md`.
- `abd06e4` — observabilidade: Sentry (`@sentry/react`) em `src/main.tsx`. Só reporta em
  produção; captura `console.error` como evento. Env var nova: `VITE_SENTRY_DSN` (Vercel OK).
- `64ef06f`..`8949e1f` — CI no GitHub Actions (build + test com env placeholder, Node 24) +
  hardening de RLS/performance (migration `0009`) + `docs/runbook.md`.
- CLAUDE.md do projeto criado/aprimorado (mapa de arquitetura, Edge Functions, DoD).

## Feito em 2026-07-15 (roadmap)

- **Grafo do código** em `docs/graph/` (401 nós, 580 arestas) para navegação no GitHub.
- **Migration `0011`** — hardening RLS: dono não atualiza `applications`; revoga INSERT direto em
  `payments`/`wallet_transactions`; `confirmar_pagamento` usa taxa real da feira no servidor;
  RPCs transacionais `curar_inscricao`, `cancelar_data_organizador`, `expirar_inscricoes_sem_pagamento`.
- **Edge Function `expirar-pagamentos`** — job de cancelamento por falta de pagamento (7 dias).
- **UX pagamentos:** seção Meus Créditos em `/VendorPayments`, feedback `?pago=1`/`?cancelado=1`,
  label "Cartão" no modal (PIX adiado), aviso de crédito no passo 3 de `/VendorApply`.
- **Polish:** `src/lib/formatacao.ts`, badges unificados em `statusInscricao.ts`, corrida do
  `AuthProvider` corrigida, aba Participações lista inscrições `realizada`.

## Feito em 2026-07-15 (Stripe + curadoria)

- Gateway de pagamento trocado: **Pagar.me fake → Stripe Checkout real** (commit `9e57c50`).
  - Edge Functions `supabase/functions/stripe-checkout` (cria Checkout Session hospedada,
    revalida taxa/dono via RLS) e `supabase/functions/stripe-webhook` (confirma pagamento
    via `checkout.session.completed`, chama RPC nova `confirmar_pagamento_admin` —
    migration `0007`, variante service-role da RPC transacional existente).
  - Gotcha resolvido: Stripe SDK em Deno precisa de
    `httpClient: Stripe.createFetchHttpClient()` no construtor — sem isso dá erro genérico
    de conexão (o cliente padrão tenta usar o módulo `http` do Node, que não existe no
    runtime de Edge Function).
  - **MVP só cartão** — PIX foi removido de `payment_method_types` por decisão do usuário
    (conta Stripe ainda não terminou onboarding: `charges_enabled: false`,
    `capabilities: {}`). Reativar é só devolver `'pix'` no array em
    `supabase/functions/stripe-checkout/index.ts` (linha comentada) + terminar onboarding
    em https://dashboard.stripe.com/settings/business/profile e ativar o método em
    https://dashboard.stripe.com/settings/payment_methods.
  - `src/lib/pagarme.ts` / `pagarme.test.ts` / `supabase/functions/pagarme/` removidos.
  - `PagamentoModal.tsx` simplificado: sem QR fake / form de cartão manual / polling —
    agora é um botão que chama `stripe-checkout` e redireciona pra `session.url`.
  - **PENDENTE (usuário):** `STRIPE_WEBHOOK_SECRET` — precisa criar o endpoint de webhook
    no dashboard da Stripe (`https://dashboard.stripe.com/test/webhooks`, URL
    `https://pyyyrzwdidcronhidkwb.supabase.co/functions/v1/stripe-webhook`, evento
    `checkout.session.completed`) e rodar
    `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`. Sem isso o webhook não
    confirma pagamento automaticamente (checkout cria a sessão normalmente, mas a
    confirmação no banco fica pendente até o secret ser configurado).
  - Verificado: Checkout Session real criada com sucesso (200, URL válida do Stripe) via
    preview; não foi possível completar o pagamento ponta-a-ponta no sandbox (bloqueia
    navegação pra domínio externo) — falta validação manual com cartão de teste
    `4242 4242 4242 4242`.

- Área de curadoria (admin) redesenhada pra seguir o padrão visual do painel do
  comerciante (commit `a7a5ba9`, depois estendida com Indicadores/Suporte em commits
  seguintes já presentes no histórico). `Sidebar`/`Topbar` viraram componentes
  reutilizáveis (prop `itens` e `role`) em vez de duplicar layout — `AdminLayout` usa os
  dois com badge "Curador" no topo.

- Acesso de teste criado: `teste.stripe@guery.dev` / `teste123456` — comerciante com
  negócio cadastrado e inscrição **aprovada** em "Feira de Sábado da Jaqueira" (R$ 200,
  pronta pra testar o botão Pagar). `gf_admin=false` (é conta de comerciante, não admin).


## Últimos commits relevantes (2026-07-08 e antes)

- `e095a64` - ignora skills locais de agente.
- `19c8dc7` - força confirmação de e-mail voltar para a origem atual do site.
- `87b34eb` - ignora estado local da Vercel.
- `f165072` - `vercel.json` com rewrite de SPA para deep links.
- `4130814` / `36f7b0c` - RPC `confirmar_pagamento` + esqueleto de Edge Function Pagar.me (substituído em 2026-07-15, ver seção acima).
- `2d6a5fb` / `7ed2f2a` - gateway Pagar.me fake (removido em 2026-07-15).
- `c2fe7a2` - merge Fatia 5, carteira/crédito.
- `9e57c50` - Stripe Checkout real substitui o gateway fake (ver "Feito em 2026-07-15").
- `a7a5ba9` - curadoria segue o layout do painel do comerciante (ver "Feito em 2026-07-15").

## Correções feitas em 2026-07-08

### Link de confirmação de e-mail

Problema: e-mail de confirmação apontava para `localhost:3000` e expirava.

Correção no app:

- Arquivo: `src/pages/Signup.tsx`
- `supabase.auth.signUp` agora usa:
  - `emailRedirectTo: window.location.origin + '/VendorPanel'`

Observação: o link antigo expirado não volta a funcionar. É preciso gerar novo e-mail.

### Tela branca em produção

Problema: a Vercel não tinha variáveis de ambiente para o build Vite, então o app quebrava antes de renderizar.

Correção na Vercel Production:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Depois disso foi feito deploy de produção. O bundle atual publicado contém a URL correta do Supabase e `/VendorPanel` responde `200`.

## Acessos criados

Criados diretamente no Auth do Supabase `pyyyrzwdidcronhidkwb`, com autorização explícita do usuário.

- `brenooliver@outlook.com`
  - Tipo: admin/curadoria
  - `email_confirmado`: true
  - `gf_admin`: true
  - `curadoria_status`: aprovado

- `sucessobreno1@gmail.com`
  - Tipo: comerciante
  - `email_confirmado`: true
  - `gf_admin`: false
  - `curadoria_status`: aprovado

- `teste.stripe@guery.dev` / `teste123456`
  - Tipo: comerciante (conta de teste, criada via SQL — ver skill `supabase-breninja`)
  - Negócio: "Comerciante Teste Stripe"
  - Tem inscrição **aprovada** em "Feira de Sábado da Jaqueira" (R$ 200) — pronta pra testar o Checkout da Stripe
  - `gf_admin`: false

Senha temporária não foi gravada neste arquivo. Consultar a conversa atual se ainda necessário e trocar a senha depois do primeiro acesso.

Validação feita via `supabase.auth.signInWithPassword`: os dois logins passaram.

## MCP Supabase

Há dois servidores configurados no Codex:

- `supabase`
  - `project_ref=pyyyrzwdidcronhidkwb`
  - Projeto do app Guery Feiras no `.env.local`
  - Em alguns momentos o plugin callable não expôs permissões completas para este projeto.

- `supabase-guery`
  - `project_ref=tqwpnrhgpmlsxccewnfm`
  - Aparece como projeto "Guery Burguer"
  - Não confundir com Guery Feiras.

## Vercel

Comandos úteis:

```bash
vercel env ls
vercel deploy --prod
```

O projeto não tinha env vars até 2026-07-08. Agora Production tem as duas `VITE_` necessárias.

## Validações recentes

- `npm run test`: 6 arquivos, 35 testes verdes (queda de 38→35 é esperada: os 3 testes de `pagarme.ts` saíram junto com o arquivo removido).
- `npm run build`: OK. Aviso de chunk grande do Vite é conhecido.
- `https://guery-feiras.vercel.app/VendorPanel`: HTTP 200.
- Login dos dois acessos criados: OK.

## Próximos passos recomendados

1. Abrir `https://guery-feiras.vercel.app/login` em aba anônima ou hard refresh.
2. Trocar as senhas temporárias.
3. Se o e-mail de confirmação voltar a ser usado, adicionar no Supabase Auth, sem trocar `Site URL` global:

```txt
https://guery-feiras.vercel.app/**
```

4. **Stripe — fechar a integração real (prioridade operacional):**
   - Configurar `STRIPE_WEBHOOK_SECRET` (ver seção Stripe acima) — sem isso o
     pagamento fica sem confirmação automática.
   - Testar ponta-a-ponta em produção com cartão de teste `4242 4242 4242 4242`.
   - Terminar onboarding da conta Stripe e reativar PIX quando decidir.
   - Agendar cron no Supabase para `expirar-pagamentos` (opcional: `CRON_SECRET`).

5. Próximas features ainda fora de escopo:
   - combos (1 pagamento → N datas)

## Observação técnica

- `AuthProvider`: corrida no reload tratada com `onAuthStateChange` + `maybeSingle()`.
