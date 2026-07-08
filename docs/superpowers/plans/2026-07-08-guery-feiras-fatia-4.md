# Guery Feiras — Fatia 4 (Pagamentos — STUB) — Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Base: branch `fatia-4` (off `main`).
> Spec-fonte: `vivafeiras-vendorpanel-specs.md` §8, §12. **Decisão do user: STUB** (sem Pagar.me real).

**Goal:** Comerciante paga uma inscrição **aprovada** via UI de pagamento simulada (QR PIX fake +
"Simular pagamento"); grava um `payment`, transiciona a inscrição `aprovado → confirmado`, notifica.
Página `/VendorPayments` lista pendentes e confirmados. Integração Pagar.me real fica p/ fatia futura.

## Global Constraints
- Schema `guery_feiras`. Project `pyyyrzwdidcronhidkwb`. RLS por dono. pt-br snake_case.
- Reutilizar: `useAuth`, `supabase`, `STATUS_LABELS`/helpers de `statusInscricao.ts`, paleta `marca.*`, Radix.
- Migration via MCP `apply_migration` (controller) + `.sql`.
- **Stub explícito:** sem chaves, sem edge function, sem webhook, sem Realtime. `// ponytail: stub — Pagar.me real em fatia futura`.

## Decisões (ponytail)
- **Pagamento simulado:** modal com QR fake (um SVG/placeholder) + copia-e-cola fake + botão "Simular
  pagamento (dev)" que finaliza na hora. Sem expiração real de 1h, sem polling.
- **Sem combos** nesta rodada (rateio é complexidade extra) — 1 pagamento = 1 inscrição. `// ponytail: combos depois`.
- **cancelado_pagamento por prazo:** NÃO implementar job/cron agora — fora de escopo do stub. Só o caminho feliz (pagar → confirmado).
- **Crédito/carteira:** Fatia 5. Aqui só PIX/cartão fake.

---

### Task 0: Migration — payments
**Files:** Create `supabase/migrations/0004_payments.sql`.
- [ ] **Step 1:** Aplicar via MCP (name `payments`) e gravar `.sql`:
```sql
create table guery_feiras.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references guery_feiras.applications(id) on delete cascade,
  valor numeric(10,2) not null,
  metodo text not null check (metodo in ('pix','cartao','credito')),
  status text not null default 'confirmado' check (status in ('pendente','confirmado','falhou')),
  pago_em timestamptz,
  criado_em timestamptz not null default now()
);
alter table guery_feiras.payments enable row level security;
create index on guery_feiras.payments(user_id);
create index on guery_feiras.payments(application_id);
create policy "pay: dono lê" on guery_feiras.payments for select
  using (user_id = auth.uid() or guery_feiras.is_admin());
create policy "pay: dono insere" on guery_feiras.payments for insert
  with check (user_id = auth.uid());
grant select, insert, update on all tables in schema guery_feiras to authenticated;
```
- [ ] **Step 2:** `notify pgrst,'reload schema'`; verificar tabela+policies. Commit.

---

### Task 1: statusInscricao — transição de pagamento (TDD)
**Files:** Modify `src/lib/statusInscricao.ts` + test.
- [ ] **Step 1 (RED):** `podePagar(status)` = true só p/ `aprovado`; `transicaoPagamento(atual)` retorna
  `confirmado` se `aprovado`, senão lança. Adicionar testes.
- [ ] **Step 2 (GREEN):** implementar. Rodar suite (deve seguir verde). Commit.

---

### Task 2: /VendorPayments (stub de pagamento)
**Files:** Create `src/pages/VendorPayments.tsx`, `src/components/PagamentoModal.tsx`. Modify `App.tsx`.
- [ ] **Step 1:** `/VendorPayments` (protegida) — buscar applications do user com `podePagar` (status
  `aprovado`) join fair/park + os `payments` do user (confirmados) join application/fair.
  Seções: **Pagamentos Pendentes** (aprovado sem pagamento → card com feira/parque/taxa + botão "Pagar");
  **Pagamentos Confirmados** (payments status confirmado → feira, valor, "Pago em … · PIX/Cartão", badge).
- [ ] **Step 2:** `PagamentoModal` (Radix Dialog) — abre ao clicar Pagar: mostra QR fake (SVG placeholder),
  campo copia-e-cola fake, escolha PIX/Cartão (visual), e botão **"Simular pagamento (dev)"**. Ao simular:
  `insert payments { user_id, application_id, valor: taxa, metodo, status:'confirmado', pago_em: now() }`,
  `update applications set status='confirmado'` (via `transicaoPagamento`), e — se possível pelo RLS — inserir
  notificação NÃO é permitido ao comerciante (só admin insere notif); então **pular a notificação aqui**
  (`// ponytail: notif de pagamento exigiria policy; comerciante vê status confirmado direto`). Fechar modal, recarregar.
- [ ] **Step 3:** Wire `/VendorPayments` → `<VendorPayments/>` (remove Placeholder). Build+test verdes. Commit.

---

### Task 3: Painel/proposta refletem pagamento
**Files:** Modify `src/pages/VendorPanel.tsx` (KPIs) e/ou `src/components/PropostaCard.tsx`.
- [ ] **Step 1:** KPIs: **Contratos ativos** = count status `confirmado`; **Pendências** = count
  `aprovado` (aprovado-não-pago). (Inscrições = total; Participações = `realizada`.) Ajustar contagens.
- [ ] **Step 2:** No `PropostaCard`, quando status `aprovado`, mostrar ação "Pagar" (link p/ `/VendorPayments`).
  Build+test verdes. Commit.

---

### Task 4: Verificação e2e
- [ ] **Step 1:** `npm run test` + `npm run build` verdes.
- [ ] **Step 2:** e2e (preview): criar comerciante + inscrição aprovada (via SQL/curador), logar, ir em
  Pagamentos → Pagar → Simular → inscrição vira **confirmado**, aparece em Confirmados, painel KPI Contratos ativos=1.
- [ ] **Step 3:** Banco: 1 payment confirmado + application confirmado. RLS: comerciante só vê seus payments.
- [ ] **Step 4:** Build final. Commit `feat: Fatia 4 (pagamentos stub)`. Limpar dados de teste.

## Notas
- Notificação de "pagamento confirmado" fica pro admin/sistema (policy só deixa admin inserir notif) — ver fatia futura ou trigger.
- Criar user/inscrição de teste: ver recipe GoTrue na memória `guery-feiras-projeto`.
