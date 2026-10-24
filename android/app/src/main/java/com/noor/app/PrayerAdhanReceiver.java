package com.noor.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class PrayerAdhanReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String id = intent.getStringExtra("id");
        String audioUrl = intent.getStringExtra("audioUrl");
        String title = intent.getStringExtra("title");
        if (id == null || audioUrl == null || !audioUrl.startsWith("https://")) return;

        context.getSharedPreferences("noor_prayer_alarms", Context.MODE_PRIVATE)
                .edit().remove(id).apply();

        Intent service = new Intent(context, PrayerAdhanService.class);
        service.setAction(PrayerAdhanService.ACTION_PLAY);
        service.putExtra("id", id);
        service.putExtra("title", title == null ? "اذان" : title);
        service.putExtra("audioUrl", audioUrl);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(service);
            } else {
                context.startService(service);
            }
        } catch (Exception e) {
            android.util.Log.e("NoorAlarm", "Could not start adhan playback service", e);
        }
    }
}