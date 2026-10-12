# VEN 2.0.0-alpha.18

- Corrige a navegação inferior durante a digitação: o menu azul é ocultado temporariamente enquanto o teclado virtual está aberto.
- O menu deve reaparecer quando o teclado for recolhido, sem depender de perder o foco do campo.
- Mantida a tela “Sobre o VEN” com o botão “Buscar atualização”.
- versionCode: 21.

## Pendências conhecidas
- O botão de atualização consulta a Release do GitHub e abre sua página; o download/instalação automática do APK ainda precisa ser implementado e testado.
- Atualização por cima exige a mesma chave de assinatura usada no APK instalado.
- Este pacote não foi compilado por Gradle nesta sessão; validar no GitHub Actions antes de instalar.
