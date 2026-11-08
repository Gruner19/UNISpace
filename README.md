# UNISpace

Plataforma web que centraliza a reserva dos espaços compartilhados da universidade, evitando conflitos de horário e garantindo o uso equitativo entre estudantes de todos os cursos e faculdades.

---

## Ideia geral do projeto

Hoje a reserva de salas de estudo, laboratórios, auditórios e áreas esportivas é controlada de forma informal (papel, planilhas e mensagens), o que gera conflitos de horário, falta de visibilidade da disponibilidade, uso concentrado em poucos cursos e nenhum histórico das reservas.

O **UNISpace** é a ideia de uma plataforma única, acessível pela web, onde qualquer membro da comunidade universitária consulta a disponibilidade dos espaços e faz uma reserva em poucos passos. O sistema mantém **uma única agenda por espaço**, valida automaticamente cada pedido (impedindo sobreposições) e aplica **regras de equidade** — cotas de uso e prioridade rotativa — para distribuir os espaços entre todos os cursos e faculdades.

- **Objetivo geral:** centralizar a gestão e a reserva dos espaços compartilhados da universidade, eliminando conflitos de horário e promovendo o uso equitativo desses recursos.
- **Público-alvo:** estudantes, docentes, grupos de pesquisa, centros acadêmicos, times esportivos, responsáveis pelos espaços e a gestão administrativa da universidade.

---

## Estrutura do repositório

```
UNISpace/
├── .github/
│   ├── ISSUE_TEMPLATE/subissue-codigo.md
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── arquitetura/
│   │   └── adr-001-stack.md      # decisão de stack (P0.1)
│   ├── casos-de-uso/             # especificações dos casos de uso
│   ├── diagramas/                # casos de uso, classes e sequência
│   ├── img/                      # imagens e protótipos das telas
│   ├── requisitos/               # histórias de usuário, regras de negócio e glossário
│   ├── testes/
│   │   └── plano-aceitacao.md    # plano de aceitação (P3.1)
│   ├── interfaces.md             # especificação das telas
│   └── planejamento-sprints.md   # calendário, papéis e backlog
├── src/
│   ├── backend/                  # Node.js + Express
│   │   ├── src/
│   │   │   ├── config/           # configuração (env, db, server)
│   │   │   ├── controllers/      # camada HTTP
│   │   │   ├── routes/           # definição de endpoints
│   │   │   ├── services/         # regras de negócio
│   │   │   ├── repositories/     # acesso a dados
│   │   │   ├── middlewares/      # auth, validação, erros
│   │   │   ├── models/           # modelos/entidades
│   │   │   ├── validators/       # validação de entrada
│   │   │   └── utils/            # funções auxiliares
│   │   ├── tests/                # testes do backend
│   │   └── .env.example
│   ├── frontend/                 # React + Vite
│   │   ├── public/
│   │   └── src/
│   │       ├── assets/           # imagens, ícones e fontes
│   │       ├── components/       # componentes reutilizáveis (common/ e layout/)
│   │       ├── features/         # módulos de domínio (auth, spaces, reservations, admin)
│   │       ├── hooks/            # hooks personalizados
│   │       ├── services/         # chamadas à API
│   │       ├── context/          # estado global (Context API)
│   │       ├── pages/            # páginas/rotas
│   │       ├── routes/           # configuração de rotas
│   │       ├── styles/           # estilos globais
│   │       └── utils/            # funções auxiliares
│   └── database/                 # modelo, migrações e scripts do banco
│       ├── modelo/               # schema do banco (Prisma)
│       ├── migracoes/            # migrações versionadas
│       └── scripts/              # seeds e scripts auxiliares
├── .editorconfig
├── .gitignore
├── README.md
└── CONTRIBUTING.md
```

## Como executar

### Estado atual

- **Backend (T6.1/T6.2):** API HTTP em Node.js com repositório em memória e transação atômica anti-conflito.
- **Frontend:** estrutura criada, ainda sem código ou `package.json`.
- **Banco:** migração PostgreSQL em `src/database/migracoes/`; necessária apenas para validar a T6.1 no banco, não para o modo local em memória.

### Pré-requisitos

- Node.js >= 18 (testado com Node 26).

### Backend

```bash
cd src/backend
npm test
npm start
```

O código atual não usa dependências externas; `npm install` só é necessário se novas bibliotecas forem adicionadas.

Opcionalmente, crie o `.env` a partir do exemplo:

```bash
copy .env.example .env   # Windows
cp .env.example .env     # Linux/macOS
```

No estado atual, apenas `HOST` e `PORT` são usados; `DATABASE_URL`, JWT e CORS ficam reservados para as próximas sub-issues.

### Verificar a API

```bash
curl http://localhost:3000/health
```

### Criar uma reserva de teste

```bash
curl -X POST http://localhost:3000/api/v1/reservas \
  -H "Content-Type: application/json" \
  -H "x-usuario-id: user-demo-1" \
  -H "x-usuario-email: demo@aluno.ufop.edu.br" \
  -d "{\"espacoId\":\"espaco-lab-01\",\"data\":\"2026-12-01\",\"horarioInicio\":\"14:00\",\"horarioFim\":\"16:00\",\"numeroParticipantes\":15,\"finalidade\":\"Estudo em grupo de ESII\"}"
```

Espaços do seed: `espaco-lab-01`, `espaco-sala-01`, `espaco-aud-01`, `espaco-quadra-01`.

### Banco de dados (opcional, requer PostgreSQL 15+)

```bash
psql "$DATABASE_URL" -f src/database/migracoes/001_t6_1_restricao_anti_sobreposicao_e_auditoria.sql
psql "$DATABASE_URL" -f src/database/scripts/testar_concorrencia_e_sobreposicao.sql
```

## Fluxo de trabalho

1. Cada tarefa do Kanban é feita em uma branch própria: `feature/<nome-da-tarefa>`.
2. Nunca se faz commit direto em `main`.
3. Ao terminar, abre-se um Pull Request e o revisor designado o revisa e aprova.
4. Só depois da aprovação é feito o merge.
5. Mensagens de commit curtas e claras, por exemplo: `docs: adiciona histórias de usuário de prioridade alta`.

## Descrição geral do sistema

O sistema é uma **aplicação web cliente-servidor**: o frontend oferece a agenda e os painéis de gestão, o backend concentra as regras de negócio (validação anti-conflito, cotas e autenticação) e o banco de dados armazena usuários, espaços, reservas, bloqueios e auditoria. O ponto crítico é a **consistência da agenda**: validar e gravar a reserva de forma atômica, para que duas solicitações simultâneas do mesmo horário nunca sejam ambas confirmadas.

---

## Link para o quadro Kanban

- [https://github.com/users/Gruner19/projects/3/views/1](https://github.com/users/Gruner19/projects/3/views/1)

---

## Integrantes del Grupo

- César Eduardo Paredes Torres
- Jordan Rivaldo Correa García
- Tommy Rodriguez Zavaleta
- Grunner Sánchez Morales
- Fabricio Rodriguez Benitez
- Ryan Alessandro Lazaro Urtecho
