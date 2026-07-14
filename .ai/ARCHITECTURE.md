# Arquitetura Planejada do Orion

## Estado da arquitetura

Este documento descreve a arquitetura planejada e o estado técnico inicial já criado. Itens marcados como planejados não devem ser interpretados como implementados até que exista código, configuração e validação correspondente no repositório.

## Monorepo

O Orion está organizado como monorepo pnpm para manter frontend, backend, pacote compartilhado e documentação no mesmo repositório.

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

Há configuração inicial de PostgreSQL local, Prisma e migration de identidade/acesso. A aplicação das migrations depende de um PostgreSQL disponível.

Há autenticação backend inicial com JWT, refresh token, sessões e guards de permissão.

Ainda não há chat funcional, Socket.IO, integrações externas, IA, RAG, tela de login no frontend, CRUD administrativo de usuários ou aplicação de permissões em módulos de negócio.

## Frontend

Frontend criado:

- Next.js;
- React;
- TypeScript;
- Tailwind CSS;
- App Router;
- diretório `src/`.

Shadcn/UI continua planejado para fases futuras de interface, mas ainda não foi configurado.

Responsabilidades do frontend:

- renderizar telas e fluxos de usuário;
- consumir APIs do backend;
- receber eventos de tempo real autorizados;
- aplicar estados visuais e experiência de uso;
- não acessar diretamente o banco de dados;
- não conter regra de negócio crítica.

Telas futuras previstas:

- login;
- dashboard;
- usuários;
- setores;
- empresas;
- chat;
- notificações;
- configurações.

Tela atual:

- página inicial simples do Orion Chat;
- mensagem "Comunicação interna da contabilidade";
- status visual de frontend funcionando.

## Backend

Backend criado:

- NestJS;
- Node.js;
- TypeScript;
- arquitetura modular;
- dependency injection;
- service layer;
- repository pattern;
- DTOs;
- validação de entrada.

Módulo atual:

- health.
- database;
- prisma.

Endpoint atual:

- `GET /health`, retornando status operacional do backend e conectividade do banco quando PostgreSQL estiver disponível.

Módulos futuros previstos:

- users;
- sectors;
- companies;
- roles;
- permissions;
- chat;
- notifications;
- audit-log;

Controllers devem receber requisições, validar o contrato de entrada e retornar respostas. Regras de negócio devem ficar em services ou use cases. Persistência deve passar por repositories.

## Banco de dados

Banco planejado e configurado para desenvolvimento local:

- PostgreSQL.

Configuração atual:

- `docker-compose.yml` com serviço `postgres`;
- imagem `postgres:17-alpine`;
- volume nomeado `orion_postgres_data`;
- variáveis locais fictícias de desenvolvimento;
- healthcheck com `pg_isready`.

Entidades iniciais criadas no Prisma:

- User;
- Sector;
- Role;
- Permission;
- RolePermission;
- AuditLog;
- RefreshToken.
- UserSession.

Entidades ainda planejadas para fases futuras:

- Company;
- Conversation;
- Message;
- Notification.

O desenho do banco deverá considerar isolamento por permissão, auditoria, rastreabilidade e futuras integrações.

## Prisma

Prisma 7 está configurado no backend como ORM de persistência.

Arquivos atuais:

- `apps/backend/prisma.config.ts`;
- `apps/backend/prisma/schema.prisma`;
- `apps/backend/prisma/seed.ts`;
- `apps/backend/prisma/migrations/20260713203600_init_identity_and_access/migration.sql`.

Como Prisma 7 removeu a URL do datasource no schema, a URL é definida em `prisma.config.ts` a partir de `DATABASE_URL`. O Prisma Client usa `@prisma/adapter-pg` para conexão direta com PostgreSQL.

Regras planejadas:

- migrations revisáveis;
- nomes claros de modelos e relações;
- evitar lógica de negócio dentro da camada de acesso a dados;
- usar repositories para isolar Prisma do restante da aplicação.
- usar UUID nativo do PostgreSQL para identificadores iniciais.

## Socket.IO

Socket.IO será usado para comunicação em tempo real em fase futura. Ainda não foi instalado nem configurado.

Casos planejados:

- mensagens privadas;
- grupos por setor;
- notificações internas;
- presença online;
- estado de lido e não lido.

Eventos em tempo real deverão respeitar autenticação, autorização e auditoria.

## Autenticação

Autenticação backend inicial implementada:

- JWT;
- refresh token;
- bcrypt para senhas;
- proteção de sessão;
- expiração e revogação de tokens.
- endpoint `POST /auth/login`;
- endpoint `POST /auth/refresh`;
- endpoint `POST /auth/logout`;
- endpoint `GET /auth/me`.

Senhas, tokens e segredos nunca devem ser versionados.

O modelo `RefreshToken` armazena apenas hash do token. O refresh token é rotacionado no uso.

Ainda não há tela de login, recuperação de senha, troca de senha ou bloqueio por tentativas.

## Autorização e permissões

A autorização deverá respeitar a hierarquia:

1. Gerente
2. Coordenador
3. Setorial
4. Auxiliar

Regras conceituais:

- Gerente poderá supervisionar todas as conversas e operações autorizadas;
- Coordenador poderá supervisionar seu setor;
- Setorial terá acesso operacional ao seu setor;
- Auxiliar terá acesso apenas às conversas, grupos e tarefas autorizadas.

Acesso gerencial deve ser controlado, transparente e auditável.

Implementação inicial:

- `JwtAuthGuard` valida access token e sessão ativa;
- `PermissionsGuard` valida permissões explícitas;
- `@RequirePermissions(...)` define permissões exigidas;
- `@CurrentUser()` expõe o usuário autenticado para controllers.

A hierarquia é apoio operacional. A autorização real deve depender de permissões explícitas.

## Auditoria

Auditoria será parte central da arquitetura.

Eventos futuros a auditar:

- login e logout;
- criação e alteração de usuários;
- alterações de permissões;
- acessos gerenciais;
- leitura de informações sensíveis;
- ações administrativas;
- integrações externas.

Logs de auditoria devem registrar ator, ação, alvo, horário e metadados necessários, sem expor segredos.

## Integrações futuras

Integrações com Alterdata, Acessórias, GED, OCR, e-mail, WhatsApp ou sistemas oficiais não fazem parte da fase inicial.

Quando forem avaliadas, deverão ser implementadas como módulos isolados, com contratos claros, permissões, logs e tratamento de falhas.

## Provider abstrato de IA

O backend deverá ser preparado futuramente para uma abstração de provider de IA. Essa abstração deve permitir troca entre modelos locais e provedores externos sem acoplamento direto ao domínio.

Possibilidades futuras:

- LM Studio;
- Gemma;
- DeepSeek;
- outros modelos locais;
- provedores externos autorizados.

Nenhum provider de IA está implementado nesta fase.
