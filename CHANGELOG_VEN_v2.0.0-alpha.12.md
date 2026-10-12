# VEN 2.0.0-alpha.12

- Adicionada seção Configurações > Atualizações.
- Preferência para ativar/desativar verificação automática (até uma vez a cada 24 horas ao abrir o app).
- Verificação manual de release pública `latest-alpha` no GitHub.
- Quando houver versão maior, o app mostra a versão e abre a página da release para o usuário baixar e confirmar a instalação.
- GitHub Actions compila em cada push para `main`/`master`, guarda o APK como artefato e atualiza a release alfa.

## Limitações importantes
- A release precisa estar em repositório público para consulta sem autenticação.
- O fluxo atual usa APK debug; não distribua para usuários finais. Para instalar atualizações por cima sem erro de assinatura, configurar keystore estável em GitHub Secrets e build assinado.
- O Android exige confirmação do usuário para instalação de APK externo; não há instalação silenciosa normal.
