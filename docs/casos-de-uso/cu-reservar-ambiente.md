# Especificação de Caso de Uso: CU-03 — Reservar Ambiente (T6)

---

## 1. Identificação e Metadados

| Atributo | Detalhe |
|---|---|
| **Identificador** | **CU-03** (vinculado a **T6** no cronograma Kanban) |
| **Nome** | Reservar Ambiente (Espaço Compartilhado) |
| **Sprint** | Sprint 2 (12/10 a 25/10) — Especificação de Lógica e Flujos de Backend |
| **Responsável (Execução)** | Integrante 3 (I3 — Jordan Rivaldo Correa García) |
| **Revisor Designado** | Integrante 4 (I4) |
| **Domínio Arquitetural** | Lógica Transacional Core |
| **Estimativa / Período** | 5 horas \| 12/10 a 25/10 |
| **Dependências Técnicas** | T4 (Diagrama de Casos de Uso UML), T13 (Regras de Negócio e Glossário) |
| **Status** | Pronto para Revisão (Em conformidade com a Definição de Pronto) |

---

## 2. Rastreabilidade com Artefatos do Projeto

- **Diagrama de Casos de Uso (T4):** Detalha o caso de uso `UC3: Reservar espaço`, que estabelece os seguintes relacionamentos UML:
  - `UC3 ..> UC1 : <<include>>` (*Entrar no sistema*) — validação de autenticação institucional (`RN-02`).
  - `UC3 ..> UC6 : <<include>>` (*Validar conflito de horário*) — verificação de sobreposição e bloqueios (`RN-01`, `RN-06`).
  - `UC3 ..> UC7 : <<include>>` (*Aplicar regras de equidade*) — validação de cotas semanais e prioridade rotativa (`RN-03`, `RN-04`).
  - `UC8 ..> UC3 : <<extend>>` (*Receber notificações*) — disparo de e-mail de confirmação (`HU-11`).
- **Histórias de Usuário:**
  - **HU-01 (Alta):** *Como usuário, quero entrar no sistema com meu e-mail institucional e senha, para acessar minhas reservas.*
  - **HU-03 (Alta):** *Como estudante, quero reservar um espaço em um horário livre, para evitar conflitos com outros grupos.*
  - **HU-04 (Alta):** *Como usuário, quero que o sistema não aceite duas reservas no mesmo espaço e horário, para não haver conflitos.*
  - **HU-07 (Média):** *Como administrador, quero definir uma cota de horas por semana para cada usuário, para distribuir os espaços de forma justa.*
  - **HU-08 (Média):** *Como estudante, quero que a prioridade de reserva mude entre cursos e faculdades, para que todos tenham as mesmas chances.*
  - **HU-11 (Baixa):** *Como usuário, quero receber um aviso antes da minha reserva, para não esquecer.*
  - **HU-13 (Baixa):** *Como docente, quero reservar um espaço para meu grupo de pesquisa, para fazer reuniões e atividades.*
- **Regras de Negócio Relacionadas (T13):**
  - **RN-01:** Um espaço não pode ter duas reservas no mesmo horário.
  - **RN-02:** Só usuários com e-mail institucional podem fazer reservas.
  - **RN-03:** Cada usuário tem uma cota máxima de horas de reserva por semana.
  - **RN-04:** A prioridade de reserva muda entre cursos e faculdades a cada período.
  - **RN-06:** Um bloqueio do administrador tem prioridade sobre qualquer reserva.
  - **RN-08:** Cada reserva tem duração mínima e máxima permitida.
  - **RN-09:** O número de participantes não pode passar da capacidade do espaço.
  - **RN-10:** Se duas pessoas pedem o mesmo horário ao mesmo tempo, só a primeira solicitação é confirmada.
  - **RN-12:** Espaços desativados não aceitam novas reservas, mas o histórico é mantido.
  - **RN-13:** Todas as reservas, cancelamentos e bloqueios ficam registrados para auditoria.

---

## 3. Sumário e Objetivo

Permitir que usuários da comunidade acadêmica devidamente autenticados (`RN-02`) realizem a reserva formal de um espaço compartilhado (salas de estudo em grupo, laboratórios, auditórios ou quadras esportivas) para uma data e período específicos.

Por se tratar do **núcleo transacional (*core*) do UNISpace**, este caso de uso garante **consistência estrita (propriedades ACID)**: toda solicitação é validada em uma transação atômica isolada que impede a sobreposição de horários (`RN-01`), resolve disputas concorrentes simultâneas via travas no banco de dados (`RN-10`), abate as horas reservadas da cota semanal do usuário (`RN-03`), respeita a prioridade rotativa entre departamentos (`RN-04`), gera registros imutáveis de auditoria (`RN-13`) e agenda o disparo de notificações de confirmação (`UC8`).

---

## 4. Atores

1. **Ator Primário:**
   - **Usuário Autenticado:** Membro da universidade (Estudante de graduação/pós, Docente, Coordenador ou Líder de Grupo de Pesquisa).
2. **Atores Secundários / Serviços de Suporte:**
   - **Módulo de Controle Transacional do UNISpace (Backend):** Executa o pipeline de validações e o controle de concorrência.
   - **Banco de Dados Relacional:** Garante a persistência atômica, isolamento transacional e integridade referencial.
   - **Serviço de Notificações:** Envia e-mail de confirmação ao usuário e agenda lembretes de proximidade.
   - **Módulo de Auditoria:** Registra data, hora, IP, identificador do usuário e parâmetros da reserva.

---

## 5. Pré-condições

1. O usuário deve estar autenticado no sistema com credencial institucional ativa (`RN-02` / `UC1`).
2. O espaço desejado deve existir no catálogo com status **ativo** (`RN-12`).
3. O usuário deve possuir saldo disponível em sua cota semanal de reservas suficiente para cobrir a duração solicitada (`RN-03`).
4. A data da reserva deve estar compreendida no período letivo vigente e respeitar o limite de antecedência máxima permitida (ex.: até 14 dias de antecedência).
5. O curso/faculdade do usuário deve estar habilitado para reservar o espaço na data pretendida segundo o calendário de prioridade rotativa vigente (`RN-04`).

---

## 6. Pós-condições

### 6.1. Pós-condição de Sucesso
- A reserva é persistida no banco de dados com status `CONFIRMADA` e recebe um código identificador único (UUID e código alfanumérico amigável de 6 caracteres).
- A agenda centralizada do espaço é bloqueada para o intervalo reservado, tornando-o indisponível para quaisquer outras tentativas de consulta ou reserva (`RN-01`).
- A cota semanal do usuário é imediatamente debitada na quantidade exata de horas da reserva (`RN-03`).
- Um registro imutável de auditoria é gravado na tabela `auditoria_reservas` (`RN-13`).
- O serviço de notificação é enfileirado para despachar o e-mail de confirmação com detalhes e instruções de uso (`HU-11`).
- O comprovante da reserva é exibido na interface do usuário com opção de download/impressão e inclusão na listagem "Minhas Reservas".

### 6.2. Pós-condição de Falha
- Se ocorrer qualquer violação de regra de negócio, concorrência simultânea ou falha sistêmica, o backend executa o **`ROLLBACK` integral** da transação.
- Nenhuma reserva é gravada, a cota semanal do usuário permanece intacta e o espaço permanece inalterado.
- Uma mensagem de erro clara, explicativa e contextualizada é exibida ao usuário.

---

## 7. Parâmetros de Entrada e Validações de Domínio

| Campo | Tipo | Obrigatório? | Regra de Negócio / Validação |
|---|---|:---:|---|
| **ID do Espaço (`espaco_id`)** | `UUID` | **Sim** | Identificador do espaço físico; deve estar ativo (`RN-12`). |
| **Data da Reserva (`data_reserva`)** | `Date` | **Sim** | Deve ser maior ou igual à data atual (`data >= hoje`) e dentro da janela de antecedência máxima permitida. |
| **Horário Inicial (`horario_inicio`)** | `Time` | **Sim** | Horário de início do uso (deve coincidir com slot válido, ex.: 14:00). |
| **Horário Final (`horario_fim`)** | `Time` | **Sim** | Horário de término do uso (deve ser posterior ao horário inicial). |
| **Duração Solicitada** | `Interval` | **Calculado** | Diferença entre fim e início. Deve respeitar o limite mínimo de 1 hora e máximo de 3 horas por reserva individual (`RN-08`). |
| **Quantidade de Participantes** | `Integer` | **Sim** | Quantidade estimada de pessoas (`>= 1`). Não pode exceder a capacidade máxima do espaço (`RN-09`). |
| **Finalidade / Justificativa** | `String` | **Sim** | Descrição suscinta do objetivo (ex.: *"Estudo do grupo de Engenharia de Software II"*). Mínimo 10 caracteres. |
| **Grupo de Pesquisa (`grupo_id`)** | `UUID` | Não | Obrigatório se o tipo de reserva for institucional de pesquisa (`HU-13`). |

---

## 8. Fluxo Principal (Cenário de Sucesso / *Happy Path*)

| Passo | Ator (Usuário) | Sistema (UNISpace) |
|:---:|---|---|
| **1** | Acessa a opção de reserva de um espaço selecionado (diretamente do catálogo ou vindo do slot livre de **CU-02**). | — |
| **2** | — | Verifica se o usuário possui sessão ativa; valida o e-mail institucional (`RN-02`) e resgata o saldo da sua cota semanal (`RN-03`). |
| **3** | — | Apresenta o formulário de reserva pré-preenchido com o espaço e os horários escolhidos, exibindo o saldo de cota disponível e a capacidade do ambiente. |
| **4** | Confirma a data, ajusta a duração (entre 1h e 3h), informa a quantidade de participantes e descreve a finalidade acadêmica da reserva. | — |
| **5** | Clica no botão **"Confirmar Reserva"**. | — |
| **6** | — | O frontend valida localmente os campos obrigatórios e submete requisição `POST /api/v1/reservas` com payload estruturado em JSON. |
| **7** | — | **Abertura da Transação ACID:** O backend inicia a transação com nível de isolamento adequado (`SERIALIZABLE` ou *Pessimistic Lock*). |
| **8** | — | **Pipeline de Validação Transacional Core:** <br>a) Aplica trava pessimista no espaço físico (`SELECT ... FOR UPDATE`). <br>b) **RN-12:** Verifica se o espaço continua com status ativo. <br>c) **RN-08:** Valida se a duração está no intervalo de 1h a 3h. <br>d) **RN-09:** Valida se a quantidade de participantes não excede a capacidade do local. <br>e) **RN-06:** Valida a ausência de bloqueios administrativos vigentes no período. <br>f) **RN-01 & RN-10:** Valida se nenhuma reserva confirmada foi gravada para aquele espaço e intervalo. <br>g) **RN-03:** Verifica se o usuário possui saldo suficiente em sua cota semanal. <br>h) **RN-04:** Valida se o curso/departamento do usuário possui prioridade na janela atual. |
| **9** | — | **Persistência Atômica:** Grava a nova reserva com status `CONFIRMADA`, gera o código alfanumérico único da reserva e debita as horas da cota do usuário. |
| **10** | — | **Registro de Auditoria (RN-13):** Insere registro na tabela de auditoria contendo `usuario_id`, `reserva_id`, timestamp UTC, endereço IP e ação `CRIACAO_RESERVA`. |
| **11** | — | **Efetivação (`COMMIT`):** A transação é confirmada e comitada no banco de dados; a trava do registro é liberada. |
| **12** | — | **Notificação Assíncrona (UC8):** Publica evento na fila de mensageria para envio de e-mail de confirmação (`HU-11`). |
| **13** | — | Retorna resposta HTTP 201 Created com os dados completos e o comprovante da reserva. |
| **14** | Visualiza a mensagem de sucesso e o comprovante na tela, podendo baixar o comprovante ou retornar ao painel principal. | — |

---

## 9. Fluxos Alternativos

### FA01 — Reserva Iniciada Diretamente a Partir da Consulta de Disponibilidade (CU-02 / T5)
- **Condição:** No passo 1, o usuário clica sobre um slot verde no calendário de disponibilidade do CU-02.
- **Fluxo:**
  1. O sistema transfere os parâmetros `espaco_id`, `data_reserva`, `horario_inicio` e `horario_fim` diretamente para o formulário de reserva.
  2. O sistema calcula a duração correspondente e valida se respeita `RN-08`.
  3. O formulário é apresentado ao usuário no passo 3 com os campos de horário bloqueados para edição direta, agilizando o preenchimento.
  4. O caso de uso segue a partir do passo 4 do fluxo principal.

### FA02 — Reserva Vinculada a Grupo de Pesquisa ou Extensão (HU-13)
- **Condição:** O usuário autenticado é um docente ou líder de grupo de pesquisa cadastrado.
- **Fluxo:**
  1. No passo 4, o usuário marca a opção *"Reserva para Grupo de Pesquisa"* e seleciona o grupo cadastrado no sistema.
  2. O sistema verifica a regularidade do grupo e associa a reserva ao projeto/grupo.
  3. O limite de cota semanal aplicado utiliza o banco de horas institucional do grupo de pesquisa em vez da cota individual do aluno.
  4. O caso de uso segue a partir do passo 5 do fluxo principal.

### FA03 — Reserva com Prioridade Rotativa Específica de Curso (HU-08 / RN-04)
- **Condição:** O usuário pertence a um curso que possui a prioridade rotativa do ciclo atual para auditórios ou laboratórios específicos.
- **Fluxo:**
  1. No passo 8, o motor de equidade reconhece que o curso do solicitante possui privilégio na rodada vigente.
  2. O sistema concede acesso prioritário de reserva com janela de antecedência estendida (ex.: até 21 dias em vez de 14 dias).
  3. O caso de uso segue normalmente até a confirmação no passo 14.

---

## 10. Fluxos de Exceção

### FE01 — Usuário Não Autenticado ou Credencial Não Institucional (RN-02 / UC1)
- **Condição:** No passo 2, a requisição não apresenta token de sessão válido ou o e-mail não pertence ao domínio universitário oficial (`@universidade.br` / `@unitru.edu.pe`).
- **Tratamento:**
  1. O sistema bloqueia imediatamente a operação e retorna HTTP 401 Unauthorized.
  2. Redireciona o usuário para a tela de autenticação com a mensagem: *"A realização de reservas é restrita a membros da universidade com e-mail institucional."*
  3. O caso de uso é encerrado sem modificações.

### FE02 — Cota Semanal de Reserva Esgotada (RN-03 / HU-07)
- **Condição:** No passo 8, a soma das horas já reservadas pelo usuário na semana corrente mais a duração da nova reserva excede o teto estabelecido pela regra de cota.
- **Tratamento:**
  1. O backend rejeita a reserva e executa `ROLLBACK`.
  2. Retorna HTTP 422 Unprocessable Entity com a mensagem: *"Limite semanal de horas excedido. Você possui X horas disponíveis esta semana, mas a reserva solicitada exige Y horas."*
  3. Sugere ao usuário cancelar uma reserva futura existente ou solicitar reserva em nome de seu grupo/orientador.
  4. O caso de uso é encerrado.

### FE03 — Conflito por Concorrência Simultânea — *Race Condition* (RN-01 & RN-10 / HU-04)
- **Condição:** No passo 8, durante a execução da transação, o sistema detecta que outro usuário acabou de confirmar e comitar uma reserva para o mesmo espaço e horário milissegundos antes.
- **Tratamento:**
  1. O backend identifica a violação de integridade única ou sobreposição temporal.
  2. Executa `ROLLBACK` imediato da transação do segundo solicitante.
  3. Retorna HTTP 409 Conflict com a mensagem clara: *"O horário selecionado acabou de ser reservado por outro usuário. Nenhuma cobrança de cota foi efetuada."*
  4. O sistema consulta automaticamente a agenda e apresenta os 3 horários livres mais próximos daquele mesmo espaço.
  5. O usuário pode selecionar um horário sugerido ou retornar à consulta.

### FE04 — Conflito com Bloqueio Administrativo / Manutenção (RN-06 / HU-09)
- **Condição:** No passo 8, o espaço foi bloqueado emergencialmente por um administrador (para manutenção predial ou evento institucional) que sobrepõe o horário pretendido.
- **Tratamento:**
  1. O sistema detecta o registro na tabela de bloqueios com prioridade soberana (`RN-06`).
  2. Executa `ROLLBACK` da transação.
  3. Retorna HTTP 409 Conflict informando o motivo oficial do bloqueio cadastrado pela administração.
  4. O caso de uso é encerrado.

### FE05 — Duração Inválida (RN-08)
- **Condição:** No passo 8, a duração solicitada é inferior a 1 hora ou superior a 3 horas contínuas.
- **Tratamento:**
  1. O sistema barra a operação antes da gravação.
  2. Exibe mensagem de erro: *"A duração da reserva deve ser de no mínimo 1 hora e no máximo 3 horas."*
  3. Retorna o formulário no passo 4 para ajuste da duração.

### FE06 — Quantidade de Participantes Excede a Capacidade Máxima (RN-09)
- **Condição:** No passo 8, a quantidade de participantes informada ultrapassa o limite físico homologado para o espaço.
- **Tratamento:**
  1. O sistema barra a solicitação com a mensagem: *"A capacidade máxima deste espaço é de X pessoas. O número informado (Y) excede a lotação permitida."*
  2. O sistema sugere espaços de maior porte compatíveis com a quantidade necessária.
  3. O caso de uso é encerrado.

### FE07 — Falha Crítica de Conexão ou Erro de Banco de Dados
- **Condição:** Durante o passo 9 ou 10, ocorre perda de conexão com o banco ou falha de disco.
- **Tratamento:**
  1. O bloco transacional aciona a rotina `EXCEPTION` e emite `ROLLBACK` forçado.
  2. O erro é gravado no log de erros do servidor para atuação da equipe de DevOps.
  3. O frontend recebe HTTP 500 Internal Server Error e orienta o usuário: *"Ocorreu um erro interno ao processar sua reserva. Nenhuma alteração foi realizada. Por favor, tente novamente."*

---

## 11. Especificação Técnica de Backend e Transação ACID (Domínio: Lógica Transacional Core)

### 11.1. Garantia de Atomicidade e Isolamento Concorrente
Para evitar o problema clássico de condição de corrida (*race condition*) onde duas reservas poderiam ser aprovadas para o mesmo slot simultaneamente (`RN-10`), a camada de serviço do UNISpace deve utilizar **transações atômicas com bloqueio pessimista ou restrição de exclusão PostgreSQL/SQL (`EXCLUDE USING gist`)**:

```sql
-- Início da Transação Atômica Core
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 1. Bloqueia o registro do espaço para garantir serialização atômica de reservas neste espaço
SELECT id, ativo, capacidade 
FROM espacos 
WHERE id = :espaco_id AND ativo = TRUE 
FOR UPDATE;

-- 2. Valida ausência estrita de sobreposição de reservas confirmadas (RN-01, RN-10)
SELECT COUNT(*) INTO v_conflitos_reserva
FROM reservas
WHERE espaco_id = :espaco_id
  AND data = :data_reserva
  AND status = 'CONFIRMADA'
  AND horario_inicio < :horario_fim
  AND horario_fim > :horario_inicio;

IF v_conflitos_reserva > 0 THEN
    ROLLBACK;
    RAISE EXCEPTION 'CONFLITO_HORARIO_RESERVA';
END IF;

-- 3. Valida ausência de bloqueios administrativos ou manutenção (RN-06)
SELECT COUNT(*) INTO v_conflitos_bloqueio
FROM bloqueios
WHERE espaco_id = :espaco_id
  AND status = 'ATIVO'
  AND data_inicio <= :data_reserva
  AND data_fim >= :data_reserva
  AND horario_inicio < :horario_fim
  AND horario_fim > :horario_inicio;

IF v_conflitos_bloqueio > 0 THEN
    ROLLBACK;
    RAISE EXCEPTION 'ESPACO_BLOQUEADO_ADMIN';
END IF;

-- 4. Valida saldo da cota semanal do usuário (RN-03)
SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (horario_fim - horario_inicio))/3600), 0) INTO v_horas_usadas
FROM reservas
WHERE usuario_id = :usuario_id
  AND status = 'CONFIRMADA'
  AND data >= :inicio_semana
  AND data <= :fim_semana;

IF (v_horas_usadas + :duracao_horas) > :cota_maxima_semanal THEN
    ROLLBACK;
    RAISE EXCEPTION 'COTA_SEMANAL_EXCEDIDA';
END IF;

-- 5. Insere a nova reserva com status CONFIRMADA
INSERT INTO reservas (
    id, espaco_id, usuario_id, data, horario_inicio, horario_fim,
    numero_participantes, finalidade, status, codigo_confirmacao, criado_em
) VALUES (
    gen_random_uuid(), :espaco_id, :usuario_id, :data_reserva, :horario_inicio, :horario_fim,
    :numero_participantes, :finalidade, 'CONFIRMADA', :codigo_gerado, NOW()
) RETURNING id INTO v_nova_reserva_id;

-- 6. Grava registro na trilha de auditoria imutável (RN-13)
INSERT INTO auditoria_reservas (
    id, reserva_id, usuario_id, acao, ip_solicitante, data_hora
) VALUES (
    gen_random_uuid(), v_nova_reserva_id, :usuario_id, 'CRIACAO_RESERVA', :ip_cliente, NOW()
);

-- 7. Efetivação definitiva de todas as operações
COMMIT;
```

---

## 12. Critérios de Aceitação da Tarefa (Definição de Pronto)

- [x] O documento abrange todos os elementos formais do Sprint 2 (identificação, atores, fluxo principal, fluxos alternativos, fluxos de exceção, pré e pós-condições).
- [x] Rastreabilidade formal estabelecida com `casos-de-uso.puml` (`UC3`, `UC1`, `UC6`, `UC7`, `UC8`), `historias-usuario-alta.md` (`HU-01`, `HU-03`, `HU-04`), `historias-usuario-media-baixa.md` (`HU-07`, `HU-08`, `HU-11`, `HU-13`) e `regras-de-negocio.md` (`RN-01` a `RN-13`).
- [x] Modelagem do núcleo de consistência atômica (ACID), controle de concorrência com travas (`FOR UPDATE`) e auditoria detalhados para o domínio de Lógica Transacional Core.
- [x] Revisão programada para o Integrante 4 (I4) conforme a rotação oficial de Pull Requests do projeto.
