# Instruções para Agentes

Qualquer agente de código, IA ou desenvolvedor automatizado deve seguir estas regras ao trabalhar no Projeto Orion.

## Antes de trabalhar

1. Ler toda a pasta `.ai/`.
2. Ler `.ai/CURRENT_STATE.md`.
3. Respeitar `.ai/DECISIONS.md`.
4. Respeitar `.ai/CODING_RULES.md`.
5. Verificar o estado real do código antes de afirmar que algo está implementado.
6. Trabalhar somente dentro da raiz do repositório Orion.

## Durante o trabalho

1. Não alterar arquitetura sem autorização.
2. Não executar push automaticamente.
3. Não inserir dados sensíveis.
4. Não versionar credenciais, tokens, senhas ou documentos reais.
5. Não implementar integrações externas fora da fase aprovada.
6. Não implementar IA ou RAG sem aprovação específica.
7. Manter alterações pequenas e revisáveis.

## Depois de mudanças relevantes

1. Atualizar a memória permanente em `.ai/`.
2. Atualizar `.ai/CURRENT_STATE.md`.
3. Registrar decisões técnicas em `.ai/DECISIONS.md`.
4. Documentar mudanças relevantes em `docs/` quando fizer sentido.
5. Executar verificações compatíveis com a mudança.

## Fonte oficial

A pasta `.ai/` é a fonte oficial de contexto do Projeto Orion.
