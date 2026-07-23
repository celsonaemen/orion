# Chat do Orion

## Funcionalidade entregue

O chat é uma funcionalidade operacional do Orion para usuários autenticados. A experiência principal em `/chat` inclui:

- pesquisa de colaboradores ativos por nome ou e-mail;
- criação idempotente de conversas diretas;
- lista de conversas ordenada por atividade;
- mensagens persistidas de até 4.000 caracteres;
- histórico paginado por cursor;
- entrega em tempo real por Socket.IO;
- estados de carregamento, vazio, erro e reconexão;
- layout responsivo para desktop e celular.

Somente participantes podem consultar ou enviar mensagens em uma conversa. Access token e refresh token permanecem nos cookies `HttpOnly`; o navegador recebe apenas um ticket de Socket.IO com validade curta.

O socket é encerrado quando o ticket expira. O cliente solicita um ticket novo e reconecta, revalidando usuário e sessão periodicamente.

## Endpoints

Backend NestJS:

- `GET /chat/users`;
- `GET /chat/conversations`;
- `POST /chat/conversations/direct`;
- `GET /chat/conversations/:conversationId/messages`;
- `POST /chat/conversations/:conversationId/messages`;
- `POST /chat/realtime-ticket`.

O frontend usa os Route Handlers correspondentes sob `/api/chat` e nunca envia os tokens de sessão aos componentes client-side.

## Persistência

A migration de conversas é `apps/backend/prisma/migrations/20260716170000_add_private_conversations/migration.sql`.

As entidades `Conversation`, `ConversationParticipant` e `ConversationMessage` armazenam conversas, participantes e histórico. A `directKey` canônica impede duas conversas diretas distintas para o mesmo par de usuários.

## Recursos não implementados

Este release não inclui grupos, anexos, edição ou exclusão de mensagens, presença, confirmação de leitura, notificações ou chamadas. Esses recursos precisam de especificação, regras de autorização e testes próprios antes de serem adicionados.

As tabelas e rotas anteriores de canais por setor continuam preservadas, mas não aparecem como experiência principal em `/chat`.

## Operação

O deploy com containers está documentado em [deployment.md](./deployment.md). Em uma instalação nova, execute migrations e o bootstrap seguro do primeiro administrador; não execute o seed fictício em produção.
