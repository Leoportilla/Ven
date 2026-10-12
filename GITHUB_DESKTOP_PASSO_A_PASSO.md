# Publicar a primeira alfa pelo GitHub Desktop

## Antes de começar
- Use esta pasta extraída como uma cópia nova e separada.
- Recomenda-se criar o repositório `VEN-App` como **privado** durante os testes alfa.
- Não inclua dados reais de clientes, arquivos de backup, tokens, senhas ou chaves de assinatura.

## Primeiro envio
1. No GitHub, crie um repositório vazio `VEN-App`. Não adicione README, licença nem `.gitignore` online, pois eles já existem localmente.
2. Abra GitHub Desktop e selecione **File → Add Local Repository** (ou **Add an Existing Repository**).
3. Selecione a pasta extraída deste ZIP. Se o GitHub Desktop disser que não é um repositório Git, escolha a opção para criar um repositório dentro dessa pasta.
4. Confira a lista de arquivos. Garanta que não há `local.properties`, `*.jks`, `*.keystore`, backups reais ou dados pessoais.
5. Faça o commit inicial com a mensagem `Prepare VEN 2.0.0-alpha.1`.
6. Use **Publish repository** ou **Push origin** para enviar a base ao GitHub.
7. No GitHub, abra **Actions → Build VEN Alpha** e confirme que a compilação terminou com sucesso. Baixe o APK em **Artifacts**.

## Criar a pré-release alfa (opcional, após o build passar)
No GitHub Desktop, abra **Repository → Create Tag**, crie `v2.0.0-alpha.1`, e publique a tag. O workflow de release cria uma GitHub Pre-release e anexa o APK debug.

## Importante
- Não use esse APK para publicar na Google Play.
- Não marque como versão estável.
- Não publique o repositório como público antes de rever privacidade, licenças de dependências e todo o conteúdo versionado.
- Se o build falhar, abra a execução em Actions e copie o erro completo do primeiro passo vermelho. Não apague nem substitua arquivos às cegas.
