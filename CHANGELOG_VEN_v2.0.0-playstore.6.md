# VEN 2.0.0-playstore.6 — correções para teste

- O pedido em andamento agora mostra um resumo visível ao ser retomado pela Home.
- A confirmação de novo pedido exibe itens, cliente e total antes de substituir o rascunho.
- A consulta de CNPJ tenta uma segunda fonte pública quando a primeira estiver indisponível. CPF permanece manual.
- A transição do PIN prepara a janela e as barras do sistema antes de exibir a tela, para reduzir o flash visual.
- Ao adicionar produto, há vibração tátil curta e feedback visual no botão +.
- Versão de teste: versionCode 74.

A compilação Android completa e a consulta de CNPJ em rede real ainda precisam ser validadas no GitHub Actions e no dispositivo.

- Correção adicional: normaliza a resposta do OpenCNPJ (`data.razaoSocial`, `data.nomeFantasia` e campos de endereço/contato), sem sobrescrever valores já digitados manualmente.
