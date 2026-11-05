# Histórias de usuário: prioridade ALTA (T2)

**Atores:** Estudante, Docente, Administrador.

## HU-01: Entrar no sistema
Como **usuário**, quero entrar no sistema com meu e-mail institucional e senha, para acessar minhas reservas.

Critérios de aceitação:
- O sistema aceita apenas e-mails institucionais.
- Se a senha estiver errada, mostra uma mensagem de erro.
- Depois de entrar, o usuário vê a agenda.

## HU-02: Ver a disponibilidade dos espaços
Como **estudante**, quero ver quais espaços estão livres em cada horário, para escolher onde estudar.

Critérios de aceitação:
- A agenda mostra salas, laboratórios, auditórios e áreas esportivas.
- É possível filtrar por tipo de espaço, dia e horário.
- Horários ocupados aparecem como indisponíveis.

## HU-03: Reservar um espaço
Como **estudante**, quero reservar um espaço em um horário livre, para evitar conflitos com outros grupos.

Critérios de aceitação:
- Só é possível reservar horários livres.
- O sistema mostra uma confirmação depois da reserva.
- A reserva aparece na minha lista de reservas.

## HU-04: Evitar reservas no mesmo horário
Como **usuário**, quero que o sistema não aceite duas reservas no mesmo espaço e horário, para não haver conflitos.

Critérios de aceitação:
- Se duas pessoas pedem o mesmo horário ao mesmo tempo, só a primeira é confirmada.
- A segunda pessoa recebe uma mensagem clara de horário ocupado.

## HU-05: Cancelar uma reserva
Como **usuário**, quero cancelar minha reserva, para liberar o espaço quando eu não puder usá-lo.

Critérios de aceitação:
- Só o dono da reserva pode cancelá-la.
- Depois de cancelar, o horário volta a ficar livre.
- O cancelamento só é permitido dentro do prazo definido nas regras de negócio.

## HU-06: Cadastrar espaços
Como **administrador**, quero cadastrar e editar os espaços da universidade, para manter a agenda atualizada.

Critérios de aceitação:
- Cada espaço tem nome, tipo, capacidade e localização.
- Posso desativar um espaço sem apagar o histórico.
