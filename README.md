# VEN — Vendas sem complicação

**Versão de teste: 2.0.0-alpha.13**  
**Status: ALFA — uso experimental; ainda não é uma versão para produção.**

O VEN é um aplicativo Android para pequenos negócios, com orçamento, catálogo e cadastro manual, leitura de código de barras, clientes, vendas, recebimentos/vencimentos, relatórios/metas, avisos, impressão/PDF, WhatsApp, personalização visual, dados da empresa e backup/restauração.

## Identidade e autoria
- Produto: VEN — Vendas sem complicação
- Desenvolvedor: Leonardo Portilla
- Contato: Leoportillagraf@gmail.com
- Localidade informada: Porto Alegre/RS, Brasil
- Android application ID: `br.com.ven.app`
- Versão alfa: `2.0.0-alpha.1` (`versionCode 4`)

## O que significa ALFA
Esta compilação é destinada a testes iniciais. Pode conter falhas, alterações de dados e recursos ainda incompletos. Faça backup antes de testar e não use como única ferramenta para controlar operações comerciais reais. Não há garantia de compatibilidade de dados entre futuras versões alfa.

## Testar no PC
Abra `VEN_TESTE_PC.html` num navegador atualizado. O teste no navegador não cobre recursos nativos do Android, como scanner, notificações, impressão do sistema ou abertura de aplicativos externos.

## Gerar APK pelo GitHub Actions
1. Crie um repositório GitHub vazio chamado `VEN-App` (recomendado: **privado durante a fase alfa**).
2. Extraia este ZIP numa pasta nova.
3. No GitHub Desktop, adicione a pasta local existente como repositório, revise as alterações e faça o primeiro commit.
4. Publique no GitHub apenas depois de conferir que não há dados reais, senhas, chaves ou backups pessoais.
5. O workflow **Build VEN Alpha** compila o APK debug e disponibiliza o arquivo como artefato da execução em Actions.
6. Para criar uma pré-versão de teste, crie e envie a tag `v2.0.0-alpha.1`. O workflow de release cria um GitHub Pre-release com o APK debug anexado.

O APK debug é apenas para testes. Não é um APK de produção assinado para a Google Play.

## Requisitos técnicos
- Android Gradle Plugin 8.7.3
- Gradle 8.9 no GitHub Actions
- JDK 17
- Android SDK 35
- `minSdk 23`, `targetSdk 34`

O workflow instala a versão especificada do Gradle e não depende de um Gradle Wrapper dentro do repositório.

## Privacidade e dados
Os dados de negócio são armazenados localmente pelo aplicativo. A alfa ainda precisa de uma revisão de privacidade, retenção/exportação de dados e testes de migração antes de uma distribuição ampla. Não inclua dados reais de clientes em issues ou logs públicos.

## Escopo futuro — ainda não implementado
- Cadastro configurável de produtos, serviços, mão de obra e campos personalizados.
- Demonstração de 7 dias e compra única permanente, usando Google Play Billing corretamente.
- Política de privacidade publicada, ficha da loja, materiais promocionais e perfis oficiais de redes sociais.

Nenhuma publicação na Google Play ou criação de redes sociais é feita por este pacote.


## Versão atual

**VEN 2.0.0-alpha.4** — nova identidade visual azul-claro/laranja/branco; `versionCode` 7. O projeto preserva a camada SQLite e a correção de tela fixa herdadas da alpha.3. A compilação real e o teste no aparelho ainda devem ser confirmados no GitHub Actions.


## Atualizações alfa via GitHub

A configuração `Configurações > Atualizações` consulta a release pública `latest-alpha`. O workflow `.github/workflows/android.yml` compila em cada push e atualiza a release. Configure `UPDATE_OWNER` e `UPDATE_REPO` em `MainActivity.java` para o dono/nome reais do repositório. O repositório precisa ser público para o app consultar a API sem token. O APK atual é debug e não deve ser distribuído ao público; configure assinatura estável antes de testar atualizações por cima de instalações existentes.
