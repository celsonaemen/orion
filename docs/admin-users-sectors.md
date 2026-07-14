# Administracao de Usuarios e Setores

Este documento descreve a primeira area administrativa real do Orion Core.

## Estado atual

Implementado nesta branch:

- listagem paginada de usuarios;
- criacao e edicao de usuarios;
- ativacao e desativacao de usuarios;
- listagem paginada de setores;
- criacao e edicao de setores;
- desativacao de setores por `isActive`;
- BFF no Next.js para `/api/users` e `/api/sectors`;
- RBAC no backend usando permissoes explicitas;
- auditoria basica das operacoes administrativas.
- leitura de usuarios limitada ao proprio setor para perfis nao gerenciais;
- estados de carregamento, erro, vazio e sessao expirada no frontend.

Nao implementado nesta fase:

- hard delete de usuarios;
- hard delete de setores;
- recuperacao ou redefinicao de senha;
- CRUD de empresas;
- CRUD de cargos e permissoes;
- chat real;
- notificacoes reais.

## Backend

Endpoints protegidos por `JwtAuthGuard` e `PermissionsGuard`:

```text
GET /users
POST /users
GET /users/options
GET /users/:id
PATCH /users/:id
PATCH /users/:id/status

GET /sectors
POST /sectors
GET /sectors/:id
PATCH /sectors/:id
```

Permissoes usadas:

- `users.read`;
- `users.create`;
- `users.update`;
- `users.change-status`;
- `sectors.read`;
- `sectors.create`;
- `sectors.update`.

O backend continua sendo a autoridade final. O frontend pode ocultar botoes, mas toda acao administrativa e validada novamente no NestJS.

Gerentes de nivel hierarquico 1 podem consultar todos os usuarios. Outros perfis que recebam `users.read` consultam somente usuarios do proprio setor, inclusive no endpoint de detalhe.

## Usuarios

A API de usuarios:

- normaliza e-mail para minusculo;
- cria senha somente como hash no backend;
- nunca retorna `passwordHash`;
- nao aceita alteracao direta de `passwordHash`;
- rejeita e-mail duplicado com conflito;
- impede desativacao da propria conta;
- invalida sessoes e refresh tokens ativos ao desativar usuario;
- bloqueia login de usuario inativo pelo fluxo de autenticacao existente.
- permite manter cargo ou setor inativo ja vinculado durante uma edicao, sem permitir novos vinculos inativos.

## Setores

A API de setores:

- normaliza slug na criacao;
- rejeita slug duplicado;
- nao altera slug em edicao para evitar impacto em identificadores relacionados;
- nao executa hard delete;
- usa `isActive` para ativacao/desativacao operacional.

## BFF

O frontend chama apenas rotas internas:

```text
/api/users
/api/users/options
/api/users/[id]
/api/users/[id]/status
/api/sectors
/api/sectors/[id]
```

O BFF:

- usa os cookies `HttpOnly` existentes;
- nao expoe access token ou refresh token ao JavaScript do navegador;
- tenta refresh no servidor quando o access token expira;
- reutiliza por uma janela curta o refresh bem-sucedido para requisicoes atrasadas no mesmo processo;
- preserva cookies em falha transitoria e os limpa apenas quando a sessao e confirmada como invalida;
- valida origem e `Content-Type` em operacoes mutaveis;
- converte erros do backend para mensagens seguras.

## Auditoria

Eventos registrados em `AuditLog`:

- criacao de usuario;
- edicao de usuario;
- ativacao/desativacao de usuario;
- criacao de setor;
- edicao de setor.

O enum atual de auditoria ainda nao possui valores especificos `SECTOR_CREATED` e `SECTOR_UPDATED`. Nesta etapa, eventos de setor sao registrados com a acao existente `SECTOR_ASSIGNED` e diferenciados por `metadata.event`, sem registrar senhas, tokens ou hashes.

Edicoes de cargo e setor registram identificadores anterior e novo. Nomes, senhas, tokens e hashes nao sao gravados nesses metadados.

## Validacao

Validado em 2026-07-14:

- 30 testes backend e 18 testes frontend executados sem skips;
- revogacao de sessao e refresh token ja emitidos ao desativar usuario;
- escopo setorial de coordenador;
- conflitos de e-mail e slug;
- origem e `Content-Type` das rotas mutaveis;
- contagens do banco identicas antes e depois da suite, sem limpeza global de dados preexistentes.
