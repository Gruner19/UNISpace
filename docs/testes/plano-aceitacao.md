# Plano de aceitação — UNISpace

- **Tarefa:** P3.1
- **Versão:** 1.0
- **Última atualização:** 2026-11-07

## 1. Objetivo

Definir como o UNISpace será validado antes da entrega final, garantindo que as
histórias de usuário, casos de uso e regras de negócio estejam implementados e
verificáveis.

## 2. Escopo

O plano cobre os fluxos principais do sistema:

- autenticação institucional;
- consulta de disponibilidade e catálogo de espaços;
- realização de reserva com validação anti-conflito;
- cancelamento de reserva;
- bloqueio administrativo de espaço;
- aprovação de reserva especial;
- geração de relatórios de uso.

## 3. Ambientes

| Ambiente | Finalidade | Observações |
|---|---|---|
| Desenvolvimento | Implementação e testes locais | Banco PostgreSQL local; dados de seed. |
| Homologação | Validação com dados representativos | Configuração próxima da produção. |
| Produção | Entrega final | Acesso restrito; monitoramento básico. |

## 4. Níveis de teste

| Nível | Responsável | Ferramentas | Cobertura esperada |
|---|---|---|---|
| Unitário | Desenvolvedores | Jest / Vitest | Regras de negócio e funções utilitárias. |
| Integração | Desenvolvedores | Supertest + banco de teste | Endpoints, repositórios e transações. |
| Sistema / E2E | QA da equipe | Navegador + roteiro de aceitação | Fluxos completos de reserva. |
| Aceitação | PO e stakeholders | Roteiro abaixo | Critérios de aceite das HUs. |

## 5. Critérios de aceite por caso de uso

### CU-02 — Consultar disponibilidade

- [ ] A agenda exibe slots livres, ocupados e bloqueados com cores distintas.
- [ ] Os filtros de data, turno, tipo, capacidade e comodidades funcionam.
- [ ] Espaços inativos ou bloqueados não aparecem como disponíveis.

### CU-03 — Reservar ambiente

- [ ] Uma reserva válida é confirmada e aparece em "Minhas Reservas".
- [ ] Duas solicitações simultâneas do mesmo horário resultam em apenas uma confirmada.
- [ ] A duração respeita os limites mínimo e máximo (RN-08).
- [ ] A quantidade de participantes não excede a capacidade do espaço (RN-09).
- [ ] A cota semanal do usuário é respeitada (RN-03).

### CU — Cancelar reserva

- [ ] O dono da reserva consegue cancelar dentro do prazo permitido (RN-05, RN-11).
- [ ] As horas retornam à cota semanal do usuário.
- [ ] A reserva passa ao histórico com status de cancelamento.

### CU — Marcar ambiente em manutenção

- [ ] O administrador consegue bloquear um período com justificativa.
- [ ] Reservas conflitantes são canceladas e os usuários são notificados (RN-06, RN-07).
- [ ] O espaço bloqueado aparece como indisponível na consulta.

### CU — Aprovar reserva especial

- [ ] Reservas de grupos de pesquisa/extensão podem ser aprovadas pelo administrador.
- [ ] A aprovação respeita a prioridade e as cotas definidas.
- [ ] O solicitante recebe a confirmação da reserva.

### CU — Gerar relatório de uso

- [ ] O administrador filtra por período, faculdade e tipo de espaço.
- [ ] Os relatórios apresentam ocupação, horários de pico e distribuição entre cursos.
- [ ] A exportação em CSV/PDF contém os dados filtrados.

## 6. Casos de teste críticos

| ID | Cenário | Resultado esperado |
|---|---|---|
| CT-01 | Login com e-mail institucional válido | Acesso liberado e redirecionamento para a agenda. |
| CT-02 | Login com e-mail não institucional | Acesso negado com mensagem clara. |
| CT-03 | Reserva em slot livre | Reserva confirmada e slot marcado como ocupado. |
| CT-04 | Duas reservas simultâneas no mesmo slot | Apenas uma confirmada; a outra recebe conflito. |
| CT-05 | Reserva acima da capacidade | Solicitação rejeitada com validação. |
| CT-06 | Cancelamento dentro do prazo | Reserva cancelada e cota devolvida. |
| CT-07 | Bloqueio sobre reserva existente | Reserva cancelada e usuário notificado. |
| CT-08 | Acesso de não administrador ao painel admin | Acesso negado (403). |

## 7. Critérios de saída

A entrega é considerada aceita quando:

- todos os casos de teste críticos passarem;
- não houver defeitos abertos de severidade alta ou crítica;
- os critérios de aceite das HUs do escopo estiverem marcados;
- a documentação estiver consistente com o comportamento entregue;
- o PO aprovar a demonstração final.

## 8. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Conflito de reservas por concorrência | Alto | Transação atômica e restrição exclusiva no banco. |
| Ambiente de homologação indisponível | Médio | Executar testes de integração com banco local. |
| Prazo curto para testes E2E | Médio | Priorizar os casos críticos CT-01 a CT-08. |
| Dados de teste irreais | Baixo | Criar seeds representativos por tipo de espaço. |
