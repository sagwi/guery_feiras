# Guery Feiras - HANDOFF

Atualizado em 2026-07-08.

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

## Últimos commits relevantes

- `e095a64` - ignora skills locais de agente.
- `19c8dc7` - força confirmação de e-mail voltar para a origem atual do site.
- `87b34eb` - ignora estado local da Vercel.
- `f165072` - `vercel.json` com rewrite de SPA para deep links.
- `4130814` / `36f7b0c` - RPC `confirmar_pagamento` + esqueleto de Edge Function Pagar.me.
- `2d6a5fb` / `7ed2f2a` - gateway Pagar.me fake.
- `c2fe7a2` - merge Fatia 5, carteira/crédito.

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

- `npm run test`: 7 arquivos, 38 testes verdes.
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

4. Próximas features ainda fora de escopo:
   - seção "Meus Créditos" em `/VendorPayments`
   - "usar crédito" no passo 3 da inscrição
   - combos
   - cron de cancelamento por falta de pagamento

## Observação técnica

Existe um log menor pré-existente:

- `AuthProvider` pode logar "falha ao carregar profile" em reload completo por uma corrida entre `.single()` e refresh de sessão.

Não foi tratado nesta rodada.
