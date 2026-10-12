# VEN 2.0.0-alpha.22

- Correção experimental da barra de navegação do Android: mantém `SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION` para a área inferior de gestos e remove `SYSTEM_UI_FLAG_LAYOUT_STABLE`, que estava associado ao deslocamento dos três controles do sistema.
- `versionCode`: 25 (incrementado de 24).
- `applicationId` mantido: `br.com.ven.app`.
- Esta alteração ainda precisa ser validada em aparelho Android real.

# VEN 2.0.0-alpha.21 — assinatura estável via GitHub Actions

- VersionCode: 24 (incrementado).
- Configurado `signingConfigs.release` lendo credenciais de variáveis de ambiente.
- Workflows `android.yml` e `release-alpha.yml` agora geram `app-release.apk` assinado.
- O keystore é decodificado em tempo de execução e não é incluído no repositório.
- Adicionado `app/keystore.jks` ao `.gitignore`.

**Importante:** a atualização sobre uma instalação existente só funciona se os Secrets apontarem para a mesma chave que assinou o APK instalado. Não foi possível verificar qual chave assinou as versões anteriores. Os workflows exigem os quatro Secrets e falham se estiverem ausentes.
