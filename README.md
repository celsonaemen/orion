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
- PostgreSQL local preparado via `docker-compose.yml`;
- Prisma 7 configurado no backend;
- modelos iniciais de identidade, acesso, sessão e auditoria criados;
- migration inicial criada para usuários, setores, cargos, permissões, sessões e auditoria;
- seed fictício criado para desenvolvimento local;
- endpoint `GET /health` criado no backend com verificação de banco;
- autenticação ainda não implementada;
- chat ainda não implementado;
- banco ainda não aplicado neste ambiente porque Docker/PostgreSQL não está disponível no PATH;
- frontend e backend ainda não rodam em Docker;
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
  "service": "orion-backend",
  "database": "connected"
}
```

Se o banco estiver indisponível, o endpoint deve responder erro de serviço sem expor URL, usuário, senha ou stack trace.

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

Scripts de banco:

```powershell
pnpm db:generate
pnpm db:migrate
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:studio
pnpm db:reset
```

`pnpm db:reset` é destrutivo e deve ser usado somente em desenvolvimento local.

## Banco de dados local

O PostgreSQL local é preparado por Docker Compose:

```powershell
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
```

O seed usa apenas dados fictícios e e-mails `@orion.local`. Para desenvolvimento local, os usuários fictícios usam a senha `OrionDev123!`. Essa senha não deve ser usada fora do ambiente local.

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
- `docs/database.md`;
- `docs/glossary.md`.

## Avisos importantes

- Projeto em construção.
- Não usar dados reais.
- Não versionar senhas, tokens ou `.env`.
- Não armazenar documentos contábeis no repositório.
- Não afirmar que algo está implementado sem verificar o código.
