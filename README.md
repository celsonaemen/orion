# Orion

Orion é uma aplicação web interna para comunicação e administração básica de um escritório contábil.

## Funcionalidades atuais

- autenticação com sessão persistida, rotação de refresh token e cookies `HttpOnly`;
- chat direto entre colaboradores autenticados;
- mensagens persistidas e histórico paginado;
- entrega em tempo real por Socket.IO;
- administração de usuários e setores com permissões explícitas;
- auditoria de autenticação e operações administrativas;
- interface responsiva em Next.js;
- API NestJS e PostgreSQL com Prisma;
- containers de produção com migrations e health checks coordenados.

O Orion não substitui Alterdata, Acessórias, e-CAC nem sistemas oficiais. Integrações externas, IA e RAG não estão implementados.

## Estrutura

```text
apps/
  backend/       API NestJS, Prisma e Socket.IO
  frontend/      Next.js, BFF e interface web
packages/
  shared/        tipos compartilhados
deploy/          configuração do gateway de produção
docs/            documentação funcional e operacional
.ai/             contexto e decisões oficiais do projeto
```

## Desenvolvimento local

Pré-requisitos: Node.js 24, Corepack, pnpm e Docker Desktop.

```powershell
corepack pnpm install --frozen-lockfile
docker compose up -d postgres

$env:DATABASE_URL="postgresql://orion:orion_dev@127.0.0.1:5433/orion?schema=public"
$env:JWT_SECRET="defina-um-segredo-local"
$env:JWT_REFRESH_SECRET="defina-outro-segredo-local"

corepack pnpm db:generate
corepack pnpm db:migrate:deploy
corepack pnpm db:seed
corepack pnpm dev
```

O frontend usa `http://localhost:3000` e o backend `http://localhost:3001`. O seed contém somente usuários fictícios `@orion.local` e não pode ser usado em produção.

## Qualidade

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Deploy

O deploy recomendado usa [compose.production.yml](./compose.production.yml) com frontend e backend em imagens próprias, PostgreSQL persistente e Nginx como gateway de mesma origem.

1. Copie `.env.production.example` para `.env.production`.
2. Configure banco, segredos JWT e a origem HTTPS pública.
3. Suba a stack com `corepack pnpm deploy:up`.
4. Em banco vazio, execute o bootstrap manual do primeiro administrador.
5. Confirme `https://seu-dominio/healthz`.

Instruções completas, atualização e limitações de escala estão em [docs/deployment.md](./docs/deployment.md).

## Segurança

- nunca versione `.env`, senhas, tokens ou chaves;
- use HTTPS em qualquer ambiente publicado;
- não use dados reais de clientes em seeds ou testes;
- faça backup do PostgreSQL antes de atualizações;
- não execute `db:reset` nem remova volumes em produção.

Consulte [docs/chat.md](./docs/chat.md), [docs/authentication.md](./docs/authentication.md) e [.ai/SECURITY.md](./.ai/SECURITY.md).
