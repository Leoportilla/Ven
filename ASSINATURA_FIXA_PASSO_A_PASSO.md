# Assinatura fixa do VEN (fazer uma única vez)

## 1. Criar a chave (no Windows, no PowerShell)
Precisa do Java (keytool). Se não tiver, instale o Temurin 17.

    keytool -genkeypair -v -keystore ven-chave.jks -alias ven -keyalg RSA -keysize 2048 -validity 10000

Escolha uma senha forte (use a mesma para a chave se ele perguntar) e preencha os dados pedidos.
**Guarde o arquivo ven-chave.jks e a senha em local seguro FORA do GitHub** (nuvem pessoal + pendrive). Se perder, não dá mais para atualizar por cima.

## 2. Converter para texto (Base64)
    [Convert]::ToBase64String([IO.File]::ReadAllBytes("ven-chave.jks")) | Set-Clipboard

(copia o texto para a área de transferência)

## 3. Cadastrar os Secrets no GitHub
Repositório do VEN > Settings > Secrets and variables > Actions > New repository secret. Crie 4:

| Nome | Valor |
|---|---|
| KEYSTORE_BASE64 | o texto copiado no passo 2 |
| KEYSTORE_PASSWORD | a senha da chave |
| KEY_ALIAS | ven |
| KEY_PASSWORD | a mesma senha |

## 4. Primeira instalação
1. No app VEN atual, faça o **backup** dentro do app.
2. Desinstale o VEN do celular (só nesta vez).
3. Envie estes arquivos ao GitHub, espere o build e instale o novo APK.
4. Restaure o backup.

Daqui em diante, todas as versões instalam por cima mantendo os dados.

## Observação
O arquivo .jks e as senhas nunca devem ir para o repositório (o .gitignore já bloqueia).
