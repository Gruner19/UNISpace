# Telas — UNISpace

Plataforma web para gestão e reserva centralizada e equitativa dos espaços compartilhados da universidade.

---

## Relação Geral de Telas do Sistema

| Tela | Histórias Atendidas | Sprint | Status |
|---|---|:---:|:---:|
| **T01 — Autenticação Institucional (Login)** | HU-01 | 1 | prevista |
| **T02 — Consulta de Disponibilidade e Catálogo de Espaços** | HU-02, HU-08 | 2 | prevista |
| **T03 — Detalhe do Espaço e Agenda Semanal** | HU-02, HU-09 | 2 | prevista |
| **T04 — Formulário de Realização de Reserva** | HU-03, HU-04, HU-07, HU-13 | 2 | prevista |
| **T05 — Minhas Reservas e Histórico** | HU-03, HU-05, HU-10 | 2 | prevista |
| **T06 — Gestão e Cadastro de Espaços (Administração)** | HU-06 | 3 | prevista |
| **T07 — Bloqueio Administrativo de Espaço** | HU-09 | 3 | prevista |
| **T08 — Relatórios Gerenciais de Ocupação e Uso** | HU-12 | 4 | prevista |

---

## T01 — Autenticação Institucional (Login)
*Histórias:* HU-01 · *Sprint:* 1

Tela de acesso inicial do sistema. Apresenta o logotipo do UNISpace, campos para inserção do e-mail institucional (`@universidade.br` ou `@unitru.edu.pe`) e senha, botão "Entrar no Sistema", opção "Lembrar meu acesso" e link "Esqueci minha senha". 

Possui validação visual em tempo real do formato do e-mail institucional e exibição de alertas de erro caso as credenciais sejam inválidas. Ao autenticar com sucesso, o usuário é direcionado para a tela principal de consulta e catálogo (**T02**).

<!-- Adicionar na entrega da Sprint 1 -->
![Print da tela de autenticação institucional](img/t01-login.png)

---

## T02 — Consulta de Disponibilidade e Catálogo de Espaços
*Histórias:* HU-02, HU-08 · *Sprint:* 2

Tela principal após o login. Apresenta a **Agenda Única** do dia selecionado e um painel superior de filtros com: seletor de data, turno (manhã, tarde, noite, integral), tipo de espaço (sala de estudo, laboratório, auditório, quadra esportiva), capacidade mínima de pessoas e comodidades (projetor, tomadas, ar-condicionado, acessibilidade).

Abaixo dos filtros, exibe uma grade de cards dos espaços correspondentes, acompanhados de uma régua visual de slots horários codificados por cores: **Verde** (Livre/Disponível), **Vermelho** (Ocupado por reserva confirmada) e **Cinza** (Bloqueado para manutenção ou evento). Se o usuário autenticado possuir prioridade rotativa ativa pelo seu curso/faculdade (HU-08), um distintivo de destaque é exibido no topo. Clicar em um card expande a tela **T03**, e clicar diretamente em um slot verde inicia a reserva na tela **T04**.

<!-- Adicionar na entrega da Sprint 2 -->
![Print da tela de consulta de disponibilidade](img/t02-consulta-disponibilidade.png)

---

## T03 — Detalhe do Espaço e Agenda Semanal
*Histórias:* HU-02, HU-09 · *Sprint:* 2

Apresenta a ficha técnica completa do espaço físico selecionado: galeria de fotos, capacidade nominal de assentos, localização precisa no campus (prédio/bloco/andar), relação de equipamentos disponíveis e regras internas de utilização.

Abaixo das especificações técnicas, exibe o calendário semanal de ocupação (segunda a sábado), permitindo navegar entre semanas para identificar janelas recorrentes livres. Caso haja bloqueio de manutenção ou intervenção técnica agendada pelo administrador (HU-09), exibe um aviso em banner amarelo detalhando a justificativa e o período de interdição. Botão "Reservar este Espaço" redireciona para a tela **T04**.

<!-- Adicionar na entrega da Sprint 2 -->
![Print da tela de detalhes do espaço e agenda semanal](img/t03-detalhe-espaco.png)

---

## T04 — Formulário de Realização de Reserva
*Histórias:* HU-03, HU-04, HU-07, HU-13 · *Sprint:* 2

Interface transacional onde o usuário formaliza sua solicitação de reserva. Exibe um resumo do espaço selecionado e campos pré-preenchidos com a data e horários escolhidos na tela anterior.

Contém os seguintes elementos:
* Seletor de duração da reserva (mínimo de 1h e máximo de 3h, conforme regras de negócio).
* Campo numérico de quantidade de participantes (com validação automática que impede valor superior à capacidade física do espaço).
* Campo de texto obrigatório para descrição da finalidade acadêmica da reserva.
* Caixa de seleção "Reserva para Grupo de Pesquisa ou Projeto de Extensão" que abre menu suspenso para vinculação do projeto cadastrado (HU-13).
* Painel lateral dinâmico que exibe a **cota semanal de horas do usuário** (HU-07), mostrando o saldo restante e o impacto da reserva atual.
* Botão primário "Confirmar Reserva" e botão "Cancelar".

Ao submeter, o sistema processa a transação atômica anti-conflito (HU-04); havendo sucesso, redireciona o usuário para a tela **T05**. Se houver concorrência simultânea, exibe alerta modal indicando a ocupação do slot e sugere horários próximos livres.

<!-- Adicionar na entrega da Sprint 2 -->
![Print da tela de realização de reserva](img/t04-formulario-reserva.png)

---

## T05 — Minhas Reservas e Histórico
*Histórias:* HU-03, HU-05, HU-10 · *Sprint:* 2

Painel de controle do usuário autenticado para acompanhamento de suas reservas. É estruturado em duas abas:
1. **Reservas Ativas / Futuras:** Exibe cards com as reservas confirmadas, indicando espaço, data, faixa de horário, código alfanumérico de confirmação (token de validação) e botão de ação "Cancelar Reserva".
   * Ao clicar em "Cancelar Reserva", abre modal de confirmação explicando a liberação do espaço e a devolução das horas à cota semanal (HU-05).
2. **Histórico de Uso:** Tabela cronológica listando todas as reservas passadas com seus status finais (`Concluída`, `Cancelada pelo Usuário`, `Cancelada por Bloqueio Administrativo`), data, duração e finalidade registrada (HU-10).

Possui botão para baixar o comprovante oficial da reserva em formato PDF imprimível.

<!-- Adicionar na entrega da Sprint 2 -->
![Print da tela de minhas reservas e histórico](img/t05-minhas-reservas.png)

---

## T06 — Gestão e Cadastro de Espaços (Administração)
*Histórias:* HU-06 · *Sprint:* 3

Painel exclusivo com controle de acesso para usuários com perfil de Administrador do campus. Apresenta uma tabela paginada com todos os espaços da universidade, exibindo código, nome, tipo, capacidade, prédio e status (`Ativo` ou `Inativo`).

Permite:
* Cadastrar novo espaço através de botão "Novo Espaço", abrindo formulário para preenchimento de nome, tipo, localização, capacidade máxima e marcação dos recursos disponíveis.
* Editar os dados cadastrais de um espaço existente.
* Alternar o status do espaço para inativo, impedindo novas reservas sem remover o histórico de reservas anteriores (preservação de integridade).

<!-- Adicionar na entrega da Sprint 3 -->
![Print da tela de gestão de espaços](img/t06-gestao-espacos.png)

---

## T07 — Bloqueio Administrativo de Espaço
*Histórias:* HU-09 · *Sprint:* 3

Interface administrativa dedicada à interdição de espaços para serviços de manutenção preventiva/corretiva, reformas, dedetização ou eventos institucionais oficiais.

Apresenta:
* Seletor de espaço físico a ser bloqueado.
* Seletores de data inicial, data final, horário de início e término.
* Campo de preenchimento obrigatório para justificativa técnica/motivo do bloqueio.
* Tabela de impacto em tempo real: exibe imediatamente as reservas já confirmadas que coincidem com o período do bloqueio pretendido.
* Opção de confirmação que, ao aplicar o bloqueio soberano, cancela automaticamente as reservas conflitantes e dispara e-mail notificando os usuários afetados com a justificativa do cancelamento.

<!-- Adicionar na entrega da Sprint 3 -->
![Print da tela de bloqueio administrativo](img/t07-bloqueio-espaco.png)

---

## T08 — Relatórios Gerenciais de Ocupação e Uso
*Histórias:* HU-12 · *Sprint:* 4

Painel analítico e gerencial voltado à reitoria e coordenações de espaço para avaliação da eficiência no uso do patrimônio universitário.

Disponibiliza:
* Seletor de período temporal (mensal, semestral ou personalizado).
* Filtros por centro de custo, faculdade e tipo de espaço.
* Gráfico de linhas com taxa de ocupação diária e horários de pico de utilização.
* Gráfico de barras demonstrando a distribuição equitativa de uso entre os diferentes cursos e faculdades da universidade.
* Ranking dos espaços com maior demanda e espaços subutilizados.
* Botão para exportação completa da base de dados filtrada nos formatos CSV e PDF.

<!-- Adicionar na entrega da Sprint 4 -->
![Print da tela de relatórios gerenciais](img/t08-relatorios-uso.png)
