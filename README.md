# Guery Feiras

Marketplace de feiras — painel do comerciante. Vite + React + TS + Tailwind + Supabase.

## Setup

```bash
npm i
cp .env.example .env.local   # preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

## Banco (Supabase BreninjaDB, schema `guery_feiras`)

Migrations em `supabase/migrations/`. Aplicadas via Supabase MCP `apply_migration`.

**Pré-requisito da API:** o schema `guery_feiras` precisa estar na lista
**Settings > API > Exposed schemas** do projeto (senão `supabase.from(...)`
retorna 404). Adicionar `guery_feiras` junto dos schemas já expostos.

## Scripts

- `npm run dev` — dev server
- `npm run build` — type-check + build
- `npm run test` — vitest
