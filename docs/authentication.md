# Autenticacao e Autorizacao

Este documento descreve a fundacao atual de autenticacao do Orion no backend e no frontend.

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

Implementado no frontend:

- Pagina `/login`.
- Dashboard autenticado inicial em `/dashboard`.
- BFF com Route Handlers do Next.js em `/api/auth/*`.
- Cookies `HttpOnly` para access token e refresh token.
- Renovacao de access token via refresh token.
- Logout com revogacao no backend e limpeza local.
- Middleware para bloquear dashboard sem cookie de sessao.
- Validacao de `Origin`/`Sec-Fetch-Site` nas operacoes mutaveis do BFF.
- Validacao de `Content-Type: application/json` nas operacoes mutaveis com body.

Ainda nao implementado:

- CRUD de cargos e permissoes.
- Recuperacao de senha.
- Troca de senha.
- Politica de bloqueio por tentativas.
- RBAC completo em todos os modulos de negocio.

## Variaveis

As variaveis abaixo devem ser configuradas fora do Git:

```env
JWT_SECRET=replace_in_local_env
JWT_REFRESH_SECRET=replace_in_local_env
JWT_ACCESS_TOKEN_TTL_SECONDS=900
JWT_REFRESH_TOKEN_TTL_SECONDS=604800
```

`JWT_SECRET` e `JWT_REFRESH_SECRET` nao podem usar valores reais no repositorio.

O frontend usa `NEXT_PUBLIC_API_URL` para o BFF localizar o backend local:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

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

No frontend, o navegador chama:

```http
POST /api/auth/login
```

O BFF chama `POST /auth/login` no backend, grava os tokens em cookies `HttpOnly` e retorna ao navegador apenas o usuario autenticado.

## Refresh Token

```http
POST /auth/refresh
```

O refresh token e rotacionado: ao usar um refresh token valido, o token antigo e revogado e um novo par de tokens e emitido.

Refresh tokens sao armazenados somente como hash.

No frontend, a renovacao usa:

```http
POST /api/auth/refresh
```

O BFF le o refresh token do cookie `HttpOnly`, chama `POST /auth/refresh`, grava o novo par de tokens em cookies e retorna apenas o usuario. Renovacoes simultaneas sao coordenadas por processo e um resultado bem-sucedido fica reutilizavel por uma janela curta para atender requisicoes atrasadas com o cookie anterior. Em falha transitoria o cookie e preservado; somente uma sessao confirmada como invalida limpa os cookies.

## Logout

```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

O logout revoga a sessao atual. Se o body incluir `refreshToken`, o refresh token correspondente tambem e revogado.

No frontend, o navegador chama:

```http
POST /api/auth/logout
```

O BFF chama o logout real do backend quando ha token disponivel e limpa os cookies locais.

## Usuario Atual

```http
GET /auth/me
Authorization: Bearer <accessToken>
```

Retorna o usuario autenticado, cargo, setor e permissoes efetivas.

No frontend, o dashboard usa:

```http
GET /api/auth/me
```

Esse endpoint valida o access token no backend. Se o access token tiver expirado e houver refresh token valido, o BFF tenta renovar a sessao.

## Protecao de Rotas

- `/dashboard` exige cookie de sessao e consulta `/api/auth/me` antes de exibir dados do usuario.
- Usuario sem cookie de sessao e redirecionado para `/login`.
- Usuario com cookie de sessao que acessa `/login` e redirecionado para `/dashboard`, exceto quando a URL indica sessao expirada.
- A protecao nao depende apenas de esconder componentes no cliente.

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

Na administracao inicial, os endpoints de usuarios e setores usam permissoes explicitas como `users.read`, `users.create`, `users.update`, `users.change-status`, `sectors.read`, `sectors.create` e `sectors.update`. O frontend apenas oculta ou desabilita acoes; o backend continua sendo a autoridade final. A leitura de usuarios e global para nivel hierarquico 1 e limitada ao proprio setor para os demais niveis.

## Cuidados

- Nao registrar tokens em logs.
- Nao retornar `passwordHash` em respostas.
- Nao versionar `.env`.
- Nao usar dados reais em testes.
- Nao expor stack trace, segredo JWT ou hash de token em respostas.
- Nao armazenar refresh token em `localStorage`.
- Cookies de token devem ser `HttpOnly`, `SameSite=Lax` e `Secure` em producao.
- Operacoes mutaveis do BFF devem rejeitar origem cross-site e mensagens fora do formato esperado.
