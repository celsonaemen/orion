# MVP de Comunicação

## Escopo implementado

O MVP atual fornece conversas privadas entre usuários autenticados. Ele inclui:

- pesquisa de colaboradores ativos por nome ou e-mail;
- criação ou reabertura idempotente de conversa 1:1;
- lista de conversas do usuário;
- envio de mensagens de até 4.000 caracteres;
- histórico persistido e paginado por cursor;
- mensagens em tempo real por Socket.IO;
- acesso limitado aos participantes;
- estados de carregamento, erro e vazio;
- layout desktop e mobile.

Grupos, anexos, edição/exclusão, presença, confirmação de leitura e notificações não fazem parte do MVP implementado.

## Autorização

- qualquer usuário com sessão ativa pode pesquisar outro usuário ativo e iniciar uma conversa;
- somente participantes podem listar ou enviar mensagens na conversa;
- cargo, setor e permissões `chat.*` não restringem o MVP privado.

As permissões antigas continuam aplicadas apenas ao chat legado por canais.

## Endpoints do backend

- `GET /chat/users`
- `GET /chat/conversations`
- `POST /chat/conversations/direct`
- `GET /chat/conversations/:conversationId/messages`
- `POST /chat/conversations/:conversationId/messages`
- `POST /chat/realtime-ticket`

O frontend usa os Route Handlers correspondentes sob `/api/chat`, preservando os tokens nos cookies `HttpOnly`.

## Banco local

A migration de conversas privadas é `apps/backend/prisma/migrations/20260716170000_add_private_conversations/migration.sql`.

Com o PostgreSQL local disponivel:

```powershell
$env:DATABASE_URL="postgresql://orion:orion_dev@127.0.0.1:5433/orion?schema=public"
corepack pnpm db:migrate:deploy
corepack pnpm db:seed
corepack pnpm test
```

Segredos JWT devem ser definidos apenas no ambiente local conforme `docs/authentication.md`.

## Estado da validacao

Em 2026-07-16, a migration foi aplicada ao PostgreSQL local. Lint, typecheck, 43 testes backend, 29 testes frontend e build completo passaram.

O fluxo foi validado no Edge com dois usuários simultâneos: pesquisa, abertura da conversa, envio e recebimento em tempo real nos dois sentidos, persistência após recarregar e layout sem overflow. Os artefatos automatizados foram removidos por IDs exatos, preservando a conversa real existente.

## Chat legado

As tabelas, APIs e componentes de canais por setor continuam no repositório para preservar a implementação anterior. Eles não definem o contrato funcional do MVP simples e não aparecem como experiência principal em `/chat`.
