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
- PostgreSQL local validado com container `orion-postgres` saudável usando imagem `postgres:17-alpine`.
- PostgreSQL via Docker publicado localmente em `127.0.0.1:5433->5432/tcp` para evitar conflito com servicos locais na porta 5432 do Windows.
- Migration e seed validados localmente em 2026-07-14.
- O seed base define 7 setores, 4 cargos, 13 permissoes, 22 vinculos cargo/permissao e 5 usuarios ficticios.
- O volume local preserva 43 usuarios, 32 permissoes, 1 sessao, 1 refresh token e 98 logs de auditoria, incluindo artefatos ficticios residuais de execucoes antigas ou interrompidas; nenhuma limpeza destrutiva foi executada nesta revisao.
- `GET /health` validado com resposta `database: "connected"`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` executados com sucesso em 2026-07-14.
- Autenticação backend inicial implementada com `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` e `GET /auth/me`.
- `JwtAuthGuard`, `PermissionsGuard`, `@RequirePermissions(...)` e `@CurrentUser()` implementados.
- Login frontend inicial implementado em `/login`.
- Dashboard autenticado inicial implementado em `/dashboard`.
- BFF de autenticação implementado no frontend com `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` e `/api/auth/me`.
- Access token e refresh token são mantidos em cookies `HttpOnly`; refresh token não usa `localStorage`.
- App Shell autenticado inicial implementado para rotas internas.
- Sidebar, header, menu mobile, menu do usuario e tema claro/escuro preparados no frontend.
- Rotas placeholder autenticadas criadas para `/chat`, `/companies`, `/notifications`, `/admin` e `/settings`.
- Administracao inicial de usuarios implementada em `/users`, com listagem, busca, filtros, paginacao, criacao, edicao e ativacao/desativacao.
- Administracao inicial de setores implementada em `/sectors`, com listagem, busca, ordenacao, criacao, edicao e status ativo/inativo.
- Backend possui `UsersModule` e `SectorsModule` com endpoints protegidos por `JwtAuthGuard`, `PermissionsGuard` e permissoes explicitas.
- Frontend possui BFF `/api/users` e `/api/sectors`, preservando tokens em cookies `HttpOnly`.
- Leituras de usuarios para perfis nao gerenciais com `users.read` ficam limitadas ao proprio setor; gerente mantem visao global.
- Desativar usuario revoga sessoes e refresh tokens ativos, com cobertura integrada do token de acesso ja emitido.
- O BFF coordena renovacoes simultaneas e atrasadas por processo, preserva cookies em indisponibilidade transitoria e limpa a sessao apenas quando o backend confirma sessao invalida.
- Testes de banco, autenticacao e administracao limpam somente os artefatos criados pela propria suite.
- Validacao de 2026-07-14 concluiu `pnpm lint`, `pnpm typecheck`, 30 testes backend, 18 testes frontend e `pnpm build` com sucesso.
- As contagens de usuarios, permissoes, sessoes, refresh tokens e logs permaneceram identicas antes e depois da suite completa.
- Nenhum chat implementado.
- Nenhuma integração implementada.
- Nenhum CRUD administrativo de cargos ou permissoes implementado.
- Frontend e backend ainda não foram colocados em Docker.
- Nenhum Socket.IO configurado.
- Nenhuma IA ou RAG implementados.

## Fase atual

Fase 1 - Orion Core iniciado tecnicamente no frontend e no backend.

## Próximo passo

Preparar a branch administrativa validada para commit e revisao humana antes de avancar para CRUD de cargos/permissoes, empresas ou Orion Chat real.

## Observações

- O repositório remoto oficial é `https://github.com/celsonaemen/orion.git`.
- A documentação em `.ai/` é a fonte oficial de contexto para agentes e desenvolvedores.
- Antes de qualquer implementação, decisões relevantes devem ser conferidas em `.ai/DECISIONS.md`.
- `.env` não foi criado nem versionado; `DATABASE_URL` foi usada somente como variável local de processo durante a validação.
- Para rodar testes de integração de banco e auth, defina `DATABASE_URL`, `JWT_SECRET` e `JWT_REFRESH_SECRET` apenas no ambiente local.
