import { defineConfig } from '@playwright/test'

// ponytail: E2E roda sob demanda (npm run test:e2e), não em todo push do CI —
// os testes de login batem no Supabase de produção real (contas de demo dedicadas),
// e esse banco é compartilhado com outros clientes. Ver docs/runbook.md.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  use: {
    baseURL: 'http://localhost:5173',
  },
})
