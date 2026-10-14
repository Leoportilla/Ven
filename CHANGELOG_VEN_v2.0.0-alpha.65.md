# VEN 2.0.0-alpha.65 — preparação para a Google Play

- "Sobre o VEN" reescrito: descrição, desenvolvedor, suporte, privacidade, termos, componentes de terceiros.
- Atualizador do GitHub passa a existir só no APK de uso próprio (`-PgithubUpdater=true`); na versão da Play fica desligado e oculto.
- targetSdk 35 (layout atual preservado no Android 15 com opt-out de borda a borda).
- Câmera não obrigatória (uses-feature), `allowBackup` desligado.
- Novo workflow manual `play-aab.yml` gera o AAB assinado.
- Pasta `docs/` com política de privacidade e termos (GitHub Pages) e `PLAY_STORE_FICHA.md` com os textos da ficha.
