package br.com.ven.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONObject;

public class AvisosReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        String acao = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(acao) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(acao)) {
            Avisos.reagendarSalvos(ctx);
            return;
        }
        try {
            Avisos.disparar(ctx, new JSONObject(intent.getStringExtra("dados")));
        } catch (Exception ignorado) { }
    }
}
