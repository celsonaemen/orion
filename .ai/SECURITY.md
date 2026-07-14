# Segurança do Projeto Orion

## Segredos e credenciais

- Nunca versionar `.env`.
- Nunca versionar tokens.
- Nunca versionar senhas.
- Nunca versionar chaves privadas.
- Nunca registrar senhas, tokens ou segredos em logs.
- Arquivos `.env.example` podem existir, mas apenas com nomes de variáveis e valores fictícios.

## Dados reais

- Nunca usar CPF real em testes, seeds ou exemplos.
- Nunca usar CNPJ real em testes, seeds ou exemplos.
- Nunca armazenar documentos contábeis no Git.
- Nunca armazenar documentos de clientes no Git.
- Nunca enviar documentos reais para modelos de IA durante os testes iniciais.

## Controle de acesso

- Usar menor privilégio como regra padrão.
- Permissões devem ser explícitas.
- Acesso gerencial deve ser auditável.
- Supervisão deve ser transparente e controlada por permissão.

## Sessões e autenticação

- Sessões devem ter expiração.
- Refresh tokens devem poder ser revogados.
- Refresh tokens devem ser armazenados somente como hash.
- Senhas devem ser protegidas com hashing adequado.
- Seeds podem usar apenas credenciais fictícias de desenvolvimento local.
- Comunicação deve usar criptografia em trânsito em ambientes publicados.

## Auditoria

- Ações sensíveis devem gerar logs de auditoria.
- Logs de auditoria devem registrar ator, ação, alvo e horário.
- Logs não devem conter segredos.
- Logs não devem conter senhas, tokens, hashes de tokens ou conteúdo completo de mensagens.
- Logs devem ser úteis para revisão de acessos e alterações.

## Ambientes

- Desenvolvimento e produção devem ser separados.
- Dados reais não devem ser usados em desenvolvimento local sem autorização explícita.
- Configurações de ambiente devem ser externas ao código.
- A senha `orion_dev` do Docker Compose é apenas para desenvolvimento local.
- `.env.example` deve conter somente placeholders e valores fictícios.

## Retenção de mensagens

Uma política futura de retenção de mensagens deverá definir:

- prazo de retenção;
- regras de exclusão;
- regras de exportação;
- responsabilidades;
- requisitos legais e operacionais.

## IA local

- IA local não deve ser exposta automaticamente para a rede.
- Providers de IA devem ser configurados de forma explícita.
- Documentos reais não devem ser usados em testes iniciais com IA.
- O uso de modelos externos dependerá de análise de privacidade e autorização.
