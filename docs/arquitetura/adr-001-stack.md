# ADR-001 — Stack tecnológica do UNISpace

- **Status:** Aceito
- **Data:** 2026-11-07
- **Responsável:** Equipe UNISpace
- **Tarefa:** P0.1

## Contexto

O UNISpace é uma aplicação web cliente-servidor que centraliza a reserva dos
espaços compartilhados da universidade. O sistema precisa de:

- autenticação de usuários com e-mail institucional e controle de perfis;
- consulta de disponibilidade com agenda única por espaço;
- validação atômica anti-conflito no momento da reserva;
- aplicação de cotas, prioridade rotativa e bloqueios administrativos;
- auditoria de reservas, cancelamentos e bloqueios.

A equipe precisa de uma stack produtiva, com boa documentação, tipagem e
ecossistema maduro para entregar o projeto dentro das sprints acadêmicas.

## Opções consideradas

1. **Frontend:** React + Vite, Vue + Vite ou Angular.
2. **Backend:** Node.js + Express, NestJS ou Spring Boot.
3. **Banco de dados:** PostgreSQL, MySQL ou SQLite.
4. **Acesso a dados:** Prisma ORM, TypeORM ou SQL puro.
5. **Autenticação:** JWT stateless ou sessões no servidor.

## Decisão

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | **React + Vite + JavaScript/TypeScript** | Ecossistema amplo, componentização por domínio e build rápido com Vite. |
| Backend | **Node.js + Express** | Curva de aprendizado baixa, estrutura simples de rotas/controllers/services e ampla documentação. |
| Banco de dados | **PostgreSQL** | Suporte a transações, restrições de integridade e índices adequados à consistência da agenda. |
| ORM | **Prisma** | Schema declarativo, migrações versionadas e tipagem gerada para o backend. |
| Autenticação | **JWT** | API stateless, simples de integrar ao frontend e adequada ao escopo do projeto. |
| Testes | **Jest/Supertest (backend) e Vitest (frontend)** | Ferramentas padrão dos ecossistemas Node/React, com baixo custo de configuração. |

## Consequências

### Positivas

- Uma única linguagem (JavaScript/TypeScript) no frontend e no backend.
- Prisma simplifica o modelo de dados, as migrações e a manutenção do schema.
- PostgreSQL permite implementar as validações de concorrência exigidas pela RN-01 e RN-10.
- Estrutura em camadas (`controllers`, `services`, `repositories`) facilita testes e evolução.

### Negativas / riscos

- A consistência das reservas exige transações e possivelmente restrições exclusivas no banco.
- A equipe precisa manter disciplina de tipagem e validação de entrada.
- Dependência do ecossistema Node e da disponibilidade do PostgreSQL no ambiente de execução.

## Alternativas descartadas

- **SQLite:** simples, porém inadequado para concorrência real e para o ambiente de produção previsto.
- **Spring Boot:** robusto, mas com maior custo de configuração e de aprendizagem para o prazo do projeto.
- **SQL puro:** maior controle, porém mais lento para evoluir o schema e as migrações.

## Referências

- [Documentação do React](https://react.dev/)
- [Documentação do Vite](https://vitejs.dev/)
- [Documentação do Express](https://expressjs.com/)
- [Documentação do Prisma](https://www.prisma.io/docs)
- [Documentação do PostgreSQL](https://www.postgresql.org/docs/)
