# VEN 2.0.0-alpha.21 — assinatura estável via GitHub Actions

- VersionCode: 24 (incrementado).
- Configurado `signingConfigs.release` lendo credenciais de variáveis de ambiente.
- Workflows `android.yml` e `release-alpha.yml` agora geram `app-release.apk` assinado.
- O keystore é decodificado em tempo de execução e não é incluído no repositório.
- Adicionado `app/keystore.jks` ao `.gitignore`.

**Importante:** a atualização sobre uma instalação existente só funciona se os Secrets apontarem para a mesma chave que assinou o APK instalado. Não foi possível verificar qual chave assinou as versões anteriores. Os workflows exigem os quatro Secrets e falham se estiverem ausentes.
