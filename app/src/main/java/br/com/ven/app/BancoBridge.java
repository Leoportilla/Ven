package br.com.ven.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;

/**
 * Armazenamento SQLite do VEN (exposto ao JavaScript como "AndroidDB").
 * Cada valor e guardado em pedacos (CursorWindow do Android limita ~2 MB por linha),
 * entao o catalogo grande nao estoura.
 */
public class BancoBridge {
    private static final int PEDACO = 200000; // caracteres por linha

    private static class Helper extends SQLiteOpenHelper {
        Helper(Context c) { super(c, "ven.db", null, 1); }

        @Override public void onCreate(SQLiteDatabase db) {
            db.execSQL("CREATE TABLE kv (k TEXT NOT NULL, i INTEGER NOT NULL, v TEXT NOT NULL, PRIMARY KEY (k, i))");
        }

        @Override public void onUpgrade(SQLiteDatabase db, int antiga, int nova) { }
    }

    private final Context ctx;
    private final Helper helper;

    public BancoBridge(Context contexto) {
        this.ctx = contexto.getApplicationContext();
        this.helper = new Helper(ctx);
    }

    /** Retorna {chave: valor, ...} com tudo que esta no banco. */
    @JavascriptInterface
    public synchronized String carregarTudo() {
        try {
            SQLiteDatabase db = helper.getReadableDatabase();
            JSONObject out = new JSONObject();
            Cursor c = db.rawQuery("SELECT k, v FROM kv ORDER BY k, i", null);
            try {
                String atual = null;
                StringBuilder sb = new StringBuilder();
                while (c.moveToNext()) {
                    String k = c.getString(0);
                    if (atual != null && !atual.equals(k)) { out.put(atual, sb.toString()); sb.setLength(0); }
                    atual = k;
                    sb.append(c.getString(1));
                }
                if (atual != null) out.put(atual, sb.toString());
            } finally { c.close(); }
            return out.toString();
        } catch (Exception e) {
            return "";
        }
    }

    @JavascriptInterface
    public synchronized String obter(String chave) {
        try {
            SQLiteDatabase db = helper.getReadableDatabase();
            Cursor c = db.rawQuery("SELECT v FROM kv WHERE k = ? ORDER BY i", new String[]{chave});
            try {
                if (!c.moveToFirst()) return null;
                StringBuilder sb = new StringBuilder();
                do { sb.append(c.getString(0)); } while (c.moveToNext());
                return sb.toString();
            } finally { c.close(); }
        } catch (Exception e) {
            return null;
        }
    }

    @JavascriptInterface
    public synchronized boolean gravar(String chave, String valor) {
        SQLiteDatabase db = helper.getWritableDatabase();
        try {
            db.beginTransaction();
            inserir(db, chave, valor == null ? "" : valor);
            db.setTransactionSuccessful();
            return true;
        } catch (Exception e) {
            return false;
        } finally {
            try { db.endTransaction(); } catch (Exception ignorado) { }
        }
    }

    @JavascriptInterface
    public synchronized boolean apagar(String chave) {
        try {
            helper.getWritableDatabase().delete("kv", "k = ?", new String[]{chave});
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** Troca todo o conteudo do banco de uma vez (tudo ou nada). Mantem a marca de migracao. */
    @JavascriptInterface
    public synchronized boolean substituirTudo(String jsonObjeto) {
        SQLiteDatabase db = helper.getWritableDatabase();
        try {
            JSONObject o = new JSONObject(jsonObjeto);
            db.beginTransaction();
            db.delete("kv", null, null);
            Iterator<String> it = o.keys();
            while (it.hasNext()) {
                String k = it.next();
                inserir(db, k, o.getString(k));
            }
            inserir(db, "__migrado", "restaurado");
            db.setTransactionSuccessful();
            return true;
        } catch (Exception e) {
            return false;
        } finally {
            try { db.endTransaction(); } catch (Exception ignorado) { }
        }
    }

    private void inserir(SQLiteDatabase db, String chave, String valor) {
        db.delete("kv", "k = ?", new String[]{chave});
        int n = 0;
        int pos = 0;
        do {
            int fim = Math.min(valor.length(), pos + PEDACO);
            // nao corta no meio de um par substituto (emoji)
            if (fim < valor.length() && Character.isHighSurrogate(valor.charAt(fim - 1))) fim--;
            ContentValues cv = new ContentValues();
            cv.put("k", chave);
            cv.put("i", n++);
            cv.put("v", valor.substring(pos, fim));
            db.insertOrThrow("kv", null, cv);
            pos = fim;
        } while (pos < valor.length());
    }

    /** Salva o backup em Downloads/VEN (Android 10+) ou na pasta do app (versoes antigas). Retorna o local ou "". */
    @JavascriptInterface
    public String salvarBackup(String nome, String conteudo) {
        try {
            byte[] bytes = conteudo.getBytes(StandardCharsets.UTF_8);
            String seguro = nome.replaceAll("[^A-Za-z0-9._-]", "_");
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.MediaColumns.DISPLAY_NAME, seguro);
                cv.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
                cv.put(MediaStore.MediaColumns.RELATIVE_PATH, "Download/VEN");
                Uri uri = ctx.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                if (uri == null) return "";
                OutputStream os = ctx.getContentResolver().openOutputStream(uri);
                if (os == null) return "";
                try { os.write(bytes); } finally { os.close(); }
                return "Downloads/VEN/" + seguro;
            }
            File dir = ctx.getExternalFilesDir(null);
            if (dir == null) dir = ctx.getFilesDir();
            File f = new File(dir, seguro);
            FileOutputStream os = new FileOutputStream(f);
            try { os.write(bytes); } finally { os.close(); }
            return f.getAbsolutePath();
        } catch (Exception e) {
            return "";
        }
    }
}
