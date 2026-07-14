# Roadmap do Projeto Orion

## Estado geral

Somente a Fase 0 está iniciada. As demais fases são planejamento e não devem ser tratadas como implementadas.

## Fase 0 - Fundação

Status: iniciada, com documentação versionada, monorepo base e fundação inicial de persistência criados para revisão.

Objetivos:

- repositório;
- memória permanente;
- documentação;
- decisões;
- segurança;
- workspace pnpm;
- frontend Next.js inicial;
- backend NestJS inicial;
- pacote compartilhado TypeScript;
- ferramentas de lint, typecheck, build e formatação;
- Docker Compose inicial para PostgreSQL local;
- Prisma configurado;
- modelos iniciais de identidade, acesso, sessão e auditoria;
- seed fictício de desenvolvimento;
- autenticação backend inicial;
- guards JWT e permissões explícitas.

Critério de saída:

- documentação inicial revisada;
- decisões arquiteturais registradas;
- regras de desenvolvimento registradas;
- monorepo validado;
- validação local com Docker/PostgreSQL disponível;
- aprovação para avançar para CRUD administrativo e aplicação das permissões nos módulos de negócio.

## Fase 1 - Orion Core

Status: iniciada tecnicamente pela fundação de persistência, autenticação backend inicial e login frontend inicial. Funcionalidades administrativas ainda não implementadas.

Escopo:

- autenticação;
- usuários;
- setores;
- empresas;
- permissões;
- dashboard;
- auditoria.

Itens técnicos já iniciados:

- autenticação;
- hashing de senha no fluxo real;
- JWT e refresh token;
- guards;
- decorators de permissão.
- login frontend;
- BFF de autenticação no Next.js;
- cookies `HttpOnly` para tokens;
- dashboard autenticado inicial.
- App Shell autenticado inicial;
- navegacao principal para modulos futuros;
- placeholders autenticados para chat, empresas, usuarios, setores, notificacoes, administracao e configuracoes;
- tema claro/escuro preparado.

Próxima etapa técnica planejada:

- CRUD administrativo de usuários, setores, cargos e permissões;
- aplicação de guards nos módulos de negócio;
- services e repositories para usuários, setores, cargos e permissões;
- auditoria de ações administrativas.

## Fase 2 - Comunicação

Status: planejada.

Escopo:

- mensagens privadas;
- grupos;
- Socket.IO;
- notificações;
- presença online;
- lido e não lido.

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
