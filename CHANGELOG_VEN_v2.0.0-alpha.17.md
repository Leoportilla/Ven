# VEN 2.0.0-alpha.17

- Restaurada a ação **Buscar atualização** na tela Sobre o VEN.
- Resultado da consulta mostra status e abre a página da release quando há versão mais recente.
- Ajustada a sincronização da cor da barra de navegação do Android com a visibilidade real do teclado, sem depender apenas do foco do campo.
- `versionCode`: 20.

## Limitações conhecidas
- A busca leva à página pública da release; download/instalação silenciosa não são feitos pelo app. O Android exige confirmação de instalação.
- A atualização por cima só funciona se o APK tiver o mesmo `applicationId` e a mesma chave de assinatura da versão instalada. Este pacote não contém nem substitui uma chave privada de assinatura.
- Build e teste em aparelho ainda precisam ser confirmados pelo GitHub Actions e pelo usuário.
