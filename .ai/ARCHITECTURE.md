# Arquitetura Planejada do Orion

## Como interpretar este documento

Este documento separa o estado técnico já existente do alvo funcional atual. Código existente não deve ser confundido com requisito do produto, e item planejado não deve ser descrito como implementado sem código e validação correspondentes.

O alvo imediato é publicar e operar o chat interno. A arquitetura de uma plataforma completa de gestão do escritório permanece como visão de longo prazo e não deve aumentar o escopo do chat atual.

## Arquitetura do chat atual

O chat atual suporta:

- usuários autenticados;
- lista de conversas do usuário;
- conversas diretas entre usuários autenticados;
- grupos simples opcionais, sem vínculo obrigatório com setor ou cargo;
- mensagens em tempo real.

Regras arquiteturais do chat:

- o chat exige autenticação e participação na conversa;
- cargo, hierarquia e setor não controlam quem pode conversar nesta fase;
- canais vinculados a setores não são obrigatórios;
- login e logout continuam auditados;
- criação de canal, criação de conversa e ações internas do chat não exigem auditoria detalhada;
- integrações, IA, RAG e módulos de gestão do escritório não podem bloquear a entrega.

## Estado técnico existente

O repositório possui autenticação, administração inicial de usuários e setores e uma implementação anterior de chat por canais setoriais, permissões específicas, mensagens persistidas e polling.

O chat direto foi implementado em uma trilha separada: pesquisa de usuários ativos, conversas idempotentes, participantes, mensagens persistidas e entrega em tempo real por Socket.IO. A base anterior de canais permanece preservada, mas não representa o contrato funcional atual.

## Monorepo

O Orion usa um monorepo pnpm para manter frontend, backend, pacote compartilhado e documentação no mesmo repositório.

Estrutura atual:

```text
apps/
  frontend/
  backend/
packages/
  shared/
docs/
.ai/
scripts/
```

- `apps/frontend`: aplicação Next.js.
- `apps/backend`: API NestJS e Prisma.
- `packages/shared`: tipos TypeScript compartilhados iniciais.
- `.ai`: contexto, decisões, arquitetura, estado e roadmap oficiais.

## Frontend

Stack atual:

- Next.js;
- React;
- TypeScript;
- Tailwind CSS;
- App Router;
- diretório `src/`.

Shadcn/UI permanece apenas planejado.

Telas implementadas:

- login;
- dashboard;
- usuários;
- setores;
- comunicação por conversas privadas em tempo real.

Implementação legada preservada:

- backend, schema e componentes do chat anterior por canais setoriais.

Rotas placeholder existentes:

- empresas;
- notificações;
- administração;
- configurações.

Responsabilidades do frontend no chat:

- autenticar o usuário pelo fluxo existente;
- exibir a lista de conversas do usuário;
- abrir uma conversa;
- enviar e receber mensagens em tempo real;
- representar estados de carregamento, vazio e erro;
- não acessar diretamente o banco;
- não concentrar regra de negócio crítica.

Rotas BFF implementadas para o chat:

- `GET /api/chat/users`;
- `GET /api/chat/conversations`;
- `POST /api/chat/conversations/direct`;
- `GET /api/chat/conversations/:conversationId/messages`;
- `POST /api/chat/conversations/:conversationId/messages`;
- `POST /api/chat/realtime-ticket`.

## Backend

Stack atual:

- NestJS;
- Node.js;
- TypeScript;
- arquitetura modular;
- injeção de dependência;
- services;
- DTOs e validação de entrada;
- acesso a dados pelo `PrismaService`.

Módulos atuais:

- health;
- database;
- prisma;
- auth;
- users;
- sectors;
- chat.

Endpoints atuais:

- `GET /health`;
- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` e `GET /auth/me`;
- endpoints administrativos de usuários;
- endpoints administrativos de setores;
- endpoints do chat anterior para canais e mensagens;
- `GET /chat/users`;
- `GET /chat/conversations`;
- `POST /chat/conversations/direct`;
- `GET /chat/conversations/:conversationId/messages`;
- `POST /chat/conversations/:conversationId/messages`;
- `POST /chat/realtime-ticket`.

Responsabilidades do backend no chat:

- validar autenticação e sessão;
- limitar cada conversa aos seus participantes;
- listar as conversas do usuário;
- persistir e entregar mensagens;
- distribuir mensagens em tempo real;
- manter regras de negócio fora dos controllers.

O `ChatController` exige apenas `JwtAuthGuard` nas rotas privadas. As rotas legadas de canais continuam adicionando `PermissionsGuard` e suas permissões antigas.

O isolamento completo por repositories permanece planejado. Os services atuais acessam o `PrismaService` diretamente, portanto repository pattern não deve ser descrito como concluído.

## Banco de dados e Prisma

Persistência atual:

- PostgreSQL;
- Prisma 7;
- `@prisma/adapter-pg`;
- UUID nativo do PostgreSQL;
- `DATABASE_URL` carregada por `prisma.config.ts`, fora do `schema.prisma`.

Infraestrutura local atual:

- Docker Compose;
- imagem `postgres:17-alpine`;
- volume `orion_postgres_data`;
- healthcheck com `pg_isready`;
- porta `127.0.0.1:5433` no host.

Models existentes:

- User;
- Sector;
- Role;
- Permission;
- RolePermission;
- RefreshToken;
- UserSession;
- AuditLog;
- Channel;
- Message;
- Conversation;
- ConversationParticipant;
- ConversationMessage.

Migrations existentes:

- `20260713203600_init_identity_and_access`;
- `20260716130000_add_chat_mvp`;
- `20260716170000_add_private_conversations`.

`Conversation` identifica a conversa e mantém `directKey` única para pares 1:1. `ConversationParticipant` controla participação, e `ConversationMessage` persiste mensagens de até 4.000 caracteres com índice para paginação cronológica. O modelo de grupos simples ainda não foi validado na aplicação, embora o enum reserve o tipo `GROUP`.

## Topologia de produção

`compose.production.yml` isola a publicação da infraestrutura local e coordena:

- PostgreSQL 17 com volume persistente não exposto ao host;
- job de `prisma migrate deploy` concluído antes do backend;
- backend NestJS em imagem Node.js, usuário sem privilégios e health check de banco;
- frontend Next.js em saída `standalone`, com health check do backend;
- gateway Nginx como único serviço exposto, encaminhando `/socket.io/` ao backend e o restante ao frontend.

O BFF usa `BACKEND_URL`, variável somente de servidor. O navegador usa a própria origem para o Socket.IO por padrão; `NEXT_PUBLIC_REALTIME_URL` existe apenas para uma topologia explicitamente separada. O ambiente de produção exige `FRONTEND_ORIGIN` HTTPS e segredos JWT distintos com tamanho mínimo.

Migrations não executam seed. Uma instalação vazia usa `bootstrap-production.ts` manualmente para criar a fundação de acesso e o primeiro administrador sem versionar credenciais.

A topologia atual mantém uma instância de backend. Escala horizontal exige sticky sessions e adapter compartilhado do Socket.IO.

## Mensagens em tempo real

Mensagens em tempo real estão implementadas com Socket.IO e o gateway NestJS `ChatRealtimeGateway`, no namespace `/chat`.

O navegador solicita pelo BFF um ticket JWT de 60 segundos. O gateway valida ticket, usuário ativo e sessão antes de associar o socket à sala `user:<userId>`. Quando uma mensagem é persistida, o backend emite `conversation.message` e `conversation.updated` somente às salas dos participantes.

O cliente renova o ticket ao reconectar e mantém access token e refresh token fora do JavaScript. A conexão é encerrada no vencimento do ticket para revalidar a sessão. O polling de 4 segundos permanece apenas no chat legado por canais. Presença, indicador de digitação, lido/não lido e notificações não estão implementados neste release.

## Autenticação e BFF

Autenticação backend já implementada:

- JWT de acesso;
- refresh token com rotação;
- bcrypt para senhas;
- sessão persistida;
- expiração e revogação;
- `POST /auth/login`;
- `POST /auth/refresh`;
- `POST /auth/logout`;
- `GET /auth/me`.

O `RefreshToken` armazena somente o hash. Access tokens são validados junto de uma `UserSession` ativa.

Autenticação frontend já implementada:

- BFF com Route Handlers Next.js;
- access token e refresh token em cookies `HttpOnly`;
- `SameSite=Lax` e `Secure` em produção;
- nenhum refresh token em `localStorage`;
- middleware de proteção das rotas autenticadas;
- coordenação de renovações simultâneas;
- preservação da sessão local em falhas transitórias.

O BFF continua sendo o caminho entre navegador e backend. Para o Socket.IO, ele retorna somente um ticket curto e limitado à conexão em tempo real; access token, refresh token e segredos não são expostos ao JavaScript nem versionados.

## Autorização

### Chat direto

A autorização é deliberadamente mínima:

- o usuário deve estar autenticado;
- o usuário pode conversar com outro usuário autenticado;
- somente participantes podem acessar uma conversa;
- cargo, nível hierárquico e setor não concedem nem retiram acesso ao chat nesta fase;
- `chat.access`, `chat.channels.manage` e `chat.read_all` pertencem às rotas legadas de canais e não restringem conversas diretas.

### Administração existente

O RBAC já implementado para usuários e setores continua existindo no código administrativo:

- `JwtAuthGuard`;
- `PermissionsGuard`;
- `@RequirePermissions(...)`;
- `@CurrentUser()`;
- permissões explícitas nos endpoints administrativos.

Esse RBAC administrativo não controla a participação nas conversas diretas atuais.

### Visão de longo prazo

Evoluções futuras poderão reavaliar hierarquia, canais por setor, supervisão gerencial e permissões detalhadas de comunicação.

## Auditoria

No chat atual, login e logout continuam auditados.

Não é requisito auditar:

- criação de canal;
- criação de conversa;
- envio de mensagem;
- cada ação interna do chat.

O código existente registra também eventos administrativos e criação de canal. Mensagens não são copiadas para logs de auditoria.

Auditoria detalhada de ações sensíveis, supervisão gerencial e integrações permanece como visão de longo prazo.

## Recursos não implementados no chat atual

Não estão implementados neste release:

- canais obrigatórios por setor;
- RBAC completo do chat;
- auditoria detalhada;
- presença online;
- lido e não lido;
- notificações;
- tarefas e workflow;
- empresas e gestão completa do escritório;
- integrações com Alterdata, Acessórias, GED, OCR, e-mail, WhatsApp ou sistemas oficiais;
- RAG;
- IA;
- aplicativo mobile.

## Visão de longo prazo

Após validação com uso real, a arquitetura poderá evoluir para módulos isolados de empresas, cargos, permissões, notificações, auditoria, tarefas, integrações, documentos, RAG e IA.

Integrações externas deverão ter contratos claros, permissões, logs e tratamento de falhas. Uma futura camada de IA deverá usar provider abstrato compatível com modelos locais ou provedores externos autorizados, sem acoplamento direto ao domínio.
