# VEN Alpha 23 — correção de menu e Releases

- `versionName`: `2.0.0-alpha.23`
- `versionCode`: `26`
- `applicationId`: `br.com.ven.app`

## Alterações
1. O botão de menu de três linhas usa a altura real da barra de status fornecida pelo Android, para ficar alinhado ao cabeçalho em aparelhos reais. No PC, a variável permanece zero e o botão mantém sua posição anterior.
2. O workflow principal volta a compilar `assembleDebug`, salvar o APK como artefato e publicar a Release numerada e `latest-alpha` automaticamente, sem depender de Secrets que não foram configurados.

## Validação e limites
- Fonte e workflow revisados localmente; não há Android SDK/Gradle configurado neste ambiente para executar a compilação Android.
- A compilação automática só será confirmada quando o GitHub Actions concluir a execução.
- O APK debug usa uma chave criada pelo runner; assinatura persistente ainda é necessária para atualizações por cima da instalação existente.
