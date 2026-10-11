package br.com.ven.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

/** Avisos de vendas vencidas: agenda alarmes e mostra a notificacao. */
public class Avisos {
    static final String CANAL = "vencimentos";
    private static final String PREFS = "ven_avisos";

    /** Substitui todos os avisos pela lista recebida. Vencidos ainda nao avisados disparam na hora. */
    public static void agendar(Context ctx, String json, boolean imediato) throws Exception {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);

        // cancela os alarmes anteriores
        JSONArray antigos = new JSONArray(sp.getString("lista", "[]"));
        for (int i = 0; i < antigos.length(); i++) {
            am.cancel(intencao(ctx, antigos.getJSONObject(i)));
        }
        sp.edit().putString("lista", json).apply();

        Set<String> avisados = new HashSet<>(sp.getStringSet("avisados", new HashSet<String>()));
        JSONArray lista = new JSONArray(json);
        Set<String> ativos = new HashSet<>();
        long agora = System.currentTimeMillis();
        for (int i = 0; i < lista.length(); i++) {
            JSONObject o = lista.getJSONObject(i);
            String chave = String.valueOf(o.get("id")) + "@" + o.getLong("quando");
            ativos.add(chave);
            if (avisados.contains(chave)) continue;
            long quando = o.getLong("quando");
            if (quando <= agora) {
                if (imediato) { mostrar(ctx, o); avisados.add(chave); }
            } else {
                PendingIntent pi = intencao(ctx, o);
                if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, quando, pi);
                else am.set(AlarmManager.RTC_WAKEUP, quando, pi);
            }
        }
        avisados.retainAll(ativos); // esquece vendas ja quitadas
        sp.edit().putStringSet("avisados", avisados).apply();
    }

    /** Chamado pelo alarme. */
    public static void disparar(Context ctx, JSONObject o) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        try {
            String chave = String.valueOf(o.get("id")) + "@" + o.getLong("quando");
            Set<String> avisados = new HashSet<>(sp.getStringSet("avisados", new HashSet<String>()));
            if (avisados.contains(chave)) return;
            // venda quitada depois? entao ela nao esta mais na lista salva
            JSONArray lista = new JSONArray(sp.getString("lista", "[]"));
            boolean existe = false;
            for (int i = 0; i < lista.length(); i++) {
                if (String.valueOf(lista.getJSONObject(i).get("id")).equals(String.valueOf(o.get("id")))) { existe = true; break; }
            }
            if (!existe) return;
            mostrar(ctx, o);
            avisados.add(chave);
            sp.edit().putStringSet("avisados", avisados).apply();
        } catch (Exception ignorado) { }
    }

    /** Depois de reiniciar o aparelho, recria os alarmes. */
    public static void reagendarSalvos(Context ctx) {
        try {
            String json = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("lista", "[]");
            agendar(ctx, json, true);
        } catch (Exception ignorado) { }
    }

    private static PendingIntent intencao(Context ctx, JSONObject o) throws Exception {
        Intent i = new Intent(ctx, AvisosReceiver.class);
        i.setAction("br.com.ven.app.AVISO");
        i.putExtra("dados", o.toString());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getBroadcast(ctx, (int) (o.getLong("id") % 1000000), i, flags);
    }

    private static void mostrar(Context ctx, JSONObject o) throws Exception {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(new NotificationChannel(CANAL, "Vendas vencidas", NotificationManager.IMPORTANCE_HIGH));
        }
        Intent abrir = new Intent(ctx, MainActivity.class);
        abrir.putExtra("destino", "agenda");
        abrir.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getActivity(ctx, 7, abrir, flags);

        int icone = ctx.getResources().getIdentifier("ic_stat_ven", "drawable", ctx.getPackageName());
        if (icone == 0) icone = android.R.drawable.ic_dialog_info;

        android.app.Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new android.app.Notification.Builder(ctx, CANAL)
                : new android.app.Notification.Builder(ctx);
        b.setSmallIcon(icone)
                .setContentTitle(o.getString("titulo"))
                .setContentText(o.getString("texto"))
                .setStyle(new android.app.Notification.BigTextStyle().bigText(o.getString("texto")))
                .setContentIntent(pi)
                .setAutoCancel(true);
        nm.notify(1000 + (int) (o.getLong("id") % 100000), b.build());
    }
}
