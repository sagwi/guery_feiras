# Specs — Viva Feiras / Painel do Comerciante (VendorPanel)

> Levantamento feito navegando na plataforma real (vivafeiras.com.br) em 07/07/2026, logado como comerciante, + Manual do Comerciante oficial. Objetivo: construir uma plataforma com as mesmas funções e opções.

## 1. Stack observada

- **Frontend:** SPA React (dropdowns estilo Radix, rotas client-side: /VendorPanel, /VendorBusinesses, /VendorApply, /VendorPayments, /VendorWallet, /ChangePassword, /VendorManual, /login)
- **Backend:** Supabase (*.supabase.co — auth, banco, storage)
- **Pagamentos:** Pagar.me (Stone) — PIX com QR Code em tempo real + cartão tokenizado
- **Visual:** sidebar branca, marca amarela + roxo escuro, cards com imagem de capa, badges de status coloridos

## 2. Papéis / conceitos

- **Comerciante (vendor):** dono de 1+ negócios (marcas), se inscreve em feiras
- **Curador (admin):** aprova cadastro do comerciante e cada inscrição em feira
- **Organizador:** pode cancelar datas de feira (gera crédito automático)
- **Feira:** pertence a um **Parque**, tem recorrência (ex: todo sábado), período início/fim, taxa (ex: R$ 200), máx. de participantes, descrição, regras, status (Aberto/Inativo)
- **Inscrição (proposta):** comerciante + negócio + feira + **data específica**. Cada data = uma cobrança separada.

## 3. Cadastro e autenticação

**Signup em 3 etapas (wizard):**
1. **Dados pessoais:** nome completo, CPF (validação automática), data de nascimento (mín. 18 anos), telefone (validação), e-mail, senha
2. **Sobre o negócio:** nome da marca, "possui Instagram" (campo @ aparece condicionalmente), segmento, descrição, faturamento médio mensal
3. **Feira e termos:** seleção opcional de uma feira para já se inscrever; aceite obrigatório de Termos de Uso + Política de Privacidade (LGPD), com links para os documentos

- Confirmação de e-mail obrigatória antes do primeiro acesso
- **Curadoria do cadastro:** curador analisa e aprova (até 48h úteis); só depois pode se inscrever em feiras
- Login: e-mail + senha, "Lembrar de mim", "Esqueceu a senha?" (link de redefinição por e-mail)
- Sessão expira por inatividade
- Banner de cookies LGPD (Lei 13.709/2018) no primeiro acesso

## 4. Layout geral (área logada)

- **Sidebar "Comerciante":** Painel · Meus negócios · Nova Inscrição · Pagamentos · Minha Carteira · Alterar Senha · Manual · Sair (rodapé)
- **Topbar:** botão recolher sidebar + sino de **notificações** com badge de não lidas
- **Botão flutuante "Reportar Problema"** em todas as páginas

## 5. Painel (/VendorPanel)

- Saudação: "Olá, {nome}! 👋 — Gerencie suas inscrições e participações"
- **4 cards de KPI:** Contratos ativos · Inscrições · Pendências (de pagamento) · Participações
- **Abas:** "Minhas Propostas" | "Últimas Participações"

### Aba Minhas Propostas
- Link "+ Nova inscrição" → /VendorApply
- **Barra de filtros:**
  - Busca livre: "Buscar feira, parque ou local..."
  - Status: Todos · Pendente · Aprovado · Realizada · Reprovado · Cancelado por falta de pagamento · Expirado (existe também "Cancelado pelo organizador")
  - Parques: Todos + lista de parques
  - Pagamentos: Todos · Pagas · Não pagas
  - Ordenar por: Data (mais recente) · Data (mais antiga) · Nome da feira
  - Contador "X de Y"
- **Card de inscrição:**
  - Imagem de capa da feira, badge do negócio (ex: "Guery Burguer")
  - Nome da feira, parque + local (ex: "Parque da Jaqueira · área central do parque")
  - Badge de status colorido
  - Bloco de pagamento: "Pago via PIX/Cartão · R$ 200,00 · data"; se combo: "Pago no combo · total R$ 350,00 · parte desta feira R$ 175,00"
  - Data escolhida, dias da semana da feira, taxa, máx. participantes
  - Descrição da feira + seção "Regras da feira" quando houver
  - Avisos contextuais: feira inativa, pagamento não realizado no prazo
  - Ações: **Pagar** (quando aprovado e não pago) · **Renovar / Renovar Inscrição**

### Aba Últimas Participações
- "Histórico de Participações — veja suas últimas feiras e renove sua participação"
- Cards com nome, parque, data + ações: **Avaliar** (nota 1–5 estrelas + comentário) e **Renovar**
- Empty state: "Nenhuma participação registrada"

## 6. Meus Negócios (/VendorBusinesses)

- "Gerencie seus negócios e segmentos. Cada negócio passa por curadoria individualmente."
- Lista: nome, badge "Aprovado", indicador "Ativo", segmento, botão Editar
- Botão "+ Adicionar negócio" (multi-marca suportado)
- **Form (adicionar/editar):**
  - Imagem do negócio (upload)
  - Nome do negócio *
  - Segmento * — 26 opções: Acessórios de Moda · Artes Plásticas · Artesanato · Autocuidado · Bebidas Alcoólicas · Bem-Estar Pessoal · Brinquedos · Calçados e Bolsas · Confeitaria · Costura Criativa · Crochês, tapeçaria, renda e bordado · Cultura Geek · Empório de Frios · Esotérico · Gastronomia · Moda Circular · Moda Fitness · Moda Praia · Papelaria · Pet · Plantas Ornamentais e Reais · Produtos Naturais · Sebo e Vinil · Serviços · Sorvetes · Vestuário
  - Descrição (textarea)
  - Produto autoral? (Sim/Não)
  - Possui CNPJ (checkbox)
  - Possui Instagram (checkbox → revela campo @handle)
  - Faixa de faturamento: Até R$ 1.000 · R$ 1.001 a R$ 3.000 · R$ 3.001 a R$ 5.000 · R$ 5.001 a R$ 10.000 · Acima de R$ 10.000
- Regra: "O cadastro do negócio é aprovado automaticamente. A participação em cada feira continua sujeita à aprovação do curador."

## 7. Nova Inscrição (/VendorApply)

**Passo 1 — Marca:** "Você deseja se inscrever com a mesma marca?" → card do negócio existente + botões "Sim, mesma marca" | "Adicionar novo negócio" (abre form do item 6)

**Passo 2 — Feiras:** "Escolha as feiras — você pode selecionar mais de uma. Escolha a data desejada para cada uma."
- Cards com checkbox: nome, parque, "Início: dd/mm/aaaa" (quando futura), taxa, vagas
- Feiras em que já está inscrito são ocultadas automaticamente
- Ao marcar uma feira, o card expande com **"Data desejada para participação *"** (calendário)
- **Calendário inteligente:** habilita apenas os dias da recorrência da feira (ex: só sábados) e somente datas dentro do período início/fim, sem datas passadas

**Passo 3 — Termos e envio:**
- Checkbox obrigatório "Li e aceito os termos de participação e o regulamento da feira"
- Botão desabilitado com label dinâmico: "Selecione as datas" → "Enviar inscrição"
- Tela de confirmação com resumo; inscrição fica **Pendente** até o curador analisar
- Se houver saldo de crédito suficiente, aparece a opção **"Usar meu crédito disponível"** (abate automático na aprovação, sem cobrança PIX/cartão)

## 8. Pagamentos (/VendorPayments)

Seções na página:
1. **Meus Créditos** — movimentações de crédito (ou empty state)
2. **Pagamentos Pendentes** — inscrições aprovadas não pagas; cada data gera cobrança separada; item mostra feira, parque, valor, botão de pagamento
3. **Cancelado por falta de pagamento** — itens em vermelho com data
4. **Pagamentos Confirmados** — feira, data da feira, valor pago, "Pago em dd/mm/aaaa, hh:mm:ss · PIX/Cartão", badge "Confirmado"; combos com tag "Combo" e rateio ("Parte desta feira R$ 175,00 · Total do combo R$ 350,00")

**Métodos:**
- **PIX:** QR Code gerado na hora + copia e cola; confirmação em tempo real (tela atualiza sozinha); QR expira em **1 hora**
- **Cartão de crédito:** número, nome impresso, validade, CVV; dados **tokenizados via Pagar.me**, nunca armazenados
- **Crédito:** uso de saldo da carteira
- **Combo:** pagamento conjunto de múltiplas feiras com desconto (observado: 2 feiras de R$ 200 pagas por R$ 350, rateado R$ 175 cada)

**Regra crítica:** inscrição aprovada e não paga no prazo → status "Cancelado por falta de pagamento" + card oferece "Renovar".

## 9. Minha Carteira (/VendorWallet)

- 3 cards: **Saldo atual** · **Total recebido** · **Total utilizado**
- **Extrato** com todas as movimentações (entradas por cancelamentos, saídas por uso em inscrições)
- Crédito é gerado automaticamente (valor exato) quando o organizador cancela uma data já paga (chuva, alagamento, risco etc.)
- Crédito **não expira** e vale para qualquer feira da plataforma

## 10. Notificações

- Sino no topo com contador de não lidas + "Marcar todas"
- Tipos observados:
  - **"Feira cancelada pelo organizador"** — informa que um crédito pode ter sido gerado
  - **"Inscrição aprovada ✅"** — "realize o pagamento para confirmar"
- Timestamp relativo ("há 10 dias")

## 11. Configurações e suporte

- **Alterar Senha** (/ChangePassword): nova senha (mín. 6 caracteres) + confirmar, ícone de olho para revelar
- **Reportar Problema:** modal com Título * + Descrição *; a **página atual é registrada automaticamente** ("Página: /ChangePassword"); notifica a equipe admin
- **Manual** (/VendorManual): guia completo com índice navegável + botão "Baixar PDF"

## 12. Máquina de estados da inscrição

    Pendente ──(fila)──► Em análise ──► Aprovado ──(pagou)──► Confirmado ──(dia da feira)──► Realizada
       │                                  │
       └──► Reprovado (e-mail com motivo) └──(não pagou no prazo)──► Cancelado por falta de pagamento
    Aprovado/Confirmado ──(organizador cancela data)──► Cancelado pelo organizador (gera crédito se pago)
    Pendente antiga ──► Expirado

**Renovação:** disponível em Minhas Propostas e Últimas Participações; calendário bloqueia datas já aprovadas (só dias diferentes); cada nova data gera nova cobrança.

## 13. Checklist de entidades (modelo de dados sugerido)

- users — comerciante: CPF, nascimento, telefone, e-mail confirmado, status de curadoria
- businesses — user_id, nome, segmento, descrição, imagem, autoral, cnpj (bool), instagram, faixa_faturamento, aprovado, ativo
- parks — nome
- fairs — park_id, nome, local, descrição, regras, imagem, taxa, max_participantes, recorrência (dias da semana), data_início, data_fim, status
- applications — business_id, fair_id, data_escolhida, status, aceite_termos
- payments — application_id(s), valor, método (PIX/cartão/crédito), combo_id + rateio, status, pago_em
- wallet_transactions — user_id, tipo (entrada/saída), valor, referência
- notifications — user_id, tipo, título, corpo, lida
- reviews — application_id, estrelas (1–5), comentário
- problem_reports — user_id, título, descrição, página
