# Orion

Orion é uma plataforma web interna planejada para um escritório contábil brasileiro.

O objetivo é criar uma central própria para comunicação interna, usuários, setores, empresas, mensagens, grupos, notificações, permissões, auditoria e dashboard operacional.

## Situação atual

O projeto está em construção e foi reiniciado do zero.

Status atual:

- fase atual: Fundação;
- documentação inicial criada;
- nenhuma aplicação implementada;
- nenhuma dependência instalada;
- nenhuma integração implementada.

## Visão do produto

O Orion será uma camada interna de organização e comunicação do escritório. Ele não substitui Alterdata, Acessórias, e-CAC, sistemas da Receita Federal, sistemas oficiais ou provedores de e-mail.

Esses sistemas poderão ser integrados no futuro, quando houver análise técnica, autorização e desenho seguro.

## Módulos planejados

- Orion Core;
- autenticação;
- usuários;
- setores;
- empresas;
- permissões;
- dashboard;
- auditoria;
- chat e comunicação em tempo real;
- notificações;
- tarefas e workflow;
- integrações futuras;
- RAG local;
- IA local ou provider externo autorizado.

## Stack planejada

Frontend:

- Next.js;
- React;
- TypeScript;
- Tailwind CSS;
- Shadcn/UI.

Backend:

- NestJS;
- Node.js;
- TypeScript.

Dados e infraestrutura:

- PostgreSQL;
- Prisma;
- Socket.IO;
- Docker;
- Docker Compose.

## Documentação

Contexto e memória permanente:

- `.ai/PROJECT_CONTEXT.md`;
- `.ai/ARCHITECTURE.md`;
- `.ai/ROADMAP.md`;
- `.ai/DECISIONS.md`;
- `.ai/CODING_RULES.md`;
- `.ai/SECURITY.md`;
- `.ai/CURRENT_STATE.md`.

Documentação geral:

- `docs/overview.md`;
- `docs/roles-and-permissions.md`;
- `docs/glossary.md`.

## Avisos importantes

- Projeto em construção.
- Não usar dados reais.
- Não versionar senhas, tokens ou `.env`.
- Não armazenar documentos contábeis no repositório.
- Não afirmar que algo está implementado sem verificar o código.
