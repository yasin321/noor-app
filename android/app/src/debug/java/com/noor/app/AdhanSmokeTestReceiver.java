package com.noor.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** Debug-only bridge used by the CI emulator smoke test. Not included in release builds. */
public class AdhanSmokeTestReceiver extends BroadcastReceiver {
    public static final String ACTION_TEST_PLAY = "com.noor.app.action.CI_TEST_PLAY_ADHAN";

    @Override public void onReceive(Context context, Intent intent) {
        if (intent == null || !ACTION_TEST_PLAY.equals(intent.getAction())) return;
        Intent service = new Intent(context, PrayerAdhanService.class);
        service.setAction(PrayerAdhanService.ACTION_PLAY);
        service.putExtra("id", intent.getStringExtra("id"));
        service.putExtra("title", intent.getStringExtra("title"));
        service.putExtra("audioUrl", intent.getStringExtra("audioUrl"));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(service);
        } else {
            context.startService(service);
        }
    }
}
