## O que é o projeto

O Orion é uma plataforma web interna planejada para um escritório contábil brasileiro. Seu objetivo é oferecer uma camada própria para comunicação, organização operacional, acompanhamento de informações internas e apoio às decisões do escritório.

O público-alvo documentado é a equipe do escritório contábil, organizada pela hierarquia operacional de **Gerente**, **Coordenador**, **Setorial** e **Auxiliar**. A supervisão gerencial deve ser transparente, controlada por permissão e auditável.

O projeto busca resolver a dispersão de conversas, setores, prazos, empresas, documentos, rotinas e responsabilidades entre e-mail, mensagens, sistemas fiscais, sistemas contábeis e controles paralelos. O Orion pretende centralizar comunicação, contexto operacional, permissões e acompanhamento interno sem substituir Alterdata, Acessórias, e-CAC, sistemas oficiais, provedores de e-mail ou ferramentas obrigatórias de órgãos públicos.

O Orion Core é a primeira base funcional e contempla autenticação, usuários, setores, empresas, permissões, dashboard, auditoria, base para notificações e comunicação interna. Integrações externas, RAG e IA estão reservados para fases futuras.

## Stack e arquitetura

**Estrutura geral**

- Aplicação web modular em monorepo gerenciado por pnpm.
- Estrutura atual: `apps/frontend`, `apps/backend`, `packages/shared`, `docs`, `.ai` e `scripts`.
- `packages/shared` contém tipos TypeScript compartilhados iniciais.
- TypeScript é obrigatório no projeto.
- A documentação em `.ai/` é a fonte oficial de contexto e decisões para agentes e desenvolvedores.

**Frontend**

- Next.js, React, TypeScript, Tailwind CSS, App Router e diretório `src/`.
- Shadcn/UI está planejado, mas não foi configurado.
- Telas reais implementadas: login (`/login`), dashboard (`/dashboard`), usuários (`/users`), setores (`/sectors`) e chat por canais setoriais (`/chat`).
- Rotas autenticadas ainda usadas como placeholders: empresas (`/companies`), notificações (`/notifications`), administração (`/admin`) e configurações (`/settings`).
- App Shell compartilhado com sidebar, header, menu mobile, menu do usuário e tema claro/escuro.
- A rota `/` redireciona para `/dashboard`; sem cookie de sessão, o middleware encaminha o usuário para `/login`.
- O frontend não acessa diretamente o banco e não deve conter regra de negócio crítica.

**Backend**

- NestJS sobre Node.js, com TypeScript, arquitetura modular, injeção de dependência, service layer, DTOs e validação de entrada.
- Módulos atuais: `health`, `database`, `prisma`, `auth`, `users`, `sectors` e `chat`.
- Módulos futuros previstos: `companies`, `roles`, `permissions`, `notifications` e `audit-log`.
- Endpoints atuais:
  - Saúde: `GET /health`.
  - Autenticação: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` e `GET /auth/me`.
  - Usuários: `GET /users`, `GET /users/options`, `GET /users/:id`, `POST /users`, `PATCH /users/:id` e `PATCH /users/:id/status`.
  - Setores: `GET /sectors`, `GET /sectors/:id`, `POST /sectors` e `PATCH /sectors/:id`.
  - Chat: `GET /chat/channels`, `POST /chat/channels`, `GET /chat/channels/:channelId/messages` e `POST /chat/channels/:channelId/messages`.
- Controllers recebem requisições e validam contratos; regras de negócio devem permanecer em services ou use cases.
- O acesso a dados está centralizado no `PrismaService`. O isolamento completo por repositories permanece planejado e ainda não está concluído.
- Em desenvolvimento, o backend executa JavaScript emitido pelo TypeScript com `tsc --watch` e `node --watch`, preservando metadados de decorators exigidos pelo NestJS.

**Persistência e infraestrutura local**

- PostgreSQL com Prisma 7.
- Prisma Client conectado diretamente por `@prisma/adapter-pg`.
- `DATABASE_URL` é lida por `prisma.config.ts` e não fica no `schema.prisma`.
- Identificadores usam UUID nativo do PostgreSQL.
- Docker Compose local com `postgres:17-alpine`, volume nomeado `orion_postgres_data`, healthcheck por `pg_isready` e publicação restrita a `127.0.0.1:5433:5432`.
- Migrations versionadas: `20260713203600_init_identity_and_access` e `20260716130000_add_chat_mvp`.
- Frontend e backend ainda não foram colocados em Docker.
- Plataforma de hospedagem ou deploy: não documentado.

**Autenticação, BFF e autorização**

- O backend usa JWT de acesso, refresh token com rotação, bcrypt para senhas e sessão persistida.
- O hash do refresh token é armazenado no banco; access tokens também são validados contra uma `UserSession` ativa.
- `JwtAuthGuard` valida token e sessão; `PermissionsGuard` valida permissões explícitas; `@RequirePermissions(...)` declara permissões; `@CurrentUser()` disponibiliza o usuário autenticado.
- Guards não são globais: cada controller protegido deve declarar `@UseGuards` explicitamente.
- O backend é a autoridade final de RBAC.
- O frontend usa Route Handlers do Next.js como BFF para autenticação, usuários, setores e chat.
- Access token e refresh token ficam em cookies `HttpOnly`, com `SameSite=Lax` e `Secure` em produção; o refresh token não usa `localStorage`.
- O middleware bloqueia rotas autenticadas sem cookie. A validação efetiva da sessão ocorre pelo BFF/backend.
- Renovações simultâneas são coordenadas. Uma renovação bem-sucedida pode ser reutilizada por uma janela curta; somente `invalid_session` limpa os cookies, enquanto falhas transitórias preservam a sessão local.
- A hierarquia apoia a operação, mas a autorização real depende de permissões explícitas.
- Usuários com `users.read` e nível hierárquico maior que 1 ficam limitados ao próprio setor; nível gerencial 1 tem visão global.
- No MVP privado, sessão ativa permite iniciar conversa com qualquer usuário ativo; somente participantes podem ler ou enviar. As permissões `chat.*` continuam apenas no chat legado por canais.

**Comunicação e tempo real**

- O MVP atual oferece pesquisa de colaboradores, conversas privadas 1:1, mensagens persistidas e paginadas e atualização em tempo real por Socket.IO.
- A conexão usa um ticket JWT de 60 segundos emitido pelo backend via BFF, sem expor os tokens mantidos em cookies `HttpOnly`.
- Grupos, presença, notificações reais e estado de lido/não lido ainda não estão implementados. O chat legado por canais continua preservado com polling.

**Auditoria e integrações**

- Já são auditados login, logout, criação e alteração de usuários, mudança de status de usuários, criação e alteração de setores e criação de canais.
- Logs registram ator, ação, alvo, horário e metadados necessários sem expor segredos.
- Alterdata, Acessórias, GED, OCR, e-mail, WhatsApp e sistemas oficiais são integrações futuras e deverão ser isolados por módulos com contratos, permissões, logs e tratamento de falhas.
- A futura IA deverá usar uma abstração de provider compatível com opções como LM Studio, Gemma, DeepSeek e provedores externos. Nenhum provider está implementado.

## Modelos de dados

O `schema.prisma` contém os enums `UserStatus` (`ACTIVE`, `INACTIVE`), `AuditAction` (`LOGIN`, `LOGOUT`, `USER_CREATED`, `USER_UPDATED`, `USER_STATUS_CHANGED`, `ROLE_ASSIGNED`, `SECTOR_ASSIGNED`, `ADMIN_CONVERSATION_ACCESSED`, `CHAT_CHANNEL_CREATED`) e `ConversationType` (`DIRECT`, `GROUP`). As models são:

- **Sector**: `id` UUID, `name` único, `slug` único, `description` opcional, `isActive`, `createdAt` e `updatedAt`. Relaciona-se com usuários e canais.
- **Role**: `id` UUID, `name` único, `slug` único, `description` opcional, `hierarchyLevel`, `isActive`, `createdAt` e `updatedAt`. Relaciona-se com usuários e permissões por `RolePermission`.
- **Permission**: `id` UUID, `code` único, `description` e `createdAt`. Relaciona-se com cargos por `RolePermission`.
- **RolePermission**: `roleId` e `permissionId`, ambos UUID e chave primária composta. Relaciona `Role` e `Permission`, com exclusão restrita e índice por `permissionId`.
- **User**: `id` UUID, `name`, `email` único, `passwordHash`, `status`, `sectorId` opcional, `roleId`, `lastLoginAt` opcional, `createdAt`, `updatedAt` e `deletedAt` opcional. Relaciona-se com setor, cargo, refresh tokens, sessões, auditorias, canais criados e mensagens.
- **Channel**: `id` UUID, `name` de até 120 caracteres, `slug` de até 80, `description` opcional de até 240, `sectorId`, `createdById`, `isActive`, `createdAt` e `updatedAt`. Possui unicidade composta por setor e slug; relaciona-se com setor, criador e mensagens.
- **Message**: `id` UUID, `channelId`, `authorId`, `content` de até 4.000 caracteres, `createdAt` e `updatedAt`. Relaciona-se com canal e autor; possui índice composto para paginação por canal, data e ID.
- **Conversation**: `id` UUID, `type`, `title` opcional, `directKey` opcional e única, `lastMessageAt` opcional, `createdAt` e `updatedAt`. Relaciona-se com participantes e mensagens privadas.
- **ConversationParticipant**: `conversationId`, `userId` e `joinedAt`, com chave primária composta. Relaciona uma conversa aos usuários autorizados.
- **ConversationMessage**: `id` UUID, `conversationId`, `authorId`, `content` de até 4.000 caracteres, `createdAt` e `updatedAt`. Relaciona-se com conversa e autor e possui índice para paginação cronológica.
- **RefreshToken**: `id` UUID, `userId`, `tokenHash`, `expiresAt`, `revokedAt` opcional e `createdAt`. Relaciona-se com usuário e possui índices por usuário e expiração.
- **UserSession**: `id` UUID, `userId`, `sessionIdentifier` único, `ipAddress` opcional, `userAgent` opcional, `lastActivityAt`, `expiresAt`, `revokedAt` opcional e `createdAt`. Relaciona-se com usuário e possui índices por usuário e expiração.
- **AuditLog**: `id` UUID, `actorUserId` opcional, `action`, `resourceType`, `resourceId` opcional, `metadata` JSON opcional, `ipAddress` opcional e `createdAt`. O ator pode ser nulo e é preservado como nulo se o usuário relacionado for removido; possui índices por ator, ação e data.

Models futuras citadas na arquitetura, mas ausentes do schema atual: `Company` e `Notification`.

## Estado atual

**Implementado e validado**

- Fundação do monorepo, frontend, backend, pacote compartilhado, lint, typecheck, build e formatação.
- PostgreSQL local, Prisma 7, migrations de identidade/acesso e chat e seed fictício.
- O seed base documentado contém 7 setores, 4 cargos, 16 permissões, 29 vínculos cargo/permissão, 5 usuários fictícios e um canal `geral` por setor ativo.
- `GET /health` validado com banco conectado.
- Autenticação completa inicial: login, refresh, logout, consulta do usuário atual, sessões, cookies `HttpOnly`, guards e permissões explícitas.
- Login, dashboard, App Shell, navegação, tema e redirecionamento operacional da rota raiz.
- Administração de usuários com listagem, busca, filtros, paginação, criação, edição, ativação e desativação.
- Administração de setores com listagem, busca, ordenação, criação, edição e mudança de status.
- Desativação de usuário revoga sessões e refresh tokens ativos.
- MVP simples com pesquisa de colaboradores, conversas privadas 1:1, histórico paginado, isolamento por participante e Socket.IO autenticado por ticket curto.
- A implementação anterior de canais setoriais continua preservada como base legada.
- Testes de integração rastreiam e removem somente os próprios registros; limpeza global do banco é proibida.
- Migration do chat e seed aplicados ao PostgreSQL local em 2026-07-16.
- Validação no Edge aprovada com dois usuários: pesquisa, abertura de conversa, troca em tempo real nos dois sentidos, persistência após recarregar e layouts desktop/mobile sem overflow.

**Última rodada documentada de qualidade**

- `pnpm lint`: aprovado.
- `pnpm typecheck`: aprovado.
- Backend: 43 testes aprovados com PostgreSQL.
- Frontend: 29 testes aprovados.
- `pnpm build`: aprovado.
- Data da validação: 2026-07-16.

**Pendente ou incompleto**

- Fase 1 ainda está em andamento.
- CRUD administrativo de cargos e permissões.
- Módulo e CRUD de empresas.
- Ampliação da consulta e da interface de auditoria administrativa.
- Notificações reais.
- Isolamento completo da persistência por repositories.
- Recuperação de senha, troca de senha e bloqueio por tentativas.
- Grupos simples, presença e lido/não lido.
- Integrações externas.
- IA e RAG.
- Dockerização do frontend e backend.
- Preparação da branch `feature/chat-mvp-v1` para commit e revisão humana antes de publicação ou ampliação do chat.

Após a limpeza específica de 19 usuários `sector-user-*`, o estado documentado registra 25 usuários não excluídos, 35 permissões, 7 sessões, 12 refresh tokens e 105 logs. Outros dados locais preexistentes não foram removidos globalmente.

## Decisões técnicas registradas

1. Orion será uma aplicação web.
2. O sistema será modular.
3. O projeto utilizará monorepo.
4. TypeScript será obrigatório.
5. O frontend planejado será Next.js.
6. O frontend usará React.
7. O frontend usará Tailwind CSS.
8. O frontend poderá usar Shadcn/UI.
9. O backend planejado será NestJS.
10. O backend usará Node.js.
11. O banco planejado será PostgreSQL.
12. Prisma será o ORM.
13. Socket.IO será usado para recursos de tempo real.
14. Docker será usado na infraestrutura futura.
15. Docker Compose será usado para orquestração local futura.
16. Orion não substituirá Alterdata.
17. Orion não substituirá Acessórias.
18. Orion não substituirá e-CAC nem sistemas oficiais.
19. Integrações externas serão tratadas somente em fases futuras.
20. Permissões seguirão a hierarquia Gerente, Coordenador, Setorial e Auxiliar.
21. Acesso gerencial será auditável.
22. Supervisão gerencial será transparente e controlada por permissão.
23. RAG será implementado somente em fase futura.
24. IA será implementada somente em fase futura.
25. O backend terá abstração para Gemma, DeepSeek, LM Studio ou provedores externos.
26. Dados reais de clientes não serão usados em testes, seeds ou exemplos.
27. Documentação e memória permanente serão atualizadas após mudanças relevantes.
28. O gerenciador de pacotes do monorepo será pnpm.
29. A estrutura inicial usará `apps/frontend`, `apps/backend` e `packages/shared`.
30. PostgreSQL local será iniciado por Docker Compose somente para desenvolvimento nesta fase.
31. A imagem local do PostgreSQL será fixada em `postgres:17-alpine`, sem `latest`.
32. Prisma 7 usará `prisma.config.ts`, mantendo `DATABASE_URL` fora do `schema.prisma`.
33. Prisma Client usará `@prisma/adapter-pg` para conexão direta com PostgreSQL.
34. Identificadores iniciais usarão UUID nativo do PostgreSQL.
35. `User.sectorId` será opcional para contas administrativas ou técnicas; usuários de negócio devem ter setor quando aplicável.
36. Usuários com histórico não serão removidos fisicamente; `deletedAt` prepara exclusão lógica.
37. Setores e cargos usarão `isActive` para desativação operacional.
38. Refresh tokens serão armazenados somente como hash.
39. Logs de auditoria poderão existir sem ator autenticado.
40. `GET /health` verificará o banco sem expor dados internos sensíveis.
41. A autenticação inicial usará JWT de acesso e refresh token com rotação.
42. Access tokens serão validados junto de uma `UserSession` ativa.
43. Refresh tokens usarão `tokenId` no payload e comparação com hash persistido.
44. A autorização inicial usará `@RequirePermissions(...)` e `PermissionsGuard`.
45. Guards não serão globais nesta etapa; controllers declararão `@UseGuards` explicitamente.
46. O frontend usará BFF com Route Handlers Next.js para não expor tokens ao JavaScript do navegador.
47. Tokens ficarão em cookies `HttpOnly`, com `SameSite=Lax` e `Secure` em produção.
48. Refresh token não ficará em `localStorage`; renovações simultâneas serão coordenadas no BFF e cliente.
49. Middleware bloqueará rotas sem cookie, com validação real da sessão via BFF.
50. PostgreSQL local usará `127.0.0.1:5433:5432` para evitar conflito e restringir acesso ao localhost.
51. App Shell autenticado será compartilhado pelas rotas internas e manterá placeholders dos módulos pendentes.
52. A navegação principal será centralizada para futura aplicação de permissões.
53. O tema usará variáveis CSS e preferência local, sem biblioteca externa.
54. Administração inicial de usuários e setores usará os models Prisma existentes, sem migration adicional nessa etapa.
55. O backend será a autoridade final de RBAC para usuários e setores.
56. O frontend administrativo usará BFF para `/api/users` e `/api/sectors`, mantendo tokens em cookies `HttpOnly`.
57. Setores não terão hard delete nesta etapa; serão desativados por `isActive`.
58. O slug de setor será definido na criação e não será alterado na edição inicial.
59. Auditorias de setor usarão `SECTOR_ASSIGNED` com diferenciação em `metadata.event` até revisão do enum.
60. `users.read` será obrigatório; níveis maiores que 1 verão apenas o próprio setor e nível 1 terá visão global.
61. Testes de integração limparão somente os próprios registros; limpeza global do banco é proibida.
62. O BFF poderá reutilizar brevemente um refresh bem-sucedido; só `invalid_session` limpará cookies.
63. Opções administrativas poderão listar cargos e setores inativos, mas novos vínculos aceitarão somente registros ativos.
64. A decisão de usar canais por setor no primeiro MVP foi supersedida pelo escopo simples de conversas privadas.
65. A decisão de exigir permissões `chat.*` no MVP foi supersedida; elas permanecem apenas no chat legado.
66. A decisão de usar polling no MVP foi supersedida; o MVP privado usa Socket.IO.
67. Mensagens terão até 4.000 caracteres e paginação por cursor de data e ID, com 50 itens por padrão e 100 no máximo.
68. O frontend do chat usará BFF Next.js e manterá tokens nos cookies `HttpOnly` existentes.
69. A auditoria de criação de canal foi supersedida como requisito do MVP simples e permanece como histórico legado.
70. O seed sincronizará exatamente `rolePermissions`, removendo vínculos obsoletos dos quatro cargos gerenciados.
71. O backend em desenvolvimento usará `tsc --watch` e `node --watch` sobre JavaScript emitido para preservar decorators do NestJS.
72. `/` redirecionará para `/dashboard`, e o middleware enviará usuários sem sessão para `/login`; a página técnica antiga não será exibida.
73. O MVP atual contém autenticação, lista de conversas, conversas diretas, grupos opcionais e mensagens em tempo real.
74. Chat privado exige autenticação e participação, sem cargo, hierarquia ou setor.
75. No MVP, auditoria obrigatória limita-se a login e logout.
76. Canais setoriais, RBAC completo e supervisão ficam para a comunicação robusta futura.
77. Canais e polling existentes são base legada, não o contrato do MVP atual.
78. Conversas privadas usam `Conversation`, `ConversationParticipant` e `ConversationMessage`.
79. `directKey` canônica e única impede duplicar uma conversa 1:1.
80. Socket.IO usa namespace `/chat` e salas individuais por participante.
81. O Socket.IO autentica por ticket JWT de 60 segundos emitido via BFF.
82. Pesquisa exige sessão ativa; leitura e envio exigem participação na conversa.

## Roadmap

**Fase 0 - Fundação: concluída tecnicamente**

Documentação, decisões, monorepo pnpm, frontend e backend iniciais, pacote compartilhado, ferramentas de qualidade, Docker Compose/PostgreSQL local, Prisma, identidade, acesso, sessão, auditoria, seed, autenticação e guards foram validados.

**Fase 1 - Orion Core: fase atual, em andamento**

Já iniciada por persistência, autenticação, login, dashboard, App Shell, administração de usuários e setores, RBAC, auditoria básica e testes integrados. A próxima etapa planejada inclui CRUD administrativo de cargos e permissões, guards nos próximos módulos, services e repositories para empresas/cargos/permissões e ampliação da auditoria administrativa.

**Fase 2A - MVP simples: implementada tecnicamente, aguardando uso real**

Já inclui pesquisa, conversas diretas, histórico persistido e Socket.IO. Permanecem pendentes a validação diária pelos colaboradores e a decisão sobre grupos simples; comunicação robusta fica para a Fase 2B.

**Fase 3 - Tarefas e workflow: planejada**

Tarefas, rotinas, competências, responsabilidades e status por empresa.

**Fase 4 - Acessórias: planejada**

Levantamento da integração, eventos, entregas, documentos e acompanhamento de prazos.

**Fase 5 - Alterdata: planejada**

Análise de integrações possíveis, leitura de relatórios, importações controladas e processos contábeis, fiscais e trabalhistas.

**Fase 6 - RAG local: planejada**

Documentos internos, manuais, POPs, base vetorial e respostas com fontes.

**Fase 7 - IA: planejada**

LM Studio, modelos locais, assistente interno, classificação e resumo de mensagens, extração de informações e provider intercambiável.

**Fase 8 - Expansão e produto: planejada**

Dashboards avançados, automações internas, aplicativo mobile, API pública controlada e recursos de produto conforme a necessidade do escritório.
