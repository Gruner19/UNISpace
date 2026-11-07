# Guia de contribuição

## Branches

- `main`: versão estável, não se edita diretamente.
- `feature/<tarefa>`: uma branch por tarefa (ex.: `feature/t2-historias-alta`).

## Commits

Formato: `tipo: descrição curta`
Tipos: `docs`, `feat`, `fix`, `chore`.

## Pull Requests

- Título claro, com o código da tarefa (ex.: "T1: estrutura do repositório").
- Preencher o template `.github/PULL_REQUEST_TEMPLATE.md`.
- Marcar o revisor designado na planilha do sprint.
- O revisor aprova antes do merge.

## Issues

- Use o template `.github/ISSUE_TEMPLATE/subissue-codigo.md` para tarefas de código.
- Toda issue deve referenciar a história de usuário, caso de uso ou regra de negócio relacionada.

## Documentação

- Requisitos: `docs/requisitos/`
- Casos de uso: `docs/casos-de-uso/`
- Diagramas: `docs/diagramas/`
- Arquitetura e decisões: `docs/arquitetura/`
- Testes e aceitação: `docs/testes/`
- Telas: `docs/interfaces.md`
- Planejamento: `docs/planejamento-sprints.md`

## Revisão

O executor da tarefa não faz o merge do próprio PR.
