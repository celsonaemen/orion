# Projeto Orion - Contexto Oficial

## Direção atual

O Orion é uma aplicação web interna para um escritório contábil brasileiro. A prioridade atual é entregar e validar rapidamente um chat interno simples, no estilo "Slack básico".

O MVP atual não pretende ser uma plataforma completa de gestão do escritório. A ambição mais ampla do Orion continua registrada como visão de longo prazo, mas não deve aumentar o escopo, bloquear a entrega ou orientar requisitos do MVP simples.

## Problema imediato

As conversas internas precisam de um ponto único, acessível apenas por usuários autenticados, no qual uma pessoa possa encontrar suas conversas e trocar mensagens com outra pessoa em tempo real.

## MVP atual (simples)

### Objetivo

Validar com uso real se um chat interno próprio atende à comunicação básica da equipe.

### Escopo fechado

O MVP atual contém somente:

- usuários autenticados;
- uma lista de conversas de cada usuário;
- conversas diretas entre dois usuários autenticados;
- grupos simples, caso sejam necessários para a validação, sem vínculo obrigatório com setor ou cargo;
- envio e recebimento de mensagens em tempo real.

### Permissões do chat

A regra do MVP é simples: um usuário autenticado pode conversar com outro usuário autenticado. O acesso a cada conversa deve ficar limitado aos seus participantes.

O chat do MVP não exige:

- hierarquia Gerente, Coordenador, Setorial e Auxiliar;
- permissões `chat.access`, `chat.channels.manage` ou `chat.read_all`;
- escopo por setor;
- supervisão gerencial das conversas.

Essas regras poderão ser reavaliadas somente depois da validação do MVP com uso real.

### Auditoria do MVP

Login e logout continuam registrados. Não é requisito do MVP auditar criação de canal, criação de conversa, envio de mensagem ou cada ação realizada dentro do chat.

### Canais e setores

Canais vinculados a setores não são necessários para validar o MVP. A experiência principal deve ser uma lista de conversas diretas; grupos simples podem ser incluídos se ajudarem a validação sem ampliar significativamente o escopo.

### Fora do escopo atual

Qualquer recurso além do escopo fechado acima está fora do MVP atual, incluindo:

- RBAC do chat por cargo ou setor;
- canais obrigatoriamente vinculados a setores;
- auditoria detalhada das ações do chat;
- supervisão gerencial de conversas;
- módulos de gestão completa do escritório;
- integrações externas;
- IA e RAG;
- GED, OCR e aplicativo mobile.

### Relação com o código existente

O repositório mantém a implementação anterior de chat por canais setoriais, permissões específicas, auditoria de criação de canal e atualização por polling como base legada.

O MVP simples agora está implementado separadamente com pesquisa de colaboradores, conversas diretas 1:1, histórico persistido e mensagens em tempo real via Socket.IO. Grupos simples continuam opcionais e não estão implementados.

## Visão de longo prazo (fases futuras)

Depois que o chat simples for validado com uso real, o Orion poderá evoluir gradualmente para uma plataforma interna mais ampla, considerando:

- canais organizados por setor;
- hierarquia operacional de Gerente, Coordenador, Setorial e Auxiliar;
- RBAC detalhado;
- supervisão gerencial transparente e auditável;
- auditoria detalhada de ações sensíveis;
- usuários, setores, empresas, cargos e permissões;
- dashboard operacional e notificações;
- tarefas e workflow;
- documentos e GED;
- integrações possíveis com Acessórias e Alterdata;
- RAG local;
- modelos de IA locais ou provedores externos por uma abstração de provider;
- automações, dashboards avançados e aplicativo mobile.

Essa visão não constitui requisito do MVP atual e não deve ser implementada sem decisão específica após a validação do chat simples.

## Sistemas que o Orion não substitui

Mesmo na visão de longo prazo, o Orion não substituirá:

- Alterdata;
- Acessórias;
- e-CAC;
- sistemas da Receita Federal;
- sistemas oficiais;
- provedores de e-mail;
- ferramentas obrigatórias de órgãos públicos.

Integrações futuras dependerão de levantamento técnico, autorização, regras de segurança e validação do impacto operacional.

## Proteção de dados

Dados reais de clientes não devem ser usados em testes, seeds ou exemplos. Durante as fases iniciais, documentos reais, dados de clientes e informações sensíveis não devem ser enviados a modelos de IA.
