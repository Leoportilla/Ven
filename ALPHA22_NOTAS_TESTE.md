# VEN Alpha 22 — correção dos três controles de navegação

Alteração principal: remover `SYSTEM_UI_FLAG_LAYOUT_STABLE` e manter `SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION` em `MainActivity.java`. O objetivo é preservar o desenho na área inferior de gestos sem deslocar os três controles do Android para perto do relógio.

Versão: `2.0.0-alpha.22`
versionCode: `25`
applicationId: `br.com.ven.app`

## Validação
- Abrir `VEN_TESTE_PC.html` permite conferir apenas a interface HTML.
- A barra de status e a barra de navegação só podem ser validadas num Android real.
- Este pacote contém o projeto-fonte, não um APK compilado. O ambiente atual não tem Gradle/Android SDK configurados para compilar localmente.
- A assinatura do APK gerado pelo GitHub precisa ser verificada separadamente antes de tentar atualizar uma instalação existente.
