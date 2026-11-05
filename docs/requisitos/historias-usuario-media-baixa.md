# Histórias de usuário: prioridade MÉDIA e BAIXA (T3)

**Atores:** Estudante, Docente, Grupo de pesquisa, Administrador.

## Prioridade MÉDIA

### HU-07: Cota de uso por usuário
Como **administrador**, quero definir uma cota de horas por semana para cada usuário, para distribuir os espaços de forma justa.

Critérios de aceitação:
- O sistema bloqueia reservas quando a cota acaba.
- O usuário pode ver quantas horas ainda tem.

### HU-08: Prioridade rotativa
Como **estudante**, quero que a prioridade de reserva mude entre cursos e faculdades, para que todos tenham as mesmas chances.

Critérios de aceitação:
- A prioridade muda a cada período definido.
- O sistema mostra qual grupo tem prioridade.

### HU-09: Bloquear espaços
Como **administrador**, quero bloquear um espaço por manutenção ou evento, para que ninguém reserve nesse período.

Critérios de aceitação:
- O bloqueio tem data de início, data de fim e motivo.
- O bloqueio tem prioridade sobre qualquer reserva.
- Os usuários afetados são avisados.

### HU-10: Histórico de reservas
Como **usuário**, quero ver meu histórico de reservas, para acompanhar o que já usei.

Critérios de aceitação:
- O histórico mostra data, espaço, horário e estado (usada ou cancelada).

## Prioridade BAIXA

### HU-11: Notificações
Como **usuário**, quero receber um aviso antes da minha reserva, para não esquecer.

Critérios de aceitação:
- O aviso é enviado por e-mail.
- O usuário pode ativar ou desativar os avisos.

### HU-12: Relatórios de uso
Como **administrador**, quero ver relatórios de uso dos espaços, para entender quais são mais usados.

Critérios de aceitação:
- O relatório mostra uso por espaço, curso e faculdade.
- Posso escolher o período.

### HU-13: Reservas para grupos de pesquisa
Como **docente**, quero reservar um espaço para meu grupo de pesquisa, para fazer reuniões e atividades.

Critérios de aceitação:
- A reserva indica o grupo e o número de participantes.
- O sistema valida a capacidade do espaço.
