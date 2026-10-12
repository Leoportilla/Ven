# VEN 2.0.0-alpha.12
- Cadastro: título e botão mudam para "Cadastrar/Salvar serviço" ou "produto"; edição mostra "Editar …/Salvar alterações".
- Seletor Produto/Serviço e "Valor fixo / Por hora" agora são controles deslizantes (estilo moderno). Unidade só aparece para serviço de valor fixo.
- Janela de cadastro com rodapé fixo (Cancelar/Salvar sempre visíveis, inclusive com o teclado aberto) e rolagem só no meio.
- Teclado: a barra inferior do Android e o fundo da janela assumem a cor da tela enquanto se digita (sem faixa azul). Manifesto com adjustResize.
- Pedido: busca atualiza só a lista (sem redesenhar a tela), cliente em destaque, desconto/observações recolhíveis, totais agrupados, ação principal grande e "Limpar" discreto.
- Desempenho: busca com debounce, listas com content-visibility.
- Logo oficial novo (V com seta) apenas como ícone do app (adaptativo + legado) e ícone de notificação; fora da Home e do menu.
- Rodapé: no HTML de teste (computador) a barra inferior não some mais ao digitar; só aparelhos de toque a escondem enquanto o teclado está aberto, e ela sempre volta ao sair do campo.
