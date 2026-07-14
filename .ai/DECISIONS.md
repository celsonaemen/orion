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
