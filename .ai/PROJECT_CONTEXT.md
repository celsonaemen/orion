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

Nesta tarefa inicial, nenhuma dessas funcionalidades está implementada. Esta fase cria apenas a memória permanente e documentação base do projeto.

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

O escopo atual é a Fundação do projeto:

- criar o repositório local oficial;
- criar a memória permanente em `.ai/`;
- registrar decisões arquiteturais;
- registrar regras de desenvolvimento;
- registrar regras de segurança;
- criar documentação inicial em `docs/`;
- preparar o projeto para futura criação do monorepo.

## Limites atuais

Nesta fase não deve ser implementado:

- frontend;
- backend;
- banco de dados;
- Docker;
- autenticação;
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
