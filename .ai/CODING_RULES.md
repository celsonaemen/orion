# Regras de Desenvolvimento

Estas regras devem orientar qualquer implementação futura do Projeto Orion.

## Linguagem e tipagem

- TypeScript é obrigatório.
- Modo strict deve ser usado.
- Evitar `any` sem justificativa técnica documentada.
- Tipos compartilhados devem ser claros, pequenos e revisáveis.

## Backend

- Entradas devem ser validadas.
- DTOs são obrigatórios para contratos de entrada e saída quando aplicável.
- Controllers não devem conter regra de negócio.
- Services devem concentrar regras de negócio.
- Repositories devem isolar persistência.
- Prisma deve ser usado para persistência.
- Acesso direto ao banco fora da camada planejada deve ser evitado.
- Erros devem ser tratados de forma explícita.
- Regras críticas devem ter testes.

## Frontend

- O frontend não pode acessar o banco diretamente.
- O frontend deve consumir APIs do backend.
- Componentes devem ser reutilizáveis quando houver repetição real.
- Componentes devem ter responsabilidades claras.
- Estados de erro, carregamento e vazio devem ser considerados.
- Regra de negócio crítica não deve ficar no frontend.

## Segurança

- Credenciais não podem ser versionadas.
- Tokens não podem ser versionados.
- Dados reais de clientes não podem ser usados em seeds, testes ou exemplos.
- Logs não devem expor senhas, tokens ou documentos sensíveis.

## Qualidade

- Alterações devem ser pequenas e revisáveis.
- Código morto deve ser removido.
- Dependências desnecessárias devem ser evitadas.
- Nomes devem refletir intenção.
- Comentários devem explicar decisões, não repetir o código.
- Testes devem cobrir partes críticas.

## Documentação

- Documentação deve ser atualizada junto de decisões relevantes.
- `.ai/DECISIONS.md` deve registrar decisões técnicas importantes.
- `.ai/CURRENT_STATE.md` deve ser atualizado após mudanças relevantes.
- Antes de afirmar que algo está implementado, o estado real do código deve ser verificado.
