package br.com.ven.app;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.SharedPreferences;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;


import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanner;
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning;

import org.json.JSONObject;
import org.json.JSONArray;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {
    private WebView webView;
    private WebView printWebView; // mantem referencia enquanto a impressao esta aberta
    private ValueCallback<Uri[]> filePathCallback;
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static String destinoPendente = "";
    // Atualizações públicas do GitHub. O repositório precisa ser público; nunca embutir token de acesso no APK.
    private static final String UPDATE_OWNER = "Leoportilla";
    private static final String UPDATE_REPO = "Ven";
    private static final String UPDATE_TAG = "latest-alpha";
    private static final String UPDATE_API = "https://api.github.com/repos/" + UPDATE_OWNER + "/" + UPDATE_REPO + "/releases/tags/" + UPDATE_TAG;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        lerDestino(getIntent());
        pedirPermissaoAvisos();
        // Cor da faixa do app (guardada da ultima vez): evita piscar outra cor ao abrir.
        aplicarCromo(getSharedPreferences("ven", MODE_PRIVATE).getString("cromo", "#10151B"));
        // Desenha também atrás da área de navegação por gestos. Em Android recentes,
        // setNavigationBarColor() não pinta a área da alça de gestos; sem edge-to-edge
        // o fundo da janela aparece como uma faixa branca/cinza abaixo do menu.
        getWindow().setStatusBarColor(0xFF0A2A66);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 29) getWindow().setNavigationBarContrastEnforced(false);
        // Mantém o conteúdo atrás da área inferior de gestos, mas não ativa
        // LAYOUT_STABLE, que estava associado ao deslocamento inesperado dos
        // controles de navegação do sistema em alguns aparelhos.
        getWindow().getDecorView().setSystemUiVisibility(
                android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        // Tela fixa: sem zoom por pinça, sem botões de zoom, texto não ampliado pelo sistema e sem barra/elástico de rolagem.
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        webView.setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.addJavascriptInterface(new AndroidBridge(), "Android");
        webView.addJavascriptInterface(new BancoBridge(this), "AndroidDB");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return abrirExterno(request.getUrl().toString());
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Informa ao HTML a altura real da barra de status do Android.
                // O botão de menu é absoluto e não respeita sozinho o padding superior do cabeçalho.
                try {
                    int topInsetPx = 0;
                    if (Build.VERSION.SDK_INT >= 30) {
                        android.view.WindowInsets wi = getWindow().getDecorView().getRootWindowInsets();
                        if (wi != null) topInsetPx = wi.getInsets(android.view.WindowInsets.Type.statusBars()).top;
                    } else if (Build.VERSION.SDK_INT >= 23) {
                        android.view.WindowInsets wi = getWindow().getDecorView().getRootWindowInsets();
                        if (wi != null) topInsetPx = wi.getSystemWindowInsetTop();
                    }
                    float density = getResources().getDisplayMetrics().density;
                    int topInsetDp = Math.round(topInsetPx / density);
                    view.evaluateJavascript("document.documentElement.style.setProperty('--ven-statusbar-inset','" + topInsetDp + "px')", null);
                } catch (Exception ignorado) { }
                SharedPreferences prefs = getSharedPreferences("ven_updates", MODE_PRIVATE);
                long last = prefs.getLong("last_check", 0L);
                if (prefs.getBoolean("auto", true) && System.currentTimeMillis() - last > 24L * 60L * 60L * 1000L) {
                    new android.os.Handler(getMainLooper()).postDelayed(() -> verificarAtualizacao(false), 2500L);
                }
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    filePathCallback = null;
                    return false;
                }
                return true;
            }
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });
        setContentView(webView);
        webView.loadUrl("file:///android_asset/orcamento.html");
    }

    // Encaminha a verificacao automatica para a rotina do bridge nativo.
    private void verificarAtualizacao(boolean mostrarStatus) {
        new AndroidBridge().verificarAtualizacao(mostrarStatus);
    }

    // Links que nao sao da propria tela (whatsapp:, intent:, tel:, mailto:, https:) abrem no app certo em vez de trocar a pagina do aplicativo.
    private boolean abrirExterno(String url) {
        if (url == null || url.startsWith("file:") || url.startsWith("about:") || url.startsWith("data:") || url.startsWith("javascript:")) return false;
        try {
            Intent i = url.startsWith("intent:") ? Intent.parseUri(url, Intent.URI_INTENT_SCHEME) : new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            i.addCategory(Intent.CATEGORY_BROWSABLE);
            i.setComponent(null);
            i.setSelector(null);
            startActivity(i);
        } catch (Exception e) {
            Toast.makeText(this, "Não foi possível abrir o link.", Toast.LENGTH_LONG).show();
        }
        return true;
    }

    // Pinta barra de status, barra de navegacao e fundo da janela com a cor da faixa do app.
    private void aplicarCromo(String cor) {
        try {
            int c = Color.parseColor(cor);
            getWindow().getDecorView().setBackgroundColor(c);
            getWindow().setStatusBarColor(c);
            getWindow().setNavigationBarColor(c);
            if (webView != null) webView.setBackgroundColor(c);
        } catch (Exception ignorado) { /* cor invalida: mantem a atual */ }
    }

    // Leitor do Google (Play Services): abre a propria tela de leitura, sem depender de permissao nem de tela da biblioteca.
    private void iniciarScanner() {
        try {
            GmsBarcodeScannerOptions options = new GmsBarcodeScannerOptions.Builder()
                    .setBarcodeFormats(Barcode.FORMAT_ALL_FORMATS)
                    .build();
            GmsBarcodeScanner scanner = GmsBarcodeScanning.getClient(this, options);
            scanner.startScan()
                    .addOnSuccessListener(barcode -> {
                        String valor = barcode.getRawValue();
                        if (valor != null && webView != null) {
                            webView.evaluateJavascript("barcodeLido(" + JSONObject.quote(valor) + ")", null);
                        }
                    })
                    .addOnFailureListener(e -> Toast.makeText(MainActivity.this,
                            "Leitor indisponível: " + e.getMessage(), Toast.LENGTH_LONG).show());
        } catch (Exception e) {
            Toast.makeText(this, "Não foi possível abrir o leitor: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void lerDestino(Intent i) {
        if (i != null && i.getStringExtra("destino") != null) destinoPendente = i.getStringExtra("destino");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        lerDestino(intent);
        if (webView != null) webView.evaluateJavascript("try{destinoNativo()}catch(e){}", null);
    }

    // Android 13+: precisa pedir permissao para mostrar notificacoes.
    private void pedirPermissaoAvisos() {
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 2001);
        }
    }

    public class AndroidBridge {
        // Vibracao curta de confirmacao (ex.: ao tocar no +).
        @JavascriptInterface
        public void vibrar(final int ms) {
            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v == null || !v.hasVibrator()) return;
                long dur = Math.max(5, Math.min(ms, 200));
                if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(dur, VibrationEffect.DEFAULT_AMPLITUDE));
                else v.vibrate(dur);
            } catch (Exception ignorado) { }
        }

        // Recebe do JS a lista de vencimentos [{id,quando,titulo,texto}] e reagenda os avisos.
        @JavascriptInterface
        public void agendarAvisos(final String json) {
            try { Avisos.agendar(getApplicationContext(), json, true); } catch (Exception ignorado) { }
        }

        // Retorna (e limpa) a tela pedida ao tocar numa notificacao.
        @JavascriptInterface
        public String destinoInicial() {
            String d = destinoPendente;
            destinoPendente = "";
            return d == null ? "" : d;
        }
        // Abre a conversa do WhatsApp com o numero informado (com DDI 55 + DDD), no WhatsApp ou WhatsApp Business.
        @JavascriptInterface
        public void abrirWhatsAppContato(final String numero) {
            runOnUiThread(() -> {
                String n = numero == null ? "" : numero.replaceAll("\\D", "");
                if (n.isEmpty()) return;
                Uri uri = Uri.parse("https://wa.me/" + n);
                String[] pacotes = {"com.whatsapp", "com.whatsapp.w4b"};
                for (String pkg : pacotes) {
                    try {
                        Intent i = new Intent(Intent.ACTION_VIEW, uri);
                        i.setPackage(pkg);
                        startActivity(i);
                        return;
                    } catch (Exception ignorado) { /* tenta o proximo */ }
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "WhatsApp não encontrado neste aparelho.", Toast.LENGTH_LONG).show();
                }
            });
        }

        // Mantém a barra de navegação do Android na mesma cor do fundo quando o teclado virtual abre.
        @JavascriptInterface
        public void setBarraTeclado(final boolean ativa, final String cor) {
            runOnUiThread(() -> {
                try {
                    int corBarra;
                    // Usa a cor atual enviada pelo HTML tanto ao abrir quanto ao fechar o teclado.
                    // Restaurar sempre o cromo salvo causava um flash escuro no tema claro.
                    String corAtual = (cor == null || cor.trim().isEmpty())
                            ? getSharedPreferences("ven", MODE_PRIVATE).getString("cromo", "#F4F7FB")
                            : cor.trim();
                    corBarra = Color.parseColor(corAtual);
                    // Mantém o fundo nativo e o WebView sincronizados com o campo focado.
                    // Isso evita que a área exposta pelo redimensionamento do teclado apareça azul.
                    getWindow().getDecorView().setBackgroundColor(corBarra);
                    if (webView != null) webView.setBackgroundColor(corBarra);
                    // A área de gestos permanece transparente; o WebView desenha o fundo
                    // por trás dela, evitando a faixa clara exposta no tema branco.
                    getWindow().setNavigationBarColor(Color.TRANSPARENT);
                    if (Build.VERSION.SDK_INT >= 29) getWindow().setNavigationBarContrastEnforced(false);
                } catch (Exception ignorado) { }
            });
        }

        @JavascriptInterface
        public void setTema(final String cor) {
            runOnUiThread(() -> {
                aplicarCromo(cor);
                getSharedPreferences("ven", MODE_PRIVATE).edit().putString("cromo", cor).apply();
            });
        }

        @JavascriptInterface
        public void scanBarcode() {
            runOnUiThread(() -> iniciarScanner());
        }

        @JavascriptInterface
        public void enviarWhatsApp(final String mensagem) {
            runOnUiThread(() -> {
                String[] pacotes = {"com.whatsapp", "com.whatsapp.w4b"};
                for (String pkg : pacotes) {
                    try {
                        Intent i = new Intent(Intent.ACTION_SEND);
                        i.setType("text/plain");
                        i.setPackage(pkg);
                        i.putExtra(Intent.EXTRA_TEXT, mensagem);
                        startActivity(i);
                        return;
                    } catch (Exception ignorado) { /* tenta o proximo */ }
                }
                try {
                    Intent share = new Intent(Intent.ACTION_SEND);
                    share.setType("text/plain");
                    share.putExtra(Intent.EXTRA_TEXT, mensagem);
                    startActivity(Intent.createChooser(share, "Enviar orçamento"));
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Não foi possível abrir o compartilhamento.", Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public void setAutoUpdateEnabled(final boolean enabled) {
            getSharedPreferences("ven_updates", MODE_PRIVATE).edit().putBoolean("auto", enabled).apply();
            if (enabled) verificarAtualizacao(false);
        }

        @JavascriptInterface
        public void checkForUpdates() { verificarAtualizacao(true); }

        @JavascriptInterface
        public void openUpdateUrl(final String url) {
            runOnUiThread(() -> {
                try {
                    Uri uri = Uri.parse(url == null ? "" : url);
                    if (!"https".equalsIgnoreCase(uri.getScheme()) || !"github.com".equalsIgnoreCase(uri.getHost())) {
                        Toast.makeText(MainActivity.this, "Link de atualização inválido.", Toast.LENGTH_LONG).show();
                        return;
                    }
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Não foi possível abrir a atualização.", Toast.LENGTH_LONG).show();
                }
            });
        }

        // Consulta a release pública latest-alpha; o usuário confirma a instalação pelo Android.
        private void verificarAtualizacao(boolean mostrarStatus) {
            new Thread(() -> {
                HttpURLConnection conn = null;
                JSONObject resposta;
                try {
                    URL url = new URL(UPDATE_API);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(8000);
                    conn.setReadTimeout(8000);
                    conn.setRequestProperty("Accept", "application/vnd.github+json");
                    conn.setRequestProperty("User-Agent", "VEN-Android-Updater");
                    int status = conn.getResponseCode();
                    if (status != 200) throw new Exception(status == 404 ? "Lançamento não encontrado ou repositório privado." : "GitHub respondeu HTTP " + status + ".");
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));
                    StringBuilder body = new StringBuilder(); String line;
                    while ((line = reader.readLine()) != null) body.append(line);
                    reader.close();
                    JSONObject release = new JSONObject(body.toString());
                    String releaseBody = release.optString("body", "");
                    int remoteCode = -1;
                    java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(?i)versionCode\\s*[:=]\\s*(\\d+)").matcher(releaseBody);
                    if (matcher.find()) remoteCode = Integer.parseInt(matcher.group(1));
                    String versionName = "nova versão";
                    java.util.regex.Matcher nameMatcher = java.util.regex.Pattern.compile("(?i)versionName\\s*[:=]\\s*([^\\r\\n]+)").matcher(releaseBody);
                    if (nameMatcher.find()) versionName = nameMatcher.group(1).trim();
                    String releaseUrl = release.optString("html_url", "https://github.com/" + UPDATE_OWNER + "/" + UPDATE_REPO + "/releases");
                    boolean available = remoteCode > BuildConfig.VERSION_CODE;
                    resposta = new JSONObject(); resposta.put("available", available); resposta.put("versionName", versionName); resposta.put("versionCode", remoteCode); resposta.put("url", releaseUrl);
                    if (!available) resposta.put("message", "Seu VEN já está atualizado.");
                    getSharedPreferences("ven_updates", MODE_PRIVATE).edit().putLong("last_check", System.currentTimeMillis()).apply();
                } catch (Exception e) {
                    resposta = new JSONObject();
                    try { resposta.put("available", false); resposta.put("message", "Não foi possível consultar atualizações. " + e.getMessage()); } catch (Exception ignored) { }
                } finally { if (conn != null) conn.disconnect(); }
                final String json = resposta.toString();
                runOnUiThread(() -> { if (webView != null) webView.evaluateJavascript("if(window.venUpdateResult)window.venUpdateResult(" + JSONObject.quote(json) + ")", null); });
            }).start();
        }

        // Imprime/gera PDF a partir de um HTML proprio do orcamento (nao depende do CSS de impressao da tela).
        @JavascriptInterface
        public void printHtml(final String html) {
            runOnUiThread(() -> {
                try {
                    final WebView pw = new WebView(MainActivity.this);
                    printWebView = pw;
                    pw.setWebViewClient(new WebViewClient() {
                        private boolean impresso = false;
                        @Override
                        public void onPageFinished(WebView view, String url) {
                            if (impresso) return;
                            impresso = true;
                            PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                            PrintDocumentAdapter adapter = view.createPrintDocumentAdapter("Orcamento_VEN");
                            pm.print("Orcamento_VEN", adapter,
                                    new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
                        }
                    });
                    pw.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Não foi possível gerar o PDF: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }

        // mantido por compatibilidade com versoes antigas do HTML
        @JavascriptInterface
        public void printQuote() {
            runOnUiThread(() -> {
                PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                if (printManager != null && webView != null) {
                    printManager.print("Orcamento_VEN", webView.createPrintDocumentAdapter("Orcamento_VEN"), new PrintAttributes.Builder().build());
                }
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback == null) return;
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) results = new Uri[]{data.getData()};
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
            return;
        }
    }

    @Override
    public void onBackPressed() {
        // A navegacao interna e controlada pelo proprio VEN. Nao usar webView.goBack(),
        // pois isso pode voltar para estados antigos do HTML ou sair inesperadamente.
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        webView.evaluateJavascript(
                "(function(){return (typeof handleAndroidBack === 'function') ? handleAndroidBack() : false;})()",
                value -> {
                    if ("true".equals(value)) {
                        // A tela interna, menu ou janela foi fechada pelo HTML.
                        return;
                    }
                    // Na Home, o botao Voltar pode encerrar o aplicativo normalmente.
                    MainActivity.super.onBackPressed();
                }
        );
    }
}
