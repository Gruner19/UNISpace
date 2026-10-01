# UNISpace

Plataforma web que centraliza a reserva dos espaços compartilhados da universidade, evitando conflitos de horário e garantindo o uso equitativo entre estudantes de todos os cursos e faculdades.

---

## Ideia geral do projeto

Hoje a reserva de salas de estudo, laboratórios, auditórios e áreas esportivas é controlada de forma informal (papel, planilhas e mensagens), o que gera conflitos de horário, falta de visibilidade da disponibilidade, uso concentrado em poucos cursos e nenhum histórico das reservas.

O **UNISpace** é a ideia de uma plataforma única, acessível pela web, onde qualquer membro da comunidade universitária consulta a disponibilidade dos espaços e faz uma reserva em poucos passos. O sistema mantém **uma única agenda por espaço**, valida automaticamente cada pedido (impedindo sobreposições) e aplica **regras de equidade** — cotas de uso e prioridade rotativa — para distribuir os espaços entre todos os cursos e faculdades.

- **Objetivo geral:** centralizar a gestão e a reserva dos espaços compartilhados da universidade, eliminando conflitos de horário e promovendo o uso equitativo desses recursos.
- **Público-alvo:** estudantes, docentes, grupos de pesquisa, centros acadêmicos, times esportivos, responsáveis pelos espaços e a gestão administrativa da universidade.

---

## Descrição geral do sistema

O sistema é uma **aplicação web cliente-servidor**: o frontend oferece a agenda e os painéis de gestão, o backend concentra as regras de negócio (validação anti-conflito, cotas e autenticação) e o banco de dados armazena usuários, espaços, reservas, bloqueios e auditoria. O ponto crítico é a **consistência da agenda**: validar e gravar a reserva de forma atômica, para que duas solicitações simultâneas do mesmo horário nunca sejam ambas confirmadas.

## Link para o quadro Kanban

* <https://github.com/users/Gruner19/projects/3/views/1>

## Integrantes del Grupo

* César Eduardo Paredes Torres
* Jordan Rivaldo Correa García 
* Tommy Rodriguez Zavaleta
* Grunner Sánchez Morales
* Fabricio Rodriguez Benitez