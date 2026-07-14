# Estado Atual do Projeto Orion

## Data

2026-07-14

## Estado do projeto

- Projeto reiniciado do zero.
- Repositório oficial configurado localmente.
- Documentação inicial criada.
- Monorepo base criado com pnpm workspace.
- Frontend inicial criado em `apps/frontend` com Next.js, React, TypeScript e Tailwind CSS.
- Backend inicial criado em `apps/backend` com NestJS e endpoint `GET /health`.
- Pacote compartilhado criado em `packages/shared` com tipos TypeScript iniciais.
- Ferramentas base de lint, typecheck, build e formatação configuradas.
- Dependências definidas para instalação via pnpm.
- Docker Compose inicial criado para PostgreSQL local.
- Prisma 7 configurado no backend.
- Prisma Client preparado com `@prisma/adapter-pg`.
- Modelos iniciais criados: User, Sector, Role, Permission, RolePermission, RefreshToken, UserSession e AuditLog.
- Migration inicial criada: `20260713203600_init_identity_and_access`.
- Seed fictício criado com setores, cargos, permissões e usuários `@orion.local`.
- Endpoint `GET /health` evoluído para verificar conectividade do banco.
- PostgreSQL local, migration e seed validados quando Docker Desktop está em execução.
- Autenticação backend inicial implementada com `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` e `GET /auth/me`.
- `JwtAuthGuard`, `PermissionsGuard`, `@RequirePermissions(...)` e `@CurrentUser()` implementados.
- Nenhum chat implementado.
- Nenhuma integração implementada.
- Nenhuma tela de login implementada.
- Nenhum CRUD administrativo de usuários, setores, cargos ou permissões implementado.
- Frontend e backend ainda não foram colocados em Docker.
- Nenhum Socket.IO configurado.
- Nenhuma IA ou RAG implementados.

## Fase atual

Fase 1 - Orion Core iniciado tecnicamente no backend.

## Próximo passo

Criar tela de login e iniciar CRUD administrativo de usuários, setores, cargos e permissões, aplicando guards e auditoria nas rotas protegidas.

## Observações

- O repositório remoto oficial é `https://github.com/celsonaemen/orion.git`.
- A documentação em `.ai/` é a fonte oficial de contexto para agentes e desenvolvedores.
- Antes de qualquer implementação, decisões relevantes devem ser conferidas em `.ai/DECISIONS.md`.
- Para rodar testes de integração de banco e auth, defina `DATABASE_URL`, `JWT_SECRET` e `JWT_REFRESH_SECRET` apenas no ambiente local.
