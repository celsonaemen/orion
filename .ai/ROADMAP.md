# Roadmap do Projeto Orion

## Estado geral

A Fase 0 possui fundação técnica validada. Partes da Fase 1 já foram implementadas, mas a prioridade imediata passa a ser a Fase 2A: validar um chat interno simples com uso real.

O MVP de comunicação não deve aguardar a conclusão de uma plataforma completa de gestão do escritório. Recursos robustos de setores, hierarquia, auditoria, integrações, IA e RAG permanecem no roadmap, mas não fazem parte do MVP atual.

## Fase 0 - Fundação

Status: concluída tecnicamente.

Entregas validadas:

- repositório e documentação permanente;
- monorepo pnpm;
- frontend Next.js inicial;
- backend NestJS inicial;
- pacote TypeScript compartilhado;
- lint, typecheck, testes, build e formatação;
- PostgreSQL local por Docker Compose;
- Prisma, migrations e seed fictício;
- modelos iniciais de identidade, acesso, sessão e auditoria;
- autenticação backend e frontend;
- sessões, JWT, refresh token e cookies `HttpOnly`.

## Fase 1 - Orion Core

Status: parcialmente implementada; o necessário para autenticar usuários e sustentar o MVP de comunicação está disponível.

Já implementado:

- autenticação e sessões;
- usuários e setores;
- dashboard e App Shell;
- administração inicial de usuários e setores;
- permissões administrativas existentes;
- auditoria básica já existente;
- BFF Next.js para comunicação com o backend.

Adiado até depois da validação do MVP simples:

- CRUD administrativo de cargos e permissões;
- empresas;
- ampliação da auditoria administrativa;
- repositories completos para os módulos de negócio;
- demais recursos de gestão do escritório que não sejam necessários ao chat simples.

## Fase 2 - Comunicação

Status: reorientada para um MVP simples. O repositório mantém a implementação anterior de canais setoriais com polling como base legada, sem tratá-la como contrato funcional do MVP atual.

### Fase 2A - MVP simples

Status: implementada tecnicamente e aguardando validação com uso real pelos colaboradores.

Escopo obrigatório:

- usuários autenticados;
- lista de conversas do usuário;
- conversas diretas entre dois usuários autenticados;
- mensagens enviadas e recebidas em tempo real.

Escopo opcional, somente se não atrasar a validação:

- grupos simples sem vínculo obrigatório com setor ou cargo.

Regras simplificadas:

- usuário autenticado pode conversar com outro usuário autenticado;
- somente participantes acessam a conversa;
- sem RBAC de chat por cargo, hierarquia ou setor;
- login e logout continuam auditados;
- criação de canal, criação de conversa e ações internas do chat não exigem auditoria detalhada;
- canais por setor não são requisito.

Critério de saída:

- dois usuários autenticados conseguem acessar suas conversas e trocar mensagens em tempo real;
- o fluxo funciona de ponta a ponta e pode ser validado com uso real;
- nenhum recurso fora do escopo simples bloqueia a entrega.

Validação técnica concluída em 2026-07-16:

- pesquisa de colaborador e criação idempotente de conversa 1:1;
- histórico persistido e paginado;
- Socket.IO autenticado por ticket curto emitido via BFF;
- troca em tempo real nos dois sentidos entre dois usuários;
- persistência após recarregar;
- layout desktop e mobile sem overflow;
- isolamento da conversa aos participantes;
- lint, typecheck, 43 testes backend, 29 testes frontend e build aprovados.

Pendente para concluir a validação do produto:

- uso real pelos colaboradores;
- registrar feedback e corrigir problemas observados no fluxo diário;
- decidir se grupos simples são necessários antes da Fase 2B.

### Fase 2B - Comunicação robusta

Status: planejada para depois da validação do MVP simples.

Possibilidades futuras:

- canais por setor;
- grupos avançados;
- hierarquia Gerente, Coordenador, Setorial e Auxiliar aplicada ao chat;
- RBAC detalhado;
- supervisão gerencial controlada;
- auditoria detalhada de ações sensíveis;
- notificações;
- presença online;
- lido e não lido;
- demais recursos definidos a partir do uso real.

## Fase 3 - Tarefas e workflow

Status: planejada.

Escopo:

- tarefas;
- rotinas;
- competências;
- responsabilidades;
- status por empresa.

## Fase 4 - Acessórias

Status: planejada.

Escopo:

- levantamento de integração;
- eventos;
- entregas;
- documentos;
- acompanhamento de prazos.

## Fase 5 - Alterdata

Status: planejada.

Escopo:

- análise das integrações possíveis;
- leitura de relatórios;
- importações controladas;
- processos contábeis, fiscais e trabalhistas.

## Fase 6 - RAG local

Status: planejada.

Escopo:

- documentos internos;
- manuais;
- POPs;
- base vetorial;
- respostas com fontes.

## Fase 7 - IA

Status: planejada.

Escopo:

- LM Studio;
- modelos locais;
- assistente interno;
- classificação de mensagens;
- resumo;
- extração de informações;
- provider intercambiável.

## Fase 8 - Expansão e produto

Status: planejada.

Escopo:

- dashboards avançados;
- automações internas;
- aplicativo mobile;
- API pública controlada;
- recursos de produto conforme necessidade do escritório.
