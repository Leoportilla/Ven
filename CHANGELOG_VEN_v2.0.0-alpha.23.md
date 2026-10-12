# VEN 2.0.0-alpha.23

- Corrige o posicionamento vertical do botão de menu de três linhas no Android, usando a altura real da barra de status, sem alterar a posição no navegador do PC.
- Recupera a publicação automática da versão numerada e do canal `latest-alpha` a partir do APK debug gerado no GitHub Actions.
- `versionCode`: 26.

## Limitação conhecida
O APK debug do GitHub Actions é assinado com uma chave de depuração criada no runner. Isso permite publicar e instalar para teste, mas não garante atualização sobre versões anteriores. Para atualizações consistentes, é necessária uma chave de assinatura persistente.
