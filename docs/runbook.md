# Runbook — Guery Feiras

## Rollback de deploy (Vercel)

1. Acessar https://vercel.com/breno-oliver-s-projects/guery-feiras
2. Aba **Deployments** → localizar o último deployment saudável anterior ao problema.
3. Menu `···` do deployment → **Promote to Production**.
4. Confirmar em `guery-feiras.vercel.app` que o problema sumiu.

Isso não reverte dados no banco — só o código servido. Rollback é imediato (sem rebuild).

## Rollback de migration (Supabase)

As migrations em `supabase/migrations/` são **só forward** (aditivas: criam tabela/coluna/policy/índice).
Nenhuma delas dropa dados. Para reverter uma migration específica:

1. Ler o arquivo da migration em `supabase/migrations/000X_*.sql` para saber exatamente o que ela criou.
2. Escrever e aplicar (via MCP `apply_migration` ou `execute_sql`, nunca direto em produção sem revisão) o inverso pontual — ex.: `drop index`, `drop policy` + recriar a policy anterior, `drop column`.
3. **Nunca** rodar `drop table`/`drop schema` sem confirmação explícita — o banco (`pyyyrzwdidcronhidkwb`, BreninjaDB) é compartilhado com outros clientes em outros schemas (`daniele`, `guery`, `fyado`, `nails-system`, etc.). Mudanças ficam restritas ao schema `guery_feiras`.

## Verificação pós-incidente

- `npx -p metaharness@latest harness score .` — score de estrutura/engenharia do repo.
- Supabase Advisors (security + performance) — checar se algo novo apareceu escopado a `guery_feiras`.
- `npm run test:e2e` — trava login/redirect por papel (curador vs comerciante) e menu com item único ativo.

## E2E (`npm run test:e2e`)

Roda sob demanda, **não** em todo push do CI. Os testes fazem login de verdade contra o
Supabase de produção (`pyyyrzwdidcronhidkwb`) usando contas de demo dedicadas — esse banco
é compartilhado com outros clientes, então evitamos automatizar isso a cada commit.

Quando rodar: antes de mexer em login/redirect, RLS, ou navegação do menu — os pontos que
já quebraram uma vez nesta sessão.

```
npm run dev &      # se ainda não tiver um servidor local rodando em :5173
npm run test:e2e
```

Contas usadas: `curadoria.demo@gueryfeiras.dev` e `nathan.cruz@demo.gueryfeiras.dev` (senha
`Demo@123` nas duas) — são contas de demonstração, seguras para reuso repetido.

## Contas de referência

- Curador (demo): `curadoria.demo@gueryfeiras.dev` / `Demo@123`
- Ver `HANDOFF.md` para contas reais e regras de segurança do banco compartilhado.
