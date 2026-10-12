# Testes e validação

Notas consolidadas das versões anteriores.

## ALFA_TESTES.md

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

## ALPHA22_NOTAS_TESTE.md

# VEN Alpha 22 — correção dos três controles de navegação

Alteração principal: remover `SYSTEM_UI_FLAG_LAYOUT_STABLE` e manter `SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION` em `MainActivity.java`. O objetivo é preservar o desenho na área inferior de gestos sem deslocar os três controles do Android para perto do relógio.

Versão: `2.0.0-alpha.22`
versionCode: `25`
applicationId: `br.com.ven.app`

## Validação
- Abrir `VEN_TESTE_PC.html` permite conferir apenas a interface HTML.
- A barra de status e a barra de navegação só podem ser validadas num Android real.
- Este pacote contém o projeto-fonte, não um APK compilado. O ambiente atual não tem Gradle/Android SDK configurados para compilar localmente.
- A assinatura do APK gerado pelo GitHub precisa ser verificada separadamente antes de tentar atualizar uma instalação existente.

## ALPHA23_NOTAS_TESTE.md

# VEN Alpha 23 — correção de menu e Releases

- `versionName`: `2.0.0-alpha.23`
- `versionCode`: `26`
- `applicationId`: `br.com.ven.app`

## Alterações
1. O botão de menu de três linhas usa a altura real da barra de status fornecida pelo Android, para ficar alinhado ao cabeçalho em aparelhos reais. No PC, a variável permanece zero e o botão mantém sua posição anterior.
2. O workflow principal volta a compilar `assembleDebug`, salvar o APK como artefato e publicar a Release numerada e `latest-alpha` automaticamente, sem depender de Secrets que não foram configurados.

## Validação e limites
- Fonte e workflow revisados localmente; não há Android SDK/Gradle configurado neste ambiente para executar a compilação Android.
- A compilação automática só será confirmada quando o GitHub Actions concluir a execução.
- O APK debug usa uma chave criada pelo runner; assinatura persistente ainda é necessária para atualizações por cima da instalação existente.

