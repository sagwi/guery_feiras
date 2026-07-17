# Design handoff — Painel do Curador (Guery Feiras)

Documento de implementação do redesign da área `/curadoria/*`.
Schema: `guery_feiras` · tabelas: `profiles`, `applications`, `fairs`, `parks`.

## Telas

| Rota | Papel |
|------|--------|
| `/curadoria` | Cadastros pendentes — cards inteligentes (avatar, contato, CTAs) |
| `/curadoria/inscricoes` | Inscrições pendentes + datas ativas — cards no padrão PropostaCard |
| `/curadoria/feiras` | Lista/gestão do catálogo de feiras |
| `/curadoria/feiras/:id` | Detalhe: abas Visão geral · Inscritos · Editar (+ export PNG) |
| `/curadoria/feiras/nova` | Criar feira (aba Cadastro) |

## Cards inteligentes

- Hierarquia visual alinhada ao `PropostaCard` do comerciante (faixa lateral / avatar, título, meta chips, ações).
- Tokens: `marca.*`, `rounded-card`, `shadow-card`, tipografia Space Grotesk + Figtree.
- Classes compartilhadas em `src/components/curadoria/curadoriaUi.ts`.

## Gestão de Feiras

- CRUD via RLS admin já existente em `fairs` / `parks`.
- Detalhe mostra KPIs (pendentes / aprovadas / confirmadas).
- Aba **Inscritos**: filtro por `data_escolhida` + **Exportar PNG** (lista de presença com checkbox).
- Lógica pura de export em `src/lib/exportListaFeira.ts` (+ testes).

## O que NÃO muda

- Máquina de estados continua em `src/lib/statusInscricao.ts`.
- Sem migrations novas — só UI sobre tabelas reais.
- Stripe / webhook / Edge Functions intocados.

## Verificação

```bash
npm test
npm run build
```

Smoke (curador `gf_admin`):

1. Login → `/curadoria`
2. Menu **Feiras** → abrir uma feira → aba Inscritos → Exportar PNG
3. Aprovar/reprovar cadastro e inscrição (comportamento anterior preservado)
