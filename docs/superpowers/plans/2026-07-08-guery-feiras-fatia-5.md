# Guery Feiras — Fatia 5 (Carteira/crédito, §9)

Sem dependência externa. Construído direto (sessão enxuta, alerta de custo do handoff).

## Tasks
0. **Migration 0005** — `wallet_transactions` (user_id, tipo entrada/saida, valor, referencia, application_id?, criado_em) + RLS. Aplicar live.
1. **lib/carteira.ts** (TDD) — `totalRecebido`, `totalUtilizado`, `saldo`, `temCredito`. + em `statusInscricao.ts`: `podeCancelarOrganizador`, `transicaoCancelamentoOrganizador`, `geraCreditoAoCancelar`.
2. **/VendorWallet** — 3 cards (Saldo/Recebido/Utilizado) + extrato. Substitui Placeholder.
3. **Curadoria: cancelar data (organizador)** — lista aprovado/confirmado; botão "Cancelar data (gera crédito)" → status `cancelado_organizador`; se estava paga, insere `wallet_transactions` entrada = valor pago.
4. **PagamentoModal: usar crédito** — se saldo ≥ taxa, método "Usar meu crédito"; paga com metodo=`credito` + saida na carteira + application confirmado.

## Fora de escopo (ponytail — reincorporar depois)
- Seção "Meus Créditos" no /VendorPayments (§8) e opção "usar crédito" no passo 3 da inscrição (§7).
- Combos, expiração de QR, cron de cancelado_pagamento (herdado da Fatia 4).
- insert+update não-atômico (mesmo débito conhecido do stub; RPC quando Pagar.me real).
