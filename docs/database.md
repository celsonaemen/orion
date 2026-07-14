# Banco de Dados do Orion

Este documento descreve a fundacao atual de PostgreSQL e Prisma do Orion. Ele nao indica que autenticacao, chat, CRUD ou permissoes funcionais ja estejam implementados.

## Estado Atual

- PostgreSQL local preparado em `docker-compose.yml`.
- Prisma 7 configurado em `apps/backend`.
- Migration inicial criada para identidade, acesso, sessoes e auditoria.
- Seed ficticio criado para desenvolvimento local.
- O Docker nao estava disponivel no PATH desta maquina durante a validacao desta etapa, entao migration e seed ainda precisam ser aplicados em um ambiente com Docker/PostgreSQL disponivel.

## Variaveis

Use `.env.example` como referencia e crie `.env` localmente quando necessario. `.env` nao deve ser versionado.

```env
DATABASE_URL=postgresql://orion:orion_dev@localhost:5432/orion?schema=public
```

A senha `orion_dev` e ficticia e exclusiva para desenvolvimento local.

## Iniciar PostgreSQL

```powershell
docker compose up -d postgres
docker compose ps
```

Parar o banco sem apagar volume:

```powershell
docker compose stop postgres
```

Evite `docker compose down -v`, pois ele remove o volume local do PostgreSQL.

## Prisma

Executar geracao do client:

```powershell
pnpm db:generate
```

Aplicar migration em desenvolvimento:

```powershell
pnpm db:migrate
```

Aplicar migrations em ambiente controlado:

```powershell
pnpm db:migrate:deploy
```

Executar seed ficticio:

```powershell
pnpm db:seed
```

Abrir Prisma Studio:

```powershell
pnpm db:studio
```

Reset local destrutivo:

```powershell
pnpm db:reset
```

`pnpm db:reset` deve ser usado somente em desenvolvimento local.

## Modelos Criados

- `Sector`
- `Role`
- `Permission`
- `RolePermission`
- `User`
- `RefreshToken`
- `UserSession`
- `AuditLog`

Enums criados:

- `UserStatus`
- `AuditAction`

## Seed Ficticio

Setores ficticios:

- Gerencia
- Fiscal
- Contabil
- Departamento Pessoal
- Legalizacao
- Financeiro
- Administrativo

Cargos ficticios:

- Gerente
- Coordenador
- Setorial
- Auxiliar

Usuarios ficticios:

- `admin@orion.local`
- `gerente@orion.local`
- `coordenador.fiscal@orion.local`
- `auxiliar.fiscal@orion.local`
- `auxiliar.contabil@orion.local`

Senha ficticia de desenvolvimento local: `OrionDev123!`

Essa senha nunca deve ser usada fora do ambiente local.

## Decisoes Tecnicas

- IDs usam UUID nativo do PostgreSQL.
- `User.sectorId` e opcional para permitir usuarios administrativos ou tecnicos sem setor operacional.
- Usuarios com historico devem usar exclusao logica futura por `deletedAt`.
- Setores e cargos usam `isActive` para desativacao operacional.
- Refresh tokens devem ser armazenados somente como hash.
- Auditoria usa `metadata` JSON e nao deve armazenar senhas, tokens ou conteudo completo de mensagens.
- Prisma 7 usa `prisma.config.ts` e `@prisma/adapter-pg`.

## Ainda Nao Implementado

- Login.
- JWT.
- Refresh token funcional.
- Guards.
- CRUD de usuarios, setores, cargos ou permissoes.
- Empresas.
- Conversas.
- Mensagens.
- Socket.IO.
- Notificacoes.
- IA.
- RAG.
- Integracoes com Alterdata ou Acessorias.
