# Decisões Arquiteturais

Este arquivo registra decisões oficiais do Projeto Orion. Toda decisão técnica relevante deve ser adicionada aqui antes ou junto da implementação correspondente.

## Decisões iniciais

1. Orion será uma aplicação web.
2. O sistema será modular.
3. O projeto utilizará monorepo.
4. TypeScript será obrigatório.
5. O frontend planejado será Next.js.
6. O frontend usará React.
7. O frontend usará Tailwind CSS.
8. O frontend poderá usar Shadcn/UI.
9. O backend planejado será NestJS.
10. O backend usará Node.js.
11. O banco planejado será PostgreSQL.
12. Prisma será o ORM.
13. Socket.IO será usado para recursos de tempo real.
14. Docker será usado na infraestrutura futura.
15. Docker Compose será usado para orquestração local futura.
16. Orion não substituirá Alterdata.
17. Orion não substituirá Acessórias.
18. Orion não substituirá e-CAC nem sistemas oficiais.
19. Integrações externas serão tratadas somente em fases futuras.
20. Permissões seguirão a hierarquia Gerente, Coordenador, Setorial e Auxiliar.
21. Acesso gerencial será auditável.
22. Supervisão gerencial deverá ser transparente e controlada por permissão.
23. RAG será implementado somente em fase futura.
24. IA será implementada somente em fase futura.
25. O backend usará uma abstração para permitir Gemma, DeepSeek, LM Studio ou provedores externos.
26. Nenhum dado real de cliente deve ser usado em testes, seeds ou exemplos.
27. Documentação e memória permanente devem ser atualizadas após mudanças relevantes.
28. O gerenciador de pacotes do monorepo será pnpm.
29. A estrutura inicial do monorepo usará `apps/frontend`, `apps/backend` e `packages/shared`.
30. PostgreSQL local será iniciado por Docker Compose somente para desenvolvimento nesta fase.
31. A imagem local do PostgreSQL será fixada em `postgres:17-alpine`, sem uso de `latest`.
32. Prisma 7 será usado com `prisma.config.ts`, mantendo `DATABASE_URL` fora do `schema.prisma`.
33. O Prisma Client usará `@prisma/adapter-pg` para conexão direta com PostgreSQL.
34. Identificadores iniciais usarão UUID nativo do PostgreSQL de forma consistente.
35. `User.sectorId` será opcional para permitir usuários administrativos ou técnicos sem setor operacional, mas usuários de negócio devem ser vinculados a setor quando aplicável.
36. Usuários com histórico não devem ser removidos fisicamente; o modelo usa `deletedAt` para exclusão lógica futura.
37. Setores e cargos usam `isActive` para desativação operacional.
38. Refresh tokens serão armazenados somente como hash.
39. Logs de auditoria podem existir sem ator autenticado para permitir registro de eventos anônimos ou falhas antes do login.
40. O endpoint `GET /health` deve verificar o banco sem expor URL, usuário, senha, stack trace ou detalhes internos sensíveis.
41. A autenticação backend inicial usará JWT de acesso e refresh token com rotação.
42. Access tokens serão validados junto da sessão ativa no banco por meio de `UserSession`.
43. Refresh tokens serão identificados por `tokenId` no payload e comparados contra hash armazenado no banco.
44. A autorização inicial usará permissões explícitas com `@RequirePermissions(...)` e `PermissionsGuard`.
45. Guards de autenticação e permissão não serão globais nesta etapa; controllers devem optar explicitamente por `@UseGuards`.
46. O frontend usará um BFF com Route Handlers do Next.js para autenticar contra o backend NestJS sem expor tokens ao JavaScript do navegador.
47. Access token e refresh token do frontend serão armazenados em cookies `HttpOnly`, com `SameSite=Lax` e `Secure` em produção.
48. O refresh token não será armazenado em `localStorage`; renovações simultâneas serão coordenadas no BFF e no cliente.
49. A proteção inicial de rotas autenticadas usará middleware do Next.js para bloquear acesso sem cookie de sessão e validação real via BFF.
50. PostgreSQL local via Docker Compose usara `127.0.0.1:5433:5432` em desenvolvimento para evitar conflito com servicos locais na porta 5432, mantendo o banco restrito ao localhost.
51. O App Shell autenticado sera o layout compartilhado das rotas internas, mantendo autenticacao via BFF e usando placeholders para modulos ainda nao implementados.
52. A navegacao principal ficara centralizada em configuracao propria para futura aplicacao de permissoes sem implementar RBAC completo nesta etapa.
53. O tema do frontend usara variaveis CSS e preferencia local do navegador, sem biblioteca externa de tema.
54. A administracao inicial de usuarios e setores usara os modelos Prisma existentes, sem migration nova nesta etapa.
55. O backend sera a autoridade final de RBAC para usuarios e setores, usando `JwtAuthGuard`, `PermissionsGuard` e codigos de permissao ja existentes no seed.
56. O frontend administrativo usara BFF Next.js para `/api/users` e `/api/sectors`, mantendo access token e refresh token somente em cookies `HttpOnly`.
57. Setores nao terao hard delete nesta etapa; `isActive` sera usado para desativacao operacional.
58. O slug de setor sera definido na criacao e nao sera alterado pela edicao administrativa inicial.
59. Como o enum atual de auditoria ainda nao tem `SECTOR_CREATED` e `SECTOR_UPDATED`, eventos administrativos de setor serao registrados com `SECTOR_ASSIGNED` e diferenciados por `metadata.event` ate futura revisao de schema.
60. A permissao `users.read` continuara obrigatoria, mas perfis com nivel hierarquico maior que 1 terao leitura de usuarios limitada ao proprio setor; nivel gerencial 1 tera visao global.
61. Suites de integracao que usam o PostgreSQL local devem rastrear e remover somente os registros que criarem; limpeza global de sessoes, tokens ou dados existentes e proibida.
62. O BFF podera reutilizar por uma janela curta o resultado bem-sucedido de refresh para atender requisicoes atrasadas com o cookie anterior. Somente `invalid_session` limpará cookies; falhas transitorias retornarao indisponibilidade sem destruir a sessao local.
63. Opcoes administrativas podem listar cargos e setores inativos para preservar vinculos existentes em edicao, mas novos vinculos continuam aceitando somente registros ativos.
