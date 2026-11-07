# Planejamento das Sprints — UNISpace

Plataforma web centralizada para gestão e reserva equitativa dos espaços compartilhados da universidade.

> **Data-base:** 07/11/2026 · **Fonte de verdade de papéis:** commit `459e7cd` (06/11/2026).
> Histórico de commits não é reescrito: correções entram por novos PRs.

---

## 1. Equipe e Papéis

| Integrante | Papel na Sprint 1 | Responsabilidades Principais |
|------------|-------------------|------------------------------|
| **Fabricio Rodriguez Benitez** | Product Owner (PO) | Definição de escopo, priorização do backlog do produto e validação dos critérios de aceite. |
| **Grunner Sánchez Morales** | Scrum Master (SM) | Facilitação das cerimônias ágeis, remoção de impedimentos e acompanhamento do fluxo no GitHub Projects. |
| **Jordan Rivaldo Correa García** | Desenvolvedor(a) | Engenharia de requisitos, lógica transacional core e validação de consistência. |
| **Ryan Alessandro Lazaro Urtecho** | Desenvolvedor(a) |Especificação de casos de uso, definição de fluxos funcionais e prototipação das interfaces do sistema. |
| **César Eduardo Paredes Torres** | Desenvolvedor(a) | Modelagem funcional, arquitetura backend e regras de domínio. |
| **Tommy Rodriguez Zavaleta** | Desenvolvedor(a) | Lógica de consulta, modelagem de dados e interfaces de usuário. |

*Nota: Os papéis de facilitação poderão rotacionar nas sprints subsequentes conforme diretriz da equipe ágil.*

---

## 2. Calendário e Milestones

| Sprint | Início | Fim | Objetivo | Milestone |
|:---:|:---:|:---:|---|:---:|
| **1** | 28/09/2026 | 11/10/2026 | **Fundamentos:** configuração do repositório, definição das histórias de usuário, modelagem do diagrama geral de casos de uso e consolidação das regras de negócio. | [Sprint 1](https://github.com/Gruner19/UNISpace/milestone/1) |
| **2** | 12/10/2026 | 25/10/2026 | **Especificação da Lógica e Fluxos de Backend:** detalhamento formal dos casos de uso entregues (T5 e T6). T7 a T10 foram replanejados para a Sprint 4. | [Sprint 2](https://github.com/Gruner19/UNISpace/milestone/2) |
| **3** | 26/10/2026 | 08/11/2026 | **Arquitetura Backend, Frontend UI, Infra e QA:** modelagem complementar e protótipo de telas. Tarefas pendentes foram movidas para a Sprint 4. | [Sprint 3](https://github.com/Gruner19/UNISpace/milestone/3) |
| **4** | 09/11/2026 | 22/11/2026 | **Consolidação e implementação:** fundamentos técnicos (P0), backend e telas Must (P1, T5–T8), documentação pendente (T11, T12, T18). | [Sprint 4](https://github.com/Gruner19/UNISpace/milestone/4) |
| **Fechamento** | 23/11/2026 | 28/11/2026 | Correções finais, QA (P3.1, T6.4), capturas em `docs/img`, consolidação na `main` e publicação da tag de release `v1.0`. | [Release v1.0](https://github.com/Gruner19/UNISpace/releases) |

### Calendário ajustado

| Janela | Foco |
|---|---|
| 07–08/11 | Ajustes administrativos, decisão das regras **[a definir]** |
| 09–15/11 (Sprint 4, semana A) | Fechar especificações e modelagem pendentes; fundamentos técnicos (P0.1 a P0.5) e T6.1 |
| 16–22/11 (Sprint 4, semana B) | Backend e telas principais (P1, T5 a T8); T11, T12 e T18 |
| 23–28/11 (Fechamento) | QA (P3.1, T6.4), correções, capturas em `docs/img`, tag `v1.0` em 28/11 |

Todos os milestones: <https://github.com/Gruner19/UNISpace/milestones>

---

## 3. Backlog por Sprint

### Sprint 1 — [milestone 1](https://github.com/Gruner19/UNISpace/milestone/1)

| História | Tarefas | Responsável | Issue / PR |
|:---:|---|:---:|:---:|
| — | **T1:** Configurar repositório, README e estrutura inicial | Fabricio Rodriguez Benitez (I1) | [#19](https://github.com/Gruner19/UNISpace/pull/19) |
| **HU-01 a HU-06** | **T2:** Histórias de usuário de prioridade alta | Fabricio Rodriguez Benitez (I1) | [#20](https://github.com/Gruner19/UNISpace/pull/20) |
| **HU-07 a HU-13** | **T3:** Histórias de usuário de prioridade média e baixa | César Eduardo Paredes (I2) | [#23](https://github.com/Gruner19/UNISpace/pull/23) |
| **HU-01 a HU-13** | **T4:** Diagrama geral de casos de uso UML | César Eduardo Paredes (I2) | [#21](https://github.com/Gruner19/UNISpace/pull/21) |
| **RN-01 a RN-13** | **T13:** Regras de negócio e glossário do sistema | Fabricio Rodriguez Benitez (I1) | [#22](https://github.com/Gruner19/UNISpace/pull/22) |

---

### Sprint 2 — [milestone 2](https://github.com/Gruner19/UNISpace/milestone/2) (12/10 a 25/10)

| Tarefa | Issue | Responsável | Estado | Branch | PR | Revisor |
|:---:|:---:|:---:|---|---|:---:|:---:|
| **T5:** CU Consultar disponibilidade | [#6](https://github.com/Gruner19/UNISpace/issues/6) | Jordan Correa (I3) | Concluída (especificação); issue segue aberta como pai de T5.1–T5.2 | `feature/t5-consultar-disponibilidade` | [#24](https://github.com/Gruner19/UNISpace/pull/24) | — |
| **T6:** CU Reservar ambiente | [#7](https://github.com/Gruner19/UNISpace/issues/7) | Jordan Correa (I3) | Concluída (especificação); issue segue aberta como pai de T6.1–T6.4 | `feature/t6-reservar-ambiente` | [#25](https://github.com/Gruner19/UNISpace/pull/25) | — |
| **T7:** CU Cancelar reserva | [#8](https://github.com/Gruner19/UNISpace/issues/8) | Ryan Lazaro (I4) | Pendente (atrasada) → Sprint 4 (`carry-over`) | `feature/t7-cancelar-reserva` | — | Grunner |
| **T8:** CU Marcar ambiente em manutenção | [#9](https://github.com/Gruner19/UNISpace/issues/9) | Ryan Lazaro (I4) | Pendente (atrasada) → Sprint 4 (`carry-over`) | `feature/t8-marcar-manutencao` | — | Grunner |
| **T9:** CU Aprovar reserva especial | [#10](https://github.com/Gruner19/UNISpace/issues/10) | Grunner Sánchez (I5) | Pendente (atrasada) → Sprint 4 (`carry-over`) | `feature/t9-aprovar-reserva-especial` | — | Tommy |
| **T10:** CU Gerar relatório de uso | [#11](https://github.com/Gruner19/UNISpace/issues/11) | Grunner Sánchez (I5) | Pendente (atrasada) → Sprint 4 (`carry-over`) | `feature/t10-gerar-relatorio` | — | Tommy |

---

### Sprint 3 — [milestone 3](https://github.com/Gruner19/UNISpace/milestone/3) (26/10 a 08/11)

| Tarefa | Issue | Responsável | Estado | Branch | Revisor |
|:---:|:---:|:---:|---|---|:---:|
| **T14:** Requisitos não funcionais | [#12](https://github.com/Gruner19/UNISpace/issues/12) | Grunner Sánchez (I5) | Pendente → Sprint 4 (`carry-over`) | `feature/t14-requisitos-nao-funcionais` | Tommy |
| **T15:** Diagrama de classes UML | [#13](https://github.com/Gruner19/UNISpace/issues/13) | Jordan Correa (I3) | Pendente → Sprint 4 (`carry-over`) | `feature/t15-diagrama-classes` | Ryan |
| **T16:** Diagrama de sequência "Reservar ambiente" | [#14](https://github.com/Gruner19/UNISpace/issues/14) | César Eduardo (I2) | Pendente → Sprint 4 (`carry-over`) | `feature/t16-diagrama-sequencia-reserva` | Jordan |
| **T17:** Protótipo de telas do sistema | [#15](https://github.com/Gruner19/UNISpace/issues/15) | Ryan Lazaro (I4) | Parcial: `docs/interfaces.md` entregue no PR [#26](https://github.com/Gruner19/UNISpace/pull/26); restante → Sprint 4 | `feature/t17-prototipo-telas` | Grunner |

> O PR [#26](https://github.com/Gruner19/UNISpace/pull/26) adicionou `docs/interfaces.md` e este planejamento sem issue própria. Ryan valida o que ainda falta em T17 (#15).

---

### Sprint 4 — [milestone 4](https://github.com/Gruner19/UNISpace/milestone/4) (09/11 a 22/11) — replanejada

| Janela | Tarefa | Issue | Responsável | Estado | Branch | Revisor |
|:---:|:---:|:---:|:---:|---|---|:---:|
| 09–12/11 | **T7:** CU Cancelar reserva | [#8](https://github.com/Gruner19/UNISpace/issues/8) | Ryan (I4) | Pendente (`carry-over`) | `feature/t7-cancelar-reserva` | Grunner |
| 09–13/11 | **T8:** CU Marcar ambiente em manutenção | [#9](https://github.com/Gruner19/UNISpace/issues/9) | Ryan (I4) | Pendente (`carry-over`) | `feature/t8-marcar-manutencao` | Grunner |
| 09–13/11 | **T9:** CU Aprovar reserva especial | [#10](https://github.com/Gruner19/UNISpace/issues/10) | Grunner (I5) | Pendente (`carry-over`) | `feature/t9-aprovar-reserva-especial` | Tommy |
| 09–13/11 | **T10:** CU Gerar relatório de uso | [#11](https://github.com/Gruner19/UNISpace/issues/11) | Grunner (I5) | Pendente (`carry-over`) | `feature/t10-gerar-relatorio` | Tommy |
| 10–14/11 | **T14:** Requisitos não funcionais | [#12](https://github.com/Gruner19/UNISpace/issues/12) | Grunner (I5) | Pendente (`carry-over`) | `feature/t14-requisitos-nao-funcionais` | Tommy |
| 09–14/11 | **T15:** Diagrama de classes UML | [#13](https://github.com/Gruner19/UNISpace/issues/13) | Jordan (I3) | Pendente (`carry-over`) | `feature/t15-diagrama-classes` | Ryan |
| 09–14/11 | **T16:** Diagrama de sequência "Reservar ambiente" | [#14](https://github.com/Gruner19/UNISpace/issues/14) | César (I2) | Pendente (`carry-over`) | `feature/t16-diagrama-sequencia-reserva` | Jordan |
| 09–14/11 | **T17:** Protótipo de telas do sistema | [#15](https://github.com/Gruner19/UNISpace/issues/15) | Ryan (I4) | Parcial (`carry-over`) | `feature/t17-prototipo-telas` | Grunner |
| 16–18/11 | **T11:** Revisão de consistência e rastreabilidade | [#16](https://github.com/Gruner19/UNISpace/issues/16) | Tommy (I6) | Pendente | `feature/t11-revisao-consistencia` | Fabricio |
| 16–22/11 | **T12:** Relatório técnico final consolidado | [#17](https://github.com/Gruner19/UNISpace/issues/17) | Tommy (I6) | Pendente | `feature/t12-relatorio-final` | Fabricio |
| 19–22/11 | **T18:** Apresentação e ensaio da defesa (20/11 é feriado) | [#18](https://github.com/Gruner19/UNISpace/issues/18) | Tommy (I6) | Pendente | `feature/t18-apresentacao` | Fabricio |

As branches `feature/...` acima substituem os nomes `docs/...` do kanban anterior: o repositório já adota `feature/<tarefa>`.
Issues atrasadas: mover para o milestone **Sprint 4** e aplicar a label `carry-over`.

---

### Fechamento — [release v1.0](https://github.com/Gruner19/UNISpace/releases) (23/11 a 28/11)

| Janela | Tarefa | Issue | Responsável | Estado | Branch | Revisor |
|:---:|:---:|:---:|:---:|---|---|:---:|
| 23–26/11 | **P3.1:** Plano e execução dos testes de aceitação | P3 | Fabricio (I1) | Pendente | `feature/p3-1-testes-aceitacao` | César |
| 19–24/11 | **T6.4:** Testes de concorrência | #7 | César (I2) | Pendente | `feature/t6-4-testes-concorrencia` | Jordan |
| 26–28/11 | **P3.2:** Capturas em `docs/img`, README final, tag `v1.0` e release | P3 | Grunner (I5) | Pendente | `feature/p3-2-release-v1` | Tommy |

Correções de QA, consolidação na `main` e publicação da tag `v1.0` em 28/11.

---

## 4. Desenvolvimento de código

Cada issue principal (caso de uso) vira **pai**; as sub-issues implementam a funcionalidade. A numeração indica o pai: `T6.2` é a sub-issue 2 da issue principal T6.

- **Issues principais existentes:** #6 a #11 (T5 a T10, os casos de uso). Elas **não se fecham agora**: a especificação já foi entregue (PRs #24 e #25 para T5 e T6), mas permanecem abertas até todas as suas sub-issues fecharem e o PO validar os critérios de aceite.
- **Issues principais novas:** a stack, o modelo de dados, o acesso/cadastro de espaços, a equidade e o QA atravessam vários casos de uso e não têm issue própria. Criar **P0 a P3** (previstas como #27 a #30; as sub-issues começam em #31; confirmar ao criar, pois a numeração é compartilhada com os PRs).
- **Como criar:** "Create sub-issue" dentro da issue pai, ou `parent_issue_number` na API. Milestone **Sprint 4**; labels `sub-issue` mais a da camada (`backend`, `frontend`, `database`, `infra`, `qa`).
- **Definição de pronto de uma sub-issue:** código com seus testes, PR aprovado e mergeado pelo revisor, `Closes #N` no PR.

### 4.1 Mapa

| Issue principal | Funcionalidade | HU | Regras | Prioridade | Sub-issues |
|---|---|---|---|---|---|
| #6 (T5) | Consultar disponibilidade | HU-02 | RN-01, RN-06, RN-12 | Must | T5.1 a T5.2 |
| #7 (T6) | Reservar ambiente | HU-03, HU-04 | RN-01, RN-02, RN-08, RN-09, RN-10 | Must | T6.1 a T6.4 |
| #8 (T7) | Cancelar reserva | HU-05, HU-10 | RN-05, RN-11, RN-13 | Must (HU-10 Should) | T7.1 a T7.3 |
| #9 (T8) | Marcar ambiente em manutenção | HU-09 | RN-06, RN-07, RN-12 | Should | T8.1 a T8.3 |
| #10 (T9) | Aprovar reserva especial | sem HU direta (a mais próxima é HU-13) | a definir | Could | T9.1 a T9.2 |
| #11 (T10) | Gerar relatório de uso | HU-12 | RN-13 | Could | T10.1 a T10.2 |
| P0 (nova) | Fundamentos técnicos | — | RN-03, RN-04, RN-05, RN-08 (decisão) | Must | P0.1 a P0.5 |
| P1 (nova) | Acesso e cadastro de espaços | HU-01, HU-06 | RN-02, RN-12 | Must | P1.1 a P1.4 |
| P2 (nova) | Equidade: cota e prioridade rotativa | HU-07, HU-08 | RN-03, RN-04 | Should | P2.1 a P2.2 |
| P3 (nova) | QA e entrega | HU-01 a HU-06 | — | Must | P3.1 a P3.2 |

Atenção em T9: o diagrama de casos de uso do repositório não tem "Aprovar reserva especial" e não existe HU nem regra para ele. Alinhar com o PO em **P0.5**; se não houver HU, tratar como trabalho futuro fora da v1.0.

### 4.2 Issue principal #6 — T5 Consultar disponibilidade (Must)

| ID | Sub-issue | Camada | Resp. | Revisor | Janela | Branch | Depende de |
|---|---|---|---|---|---|---|---|
| T5.1 | Endpoint de disponibilidade com filtros por tipo, dia e horário; horários ocupados e bloqueados marcados como indisponíveis | Backend | Tommy | Fabricio | 16–19/11 | `feature/t5-1-api-disponibilidade` | P0.4, spec T5 (feita) |
| T5.2 | Tela de agenda com filtros e indicação visual de horário livre/ocupado | Frontend | Ryan | Grunner | 17–21/11 | `feature/t5-2-ui-agenda` | T5.1, T17 |

### 4.3 Issue principal #7 — T6 Reservar ambiente (Must)

| ID | Sub-issue | Camada | Resp. | Revisor | Janela | Branch | Depende de |
|---|---|---|---|---|---|---|---|
| T6.1 | Restrição anti-sobreposição de horários e registro de auditoria das reservas | Banco | Jordan | Ryan | 14–16/11 | `feature/t6-1-bd-reservas` | P0.4 |
| T6.2 | Criar reserva de forma atômica: horário livre, duração mínima/máxima, capacidade, e-mail institucional | Backend | Jordan | Ryan | 16–20/11 | `feature/t6-2-api-criar-reserva` | T6.1, P1.1, P0.5 |
| T6.3 | Fluxo de reserva na interface: seleção de horário, confirmação e mensagem clara de conflito | Frontend | Ryan | Grunner | 18–22/11 | `feature/t6-3-ui-reserva` | T6.2, T5.2 |
| T6.4 | Testes de concorrência: duas solicitações simultâneas do mesmo horário, só a primeira confirma | Testes | César | Jordan | 19–24/11 | `feature/t6-4-testes-concorrencia` | T6.2 |

### 4.4 Issue principal #8 — T7 Cancelar reserva (Must)

| ID | Sub-issue | Camada | Resp. | Revisor | Janela | Branch | Depende de |
|---|---|---|---|---|---|---|---|
| T7.1 | Cancelar reserva: só o dono ou o administrador, dentro do prazo, liberando o horário e registrando auditoria | Backend | Jordan | Ryan | 18–21/11 | `feature/t7-1-api-cancelar-reserva` | T6.2, P0.5, spec T7 |
| T7.2 | Tela "minhas reservas" com botão de cancelar e confirmação | Frontend | Ryan | Grunner | 19–22/11 | `feature/t7-2-ui-minhas-reservas` | T7.1 |
| T7.3 | Histórico de reservas (data, espaço, horário, estado usada ou cancelada) — HU-10 | Backend | Tommy | Fabricio | 19–22/11 | `feature/t7-3-api-historico` | T6.2 |

### 4.5 Issue principal #9 — T8 Marcar ambiente em manutenção (Should)

| ID | Sub-issue | Camada | Resp. | Revisor | Janela | Branch | Depende de |
|---|---|---|---|---|---|---|---|
| T8.1 | Criar bloqueio (início, fim, motivo) com prioridade sobre reservas e cancelamento das reservas afetadas | Backend | César | Jordan | 18–21/11 | `feature/t8-1-api-bloqueios` | T6.2, spec T8 |
| T8.2 | Tela do administrador para criar e listar bloqueios | Frontend | Tommy | Fabricio | 19–22/11 | `feature/t8-2-ui-bloqueios` | T8.1 |
| T8.3 | Aviso aos usuários afetados por um bloqueio (RN-07) | Backend | Grunner | Tommy | 19–23/11 | `feature/t8-3-aviso-afetados` | T8.1 |

### 4.6 Issue principal #10 — T9 Aprovar reserva especial (Could)

| ID | Sub-issue | Camada | Resp. | Revisor | Janela | Branch | Depende de |
|---|---|---|---|---|---|---|---|
| T9.1 | Estado "pendente de aprovação" e endpoints de aprovar e rejeitar | Backend | César | Jordan | 20–24/11 | `feature/t9-1-api-aprovacao` | P0.5, spec T9, T6.2 |
| T9.2 | Fila de aprovação na interface do administrador | Frontend | Fabricio | César | 20–24/11 | `feature/t9-2-ui-aprovacao` | T9.1 |

### 4.7 Issue principal #11 — T10 Gerar relatório de uso (Could)

| ID | Sub-issue | Camada | Resp. | Revisor | Janela | Branch | Depende de |
|---|---|---|---|---|---|---|---|
| T10.1 | Consulta agregada de uso por espaço, curso e faculdade, com período | Backend | Tommy | Fabricio | 20–24/11 | `feature/t10-1-api-relatorio` | T6.2, spec T10 |
| T10.2 | Tela de relatório com filtro de período | Frontend | Grunner | Tommy | 20–24/11 | `feature/t10-2-ui-relatorio` | T10.1 |

### 4.8 Issue principal nova P0 — Fundamentos técnicos (Must)

| ID | Sub-issue | Camada | Resp. | Revisor | Janela | Branch | Depende de |
|---|---|---|---|---|---|---|---|
| P0.1 | ADR da stack (backend, banco, frontend) em `docs/arquitetura/adr-001-stack.md` | Infra | César | Jordan | 09–11/11 | `feature/p0-1-adr-stack` | — |
| P0.2 | Estrutura de `src/` e ambiente local (`.env.example`, instruções de execução) | Infra | Grunner | Tommy | 10–13/11 | `feature/p0-2-scaffold-projeto` | P0.1 |
| P0.3 | Integração contínua: build e testes em cada PR | Infra | Grunner | Tommy | 12–14/11 | `feature/p0-3-ci-pr` | P0.2 |
| P0.4 | Modelo relacional e script de criação (usuários, espaços, reservas, bloqueios, auditoria) | Banco | Tommy | Fabricio | 10–15/11 | `feature/p0-4-modelo-dados` | T15, P0.1 |
| P0.5 | Decidir os valores **[a definir]** (cota semanal, prioridade rotativa, prazo de cancelamento, duração mínima/máxima), decidir o destino de T9 e atualizar `regras-de-negocio.md` | Decisão | Fabricio | César | 09–10/11 | `feature/p0-5-regras-pendentes` | — |

### 4.9 Issue principal nova P1 — Acesso e cadastro de espaços (Must)

| ID | Sub-issue | Camada | Resp. | Revisor | Janela | Branch | Depende de |
|---|---|---|---|---|---|---|---|
| P1.1 | Autenticação com e-mail institucional e senha (HU-01, RN-02) | Backend | César | Jordan | 14–18/11 | `feature/p1-1-api-autenticacao` | P0.4 |
| P1.2 | Cadastro, edição e desativação de espaços sem apagar histórico (HU-06, RN-12) | Backend | Fabricio | César | 14–18/11 | `feature/p1-2-api-espacos` | P0.4 |
| P1.3 | Tela de login com mensagem de erro e redirecionamento para a agenda | Frontend | Ryan | Grunner | 16–20/11 | `feature/p1-3-ui-login` | P1.1, T17 |
| P1.4 | Painel do administrador para cadastrar e editar espaços | Frontend | Fabricio | César | 18–22/11 | `feature/p1-4-ui-admin-espacos` | P1.2 |

### 4.10 Issue principal nova P2 — Equidade (Should)

| ID | Sub-issue | Camada | Resp. | Revisor | Janela | Branch | Depende de |
|---|---|---|---|---|---|---|---|
| P2.1 | Cota semanal de horas por usuário e saldo consultável (HU-07, RN-03) | Backend | Fabricio | César | 18–23/11 | `feature/p2-1-api-cota` | P0.5, T6.2 |
| P2.2 | Prioridade rotativa entre cursos e faculdades (HU-08, RN-04) | Backend | Jordan | Ryan | 18–23/11 | `feature/p2-2-api-prioridade` | P0.5, T6.2 |

Quando P2 terminar, T5.2 e T6.3 passam a exibir o saldo de horas e o grupo com prioridade (ajuste pequeno na própria sub-issue).

### 4.11 Issue principal nova P3 — QA e entrega (Must)

| ID | Sub-issue | Camada | Resp. | Revisor | Janela | Branch | Depende de |
|---|---|---|---|---|---|---|---|
| P3.1 | Plano e execução de testes de aceitação com os critérios das HU-01 a HU-06 em `docs/testes/plano-aceitacao.md` | Testes | Fabricio | César | 23–26/11 | `feature/p3-1-testes-aceitacao` | T5, T6, T7, P1 |
| P3.2 | Capturas em `docs/img`, README final, tag `v1.0` e release | Entrega | Grunner | Tommy | 26–28/11 | `feature/p3-2-release-v1` | P3.1 |

### 4.12 Carga por integrante (29 sub-issues)

| Integrante | Documentação pendente | Sub-issues de código |
|---|---|---|
| Fabricio | — | P0.5, P1.2, P1.4, P2.1, P3.1, T9.2 |
| César | T16 | P0.1, P1.1, T6.4, T8.1, T9.1 |
| Jordan | T15 | T6.1, T6.2, T7.1, P2.2 |
| Ryan | T7, T8, T17 | P1.3, T5.2, T6.3, T7.2 |
| Grunner | T9, T10, T14 | P0.2, P0.3, T8.3, T10.2, P3.2 |
| Tommy | T11, T12, T18 | P0.4, T5.1, T7.3, T8.2, T10.1 |

A revisão segue a rotação da seção 5. Se o prazo apertar, cortar nesta ordem: Could (T9, T10), depois Should (T8, P2, T7.3, P0.3, P1.4). O Must (P0, P1.1 a P1.3, T5, T6, T7.1, T7.2, P3) é o que sustenta a v1.0.

---
