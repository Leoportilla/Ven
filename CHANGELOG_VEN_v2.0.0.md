## 2.0.0-alpha.10
- Corrigido erro de sintaxe JavaScript causado pela inserção do CSS do seletor dentro do HTML de impressão.
- Mantido o seletor moderno de Produto/Serviço e as demais alterações da alpha.9.

## VEN 2.0.0-alpha.6
- Corrigido o modal de Dados da empresa: altura limitada à área útil do celular, rolagem interna e respeito às áreas seguras do sistema.
- A navegação inferior fica oculta enquanto configurações estão abertas, evitando cobrir campos e botões.
- Removida do menu a opção de importação TXT de produtos/códigos de barras; o recurso legado fica fora do fluxo público até ser replanejado.
- `versionCode` incrementado para 9 e `versionName` para `2.0.0-alpha.6`.

# VEN 2.0.0 — nova base funcional

- Baseado no projeto IAGER estável v1.61, preservando suas funcionalidades de negócio e integrações nativas.
- Identificador Android migrado para `br.com.ven.app`; nome, preferências nativas, avisos e impressão rebatizados.
- Ícone do app substituído pela identidade VEN.
- Dados padrão da empresa antiga removidos para evitar carregar informações de terceiros.
- Preferências e chaves de armazenamento alinhadas com `ven_*` quando possível.
- Backup aceita o formato antigo IAGER e remapeia chaves conhecidas para VEN.
- Adicionada tela “Sobre o VEN” com autoria, contato, localidade e status honesto da futura licença.
- Importação TXT mantida temporariamente para não perder recurso antes de substituir pelo cadastro flexível.
- Não contém ainda trial/licença de compra real nem perfis sociais publicados.

## 2.0.0-alpha.11
- Código interno de produtos/serviços preenchido automaticamente no formato MAN-0001, MAN-0002 etc., sempre buscando um código livre.
- Campo continua editável antes de salvar.
- Aplicado tanto ao HTML de teste no PC quanto à tela carregada pelo Android.
