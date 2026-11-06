# Especificação de Caso de Uso: CU-02 — Consultar Disponibilidade (T5)

---

## 1. Identificação e Metadados

| Atributo | Detalhe |
|---|---|
| **Identificador** | **CU-02** (vinculado a **T5** no cronograma Kanban) |
| **Nome** | Consultar Disponibilidade de Espaços |
| **Sprint** | Sprint 2 (12/10 a 25/10) — Especificação de Lógica e Flujos de Backend |
| **Responsável (Execução)** | Integrante 3 (I3 — Jordan Rivaldo Correa García) |
| **Revisor Designado** | Integrante 4 (I4) |
| **Domínio Arquitetural** | Lógica de Consulta e Filtros |
| **Estimativa / Período** | 3 horas \| 12/10 a 18/10 |
| **Dependências Técnicas** | T4 (Diagrama de Casos de Uso UML), T13 (Regras de Negócio e Glossário) |
| **Status** | Pronto para Revisão (Em conformidade com a Definição de Pronto) |

---

## 2. Rastreabilidade com Artefatos do Projeto

- **Diagrama de Casos de Uso (T4):** Detalha o caso de uso `UC2: Consultar disponibilidade`, associado aos atores `Estudante`, `Docente` e `Administrador`.
- **Histórias de Usuário:**
  - **HU-02 (Alta):** *Como estudante, quero ver quais espaços estão livres em cada horário, para escolher onde estudar.*
  - **HU-08 (Média):** *Como estudante, quero que a prioridade de reserva mude entre cursos e faculdades, para que todos tenham as mesmas chances.*
  - **HU-09 (Média):** *Como administrador, quero bloquear um espaço por manutenção ou evento, para que ninguém reserve nesse período.*
- **Regras de Negócio Relacionadas (T13):**
  - **RN-01:** Um espaço não pode ter duas reservas no mesmo horário.
  - **RN-06:** Um bloqueio do administrador tem prioridade sobre qualquer reserva.
  - **RN-08:** Cada reserva tem duração mínima e máxima permitida.
  - **RN-09:** O número de participantes não pode passar da capacidade do espaço.
  - **RN-12:** Espaços desativados não aceitam novas reservas, mas o histórico é mantido.

---

## 3. Sumário e Objetivo

Permitir que qualquer usuário da comunidade universitária (estudante, docente, grupo de pesquisa ou administrador) consulte a disponibilidade física e temporal dos espaços compartilhados da universidade (salas de estudo, laboratórios de informática, auditórios e áreas esportivas).

O sistema oferece uma **agenda única centralizada**, permitindo a busca por data e horários específicos combinados a múltiplos filtros (tipo de espaço, capacidade mínima de pessoas, recursos tecnológicos e localização), garantindo que apenas intervalos estritamente desprovidos de conflitos de reserva (`RN-01`) ou de bloqueios administrativos (`RN-06`) sejam apresentados como elegíveis para reserva.

---

## 4. Atores

1. **Ator Primário:**
   - **Usuário Autenticado / Visitante:** Membro da universidade (Estudante, Docente, Administrador) que busca um local adequado para suas atividades acadêmicas.
2. **Ator Secundário (Sistema):**
   - **Motor de Disponibilidade UNISpace (Backend):** Serviço responsável por filtrar espaços ativos, cruzar agendas e computar janelas livres em tempo real.
   - **Banco de Dados Relacional:** Provedor dos dados de espaços, reservas vigentes e bloqueios de manutenção.

---

## 5. Pré-condições

1. A plataforma web UNISpace deve estar operacional e conectada à base de dados institucional.
2. Deve existir pelo menos um espaço acadêmico cadastrado com status **ativo** no sistema (`RN-12`).
3. O calendário operacional do semestre deve estar ativo para permitir projeções de reservas futuras.

---

## 6. Pós-condições

### 6.1. Pós-condição de Sucesso
- O sistema retorna e exibe a matriz ou grade de horários organizada por espaço físico, diferenciando visualmente os slots:
  - **Livre (Verde):** Disponível para reserva imediata.
  - **Ocupado (Vermelho):** Já alocado por reserva confirmada.
  - **Bloqueado (Cinza/Amarelo):** Indisponível por motivo administrativo ou manutenção preventiva.
- O usuário pode clicar diretamente em qualquer slot livre para iniciar o fluxo transacional de reserva (**CU-03 / T6**).
- Nenhuma alteração de estado ou gravação é efetuada no banco de dados (operação idempotente de leitura).

### 6.2. Pós-condição de Falha
- Se nenhum espaço atender aos critérios ou se todos estiverem ocupados/bloqueados, o sistema exibe notificações claras e recomendações de horários e filtros alternativos, preservando o estado do sistema inalterado.

---

## 7. Parâmetros e Filtros de Consulta

| Parâmetro | Tipo | Obrigatório? | Descrição / Regra de Validação | Valor Padrão |
|---|---|:---:|---|---|
| **Data da Consulta** | `Date` | **Sim** | Data em que se deseja verificar a disponibilidade. Deve ser maior ou igual à data corrente (`data >= hoje`). | Data atual |
| **Horário Inicial** | `Time` | Não | Limite inferior do intervalo pretendido (ex.: `14:00`). | Abertura do campus (ex.: `07:00`) |
| **Horário Final** | `Time` | Não | Limite superior do intervalo pretendido (ex.: `18:00`). Deve ser posterior ao horário inicial. | Fechamento do campus (ex.: `22:00`) |
| **Turno** | `Enum` | Não | Atalho de período: `Manhã` (07h-12h), `Tarde` (12h-18h), `Noite` (18h-22h) ou `Integral`. | `Integral` |
| **Tipo de Espaço** | `Enum` | Não | Categoria física: `Sala de Estudo`, `Laboratório`, `Auditório`, `Área Esportiva` ou `Todos`. | `Todos` |
| **Capacidade Mínima** | `Integer` | Não | Quantidade de assentos/lugares necessários (`capacidade >= 1`). Aplica `RN-09`. | Sem filtro (mín. 1) |
| **Localização / Bloco** | `String` | Não | Filtro por prédio, bloco ou campus (ex.: ICEB, DECOM, Biblioteca Central). | Todos os prédios |
| **Recursos Especiais** | `List<Enum>` | Não | Equipamentos obrigatórios: `Projetor`, `Ar-condicionado`, `Computadores`, `Lousa`, `Acessibilidade PCD`. | Nenhum filtro adicional |

---

## 8. Fluxo Principal (Cenário de Sucesso / *Happy Path*)

| Passo | Ator (Usuário) | Sistema (UNISpace) |
|:---:|---|---|
| **1** | Acessa a opção **"Consultar Disponibilidade"** no menu principal ou painel inicial da aplicação. | — |
| **2** | — | Carrega a visão padrão da **Agenda Única**, configurada inicialmente para a data corrente, apresentando a barra de filtros superiores e os espaços mais populares da universidade. |
| **3** | Informa a **Data desejada** e seleciona os critérios de filtragem (ex.: Tipo: *Laboratório de Informática*, Capacidade Mínima: *25*, Turno: *Tarde*, Recursos: *Projetor*). | — |
| **4** | Ciona o botão **"Filtrar / Consultar"**. | — |
| **5** | — | O frontend realiza pré-validação dos parâmetros (garantindo data válida e coerência temporal) e envia requisição assíncrona `GET /api/v1/espacos/disponibilidade` ao backend. |
| **6** | — | O backend valida os dados de entrada e consulta os espaços cadastrados no banco de dados que atendem cumulativamente a: status ativo (`RN-12`), tipo de espaço, capacidade mínima (`RN-09`) e recursos exigidos. |
| **7** | — | Para cada espaço selecionado, o motor de consulta avalia a agenda do dia: <br>a) Identifica reservas ativas com status `CONFIRMADA` no período (`RN-01`). <br>b) Identifica bloqueios ativos do administrador (`RN-06`). <br>c) Mapeia a grade horária em fatias (slots), marcando cada intervalo como *Livre*, *Ocupado* ou *Bloqueado*. |
| **8** | — | Retorna o payload JSON estruturado com os espaços compatíveis e suas respectivas grades horárias em tempo inferior a 2 segundos (conforme RNF1). |
| **9** | — | A interface renderiza os resultados em formato de matriz/calendário interativo, utilizando codificação visual intuitiva (Verde = Livre, Vermelho = Ocupado, Cinza = Bloqueado/Manutenção). |
| **10** | Visualiza a grade de horários e clica sobre um slot verde ("Livre") correspondente ao horário e espaço desejados. | O sistema destaca o horário escolhido e habilita o botão para prosseguir diretamente para a realização da reserva (**CU-03 / T6**). |

---

## 9. Fluxos Alternativos

### FA01 — Navegação por Calendário Amplo (Visão Semanal / Mensal de um Espaço)
- **Condição:** No passo 3, o usuário deseja acompanhar a agenda completa de uma sala específica ao longo de toda a semana.
- **Fluxo:**
  1. O usuário clica sobre o nome ou card do espaço desejado.
  2. O sistema alterna a visualização para a grade semanal daquele espaço específico.
  3. O backend busca as reservas e bloqueios no intervalo de 7 dias (segunda a sábado/domingo).
  4. O sistema renderiza a agenda semanal completa com todos os slots mapeados.
  5. O caso de uso retorna ao passo 10 do fluxo principal.

### FA02 — Filtragem Reativa Dinâmica (*Debounced Instant Search*)
- **Condição:** O usuário altera qualquer filtro na interface (ex.: digita capacidade mínima ou marca caixa de seleção de recursos).
- **Fluxo:**
  1. A interface detecta o evento de alteração com *debounce* de 300ms.
  2. Executa a requisição assíncrona sem necessidade de recarregar a página completa.
  3. A lista de espaços e seus respectivos horários é atualizada de forma fluida.
  4. O caso de uso retorna ao passo 9 do fluxo principal.

### FA03 — Redirecionamento Direto para Reserva (Integração T5 → T6)
- **Condição:** No passo 10, o usuário clica com duplo clique em um slot com status "Livre".
- **Fluxo:**
  1. O sistema verifica se o usuário possui sessão ativa (autenticado com e-mail institucional conforme `RN-02`).
  2. Se autenticado, armazena em memória o `espaco_id`, `data`, `horario_inicio` e `horario_fim` selecionados.
  3. Redireciona o usuário diretamente para a tela de confirmação do **CU-03 (Reservar Ambiente)** com os campos previamente preenchidos.
  4. O caso de uso é encerrado com sucesso.

### FA04 — Exibição de Cotas e Prioridade Rotativa do Usuário Logado
- **Condição:** O usuário que realiza a consulta está autenticado na plataforma.
- **Fluxo:**
  1. O sistema identifica o perfil do usuário, curso/faculdade e histórico semanal.
  2. No topo da tela de consulta, o sistema exibe um painel informativo:
     - Saldo de horas disponíveis na cota semanal (`RN-03`).
     - Indicação se o curso do estudante pertence ao grupo prioritário da rodada atual (`RN-04`).
  3. Se a cota semanal estiver zerada, os slots livres continuam visíveis, porém acompanhados de aviso indicando que a reserva estará bloqueada até a renovação da cota.
  4. O caso de uso segue no fluxo principal.

---

## 10. Fluxos de Exceção

### FE01 — Data Informada Inválida ou no Passado
- **Condição:** No passo 3, o usuário informa uma data anterior ao dia atual ou fora da vigência letiva.
- **Tratamento:**
  1. O sistema bloqueia a submissão e exibe mensagem de alerta: *"A data da consulta não pode ser anterior ao dia atual."*
  2. O seletor de data é automaticamente ajustado para a data corrente (`hoje`).
  3. O sistema retorna ao passo 3 do fluxo principal.

### FE02 — Intervalo de Horários Incoerente
- **Condição:** No passo 3, o usuário define um horário de início posterior ou igual ao horário de término (ex.: início 16h00 e fim 14h00).
- **Tratamento:**
  1. O sistema destaca os campos com borda vermelha e exibe a mensagem: *"O horário inicial deve ser anterior ao horário final."*
  2. O botão de consulta permanece desabilitado até a correção dos valores.
  3. O sistema retorna ao passo 3 do fluxo principal.

### FE03 — Nenhum Espaço Atende aos Filtros Físicos
- **Condição:** No passo 6, nenhum espaço ativo no banco de dados satisfaz a combinação exigida (ex.: auditório para 400 pessoas com 50 computadores).
- **Tratamento:**
  1. O sistema exibe mensagem informativa com ilustração amigável: *"Nenhum espaço encontrado com os filtros aplicados."*
  2. Apresenta botões de ação rápida: *"Limpar filtros"* ou *"Ver todos os espaços disponíveis hoje"*.
  3. Nenhum slot é renderizado e o sistema aguarda nova ação do usuário.

### FE04 — Espaços Encontrados, Porém Totalmente Ocupados ou Bloqueados
- **Condição:** No passo 7, os espaços compatíveis existem fisicamente, mas 100% dos slots estão ocupados por reservas confirmadas (`RN-01`) ou bloqueados por manutenção (`RN-06`).
- **Tratamento:**
  1. O sistema exibe os espaços com status visual de indisponibilidade total no horário solicitado.
  2. O motor de recomendação do backend busca automaticamente os 3 horários livres mais próximos (no mesmo dia ou no dia útil subsequente).
  3. Exibe o aviso: *"Todos os horários estão ocupados para o intervalo selecionado. Sugestões de horários livres mais próximos:"* com links diretos para os horários alternativos.
  4. O usuário pode clicar em uma sugestão para carregar a nova disponibilidade.

### FE05 — Falha de Conexão com o Banco de Dados / Timeout
- **Condição:** Durante o processamento no backend (passos 6 ou 7), ocorre falha de rede, timeout ou sobrecarga no banco de dados.
- **Tratamento:**
  1. O sistema captura a exceção de infraestrutura, registra o log do erro para auditoria interna (`RN-13`) e evita exibir stack trace ao usuário.
  2. O frontend exibe mensagem amigável: *"Não foi possível consultar a disponibilidade no momento devido a uma instabilidade temporária. Por favor, tente novamente em alguns instantes."*
  3. Oferece o botão *"Tentar novamente"*.

---

## 11. Especificação Técnica e Lógica de Backend (Domínio: Consulta/Filtros)

### 11.1. Algoritmo de Verificação de Conflito de Horário (Overlap Logic)
Para assegurar a aplicação rigorosa da regra **RN-01**, o motor de disponibilidade utiliza o princípio de sobreposição de intervalos abertos à direita $[S, E)$:

Dois períodos temporais $[S_{\text{solicitado}}, E_{\text{solicitado}})$ e $[S_{\text{existente}}, E_{\text{existente}})$ entram em conflito se e somente se:

$$S_{\text{solicitado}} < E_{\text{existente}} \quad \land \quad E_{\text{solicitado}} > S_{\text{existente}}$$

### 11.2. Consulta SQL Representativa (Otimizada e Indexada)
A consulta a seguir ilustra a lógica de backend para identificar slots livres de um espaço $E$ na data $D$:

```sql
-- Seleciona espaços ativos que atendem aos filtros físicos e verifica disponibilidade
SELECT 
    e.id AS espaco_id,
    e.nome AS espaco_nome,
    e.tipo AS espaco_tipo,
    e.capacidade,
    e.localizacao
FROM espacos e
WHERE e.ativo = TRUE                              -- RN-12: Espaços ativos
  AND e.capacidade >= :capacidade_minima          -- RN-09: Capacidade física
  AND (:tipo_espaco IS NULL OR e.tipo = :tipo_espaco)
  AND NOT EXISTS (
      -- Verifica se há reserva confirmada que sobreponha o intervalo (RN-01)
      SELECT 1 
      FROM reservas r
      WHERE r.espaco_id = e.id
        AND r.data = :data_consulta
        AND r.status = 'CONFIRMADA'
        AND r.horario_inicio < :horario_fim
        AND r.horario_fim > :horario_inicio
  )
  AND NOT EXISTS (
      -- Verifica se há bloqueio administrativo/manutenção ativo (RN-06)
      SELECT 1 
      FROM bloqueios b
      WHERE b.espaco_id = e.id
        AND b.data_inicio <= :data_consulta
        AND b.data_fim >= :data_consulta
        AND b.status = 'ATIVO'
        AND b.horario_inicio < :horario_fim
        AND b.horario_fim > :horario_inicio
  )
ORDER BY e.nome ASC;
```

### 11.3. Estratégia de Indexação Recomendada
Para garantir o cumprimento do requisito **RNF1** (tempo de resposta $\le 2$ segundos em 95% das requisições sob carga simultânea):
1. `CREATE INDEX idx_espacos_filtros ON espacos (ativo, tipo, capacidade);`
2. `CREATE INDEX idx_reservas_disponibilidade ON reservas (espaco_id, data, status, horario_inicio, horario_fim);`
3. `CREATE INDEX idx_bloqueios_periodo ON bloqueios (espaco_id, status, data_inicio, data_fim, horario_inicio, horario_fim);`

---

## 12. Critérios de Aceitação da Tarefa (Definição de Pronto)

- [x] O documento abrange todos os elementos formais exigidos no objetivo do Sprint 2 (identificação, atores, fluxo principal, fluxos alternativos, exceções, pré e pós-condições).
- [x] Rastreabilidade bidirecional estabelecida com `casos-de-uso.puml` (UC2), `historias-usuario-alta.md` (HU-02) e `regras-de-negocio.md` (RN-01, RN-06, RN-08, RN-09, RN-12).
- [x] Detalhamento da lógica de filtros e validações de backend em conformidade com o domínio atribuído a I3.
- [x] Revisão programada para o Integrante 4 (I4) conforme a rotação de PR do projeto.
