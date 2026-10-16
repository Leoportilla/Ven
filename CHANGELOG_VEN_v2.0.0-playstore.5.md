# VEN 2.0.0-playstore.5 — microinterações e carregamento

- Adicionados estados de hover apenas para dispositivos com ponteiro, sem afetar a experiência por toque.
- Adicionadas transições suaves entre telas e estados visuais de botões/cartões.
- Respeitada a preferência do sistema por movimento reduzido.
- Adicionados estilos reutilizáveis de skeleton/shimmer e spinner.
- Consultas assíncronas de CEP e CNPJ agora exibem spinner e mensagens de sucesso/fallback para preenchimento manual.

Validação realizada: sintaxe JavaScript inline verificada com `node --check`. A compilação Android completa ainda precisa ser confirmada pelo GitHub Actions.
