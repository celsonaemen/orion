# Arquitetura Planejada do Orion

## Estado da arquitetura

Este documento descreve a arquitetura planejada. Nenhum item descrito aqui deve ser interpretado como implementado até que exista código, configuração e validação correspondente no repositório.

## Monorepo

O Orion será organizado como monorepo para manter frontend, backend, pacotes compartilhados e documentação no mesmo repositório.

Estrutura planejada:

```text
apps/
  web/
  api/
packages/
  shared/
  config/
prisma/
docs/
.ai/
```

Essa estrutura ainda não foi criada. Ela deverá ser proposta e revisada antes da implementação.

## Frontend

Frontend planejado:

- Next.js;
- React;
- TypeScript;
- Tailwind CSS;
- Shadcn/UI.

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

## Backend

Backend planejado:

- NestJS;
- Node.js;
- TypeScript;
- arquitetura modular;
- dependency injection;
- service layer;
- repository pattern;
- DTOs;
- validação de entrada.

Módulos futuros previstos:

- auth;
- users;
- sectors;
- companies;
- roles;
- permissions;
- chat;
- notifications;
- audit-log;
- health.

Controllers devem receber requisições, validar o contrato de entrada e retornar respostas. Regras de negócio devem ficar em services ou use cases. Persistência deve passar por repositories.

## Banco de dados

Banco planejado:

- PostgreSQL.

Entidades iniciais planejadas:

- User;
- Sector;
- Company;
- Role;
- Permission;
- Conversation;
- Message;
- Notification;
- AuditLog;
- RefreshToken.

O desenho do banco deverá considerar isolamento por permissão, auditoria, rastreabilidade e futuras integrações.

## Prisma

Prisma será o ORM planejado para persistência. O schema deverá ser versionado e evoluído por migrations quando o banco for criado.

Regras planejadas:

- migrations revisáveis;
- nomes claros de modelos e relações;
- evitar lógica de negócio dentro da camada de acesso a dados;
- usar repositories para isolar Prisma do restante da aplicação.

## Socket.IO

Socket.IO será usado para comunicação em tempo real em fase futura.

Casos planejados:

- mensagens privadas;
- grupos por setor;
- notificações internas;
- presença online;
- estado de lido e não lido.

Eventos em tempo real deverão respeitar autenticação, autorização e auditoria.

## Autenticação

Autenticação planejada:

- JWT;
- refresh token;
- bcrypt para senhas;
- proteção de sessão;
- expiração e revogação de tokens.

Senhas, tokens e segredos nunca devem ser versionados.

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
