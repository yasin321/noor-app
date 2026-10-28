package com.noor.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class AdhanAlarmReceiver extends BroadcastReceiver {
    public static final String ACTION_TRIGGER = "com.noor.app.ACTION_TRIGGER_ADHAN_ALARM";
    public static final String ACTION_STOP = "com.noor.app.ACTION_STOP_ADHAN_ALARM";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        if (ACTION_STOP.equals(intent.getAction())) {
            Intent stopService = new Intent(context, AdhanForegroundService.class);
            stopService.setAction(ACTION_STOP);
            context.stopService(stopService);
            context.sendBroadcast(new Intent("com.noor.app.ACTION_CLOSE_ALARM_UI"));
            return;
        }

        if (ACTION_TRIGGER.equals(intent.getAction())) {
            Intent serviceIntent = new Intent(context, AdhanForegroundService.class);
            serviceIntent.putExtra("title", intent.getStringExtra("title"));
            serviceIntent.putExtra("body", intent.getStringExtra("body"));
            serviceIntent.putExtra("soundType", intent.getStringExtra("soundType"));
            serviceIntent.putExtra("adhanId", intent.getStringExtra("adhanId"));
            serviceIntent.putExtra("durationSeconds", intent.getIntExtra("durationSeconds", 0));
            serviceIntent.putExtra("volumePercent", intent.getIntExtra("volumePercent", 90));

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        }
    }
}
