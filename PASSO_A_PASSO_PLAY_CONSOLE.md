# Publicar o VEN na Google Play — passo a passo

## A. Preparação (GitHub)
1. Criar a chave e cadastrar os 4 Secrets (ver ASSINATURA_FIXA_PASSO_A_PASSO.md).
2. Ligar o GitHub Pages: repositório Ven > Settings > Pages > Branch `main`, pasta `/docs`. Testar abrindo
   https://leoportilla.github.io/Ven/privacidade.html e .../termos.html (podem levar alguns minutos).
3. Subir os arquivos do projeto. O workflow "VEN - Compilar APK automaticamente" gera o APK para teste no seu celular.
4. Actions > "VEN - Gerar AAB para Google Play (manual)" > Run workflow. Baixe o artefato `VEN-AAB-Google-Play` (zip com `app-release.aab`).

## B. Play Console
1. Criar app: nome "VEN – Orçamentos e Vendas", idioma Português (Brasil), tipo **App**, **Gratuito** (a venda será compra dentro do app).
2. Ativar o **Play App Signing** quando for pedido (aceitar o padrão). Sua chave fixa vira a chave de envio.
3. Painel > "Configurar seu app": política de privacidade (URL acima), anúncios (não), acesso ao app (sem login),
   classificação de conteúdo (questionário), público-alvo (adultos), segurança dos dados (usar PLAY_STORE_FICHA.md),
   categoria Negócios e e-mail de contato leoportilladev@gmail.com.
4. Ficha principal: textos de PLAY_STORE_FICHA.md, ícone 512x512, imagem 1024x500, capturas de tela.
5. Testes > **Teste interno** > Criar versão > enviar o `app-release.aab` > adicionar os e-mails dos testadores > salvar e publicar.
   Os testadores aceitam o convite pelo link e instalam pela Play.
6. Depois do primeiro envio: Monetizar > Produtos > **Produtos no app** > criar `ven_desbloqueio` (compra única), definir o preço.
   Configurar também testadores de licença (Configurações > Testes de licença) para testar a compra sem cobrar.
7. Se a conta for pessoal nova: Testes > **Teste fechado** com os testadores mínimos exigidos por 14 dias seguidos, depois pedir acesso à produção.
8. Produção: criar versão, enviar, revisar e publicar.

## C. Cuidados
- versionCode precisa subir a cada envio (o projeto já cuida disso).
- Guarde a chave .jks e as senhas. Sem elas não é possível enviar atualizações (a Play permite pedir troca da chave de envio, mas dá trabalho).
- O APK do GitHub e o app instalado pela Play têm assinaturas diferentes: não atualizam um ao outro. Em quem testa pela Play, desinstale o do GitHub antes.
