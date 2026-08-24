# Guery Feiras — repositório de demonstração

Clone de demonstração do produto de gestão de feiras (painel do expositor + curadoria),
com **branding Guery Feiras** e **dados de exemplo**.

A produção do cliente (**Vamô! Mercado Criativo** / `vamomercadocriativo.com.br`) vive em
repositório e infraestrutura **separados** e não deve ser alterada a partir daqui.

## Setup

```bash
npm i
cp .env.example .env.local   # preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

## Contas demo

Ver `docs/runbook.md` e `HANDOFF.md`. Exemplos:

- Curador: `curadoria.demo@gueryfeiras.dev` / `Demo@123`
- Comerciante: `nathan.cruz@demo.gueryfeiras.dev` / `Demo@123`

## Banco (Supabase BreninjaDB, schema `guery_feiras`)

Migrations em `supabase/migrations/`. Aplicadas via Supabase MCP `apply_migration`.

**Pré-requisito da API:** o schema `guery_feiras` precisa estar na lista
**Settings > API > Exposed schemas** do projeto (senão `supabase.from(...)`
retorna 404).

## Scripts

- `npm run dev` — dev server
- `npm run build` — type-check + build
- `npm run test` — vitest
- `npm run test:e2e` — Playwright (sob demanda; login real — ver runbook)
