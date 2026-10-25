package com.noor.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;

public class AdhanAlarmReceiver extends BroadcastReceiver {
    public static final String ACTION_TRIGGER = "com.noor.app.ACTION_TRIGGER_ADHAN_ALARM";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String soundType = intent.getStringExtra("soundType");

        Intent serviceIntent = new Intent(context, AdhanForegroundService.class);
        serviceIntent.putExtra("title", title != null ? title : "یادآوری و اذان نور");
        serviceIntent.putExtra("body", body != null ? body : "وقت ذکر و نماز فرا رسیده است");
        serviceIntent.putExtra("soundType", soundType != null ? soundType : "adhan");

        ContextCompat.startForegroundService(context, serviceIntent);
    }
}
