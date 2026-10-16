# VEN-Playstore — projeto separado para preparar o AAB

Este repositório separado foi baseado na versão estável **VEN 2.0.0-alpha.67**. Ele não substitui nem altera o repositório original VEN.

## Configuração desta cópia
- `applicationId`: `br.com.ven.app` (mantido)
- `versionName`: `2.0.0-playstore.1`
- `versionCode`: `69`
- `compileSdk` e `targetSdk`: `36`
- JDK: `17`
- Android Gradle Plugin: `8.13.2`
- Gradle: `8.13`
- Um único workflow: gerar AAB manualmente em GitHub Actions
- Atualizador do GitHub desligado por padrão nesta variante

## Como testar
1. Mantenha este projeto em um repositório separado e privado enquanto testa.
2. Antes do primeiro commit, confira as alterações no GitHub Desktop. Nunca envie `.jks`, senhas, dados reais de clientes ou backups.
3. No GitHub, configure os Secrets `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` e `KEY_PASSWORD` com a mesma chave de assinatura de envio que você já criou e guardou com segurança. Não compartilhe esses valores no chat.
4. Abra **Actions** e execute **VEN - Gerar AAB para Google Play (manual)** com **Run workflow**.
5. Se o processo concluir, baixe o artefato `VEN-Playstore-AAB` da execução e teste/valide antes de pensar em enviar à Play Console.

## Importante
Este ZIP foi revisado para corrigir a combinação de versões do Android Gradle Plugin e Gradle e para evitar workflows antigos produzindo releases paralelas. **O AAB não foi compilado nesta preparação**; o resultado real só será confirmado quando o GitHub Actions executar.

A dependência do Google Play Billing está presente, mas a compra/desbloqueio ainda precisa ser implementada e testada no código antes de vender recursos dentro do app. Ter a dependência não significa que pagamentos já funcionem.


## Atenção sobre cobrança
Esta cópia está preparada para gerar o AAB de teste `2.0.0-playstore.2` (versionCode 70). A dependência Billing está presente, mas a assinatura mensal de R$ 7,00, os 7 dias grátis e o bloqueio/restauração de acesso ainda **não** estão implementados. Não publique como versão comercial até implementar e validar esses fluxos.
