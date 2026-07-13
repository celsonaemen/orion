# Orion

Orion é uma plataforma web interna planejada para um escritório contábil brasileiro.

O objetivo é criar uma central própria para comunicação interna, usuários, setores, empresas, mensagens, grupos, notificações, permissões, auditoria e dashboard operacional.

## Situação atual

O projeto está em construção, na Fase 0 - Fundação.

Estado atual:

- monorepo pnpm criado;
- frontend inicial criado em `apps/frontend`;
- backend inicial criado em `apps/backend`;
- pacote compartilhado criado em `packages/shared`;
- endpoint `GET /health` criado no backend;
- autenticação ainda não implementada;
- chat ainda não implementado;
- banco ainda não configurado;
- Docker ainda não configurado;
- integrações externas, IA e RAG ainda não implementados.

## Visão do produto

O Orion será uma camada interna de organização e comunicação do escritório. Ele não substitui Alterdata, Acessórias, e-CAC, sistemas da Receita Federal, sistemas oficiais ou provedores de e-mail.

Esses sistemas poderão ser integrados no futuro, quando houver análise técnica, autorização e desenho seguro.

## Estrutura do monorepo

```text
apps/
  frontend/
  backend/
packages/
  shared/
scripts/
docs/
.ai/
```

## Aplicações

### Frontend

Local: `apps/frontend`

Stack inicial:

- Next.js;
- React;
- TypeScript;
- Tailwind CSS;
- App Router.

Tela atual:

- nome Orion;
- texto "Comunicação interna da contabilidade";
- indicação "Orion Chat — Fundação técnica";
- status visual de frontend funcionando.

### Backend

Local: `apps/backend`

Stack inicial:

- NestJS;
- Node.js;
- TypeScript;
- validação preparada.

Endpoint atual:

```text
GET /health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "orion-backend"
}
```

### Shared

Local: `packages/shared`

Pacote TypeScript reutilizável com tipos compartilhados iniciais.

## Scripts

Na raiz do repositório:

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

## Stack planejada

Frontend:

- Next.js;
- React;
- TypeScript;
- Tailwind CSS;
- Shadcn/UI em fase futura.

Backend:

- NestJS;
- Node.js;
- TypeScript.

Dados e infraestrutura planejados:

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
