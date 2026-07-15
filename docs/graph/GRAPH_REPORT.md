> Grafo estrutural do repositório Guery Feiras (gerado em 2026-07-15).
> Consulta: abra `graph.html` no browser ou use `graph.json` programaticamente.
> Relatório: este arquivo (`GRAPH_REPORT.md`).

# Graph Report - Guery Feiras (2026-07-15)

## Corpus Check
- Corpus is ~32,729 words - fits in a single context window. You may not need a graph.

## Summary
- 401 nodes · 580 edges · 37 communities (27 shown, 10 thin omitted)
- Extraction: 95% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.83)
- Token cost: 0 input · 252,096 output

## Community Hubs (Navigation)
- Domínio e Convenções do Projeto
- Rotas e Telas do App
- Autenticação e Sessão
- Componentes de UI Reutilizáveis
- DevDependencies e Tooling
- Dependencies de Runtime
- TSConfig do App
- TSConfig do Node/Vite
- Modal de Pagamento e Carteira
- Cadastro e Validação de CPF
- Calendário de Datas de Feira
- Máquina de Estados da Inscrição
- Runbook e Operação
- Package.json e Scripts
- Tela de Pagamentos
- Migration Fundação (schema)
- Fluxo Stripe fim a fim
- Migration Feiras/Inscrições
- Edge Function stripe-checkout
- Edge Function stripe-webhook
- Migration Carteira
- TSConfig raiz
- Migration Notificações
- Migration Payments
- Migration Problem Reports
- Vercel SPA rewrites
- Vocabulário pt-BR
- Favicon

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 27 edges
2. `supabase` - 21 edges
3. `compilerOptions` - 18 edges
4. `compilerOptions` - 15 edges
5. `saldo()` - 9 edges
6. `VendorApply()` - 7 edges
7. `VendorWallet()` - 7 edges
8. `Edge Function stripe-checkout` - 7 edges
9. `Máquina de estados da inscrição (§12)` - 7 edges
10. `Plano Fatia 1: Fundação + Auth + Layout` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Edge Function stripe-checkout` --semantically_similar_to--> `Plano Fatia 4: Pagamentos STUB`  [INFERRED] [semantically similar]
  HANDOFF.md → docs/superpowers/plans/2026-07-08-guery-feiras-fatia-4.md
- `Convenção // ponytail: (simplificação deliberada)` --conceptually_related_to--> `Plano Fatia 2: Meus Negócios + Nova Inscrição`  [INFERRED]
  CLAUDE.md → docs/superpowers/plans/2026-07-08-guery-feiras-fatia-2.md
- `Edge Function stripe-checkout` --conceptually_related_to--> `Stripe em test mode`  [INFERRED]
  HANDOFF.md → CLAUDE.md
- `Curadoria redesenhada (Sidebar/Topbar reutilizáveis)` --references--> `Plano Fatia 3: Curadoria + Estados + Notificações`  [INFERRED]
  HANDOFF.md → docs/superpowers/plans/2026-07-08-guery-feiras-fatia-3.md
- `Schema guery_feiras (exclusivo do app)` --conceptually_related_to--> `Gotcha: guery_feiras em Exposed schemas da API`  [INFERRED]
  CLAUDE.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Fluxo de pagamento Stripe fim a fim (tela → checkout → webhook → RPC)** — claude_fluxo_pagamento, handoff_stripe_checkout, handoff_stripe_webhook, handoff_confirmar_pagamento_admin [EXTRACTED 1.00]
- **Máquina de estados da inscrição (spec §12 → statusInscricao.ts → pagamentos)** — vivafeiras_vendorpanel_specs_maquina_de_estados, docs_superpowers_plans_2026_07_08_guery_feiras_fatia_3_status_inscricao, docs_superpowers_plans_2026_07_08_guery_feiras_fatia_4_pagamentos_stub, claude_status_inscricao [INFERRED 0.85]
- **Fatias verticais 1-5 do roadmap Guery Feiras** — docs_superpowers_specs_2026_07_07_guery_feiras_fatia_1_design_roadmap, docs_superpowers_plans_2026_07_07_guery_feiras_fatia_1_fundacao_auth_layout, docs_superpowers_plans_2026_07_08_guery_feiras_fatia_2_meus_negocios_inscricao, docs_superpowers_plans_2026_07_08_guery_feiras_fatia_3_curadoria, docs_superpowers_plans_2026_07_08_guery_feiras_fatia_4_pagamentos_stub, docs_superpowers_plans_2026_07_08_guery_feiras_fatia_5_carteira [EXTRACTED 1.00]

## Communities (37 total, 10 thin omitted)

### Community 0 - "Domínio e Convenções do Projeto"
Cohesion: 0.06
Nodes (48): BreninjaDB (Supabase compartilhado pyyyrzwdidcronhidkwb), carteira.ts — exemplo canônico de lógica pura + teste, Guery Feiras (marketplace de feiras), Migrations forward-only e aditivas, Convenção // ponytail: (simplificação deliberada), ProtectedRoute/AdminRoute (guardas de rota), Schema guery_feiras (exclusivo do app), statusInscricao.ts — ponto único de decisão de status (+40 more)

### Community 1 - "Rotas e Telas do App"
Cohesion: 0.10
Nodes (19): CuradoriaBanner(), formatarDataBR(), formatarMoeda(), Proposta, PropostaCard(), STATUS, AuthLayout(), completarOnboarding() (+11 more)

### Community 2 - "Autenticação e Sessão"
Cohesion: 0.11
Nodes (20): AuthCtx, AuthProvider(), Ctx, Profile, useAuth(), useIdleLogout(), CookieBanner(), Notificacao (+12 more)

### Community 3 - "Componentes de UI Reutilizáveis"
Cohesion: 0.09
Nodes (22): KpiCard(), KpiTone, toneChip, useCountUp(), NegocioForm(), NegocioFormData, negocioFormSchema, base (+14 more)

### Community 4 - "DevDependencies e Tooling"
Cohesion: 0.07
Nodes (29): autoprefixer, jsdom, devDependencies, autoprefixer, jsdom, @playwright/test, postcss, tailwindcss (+21 more)

### Community 5 - "Dependencies de Runtime"
Cohesion: 0.07
Nodes (27): @hookform/resolvers, lucide-react, dependencies, @hookform/resolvers, lucide-react, @radix-ui/react-checkbox, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu (+19 more)

### Community 6 - "TSConfig do App"
Cohesion: 0.08
Nodes (23): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+15 more)

### Community 7 - "TSConfig do Node/Vite"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 8 - "Modal de Pagamento e Carteira"
Cohesion: 0.23
Nodes (16): AplicacaoPagavel, formatarMoeda(), Metodo, metodoBtn(), PagamentoModal(), saldo(), somaPor(), temCredito() (+8 more)

### Community 9 - "Cadastro e Validação de CPF"
Cohesion: 0.15
Nodes (10): validarCPF(), base, maskCPF(), maskTelefone(), PessoaisData, pessoaisSchema, StepPessoais(), withMask() (+2 more)

### Community 10 - "Calendário de Datas de Feira"
Cohesion: 0.18
Nodes (14): datasDisponiveis(), FeiraRecorrencia, parseLocal(), hoje, toISO(), Business, DIAS_SEMANA, diasLabel() (+6 more)

### Community 11 - "Máquina de Estados da Inscrição"
Cohesion: 0.25
Nodes (14): geraCreditoAoCancelar(), podeCancelarOrganizador(), podeCurar(), podePagar(), STATUS_LABELS, StatusInscricao, transicaoCancelamentoOrganizador(), transicaoCuradoria() (+6 more)

### Community 12 - "Runbook e Operação"
Cohesion: 0.18
Nodes (11): Definition of Done do projeto, Deploy Vercel automático + smoke test, E2E sob demanda (login real contra produção), Sentry (observabilidade de erro), Contas demo de E2E (curadoria.demo / nathan.cruz), Procedimento E2E (npm run test:e2e), Verificação pós-incidente (harness score + Advisors + E2E), Rollback de deploy (Promote to Production) (+3 more)

### Community 13 - "Package.json e Scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, preview, test, test:e2e (+2 more)

### Community 14 - "Tela de Pagamentos"
Cohesion: 0.36
Nodes (7): formatarDataBR(), formatarDataHoraBR(), formatarMoeda(), InscricaoPagavel, metodoLabel, PagamentoConfirmado, VendorPayments()

### Community 15 - "Migration Fundação (schema)"
Cohesion: 0.33
Nodes (3): guery_feiras.businesses, guery_feiras.profiles, guery_feiras.termos_aceite

### Community 16 - "Fluxo Stripe fim a fim"
Cohesion: 0.50
Nodes (5): Edge Functions Stripe (Deno), Fluxo de pagamento fim a fim, RPC confirmar_pagamento_admin (migration 0007), Edge Function stripe-webhook, Pendência: STRIPE_WEBHOOK_SECRET

### Community 17 - "Migration Feiras/Inscrições"
Cohesion: 0.83
Nodes (3): guery_feiras.applications, guery_feiras.fairs, guery_feiras.parks

## Ambiguous Edges - Review These
- `Trigger handle_new_user cria profile` → `Tabela applications (inscrições)`  [AMBIGUOUS]
  docs/superpowers/plans/2026-07-08-guery-feiras-fatia-2.md · relation: shares_data_with

## Knowledge Gaps
- **139 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+134 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Trigger handle_new_user cria profile` and `Tabela applications (inscrições)`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **Why does `supabase` connect `Rotas e Telas do App` to `Autenticação e Sessão`, `Componentes de UI Reutilizáveis`, `Modal de Pagamento e Carteira`, `Cadastro e Validação de CPF`, `Calendário de Datas de Feira`, `Máquina de Estados da Inscrição`, `Tela de Pagamentos`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Autenticação e Sessão` to `Rotas e Telas do App`, `Componentes de UI Reutilizáveis`, `Modal de Pagamento e Carteira`, `Calendário de Datas de Feira`, `Tela de Pagamentos`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `DevDependencies e Tooling` to `Package.json e Scripts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _139 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Domínio e Convenções do Projeto` be split into smaller, more focused modules?**
  _Cohesion score 0.05673758865248227 - nodes in this community are weakly interconnected._
- **Should `Rotas e Telas do App` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._