# VEN 2.0.0-alpha.41

Base: alpha.40 marco de referência.

## Segurança com PIN (primeira etapa)
- Adicionada opção Configurações > Proteção com PIN.
- Cadastro e confirmação de PIN numérico de 4 a 6 dígitos.
- PIN salvo como hash derivado com salt aleatório (PBKDF2-HMAC-SHA256), não como texto puro.
- Solicitação de PIN ao abrir o aplicativo quando a proteção estiver ativa.
- Alteração ou desativação exige confirmação do PIN atual.
- PIN armazenado em preferências nativas Android, separado dos dados comerciais do HTML.

## Limites desta alfa
- Ainda não inclui bloqueio por inatividade nem impressão digital.
- Não foi possível executar build Android local nesta sessão; o projeto deve ser compilado no GitHub Actions e testado no aparelho antes de considerar a funcionalidade validada.
