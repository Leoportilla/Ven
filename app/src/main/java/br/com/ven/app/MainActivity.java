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
import android.widget.EditText;
import android.text.InputType;
import android.view.Gravity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.widget.TextView;
import android.widget.LinearLayout;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.fragment.app.FragmentActivity;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import android.util.Base64;


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

public class MainActivity extends FragmentActivity {
    private WebView webView;
    private WebView printWebView; // mantem referencia enquanto a impressao esta aberta
    private boolean paginaLiberada = false;
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
                    new android.os.Handler(getMainLooper()).postDelayed(() -> {
                        if (getSharedPreferences("ven_updates", MODE_PRIVATE).getBoolean("auto", true)) {
                            verificarAtualizacao(false);
                        }
                    }, 2500L);
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
        solicitarPinAoAbrir();
    }

    private SharedPreferences pinPrefs() { return getSharedPreferences("ven_security", MODE_PRIVATE); }

    private boolean pinAtivo() { return pinPrefs().getBoolean("pin_enabled", false); }
    private boolean biometriaAtiva() { return pinPrefs().getBoolean("biometric_enabled", false); }

    private String derivarPin(String pin, String salt) throws Exception {
        byte[] saltBytes = Base64.decode(salt, Base64.NO_WRAP);
        KeySpec spec = new PBEKeySpec(pin.toCharArray(), saltBytes, 120000, 256);
        byte[] hash = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        return Base64.encodeToString(hash, Base64.NO_WRAP);
    }

    private boolean conferirPin(String pin) {
        try {
            String salt = pinPrefs().getString("pin_salt", "");
            String esperado = pinPrefs().getString("pin_hash", "");
            if (salt.isEmpty() || esperado.isEmpty()) return false;
            return java.security.MessageDigest.isEqual(derivarPin(pin, salt).getBytes("UTF-8"), esperado.getBytes("UTF-8"));
        } catch (Exception e) { return false; }
    }

    private void salvarPin(String pin) {
        try {
            byte[] saltBytes = new byte[16];
            new SecureRandom().nextBytes(saltBytes);
            String salt = Base64.encodeToString(saltBytes, Base64.NO_WRAP);
            String hash = derivarPin(pin, salt);
            pinPrefs().edit().putString("pin_salt", salt).putString("pin_hash", hash).putBoolean("pin_enabled", true).apply();
            Toast.makeText(this, "PIN ativado com sucesso.", Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(this, "Não foi possível configurar o PIN neste aparelho.", Toast.LENGTH_LONG).show();
        }
    }

    private boolean temaEscuroAtivo() {
        int modo = getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK;
        return modo == android.content.res.Configuration.UI_MODE_NIGHT_YES;
    }

    private TextView tituloDialogo(String titulo) {
        TextView t = new TextView(this);
        t.setText(titulo);
        // Identidade VEN com contraste adaptado ao tema do aparelho.
        t.setTextColor(Color.rgb(255, 145, 45));
        t.setTextSize(20);
        t.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        int h = (int)(22 * getResources().getDisplayMetrics().density);
        int v = (int)(18 * getResources().getDisplayMetrics().density);
        t.setPadding(h, v, h, v);
        t.setBackgroundColor(temaEscuroAtivo() ? Color.rgb(11, 42, 102) : Color.rgb(235, 245, 252));
        if (!temaEscuroAtivo()) t.setTextColor(Color.rgb(11, 42, 102));
        return t;
    }

    private void aplicarEstiloVen(AlertDialog dialog, String titulo) {
        dialog.setCustomTitle(tituloDialogo(titulo));
        dialog.setOnShowListener(v -> {
            if (dialog.getButton(AlertDialog.BUTTON_POSITIVE) != null) dialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(Color.rgb(245,130,32));
            if (dialog.getButton(AlertDialog.BUTTON_NEGATIVE) != null) dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setTextColor(Color.rgb(45,145,205));
            if (dialog.getButton(AlertDialog.BUTTON_NEUTRAL) != null) dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setTextColor(Color.rgb(11,42,102));
            if (dialog.getWindow() != null) {
                float d = getResources().getDisplayMetrics().density;
                GradientDrawable bg = new GradientDrawable();
                bg.setColor(temaEscuroAtivo() ? Color.rgb(18, 28, 43) : Color.rgb(255, 255, 255));
                bg.setCornerRadius(22 * d);
                bg.setStroke(Math.max(1, (int)d), Color.rgb(45, 145, 205));
                dialog.getWindow().setBackgroundDrawable(bg);
                dialog.getWindow().setLayout((int)(Math.min(360*d, getResources().getDisplayMetrics().widthPixels - 40*d)), android.view.WindowManager.LayoutParams.WRAP_CONTENT);
            }
        });
    }

    private void estilizarPainelPin(AlertDialog dialog) {
        if (dialog == null) return;
        float d = getResources().getDisplayMetrics().density;
        boolean escuro = temaEscuroAtivo();
        int fundo = escuro ? Color.rgb(18, 28, 43) : Color.rgb(255, 255, 255);
        int texto = escuro ? Color.rgb(238, 243, 250) : Color.rgb(31, 41, 55);
        int azul = Color.rgb(45, 145, 205);
        int laranja = Color.rgb(255, 145, 45);
        try {
            TextView msg = dialog.findViewById(android.R.id.message);
            if (msg != null) {
                msg.setTextColor(texto);
                msg.setTextSize(16);
                msg.setPadding((int)(20*d), (int)(8*d), (int)(20*d), (int)(12*d));
            }
            // Não acessar IDs internos do AlertDialog: eles não fazem parte da API pública Android.
            // O fundo e o contorno são aplicados à janela abaixo; a mensagem e os botões são estilizados aqui.
            if (dialog.getButton(AlertDialog.BUTTON_POSITIVE) != null)
                dialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(laranja);
            if (dialog.getButton(AlertDialog.BUTTON_NEGATIVE) != null)
                dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setTextColor(azul);
            if (dialog.getButton(AlertDialog.BUTTON_NEUTRAL) != null)
                dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setTextColor(azul);
            if (dialog.getWindow() != null) {
                GradientDrawable bg = new GradientDrawable();
                bg.setColor(fundo);
                bg.setCornerRadius(22*d);
                bg.setStroke(Math.max(1, (int)d), azul);
                dialog.getWindow().setBackgroundDrawable(bg);
                dialog.getWindow().setLayout((int)Math.min(380*d, getResources().getDisplayMetrics().widthPixels - 32*d),
                        android.view.WindowManager.LayoutParams.WRAP_CONTENT);
            }
        } catch (Exception e) {
            android.util.Log.w("VEN_PIN_STYLE", "Falha ao aplicar estilo do PIN", e);
        }
    }

    private int disponibilidadeBiometria() {
        try {
            return BiometricManager.from(this).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK);
        } catch (Exception e) {
            return BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE;
        }
    }

    private void mostrarErroBiometria(int resultado) {
        String mensagem;
        switch (resultado) {
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                mensagem = "Este aparelho não disponibilizou um sensor biométrico para o VEN."; break;
            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                mensagem = "O sensor biométrico está temporariamente indisponível. Tente novamente."; break;
            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                mensagem = "Nenhuma digital está cadastrada para uso em aplicativos. Confira a segurança do Android."; break;
            default:
                mensagem = "A biometria não está disponível agora. Use o PIN do VEN."; break;
        }
        Toast.makeText(this, mensagem, Toast.LENGTH_LONG).show();
    }

    private BiometricPrompt.PromptInfo criarPromptBiometrico(String titulo, String subtitulo) {
        return new BiometricPrompt.PromptInfo.Builder()
                .setTitle(titulo)
                .setSubtitle(subtitulo)
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_WEAK)
                .setNegativeButtonText("Usar PIN")
                .build();
    }

    private void autenticarBiometria() {
        int status = disponibilidadeBiometria();
        if (status != BiometricManager.BIOMETRIC_SUCCESS) {
            mostrarErroBiometria(status);
            return;
        }
        try {
            BiometricPrompt prompt = new BiometricPrompt(this, getMainExecutor(), new BiometricPrompt.AuthenticationCallback() {
                @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                    runOnUiThread(() -> liberarPagina());
                }
                @Override public void onAuthenticationFailed() {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "Digital não reconhecida. Tente novamente ou use o PIN.", Toast.LENGTH_SHORT).show());
                }
                @Override public void onAuthenticationError(int code, CharSequence message) {
                    if (code == BiometricPrompt.ERROR_NEGATIVE_BUTTON || code == BiometricPrompt.ERROR_USER_CANCELED) {
                        runOnUiThread(() -> { if (!paginaLiberada) mostrarDialogoPinCompacto(); });
                    } else {
                        runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
                    }
                }
            });
            prompt.authenticate(criarPromptBiometrico("Desbloquear VEN", "Confirme sua identidade com a biometria do aparelho"));
        } catch (Exception e) {
            Toast.makeText(this, "Não foi possível iniciar a biometria. O PIN continua disponível.", Toast.LENGTH_LONG).show();
            android.util.Log.e("VEN_BIOMETRIA", "Falha ao iniciar autenticação biométrica", e);
        }
    }

    private EditText campoPin() {
        EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_VARIATION_PASSWORD);
        input.setHint("PIN (4–6 dígitos)");
        input.setGravity(Gravity.CENTER);
        input.setTextSize(18);
        input.setLetterSpacing(0.04f);
        input.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(6)});
        // Campo compacto com paleta coerente com o tema claro/escuro do aparelho.
        boolean escuro = temaEscuroAtivo();
        input.setTextColor(escuro ? Color.rgb(245, 247, 250) : Color.rgb(31, 41, 55));
        input.setHintTextColor(escuro ? Color.rgb(174, 188, 207) : Color.rgb(112, 128, 144));
        float d = getResources().getDisplayMetrics().density;
        int pad = (int)(12 * d);
        input.setPadding(pad, (int)(6*d), pad, (int)(6*d));
        GradientDrawable campo = new GradientDrawable();
        campo.setColor(escuro ? Color.rgb(27, 45, 70) : Color.rgb(245, 249, 252));
        campo.setCornerRadius(12*d);
        campo.setStroke(Math.max(1, (int)d), Color.rgb(45, 145, 205));
        input.setBackground(campo);
        if (Build.VERSION.SDK_INT >= 21) {
            input.setBackgroundTintList(null);
        }
        return input;
    }

    private void solicitarPinAoAbrir() {
        if (paginaLiberada || webView == null) return;
        if (!pinAtivo()) { liberarPagina(); return; }
        // Quando a biometria foi ativada, ela é a primeira opção ao abrir o VEN.
        if (biometriaAtiva() && Build.VERSION.SDK_INT >= 28
                && disponibilidadeBiometria() == BiometricManager.BIOMETRIC_SUCCESS) {
            autenticarBiometria();
            return;
        }
        mostrarDialogoPinCompacto();
    }

    private interface PinDigitadoCallback { void onPin(String pin); }

    // Teclado numérico próprio do VEN: compacto, com seis posições e cores adaptadas ao tema.
    private void mostrarTecladoPin(String titulo, String mensagem, String acao,
                                   boolean permitirBiometria, PinDigitadoCallback callback) {
        if (isFinishing()) return;
        final float d = getResources().getDisplayMetrics().density;
        final boolean escuro = temaEscuroAtivo();
        final int fundo = escuro ? Color.rgb(11, 14, 18) : Color.rgb(13, 105, 157);
        final int superficie = escuro ? Color.rgb(25, 29, 35) : Color.rgb(255, 255, 255);
        final int texto = escuro ? Color.rgb(245, 247, 250) : Color.rgb(255, 255, 255);
        final int secundario = escuro ? Color.rgb(160, 169, 181) : Color.rgb(211, 229, 240);
        final int azul = escuro ? Color.rgb(48, 151, 211) : Color.rgb(255, 255, 255);
        final int laranja = Color.rgb(255, 145, 45);
        final StringBuilder valor = new StringBuilder();

        LinearLayout raiz = new LinearLayout(this);
        raiz.setOrientation(LinearLayout.VERTICAL);
        raiz.setGravity(Gravity.CENTER_HORIZONTAL);
        raiz.setPadding((int)(18*d), (int)(18*d), (int)(18*d), (int)(16*d));
        GradientDrawable painel = new GradientDrawable();
        painel.setColor(fundo);
        painel.setCornerRadius(28*d);
        painel.setStroke(Math.max(1, (int)d), escuro ? Color.rgb(43, 49, 58) : Color.rgb(35, 132, 183));
        raiz.setBackground(painel);

        // Marca VEN em forma de V, no topo do painel de PIN.
        TextView logo = new TextView(this);
        logo.setText("V");
        logo.setTextColor(laranja);
        logo.setTextSize(30);
        logo.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        logo.setGravity(Gravity.CENTER);
        GradientDrawable logoBg = new GradientDrawable();
        logoBg.setColor(escuro ? Color.rgb(30, 34, 41) : Color.rgb(39, 128, 174));
        logoBg.setCornerRadius(18*d);
        logoBg.setStroke(Math.max(1, (int)d), escuro ? Color.rgb(51, 58, 68) : Color.rgb(92, 166, 204));
        logo.setBackground(logoBg);
        LinearLayout.LayoutParams lpLogo = new LinearLayout.LayoutParams((int)(58*d), (int)(58*d));
        lpLogo.bottomMargin = (int)(10*d);
        raiz.addView(logo, lpLogo);

        TextView cabecalho = new TextView(this);
        cabecalho.setText(titulo);
        cabecalho.setTextColor(texto);
        cabecalho.setTextSize(23);
        cabecalho.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        cabecalho.setGravity(Gravity.CENTER);
        raiz.addView(cabecalho, new LinearLayout.LayoutParams(-1, -2));

        TextView descricao = new TextView(this);
        descricao.setText("Escolha de 4 a 6 dígitos".equals(mensagem) || mensagem.startsWith("Escolha um PIN")
                ? "Escolha de 4 a 6 dígitos" : mensagem);
        descricao.setTextColor(secundario);
        descricao.setTextSize(14);
        descricao.setGravity(Gravity.CENTER);
        descricao.setPadding((int)(2*d), (int)(4*d), (int)(2*d), (int)(12*d));
        raiz.addView(descricao, new LinearLayout.LayoutParams(-1, -2));

        TextView pontos = new TextView(this);
        pontos.setText("○   ○   ○   ○   ○   ○");
        pontos.setTextColor(secundario);
        pontos.setTextSize(22);
        pontos.setGravity(Gravity.CENTER);
        pontos.setLetterSpacing(0.02f);
        LinearLayout.LayoutParams pp = new LinearLayout.LayoutParams(-1, (int)(30*d));
        pp.bottomMargin = (int)(2*d);
        raiz.addView(pontos, pp);

        TextView estado = new TextView(this);
        estado.setText("Digite de 4 a 6 dígitos");
        estado.setTextColor(secundario);
        estado.setTextSize(12);
        estado.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams ep = new LinearLayout.LayoutParams(-1, -2);
        ep.bottomMargin = (int)(10*d);
        raiz.addView(estado, ep);

        LinearLayout teclado = new LinearLayout(this);
        teclado.setOrientation(LinearLayout.VERTICAL);
        teclado.setGravity(Gravity.CENTER);
        String[][] linhas = {{"1","2","3"},{"4","5","6"},{"7","8","9"},{"","0","⌫"}};
        for (String[] linha : linhas) {
            LinearLayout row = new LinearLayout(this);
            row.setGravity(Gravity.CENTER);
            for (String tecla : linha) {
                TextView b = new TextView(this);
                b.setText(tecla.equals("⌫") ? "⌫" : tecla);
                b.setTextColor(tecla.isEmpty() ? Color.TRANSPARENT : texto);
                b.setTextSize(tecla.equals("⌫") ? 25 : 22);
                b.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
                b.setGravity(Gravity.CENTER);
                GradientDrawable db = new GradientDrawable();
                db.setShape(GradientDrawable.OVAL);
                db.setColor(escuro ? Color.rgb(25, 29, 35) : Color.rgb(48, 128, 171));
                db.setStroke(Math.max(1, (int)d), escuro ? Color.rgb(48, 54, 63) : Color.rgb(101, 166, 201));
                b.setBackground(db);
                LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams((int)(56*d), (int)(56*d));
                bp.setMargins((int)(7*d), (int)(4*d), (int)(7*d), (int)(4*d));
                row.addView(b, bp);
                b.setEnabled(!tecla.isEmpty());
                b.setOnClickListener(v -> {
                    if (tecla.equals("⌫")) { if (valor.length() > 0) valor.deleteCharAt(valor.length()-1); }
                    else if (!tecla.isEmpty() && valor.length() < 6) { valor.append(tecla); }
                    StringBuilder display = new StringBuilder();
                    for (int i=0; i<6; i++) display.append(i < valor.length() ? "●" : "○").append(i == 5 ? "" : "   ");
                    pontos.setText(display.toString());
                    estado.setText(valor.length() >= 4 ? valor.length() + " dígitos digitados · já pode continuar" : "Digite de 4 a 6 dígitos");
                    estado.setTextColor(valor.length() >= 4 ? laranja : secundario);
                });
            }
            teclado.addView(row, new LinearLayout.LayoutParams(-2, -2));
        }
        raiz.addView(teclado);

        final AlertDialog[] dialogRef = new AlertDialog[1];
        TextView continuar = new TextView(this);
        continuar.setText(acao.toUpperCase(java.util.Locale.ROOT));
        continuar.setTextColor(Color.rgb(28, 34, 40));
        continuar.setTextSize(15);
        continuar.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        continuar.setGravity(Gravity.CENTER);
        GradientDrawable botao = new GradientDrawable();
        botao.setColor(laranja);
        botao.setCornerRadius(30*d);
        continuar.setBackground(botao);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(-1, (int)(48*d));
        cp.topMargin = (int)(14*d);
        raiz.addView(continuar, cp);
        continuar.setOnClickListener(v -> {
            if (valor.length() < 4 || valor.length() > 6) {
                Toast.makeText(this, "Digite de 4 a 6 números.", Toast.LENGTH_SHORT).show();
                return;
            }
            String pin = valor.toString();
            if (dialogRef[0] != null) dialogRef[0].dismiss();
            callback.onPin(pin);
        });

        TextView cancelar = new TextView(this);
        cancelar.setText("Cancelar");
        cancelar.setTextColor(secundario);
        cancelar.setTextSize(14);
        cancelar.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams cancelLp = new LinearLayout.LayoutParams(-1, (int)(34*d));
        cancelLp.topMargin = (int)(2*d);
        raiz.addView(cancelar, cancelLp);

        AlertDialog dialog = new AlertDialog.Builder(this).setView(raiz).create();
        dialogRef[0] = dialog;
        cancelar.setOnClickListener(v -> dialog.dismiss());
        if (permitirBiometria && biometriaAtiva()) {
            TextView digital = new TextView(this);
            digital.setText("Usar impressão digital");
            digital.setTextColor(azul);
            digital.setTextSize(13);
            digital.setGravity(Gravity.CENTER);
            raiz.addView(digital);
            digital.setOnClickListener(v -> { dialog.dismiss(); autenticarBiometria(); });
        }
        dialog.setOnCancelListener(v -> { });
        dialog.show();
        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
            dialog.getWindow().setLayout((int)Math.min(360*d, getResources().getDisplayMetrics().widthPixels - 28*d),
                    android.view.WindowManager.LayoutParams.WRAP_CONTENT);
        }
    }

    private void mostrarDialogoPinCompacto() {
        if (paginaLiberada || isFinishing()) return;
        mostrarTecladoPin("Desbloquear VEN", "Digite seu PIN para acessar o VEN", "Desbloquear", true, pin -> {
            if (conferirPin(pin)) liberarPagina();
            else { Toast.makeText(this, "PIN incorreto. Tente novamente.", Toast.LENGTH_LONG).show(); mostrarDialogoPinCompacto(); }
        });
    }

    private void pedirNovoPin() {
        mostrarTecladoPin("Cadastrar PIN", "Escolha um PIN numérico de 4 a 6 dígitos.", "Continuar", false, pin ->
                mostrarTecladoPin("Confirmar PIN", "Digite novamente o mesmo PIN.", "Ativar proteção", false, confirmacao -> {
                    if (!pin.equals(confirmacao)) {
                        Toast.makeText(this, "Os PINs não coincidem. Tente novamente.", Toast.LENGTH_LONG).show();
                        pedirNovoPin();
                    } else salvarPin(pin);
                }));
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
        @JavascriptInterface
        public String getInstalledVersion() { return BuildConfig.VERSION_NAME; }

        @JavascriptInterface
        public void gerenciarPin() { MainActivity.this.gerenciarPin(); }

        @JavascriptInterface
        public boolean pinAtivo() { return MainActivity.this.pinAtivo(); }

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
        // Abre o aplicativo de e-mail com destinatário, assunto e mensagem preenchidos.
        @JavascriptInterface
        public void abrirEmail(final String destinatario, final String assunto, final String mensagem) {
            runOnUiThread(() -> {
                try {
                    String para = destinatario == null ? "" : destinatario.trim();
                    if (para.isEmpty()) { Toast.makeText(MainActivity.this, "E-mail do cliente não cadastrado.", Toast.LENGTH_LONG).show(); return; }
                    Intent i = new Intent(Intent.ACTION_SENDTO);
                    i.setData(Uri.parse("mailto:" + Uri.encode(para)));
                    i.putExtra(Intent.EXTRA_EMAIL, new String[]{para});
                    i.putExtra(Intent.EXTRA_SUBJECT, assunto == null ? "" : assunto);
                    i.putExtra(Intent.EXTRA_TEXT, mensagem == null ? "" : mensagem);
                    // Deixa o Android resolver o app de e-mail diretamente; quando houver mais de um,
                    // o sistema pode oferecer “Sempre”/“Só uma vez” para definir o padrão.
                    startActivity(i);
                } catch (Exception e) { Toast.makeText(MainActivity.this, "Não foi possível abrir um aplicativo de e-mail.", Toast.LENGTH_LONG).show(); }
            });
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
        public boolean isAutoUpdateEnabled() {
            return getSharedPreferences("ven_updates", MODE_PRIVATE).getBoolean("auto", true);
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
