# Visão Geral do Orion

O Orion é uma plataforma web interna planejada para um escritório contábil brasileiro. Ele nasce para organizar comunicação, usuários, setores, empresas, permissões, auditoria e visão operacional em um ambiente próprio.

O Orion não substitui sistemas oficiais ou sistemas contábeis existentes. Alterdata, Acessórias, e-CAC, sistemas da Receita Federal e provedores de e-mail continuam sendo ferramentas externas ao Orion.

## Situação atual

O projeto esta na Fase 1 - Orion Core, com a fundacao tecnica da Fase 0 validada.

Ja existem monorepo, frontend Next.js, backend NestJS, PostgreSQL/Prisma, autenticacao, App Shell e administracao inicial de usuarios e setores. Empresas, cargos/permissoes administrativos, chat e notificacoes reais ainda nao foram implementados.

## Objetivo inicial

O Orion Core em andamento cobre:

- autenticação;
- usuários;
- setores;
- empresas;
- permissões;
- dashboard;
- auditoria.

Autenticacao, usuarios, setores, dashboard inicial e auditoria basica ja foram iniciados. Empresas e CRUD de cargos/permissoes permanecem como proximas etapas.

## Evolução planejada

Depois do Orion Core, o projeto poderá evoluir para comunicação em tempo real, tarefas, workflow, integrações com Acessórias e Alterdata, GED, RAG local, IA e automações.

Cada etapa deverá ser revisada, documentada e implementada de forma modular.
