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
- Rodar o fluxo crítico manualmente: login curador → aprovar inscrição → comerciante paga → indicadores atualiza.

## Contas de referência

- Curador (demo): `curadoria.demo@gueryfeiras.dev` / `Demo@123`
- Ver `HANDOFF.md` para contas reais e regras de segurança do banco compartilhado.
