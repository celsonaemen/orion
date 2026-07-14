# Projeto Orion - Contexto Oficial

## O que é o Orion

O Orion é uma plataforma web interna planejada para um escritório contábil brasileiro. Ele será usado como uma camada própria de comunicação, organização operacional, acompanhamento de informações internas e suporte a decisões do escritório.

O sistema começa pelo Orion Core, uma base inicial para autenticação, usuários, setores, empresas, permissões, dashboard, auditoria e comunicação interna. As integrações externas e recursos de inteligência serão tratados em fases futuras.

## Problema que o Orion resolve

Escritórios contábeis lidam com muitas conversas, setores, prazos, empresas, documentos, rotinas e responsabilidades distribuídas. Parte dessas informações fica espalhada em e-mail, mensagens, sistemas fiscais, sistemas contábeis e controles paralelos.

O Orion existe para centralizar a visão interna do escritório sem substituir os sistemas oficiais. A proposta é criar um ponto único para organizar comunicação, contexto operacional, permissões e acompanhamento interno.

## Contexto do escritório contábil

O Orion deve considerar a realidade de um escritório com setores, hierarquia, empresas clientes, prazos fiscais, rotinas mensais, necessidade de supervisão e responsabilidade sobre informações sensíveis.

As funcionalidades devem respeitar a hierarquia operacional:

1. Gerente
2. Coordenador
3. Setorial
4. Auxiliar

A supervisão gerencial deve ser transparente, controlada por permissão e auditável.

## Objetivo do Orion Core

O Orion Core será a primeira base funcional do sistema. Ele deverá preparar:

- autenticação;
- usuários;
- setores;
- empresas;
- permissões;
- dashboard operacional;
- auditoria;
- base para notificações;
- base para comunicação interna.

O estado atual ja inclui a fundacao do monorepo, PostgreSQL/Prisma, autenticacao, App Shell e administracao inicial de usuarios e setores. Empresas, cargos/permissoes administrativos, comunicacao real e demais modulos continuam pendentes.

## Sistemas que o Orion não substitui

O Orion não substituirá:

- Alterdata;
- Acessórias;
- e-CAC;
- sistemas da Receita Federal;
- sistemas oficiais;
- provedores de e-mail;
- ferramentas obrigatórias de órgãos públicos.

Esses sistemas poderão ser integrados futuramente, quando houver análise técnica, autorização e desenho seguro.

## Escopo atual

O escopo atual e a Fase 1 do Orion Core:

- manter autenticacao e sessoes seguras;
- administrar usuarios e setores com permissoes explicitas;
- consolidar dashboard e App Shell;
- preparar CRUD de cargos, permissoes e empresas;
- ampliar auditoria administrativa;
- manter documentacao e testes alinhados ao codigo real.

## Limites atuais

Nesta fase ainda nao deve ser implementado sem aprovacao especifica:

- chat;
- integrações externas;
- IA;
- RAG;
- GED;
- OCR;
- aplicativo mobile.

## Módulos futuros

O Orion poderá evoluir para:

- Orion Core;
- chat em tempo real;
- tarefas e workflow;
- integração com Acessórias;
- integração possível com Alterdata;
- documentos e GED;
- RAG local;
- modelo de IA local;
- automações internas;
- dashboards avançados;
- aplicativo mobile.

## Alterdata e Acessórias

Alterdata e Acessórias são sistemas externos ao Orion. O Orion não deve tentar substituí-los. Qualquer integração futura deverá ser precedida por levantamento técnico, regras de permissão, logs de auditoria e validação do impacto operacional.

## RAG e IA local

RAG e IA local são fases futuras. A arquitetura deve ser preparada para permitir modelos locais ou provedores externos por meio de uma abstração de provider, sem acoplar o sistema a uma tecnologia específica.

Durante as fases iniciais, documentos reais, dados de clientes e informações sensíveis não devem ser enviados para modelos de IA.
