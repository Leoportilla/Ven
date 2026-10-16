# Notas de compilação Play Store

- Base funcional: VEN alpha.67.
- API alvo configurada: 36.
- AGP 8.13.2 com Gradle 8.13 e JDK 17.
- AAB produzido por workflow manual.
- Não incluir arquivo de assinatura no repositório.
- O workflow exige os quatro Secrets de assinatura e não altera nem remove caracteres das senhas.
- Build ainda precisa ser confirmado no GitHub Actions; não presumir sucesso antes de ver a execução verde e o artefato.
- A implementação de Google Play Billing ainda não foi concluída.

- Versão preparada para a próxima compilação: `2.0.0-playstore.2` (versionCode 70).
- Esta atualização de versão não adiciona lógica de cobrança; Billing ainda precisa ser implementado antes de cobrar usuários.
