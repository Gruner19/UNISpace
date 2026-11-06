# Planejamento das Sprints — UNISpace

Plataforma web centralizada para gestão e reserva equitativa dos espaços compartilhados da universidade.

---

## 1. Equipe e Papéis

| Integrante | Papel na Sprint 1 | Responsabilidades Principais |
|------------|-------------------|------------------------------|
| **Fabricio Rodriguez Benitez** | Product Owner (PO) | Definição de escopo, priorização do backlog do produto e validação dos critérios de aceite. |
| **Grunner Sánchez Morales** | Scrum Master (SM) | Facilitação das cerimônias ágeis, remoção de impedimentos e acompanhamento do fluxo no GitHub Projects. |
| **Jordan Rivaldo Correa García** | Desenvolvedor(a) | Engenharia de requisitos, lógica transacional core e validação de consistência. |
| **César Eduardo Paredes Torres** | Desenvolvedor(a) | Modelagem funcional, arquitetura backend e regras de domínio. |
| **Tommy Rodriguez Zavaleta** | Desenvolvedor(a) | Lógica de consulta, modelagem de dados e interfaces de usuário. |

*Nota: Os papéis de facilitação poderão rotacionar nas sprints subsequentes conforme diretriz da equipe ágil.*

---

## 2. Calendário e Milestones

| Sprint | Início | Fim | Objetivo | Milestone |
|:---:|:---:|:---:|---|:---:|
| **1** | 28/09/2026 | 11/10/2026 | **Fundamentos:** configuração do repositório, definição das histórias de usuário, modelagem do diagrama geral de casos de uso e consolidação das regras de negócio. | [Sprint 1](https://github.com/Gruner19/UNISpace/milestone/1) |
| **2** | 12/10/2026 | 25/10/2026 | **Especificação da Lógica e Fluxos de Backend:** detalhamento formal dos 6 casos de uso do sistema (fluxo básico, alternativos, exceções, pré e pós-condições). | [Sprint 2](https://github.com/Gruner19/UNISpace/milestone/2) |
| **3** | 26/10/2026 | 08/11/2026 | **Arquitetura Backend, Frontend UI, Infra e QA:** modelagem complementar (requisitos não funcionais, diagrama de classes, diagrama de sequência, protótipo de telas) e revisão de consistência. | [Sprint 3](https://github.com/Gruner19/UNISpace/milestone/3) |
| **4** | 09/11/2026 | 22/11/2026 | **Consolidação:** unificação de toda a documentação no relatório técnico final e preparação da defesa/apresentação. | [Sprint 4](https://github.com/Gruner19/UNISpace/milestone/4) |
| **Fechamento** | 23/11/2026 | 28/11/2026 | Correções finais, merge da ramificação `develop` para `main`, publicação da tag de release `v1.0` e encerramento. | [Release v1.0](https://github.com/Gruner19/UNISpace/releases) |

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

### Sprints seguintes

As Sprints 2, 3 e 4 têm seus objetivos e metas globais definidos na seção 2. O backlog de cada uma é refinado e detalhado no planejamento específico de cada ciclo:

- **Sprint 2 (12/10 a 25/10):**
  - **T5:** Especificação do CU Consultar disponibilidade (Resp.: Jordan Correa — I3 | PR [#24](https://github.com/Gruner19/UNISpace/pull/24)).
  - **T6:** Especificação do CU Reservar ambiente (Resp.: Jordan Correa — I3 | PR [#25](https://github.com/Gruner19/UNISpace/pull/25)).
  - **T7:** Especificação do CU Cancelar reserva (Resp.: Tommy Rodriguez — I4).
  - **T8:** Especificação do CU Marcar ambiente em manutenção (Resp.: Tommy Rodriguez — I4).
  - **T9:** Especificação do CU Aprovar reserva especial (Resp.: Grunner Sánchez — I5).
  - **T10:** Especificação do CU Gerar relatório de uso (Resp.: Grunner Sánchez — I5).

- **Sprint 3 (26/10 a 08/11):**
  - **T14:** Requisitos não-funcionais (Resp.: Grunner Sánchez — I5).
  - **T15:** Diagrama de classes UML (Resp.: Jordan Correa — I3).
  - **T16:** Diagrama de sequência "Reservar ambiente" (Resp.: César Eduardo — I2).
  - **T17:** Protótipo de telas do sistema (Resp.: Tommy Rodriguez — I4).
  - **T11:** Revisão de consistência e rastreabilidade total (Resp.: Equipe / I6).

- **Sprint 4 e Fechamento (09/11 a 28/11):**
  - **T12:** Relatório técnico final consolidado.
  - **T18:** Apresentação e ensaio da defesa do projeto.
  - **Fechamento:** Correções de QA, consolidação em `main` e publicação da tag `v1.0`.
