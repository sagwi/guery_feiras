# Handoff de migração de computador | 21/10/2026

<!-- migration-handoff-2026-10-21 -->

Autor: Codex. Tarefa: MIGRACAO-PC-2026-10-21. Próximo responsável: Breno e agente no novo PC.

## Estado verificado localmente

- Pasta de origem: `/Users/brenooliveira/Documents/ProjetosDEV/Claude code`. No destino, adaptar o caminho à nova máquina.
- Branch: `main`.
- HEAD: `f68da13930ce55a60b55943d25aa6e8771119597`.
- Evidência: consultas locais de Git e arquivos em 21/10/2026 (America/Recife). Nenhum fetch, push, commit, deploy ou operação de banco executado. Referências remotas abaixo são o cache local e podem estar desatualizadas.
- Verificação desta entrega: documental. Build, testes de aplicação e estado de produção não foram revalidados. As validações do histórico continuam datadas.

## Atenção para a transferência

- Estado completo dos arquivos não confirmado: git status falhou ou excedeu 12 segundos. Não tratar este checkout como limpo; disponibilizar os arquivos do iCloud e repetir a conferência antes de apagar o PC antigo.

### Remotos configurados

```text
origin	https://github.com/sagwi/guery_feiras.git (fetch)
origin	https://github.com/sagwi/guery_feiras.git (push)
```

### Upstream

```text
origin/main
```

### Commits à frente / atrás do upstream local

```text
0	6
```

### Alterações existentes antes desta atualização

```text
INDISPONÍVEL: timeout de leitura
```

### Branches locais

```text
fatia-1 38adb22 fix: propaga erros de query (checagem de onboarding + carga de profile)
  fatia-2 92894bc feat: Painel lista propostas reais + KPIs por status
  fatia-3 18a4d8e feat: sino de notificações real (contador + marcar todas)
  fatia-4 4758db3 feat: painel reflete pagamento (KPIs + ação Pagar no card)
  fatia-5 d16d42c feat: /VendorWallet + cancelar data gera crédito + pagar com crédito
* main    f68da13 [origin/main: behind 6] docs: atualiza HANDOFF com Stripe Checkout e redesenho da curadoria (2026-07-15)
```

### Worktrees vinculados

```text
/Users/brenooliveira/Documents/ProjetosDEV/Claude code f68da13 [main]
```

### Stashes

```text
Nenhum registro retornado.
```

### Últimos commits locais

```text
f68da13 2026-07-15 docs: atualiza HANDOFF com Stripe Checkout e redesenho da curadoria (2026-07-15)
36766d6 2026-07-09 docs: CLAUDE.md do projeto + HANDOFF atualizado (estado 2026-07-09)
abd06e4 2026-07-09 feat: observabilidade de erro (Sentry)
cddd4c1 2026-07-09 test: E2E (Playwright) do login/redirect por papel — sob demanda
d3b49c9 2026-07-09 feat: canal de suporte real (problem_reports + aba Suporte na curadoria)
```

## Ambiente e retomada

- Arquivos de ambiente encontrados (somente nomes, valores não lidos): `.env.local`, `.env.example`.
- Manifests/lockfiles encontrados: `package-lock.json`.
- Ler no destino: `README.md`, `AGENTS.md`, `CLAUDE.md`.
- Metadados do package.json: `{"name": "guery-feiras"}`.
- Scripts disponíveis (nomes; revisar implementação antes de executar): `dev`, `build`, `test`, `test:e2e`, `preview`.

1. Preservar arquivos modificados, não rastreados, stashes, branches locais e o histórico `.git`. Clonar apenas o remoto não recupera esses itens nem esta atualização ainda sem commit. Conferir também arquivos ignorados e assets, que não aparecem no status comum.
2. Transferir configurações e segredos por meio privado. Reautenticar GitHub, hospedagem e conectores no novo PC; não colocar credenciais no handoff ou em commits. Preservar as instruções pessoais de AGENTS.md e notas de projeto necessárias fora deste repositório.
3. Worktrees dependem do repositório principal e podem conter caminhos absolutos em `.git`. Preservar cada árvore de arquivos e reconstruir seus vínculos no destino antes de desenvolver. Links simbólicos de node_modules não são instalações portáveis.
4. Conferir README, versão de runtime, gerenciador e lockfile; restaurar dependências no destino. Revisar scripts de instalação/teste antes de rodar: alguns projetos acessam banco real, aplicam migrações ou publicam. Não executar esses efeitos como parte automática da migração.
5. Comparar HEAD, branches e alterações com este registro; conferir os handoffs históricos para pendências funcionais. Executar as verificações locais apropriadas depois de restaurar o ambiente. Só considerar a transferência concluída após confirmar os arquivos e fluxos necessários no novo PC.

## Histórico anterior preservado

Os registros abaixo mantêm suas datas e escopos originais; alegações de publicação ou testes não foram revalidadas em 21/10/2026.

---

# Guery Feiras - HANDOFF

Atualizado em 2026-07-15.

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

## Feito em 2026-07-15

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

4. **Stripe — fechar a integração real (prioridade):**
   - Configurar `STRIPE_WEBHOOK_SECRET` (ver "Feito em 2026-07-15" acima) — sem isso o
     pagamento fica sem confirmação automática.
   - Testar ponta-a-ponta em produção com cartão de teste `4242 4242 4242 4242`.
   - Terminar onboarding da conta Stripe (perfil do negócio + ToS) e reativar PIX quando
     o usuário decidir.

5. Próximas features ainda fora de escopo:
   - seção "Meus Créditos" em `/VendorPayments`
   - "usar crédito" no passo 3 da inscrição
   - combos
   - cron de cancelamento por falta de pagamento

## Observação técnica

Existe um log menor pré-existente:

- `AuthProvider` pode logar "falha ao carregar profile" em reload completo por uma corrida entre `.single()` e refresh de sessão.

Não foi tratado nesta rodada.

## Migração de máquina (2026-10-21): Mac → Windows

- Pasta no Mac: `/Users/brenooliveira/Documents/ProjetosDEV/Claude code`
- Branch de trabalho no Mac: `main` (upstream: origin/main)
- Trabalho não commitado (9 itens) salvo na branch **`wip/migracao-2026-10-21`**, baseada em `main`. Áreas: graphify-out/ (39), .maestri/ (3), supabase/ (1), src/ (1), HANDOFF.md (1), CLAUDE.md (1).
- Commits que não estavam no remoto: nenhum

- Último commit antes da migração: f68da13 2026-07-15 docs: atualiza HANDOFF com Stripe Checkout e redesenho da curadoria (2026-07-15)
- Arquivos `.env` locais que **não** foram versionados e precisam ser recriados: .env.local 
- Variáveis esperadas (nomes, do .env example): VITE_SENTRY_DSN VITE_SUPABASE_ANON_KEY VITE_SUPABASE_URL 

### Retomar no Windows
1. `gh repo clone` (ou `clone-repos.ps1` do repo `sagwi/dev-ambiente`), depois `git switch wip/migracao-2026-10-21`.
2. Revise o diff contra `main` e quebre em commits/PR antes de levar para a branch principal. A branch WIP **não** vai para produção.
3. Recrie os `.env` (`vercel env pull` ou painel Supabase/Vercel) e rode `npm install` + build/testes do projeto.
4. Contexto detalhado: seções anteriores deste HANDOFF e o vault SegundoCerebro (restaurado de `sagwi/dev-ambiente`).
