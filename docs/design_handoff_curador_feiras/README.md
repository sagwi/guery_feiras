# Design handoff — Painel do Curador (implementado)

Referência: protótipos `.dc.html` + screenshots (cards inteligentes + Gestão de Feiras).

## Telas

| Rota | Design | Status |
|------|--------|--------|
| `/curadoria` | Cadastros 1d | Contadores, busca, ordenação, bulk, grade 2 col, Detalhes/Aprovar/Reprovar + modal motivo |
| `/curadoria/inscricoes` | Inscrições 1b | Contadores, segmented Todos/Pendente/Em análise, busca, bulk, cards horizontais |
| `/curadoria/feiras` | Grade 2a | Minhas feiras, filtros Todas/Abertas/Rascunhos/Encerradas, cards com capa/ocupação/Gerenciar, modal Nova feira |
| `/curadoria/feiras/:id` | Detalhe 2b | Capa, 6 KPIs, abas Visão geral / Inscritos / Pendentes / Pendências / Financeiro / Detalhes, prévia PNG |

## Schema

Migration `0011_fairs_horario_categorias_status`:
- `horario text`
- `categorias text[]`
- `status` ∈ `aberto | rascunho | encerrada | inativo`

## Shell

Sidebar do curador: **PAINEL DO CURADOR** (logo gradiente laranja→rosa).

## Fora de escopo / ponytail

- Upload de capa: data URL ≤1,5 MB (sem bucket Storage ainda).
- Pendências documentais (alvará/MEI): só pagamento em atraso derivado de `aprovado`.
- Fontes do protótipo (Poppins/Material): usa Space Grotesk/Figtree/Lucide do app.
