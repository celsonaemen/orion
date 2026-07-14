# Autenticacao e Autorizacao

Este documento descreve a fundacao atual de autenticacao do backend Orion. A tela de login no frontend ainda nao foi implementada.

## Estado Atual

Implementado no backend:

- `AuthModule`.
- `POST /auth/login`.
- `POST /auth/refresh`.
- `POST /auth/logout`.
- `GET /auth/me`.
- `JwtAuthGuard`.
- `PermissionsGuard`.
- Decorator `@RequirePermissions(...)`.
- Decorator `@CurrentUser()`.
- Validacao de DTOs com `class-validator`.
- Auditoria basica de login e logout.

Ainda nao implementado:

- Tela de login no frontend.
- CRUD de usuarios.
- Recuperacao de senha.
- Troca de senha.
- Politica de bloqueio por tentativas.
- Cookies HTTP-only.
- RBAC em modulos de negocio.

## Variaveis

As variaveis abaixo devem ser configuradas fora do Git:

```env
JWT_SECRET=replace_in_local_env
JWT_REFRESH_SECRET=replace_in_local_env
JWT_ACCESS_TOKEN_TTL_SECONDS=900
JWT_REFRESH_TOKEN_TTL_SECONDS=604800
```

`JWT_SECRET` e `JWT_REFRESH_SECRET` nao podem usar valores reais no repositorio.

## Fluxo de Login

```http
POST /auth/login
```

Body:

```json
{
  "email": "admin@orion.local",
  "password": "OrionDev123!"
}
```

Resposta:

```json
{
  "tokens": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  },
  "user": {
    "id": "...",
    "email": "admin@orion.local",
    "permissions": ["audit.read"]
  }
}
```

A senha acima e ficticia e exclusiva para desenvolvimento local.

## Refresh Token

```http
POST /auth/refresh
```

O refresh token e rotacionado: ao usar um refresh token valido, o token antigo e revogado e um novo par de tokens e emitido.

Refresh tokens sao armazenados somente como hash.

## Logout

```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

O logout revoga a sessao atual. Se o body incluir `refreshToken`, o refresh token correspondente tambem e revogado.

## Usuario Atual

```http
GET /auth/me
Authorization: Bearer <accessToken>
```

Retorna o usuario autenticado, cargo, setor e permissoes efetivas.

## Guards

Usar `JwtAuthGuard` para exigir autenticacao:

```ts
@UseGuards(JwtAuthGuard)
```

Usar `PermissionsGuard` com `@RequirePermissions` para exigir permissoes explicitas:

```ts
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("users.read")
```

A hierarquia Gerente, Coordenador, Setorial e Auxiliar existe como apoio operacional. A autorizacao real deve depender de permissoes explicitas.

## Cuidados

- Nao registrar tokens em logs.
- Nao retornar `passwordHash` em respostas.
- Nao versionar `.env`.
- Nao usar dados reais em testes.
- Nao expor stack trace, segredo JWT ou hash de token em respostas.
