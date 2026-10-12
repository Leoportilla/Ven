# Plano mínimo de testes alfa

Antes de considerar esta alfa aceitável, testar no PC e num aparelho Android real:

- [ ] Abrir o aplicativo e navegar por todas as abas.
- [ ] Criar, editar, salvar, reabrir e excluir orçamento de teste.
- [ ] Criar cliente e conferir associação com orçamento/venda.
- [ ] Conferir catálogo, cadastro manual e leitura de código de barras.
- [ ] Conferir fechamento como venda, condição de pagamento, vencimentos e marcação de pago.
- [ ] Conferir relatórios e meta mensal.
- [ ] Conferir exportação e restauração de backup de teste.
- [ ] Conferir WhatsApp, impressão/PDF, permissões e notificações no Android.
- [ ] Testar atualização por cima de uma instalação alfa anterior, se houver dados de teste.
- [ ] Registrar modelo do aparelho, versão Android, passos para reproduzir e resultado esperado/real.

Use somente dados fictícios. Guarde uma cópia do backup antes de testar restauração.


## Atualização alpha.4
- [ ] Confirmar que o ícone de lançamento usa fundo azul claro, V laranja e detalhe branco.
- [ ] Confirmar que o app abre sem zoom e que botões/telas continuam acessíveis.
- [ ] Confirmar a migração SQLite e a presença do backup `VEN_PRE_MIGRACAO_*.json` antes de usar os dados migrados.
- [ ] Confirmar build APK verde no GitHub Actions e instalar no aparelho.


## Alpha.7 — produto e serviço
- [ ] Cadastrar produto com estoque e custo.
- [ ] Cadastrar serviço com valor fixo.
- [ ] Cadastrar mão de obra por hora e conferir unidade / hora no orçamento.
- [ ] Salvar campos personalizados e editar o item.
- [ ] Confirmar ícone azul-claro com V laranja e detalhe branco no APK instalado.


## Alpha.8 — logo e teclado
- [ ] Confirmar ícone instalado: fundo azul-claro, V inteiro laranja e detalhe branco.
- [ ] Focar campos em diferentes telas e verificar que a navegação inferior desaparece imediatamente.
- [ ] Observar a animação do teclado: nenhuma faixa azul deve permanecer abaixo dele.
- [ ] Repetir em tema claro e escuro e fechar o teclado para conferir restauração da navegação.
