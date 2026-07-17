# Estado Atual do Projeto Orion

## Data

2026-07-16

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
- Modelos criados: User, Sector, Role, Permission, RolePermission, RefreshToken, UserSession, AuditLog, Channel, Message, Conversation, ConversationParticipant e ConversationMessage.
- Migrations versionadas: `20260713203600_init_identity_and_access`, `20260716130000_add_chat_mvp` e `20260716170000_add_private_conversations`.
- Seed fictício criado com setores, cargos, permissões e usuários `@orion.local`.
- Endpoint `GET /health` evoluído para verificar conectividade do banco.
- PostgreSQL local validado com container `orion-postgres` saudável usando imagem `postgres:17-alpine`.
- PostgreSQL via Docker publicado localmente em `127.0.0.1:5433->5432/tcp` para evitar conflito com servicos locais na porta 5432 do Windows.
- Migration inicial e seed validados localmente em 2026-07-14; migration e seed do chat validados em 2026-07-16.
- O seed base define 7 setores, 4 cargos, 16 permissoes, 29 vinculos cargo/permissao, 5 usuarios ficticios e um canal `geral` por setor ativo.
- Após a limpeza específica dos 19 usuários residuais `sector-user-*`, o volume local possui 25 usuários não excluídos, 35 permissões, 7 sessões, 12 refresh tokens e 105 logs de auditoria. Outros dados locais preexistentes não foram removidos globalmente.
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
- Rotas placeholder autenticadas mantidas para `/companies`, `/notifications`, `/admin` e `/settings`.
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
- A implementação anterior de chat por canais setoriais permanece no backend e no schema como base legada, protegida por `chat.access`, `chat.channels.manage` e `chat.read_all`.
- Backend do chat implementado com listagem e criacao de canais, envio e paginacao de mensagens, escopo setorial, auditoria de criacao de canal e validacao de entrada.
- Frontend do chat implementado com BFF Next.js, estados de carregamento/erro/vazio, criacao de canal autorizada, envio de mensagem, historico paginado e atualizacao por polling a cada 4 segundos.
- Migration `20260716130000_add_chat_mvp` criada e Prisma Client regenerado.
- O disco WSL do Docker foi recuperado com backup SHA-256 validado e `e2fsck`; nenhum reset ou volume foi excluido. O backup local foi preservado fora do repositorio.
- Migration `20260716130000_add_chat_mvp` e seed aplicados com sucesso ao PostgreSQL local em 2026-07-16.
- O seed sincroniza exatamente a matriz de permissoes dos quatro cargos ficticios, removendo vinculos obsoletos.
- Validacao final de 2026-07-16 concluiu `pnpm lint`, `pnpm typecheck`, 39 testes backend com PostgreSQL, 26 testes frontend e `pnpm build` com sucesso.
- Validacao no Edge concluiu login, listagem de canais, envio `201`, persistencia apos recarregar, cookies `HttpOnly`, ausencia de erros de console/API e layout desktop/mobile sem overflow.
- O modo `dev` do backend foi corrigido para `tsc --watch` mais `node --watch`, preservando os metadados de injecao de dependencia do NestJS.
- A rota raiz `/` redireciona para `/dashboard`; sem cookie de sessao, o middleware encaminha para `/login`.
- MVP simples de conversas privadas implementado em `/chat`, com pesquisa por nome/e-mail, criação idempotente de conversa 1:1, lista de conversas, histórico paginado e envio de mensagens.
- Conversas privadas exigem somente autenticação e participação; cargo, hierarquia e setor não restringem quem pode conversar nesta fase.
- Socket.IO foi configurado no namespace `/chat`. O navegador obtém pelo BFF um ticket JWT de 60 segundos, sem receber o access token armazenado em cookie `HttpOnly`.
- Migration `20260716170000_add_private_conversations` aplicada com sucesso ao PostgreSQL local.
- Validação final concluiu `pnpm lint`, `pnpm typecheck`, 43 testes backend, 29 testes frontend e `pnpm build` com sucesso.
- Validação com dois contextos do Edge confirmou mensagens em tempo real nos dois sentidos, persistência após recarregar, ausência de erros HTTP/console e layout desktop/mobile sem overflow.
- A conversa real usada na validacao E2E foi preservada; somente a conversa, mensagens, sessoes e tokens criados pelo proprio teste foram removidos por identificadores exatos.
- Nenhuma integração implementada.
- Nenhum CRUD administrativo de cargos ou permissoes implementado.
- Frontend e backend ainda não foram colocados em Docker.
- Nenhuma IA ou RAG implementados.

## Fase atual

Fase 2A - MVP simples de comunicação implementado tecnicamente e aguardando validação com uso real pelos colaboradores.

## Próximo passo

Validar conversas privadas com colaboradores reais e revisar a branch `feature/chat-mvp-v1` antes de qualquer publicação. Grupos simples permanecem opcionais e ainda não foram implementados.

## Observações

- O repositório remoto oficial é `https://github.com/celsonaemen/orion.git`.
- A documentação em `.ai/` é a fonte oficial de contexto para agentes e desenvolvedores.
- Antes de qualquer implementação, decisões relevantes devem ser conferidas em `.ai/DECISIONS.md`.
- `.env` não foi criado nem versionado; `DATABASE_URL` foi usada somente como variável local de processo durante a validação.
- Para rodar testes de integração de banco e auth, defina `DATABASE_URL`, `JWT_SECRET` e `JWT_REFRESH_SECRET` apenas no ambiente local.
- O MVP simples usa Socket.IO para conversas privadas. O chat legado por canais continua usando polling; grupos, presença, confirmação de leitura e notificações permanecem fora do escopo implementado.
