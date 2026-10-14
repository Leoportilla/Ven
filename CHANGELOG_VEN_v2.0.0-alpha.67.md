# VEN 2.0.0-alpha.67

- Ao usar “Zerar dados do aplicativo”, agora também são apagados os dados da empresa (nome, nome fantasia, documento, endereço, telefone, e-mail e logotipo).
- A preferência de aparência (modo claro/escuro) continua preservada.
- Mantida a assinatura fixa e incrementado o versionCode para permitir atualizar a instalação anterior por cima.
- Consolidado o fluxo de publicação: o workflow principal publica o APK assinado na Release da versão e atualiza `latest-alpha`; removido o workflow duplicado que publicava APK de debug no mesmo tag.
