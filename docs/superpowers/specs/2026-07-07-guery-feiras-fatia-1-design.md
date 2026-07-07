# Guery Feiras — Design da Fatia 1 (Fundação + Auth + Layout)

> Data: 2026-07-07 · Clone técnico completo do VendorPanel da Viva Feiras.
> Spec de referência: [`vivafeiras-vendorpanel-specs.md`](../../../vivafeiras-vendorpanel-specs.md)

## Contexto

Guery Feiras é um **marketplace** de feiras: comerciantes (donos de negócios) se
inscrevem em feiras que pertencem a parques; um curador/organizador aprova
cadastros e inscrições e gerencia datas. Difere do modelo single-tenant do schema
`guery` existente no BreninjaDB (aquele é a operação de food-truck do próprio Guery;
`guery.feiras` é outro conceito e **não** colide).

- **Supabase:** projeto `BreninjaDB` (`pyyyrzwdidcronhidkwb`), padrão **schema-por-cliente**.
- **Schema novo:** `guery_feiras` (independente).
- **Stack:** Vite + React + TS + Tailwind + Radix + Supabase JS + React Router.

### Convenções herdadas do schema `guery` (seguir à risca)
- `profiles.id uuid PK → auth.users.id`; UUID `gen_random_uuid()` p/ entidades,
  `bigint identity` p/ tabelas transacionais.
- Colunas pt-br snake_case: `nome`, `criado_em`, `updated_at`, `ativo/active`,
  `status text` com `CHECK`.
- `timestamptz default now()`; RLS habilitado em todas as tabelas.
- Helpers `SECURITY DEFINER` por schema no padrão `is_member()`, `has_role()`,
  `is_super_admin()`.

## Roadmap (fatias verticais — cada uma spec→plano→build)

1. **Fundação + Auth + Layout** <- esta fatia
2. Negócios + Nova Inscrição (calendário inteligente) -> inscrição Pendente
3. Curadoria + máquina de estados + notificações
4. Pagamentos (Pagar.me): PIX + cartão + combos
5. Carteira + créditos
6. Participações, avaliações, manual, reportar problema, polish

## Escopo da Fatia 1

### Schema `guery_feiras`
- **`profiles`** — `id uuid PK → auth.users.id`, `nome`, `cpf`, `nascimento date`,
  `telefone`, `email`, `curadoria_status text check in (pendente|aprovado|reprovado)
  default 'pendente'`, `curadoria_motivo text null`, `avatar_url`, `criado_em`,
  `updated_at`.
- **`businesses`** — `id uuid default gen_random_uuid()`, `user_id uuid → auth.users`,
  `nome`, `segmento text` (CHECK nas 26 opções), `descricao`, `imagem_url`,
  `autoral bool`, `cnpj bool default false`, `instagram text null`,
  `faixa_faturamento text` (CHECK 5 faixas), `aprovado bool default true`,
  `ativo bool default true`, `criado_em`, `updated_at`. Criado já no signup (passo 2).
- **`termos_aceite`** — `id bigint identity`, `user_id uuid → auth.users`,
  `tipo text check in (uso|privacidade)`, `versao text`, `aceito_em timestamptz default now()`.
- **Helpers RLS:** `guery_feiras.uid()`, `guery_feiras.is_admin()`. Trigger
  `handle_new_user` cria `profiles` ao inserir em `auth.users`.
- **RLS:** comerciante lê/edita apenas linhas onde `user_id = auth.uid()` (e o próprio
  profile); admin (`is_admin()`) enxerga tudo.

### Auth
- **Wizard de signup (3 passos):**
  1. Pessoais: nome, **CPF com validação real de dígito verificador**, nascimento >=18,
     telefone, e-mail, senha.
  2. Negócio: nome da marca, "possui Instagram" (revela campo @ condicional), segmento,
     descrição, faixa de faturamento.
  3. Termos: aceite obrigatório de Termos de Uso + Política de Privacidade com links.
     *(Seleção de feira no signup fica para a Fatia 2 — feiras nascem lá.)*
- Confirmação de e-mail (nativo Supabase) obrigatória antes do 1º acesso.
- Login: e-mail + senha, "Lembrar de mim", "Esqueceu a senha?" (reset por e-mail).
- Alterar senha (mín. 6 caracteres) + confirmar, com ícone de revelar.
- Expiração de sessão por inatividade.

### Layout (área logada)
- Sidebar branca "Comerciante" com 8 itens (Painel · Meus negócios · Nova Inscrição ·
  Pagamentos · Minha Carteira · Alterar Senha · Manual · Sair). Itens de fatias futuras
  apontam para páginas placeholder.
- Topbar: recolher sidebar + sino de notificações (badge stub em 0).
- Botão flutuante "Reportar Problema" (stub — vira real na Fatia 6).
- Painel: saudação "Olá, {nome}! 👋", 4 KPI cards zerados, abas "Minhas Propostas" |
  "Últimas Participações" com empty states.
- Banner de cookies LGPD no primeiro acesso.
- Visual: sidebar branca, paleta amarelo + roxo escuro, badges de status coloridos,
  branding **Guery Feiras**.

## Prova ponta-a-ponta da fatia
Signup completo -> e-mail de confirmação -> confirma -> login -> cai no Painel exibindo o
estado "cadastro em curadoria (pendente)" + KPIs zerados e empty states.

## Simplificações deliberadas (ponytail)
- Feira-no-signup, pagamentos, notificações reais, avaliações e painel admin -> fatias 2–6.
- Itens de sidebar dessas fatias são placeholders nesta fatia.
- CPF terá função pura de validação + um teste (lógica não-trivial; único check exigido).

## Não-metas
- Nenhuma integração Pagar.me nesta fatia. Nenhum fluxo de curadoria admin nesta fatia.
