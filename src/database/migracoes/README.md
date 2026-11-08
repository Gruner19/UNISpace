# Migrações e Restrições de Banco de Dados — UNISpace (T6.1)

- **Sub-issue:** [#35 — T6.1: Restrição anti-sobreposição (BD)](https://github.com/Gruner19/UNISpace/issues/35)
- **Issue Principal:** [#7 — T6: CU Reservar ambiente](https://github.com/Gruner19/UNISpace/issues/7)
- **Responsável:** Jordan Rivaldo Correa García (I3)
- **Revisor:** Ryan Alessandro Lazaro Urtecho (I4)

---

## 1. Objetivo

Garantir no nível físico do motor do **PostgreSQL** que:
1. **Impossibilidade de Conflito de Horários (`RN-01` e `RN-10`):** Duas solicitações (mesmo simultâneas em transações concorrentes) jamais confirmem reserva para o mesmo `espaco_id`, na mesma `data`, com interseção de horários `[horario_inicio, horario_fim)`.
2. **Trilha de Auditoria Imutável (`RN-13`):** Toda criação, cancelamento ou alteração de estado de uma reserva seja gravada automaticamente em `auditoria_reservas`, com proteção contra `UPDATE` e `DELETE`.
3. **Defesa em Profundidade (`RN-06`, `RN-08`, `RN-09`, `RN-12`):** Triggers de banco asseguram que espaços inativos, bloqueados administrativamente ou com excesso de capacidade/duração sejam barrados mesmo fora da camada de aplicação.

---

## 2. Mecanismo Técnico Anti-Sobreposição (`btree_gist`)

A migração [`001_t6_1_restricao_anti_sobreposicao_e_auditoria.sql`](./001_t6_1_restricao_anti_sobreposicao_e_auditoria.sql) habilita a extensão `btree_gist` do PostgreSQL e define a constraint de exclusão parcial:

```sql
ALTER TABLE reservas
ADD CONSTRAINT excl_reservas_sem_sobreposicao_horario
EXCLUDE USING gist (
    espaco_id WITH =,
    tsrange((data + horario_inicio), (data + horario_fim), '[)') WITH &&
)
WHERE (status = 'CONFIRMADA');
```

- **Semântica do intervalo `[)` (fechado no início, aberto no fim):** Permite reservas adjacentes sem conflito (ex.: uma reserva das `14:00` às `16:00` e outra das `16:00` às `18:00` no mesmo espaço coexistem perfeitamente), mas bloqueia qualquer sobreposição parcial ou total com erro nativo `SQLSTATE 23P01 (exclusion_violation)`.
- **Filtro parcial `WHERE (status = 'CONFIRMADA')`:** Quando uma reserva é cancelada (`CANCELADA_USUARIO`, `CANCELADA_ADMIN` ou `CANCELADA_BLOQUEIO`), o slot volta imediatamente a aceitar novas reservas sem apagar o registro histórico.

---

## 3. Como Executar a Migração e Validar

### 3.1. Aplicar a Migração
```bash
psql "$DATABASE_URL" -f src/database/migracoes/001_t6_1_restricao_anti_sobreposicao_e_auditoria.sql
```

### 3.2. Executar o Script de Verificação Automatizada
```bash
psql "$DATABASE_URL" -f src/database/scripts/testar_concorrencia_e_sobreposicao.sql
```

O script valida automaticamente:
- **Teste 1:** Criação de reserva válida e geração automática do registro em `auditoria_reservas`.
- **Teste 2:** Rejeição imediata de reserva sobreposta com `SQLSTATE 23P01`.
- **Teste 3:** Bloqueio de tentativa de `DELETE` na tabela `auditoria_reservas` com `SQLSTATE 42501`.
