# UNISpace — Regras de Negócio

> Documento atualizado na tarefa P0.5 (issue #53). Todos os valores antes marcados como "[a definir]" foram decididos pelo PO em 07/11/2026 e são revisáveis após o primeiro mês de uso.

## RN-03 — Cota semanal de uso (equidade)

- Por usuário: máximo de **6 horas de reserva por semana** (segunda a domingo) e **2 reservas ativas** (futuras) simultâneas.
- Por curso/faculdade: no máximo **40% das horas disponíveis** de um mesmo espaço por semana (parâmetro configurável por espaço).
- Antecedência máxima para reservar: **14 dias**.
- Reservas canceladas dentro do prazo não contam para a cota semanal.

## RN-04 — Prioridade rotativa

- A prioridade entre cursos/faculdades **gira semanalmente**: a cada semana, o curso que usou **menos horas** do espaço na semana anterior tem prioridade na abertura das reservas.
- A prioridade vale apenas para a **primeira janela de reservas da semana**: durante as primeiras 24 horas após a abertura da agenda, apenas o curso prioritário pode reservar horários em horário nobre (definido por espaço).
- Após essa janela, a agenda abre para todos, por ordem de chegada, respeitando as cotas (RN-03).
- Empates na semana anterior são resolvidos por sorteio registrado em auditoria.

## RN-05 — Prazo de cancelamento

- O usuário pode cancelar sua reserva **até 2 horas antes** do horário de início sem penalidade.
- Cancelamentos com **menos de 2 horas** de antecedência são permitidos, mas contam como **uso consumido** na cota semanal.
- **Não comparecimento (no-show)**: após 3 no-shows em 30 dias, o usuário fica **suspenso de novas reservas por 7 dias**.
- O horário liberado por cancelamento volta imediatamente à agenda.

## RN-08 — Duração mínima e máxima das reservas

| Tipo de espaço | Duração mínima | Duração máxima por reserva | Blocos |
|---|---|---|---|
| Salas de estudo | 30 min | 2 horas | 30 min |
| Laboratórios | 30 min | 3 horas | 30 min |
| Auditórios | 1 hora | 4 horas | 1 h |
| Áreas esportivas | 1 hora | 2 horas | 1 h |

- A duração mínima evita fragmentação da agenda e custo operacional por reservas muito curtas.
- A duração máxima evita que uma única reserva monopolize o espaço.

## RN — Consistência da agenda

- A validação de conflito de horário e de cota deve ocorrer na **mesma operação atômica** que grava a reserva, de modo que duas solicitações simultâneas para o mesmo horário nunca sejam ambas confirmadas.

## T9 — Aprovar reserva especial (decisão)

**Decisão: ADIAR para o futuro (fora do escopo da Sprint 4).**

Justificativa:
- Exige fluxo de aprovação com responsável pelo espaço, notificações e novos estados da reserva, o que aumenta a complexidade e o risco do núcleo do sistema.
- O núcleo prioritário (P0) é a reserva sem conflitos, com cotas e prioridade rotativa.
- Enquanto T9 não for implementada, eventos especiais (ex.: cerimônias, campeonatos) são tratados por **bloqueio administrativo** do espaço, feito pela gestão.

Reavaliar T9 após a Sprint 4, com base no uso real da plataforma.

## Resumo dos valores decididos

| Regra | Valor |
|---|---|
| Cota semanal por usuário | 6 h/semana e 2 reservas ativas |
| Cota por curso/faculdade | 40% das horas do espaço por semana |
| Antecedência máxima | 14 dias |
| Prioridade rotativa | Semanal; curso com menor uso na semana anterior, janela de 24 h |
| Cancelamento sem penalidade | Até 2 h antes |
| Suspensão por no-show | 3 no-shows em 30 dias → 7 dias suspenso |
| Duração mínima | 30 min (salas/labs) · 1 h (auditórios/esportivas) |
| Duração máxima | 2 h (salas) · 3 h (labs) · 4 h (auditórios) · 2 h (esportivas) |
| T9 | Adiada |
