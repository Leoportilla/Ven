# VEN 2.0.0-alpha.15

- Ajustado o controle da navegação inferior para acompanhar a abertura e o recolhimento real do teclado, não apenas o foco do campo.
- Implementada a ponte nativa `setBarraTeclado` para sincronizar a cor da barra de navegação Android com o fundo do campo durante a digitação.
- Mantido `adjustResize` e o comportamento de redimensionamento da janela.
- Workflow atualizado para publicar uma Release numerada por versão e manter `latest-alpha` como canal de atualização.

## Limitações a validar

- Esta versão ainda precisa ser compilada e testada em aparelho Android real.
- Atualização por cima da instalação existente exige que o APK tenha a mesma chave de assinatura da versão instalada. O workflow atual usa assinatura debug gerada no runner; para estabilidade, configure um keystore fixo nos GitHub Secrets antes de prometer atualização sem desinstalar.
- O download e início automático do instalador dentro do app não foram implementados neste pacote; a Release mantém o APK disponível para download.
