# Deploy do Orion

## Arquitetura publicada

A stack de produção usa quatro serviços:

- `gateway`: Nginx, único serviço exposto;
- `frontend`: Next.js em saída `standalone`;
- `backend`: NestJS com HTTP e Socket.IO;
- `postgres`: PostgreSQL 17 com volume persistente.

Um job separado, `backend-migrate`, aplica `prisma migrate deploy` antes de liberar backend e frontend. O seed fictício nunca é executado automaticamente.

O gateway encaminha `/socket.io/` ao backend e todas as demais rotas ao frontend. Isso mantém navegador, BFF e tempo real na mesma origem.

## Pré-requisitos

- Docker Engine com Docker Compose;
- domínio HTTPS apontado para o host;
- proxy, load balancer ou túnel TLS encaminhando para a porta do gateway;
- rotina externa de backup do volume PostgreSQL.

Cookies de produção usam `Secure`. Login por HTTP simples não é suportado em ambiente publicado.

## Variáveis

Copie `.env.production.example` para `.env.production` e preencha o arquivo fora do Git:

```powershell
Copy-Item .env.production.example .env.production
```

Obrigatórias:

- `POSTGRES_PASSWORD`;
- `DATABASE_URL`, usando `postgres` como host quando o banco do Compose for usado;
- `JWT_SECRET` e `JWT_REFRESH_SECRET`, diferentes e com pelo menos 32 caracteres;
- `FRONTEND_ORIGIN`, com a origem HTTPS pública exata.

`NEXT_PUBLIC_REALTIME_URL` pode permanecer vazio na topologia padrão de mesma origem. Use-o somente quando o Socket.IO tiver uma origem pública separada.

Nunca versione `.env.production` e nunca reutilize os segredos de desenvolvimento.

## Construção e inicialização

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build

docker compose --env-file .env.production -f compose.production.yml config
docker compose --env-file .env.production -f compose.production.yml up -d --build
docker compose --env-file .env.production -f compose.production.yml ps
```

Valide a entrada pública:

```powershell
curl.exe --fail https://orion.example.com/healthz
```

A resposta saudável informa `orion-frontend`, backend conectado e status `ok` sem expor credenciais.

## Primeiro administrador

Em uma instalação vazia, defina as credenciais apenas na sessão do terminal e execute o perfil manual de bootstrap:

```powershell
$env:BOOTSTRAP_ADMIN_NAME="Administrador Orion"
$env:BOOTSTRAP_ADMIN_EMAIL="administrador@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD="defina-uma-senha-forte"

docker compose --env-file .env.production -f compose.production.yml --profile bootstrap run --rm `
  -e BOOTSTRAP_ADMIN_NAME `
  -e BOOTSTRAP_ADMIN_EMAIL `
  -e BOOTSTRAP_ADMIN_PASSWORD `
  bootstrap-admin

Remove-Item Env:BOOTSTRAP_ADMIN_NAME,Env:BOOTSTRAP_ADMIN_EMAIL,Env:BOOTSTRAP_ADMIN_PASSWORD
```

O comando é idempotente para a fundação de setores, cargos e permissões. Se o e-mail já existir, a senha não é alterada. Para uma redefinição intencional, passe também `BOOTSTRAP_ADMIN_RESET_PASSWORD=true`.

## Atualizações

1. Faça backup do PostgreSQL.
2. Construa as novas imagens.
3. Execute `docker compose ... up -d`.
4. Aguarde o job de migration e todos os health checks.
5. Confira `/healthz` e os logs.

Não use `db:reset`, não remova o volume e não rode o seed de desenvolvimento em produção.

## Escala e disponibilidade

A configuração entregue usa uma instância de backend. Para múltiplas réplicas de Socket.IO serão necessários sticky sessions e um adapter compartilhado, como Redis. Esse trabalho não deve ser feito apenas aumentando `replicas`, porque as salas atuais vivem na memória do processo.

TLS, monitoramento, alertas, backups e retenção devem ser configurados na infraestrutura onde o Orion for publicado.
