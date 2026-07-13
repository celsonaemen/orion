# Papéis e Permissões

Este documento descreve a visão conceitual inicial de papéis e permissões do Orion. As regras finais deverão ser detalhadas durante a implementação do Orion Core.

## Hierarquia

1. Gerente
2. Coordenador
3. Setorial
4. Auxiliar

## Gerente

O Gerente poderá supervisionar conversas, setores e operações do escritório conforme permissões configuradas.

Requisitos importantes:

- acesso auditável;
- transparência sobre supervisão;
- controle por permissão;
- registro de ações sensíveis.

## Coordenador

O Coordenador poderá supervisionar informações e conversas do seu setor.

Requisitos importantes:

- acesso limitado ao setor;
- visão operacional;
- apoio ao acompanhamento de rotinas e pendências.

## Setorial

O Setorial terá acesso operacional ao seu setor, conforme atribuições definidas.

Requisitos importantes:

- foco nas atividades do setor;
- acesso apenas ao necessário;
- rastreabilidade de ações relevantes.

## Auxiliar

O Auxiliar terá acesso somente às conversas, grupos, tarefas e informações autorizadas ou atribuídas.

Requisitos importantes:

- menor privilégio;
- acesso objetivo;
- ausência de visibilidade indevida sobre dados sensíveis.

## Auditoria

Toda ação administrativa e todo acesso gerencial relevante deverão ser auditáveis. A auditoria deve permitir responder quem acessou, o que acessou, quando acessou e por qual permissão.
