# Projeto Orion - Contexto Oficial

## Direção atual

O Orion é uma aplicação web interna para um escritório contábil brasileiro. A prioridade atual é publicar e operar um chat interno confiável, mantendo a administração de usuários e setores já existente.

O chat é funcionalidade do produto, não uma demonstração temporária. Toda mudança deve preservar autenticação, cookies `HttpOnly`, BFF Next.js, autorização backend, PostgreSQL, auditoria e proteção de dados.

## Chat atual

O fluxo principal permite que usuários autenticados:

- pesquisem colaboradores ativos;
- iniciem ou retomem conversas diretas;
- consultem histórico persistido e paginado;
- enviem e recebam mensagens em tempo real;
- usem a interface em desktop e celular.

Somente participantes acessam cada conversa. Cargo e setor não bloqueiam conversas diretas no comportamento atual. As permissões administrativas continuam válidas para usuários e setores.

O navegador acessa dados por Route Handlers do Next.js. Access token e refresh token permanecem em cookies `HttpOnly`; o Socket.IO recebe somente um ticket curto, renovado por reconexão.

## Publicação

A topologia de produção usa:

- Nginx como gateway de mesma origem;
- Next.js em saída `standalone`;
- NestJS com HTTP e Socket.IO;
- PostgreSQL 17 persistente;
- migration automática antes da inicialização;
- health checks de banco, backend, frontend e gateway;
- bootstrap manual do primeiro administrador, sem seed fictício.

TLS é obrigatório na entrada pública. Segredos e credenciais permanecem fora do Git. A configuração entregue usa uma instância de backend; escala horizontal do Socket.IO exige adapter compartilhado e sticky sessions.

## Recursos ainda não implementados

- grupos;
- anexos;
- edição e exclusão de mensagens;
- presença;
- confirmação de leitura;
- notificações;
- chamadas;
- empresas e workflow completo;
- integrações externas;
- IA e RAG;
- aplicativo mobile.

Esses itens exigem especificação e autorização próprias. Não devem ser inferidos como necessários para publicar o chat atual.

## Sistemas que o Orion não substitui

O Orion não substitui Alterdata, Acessórias, e-CAC, sistemas da Receita Federal, sistemas oficiais nem provedores de e-mail.

## Proteção de dados

Dados reais de clientes não podem ser usados em testes, seeds ou exemplos. Documentos, credenciais, tokens e informações sensíveis não podem ser versionados nem enviados a modelos de IA.
