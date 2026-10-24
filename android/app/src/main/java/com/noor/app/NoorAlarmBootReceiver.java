package com.noor.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONObject;

public class NoorAlarmBootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !Intent.ACTION_TIME_CHANGED.equals(action)
                && !Intent.ACTION_TIMEZONE_CHANGED.equals(action)
                && !"android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED".equals(action)) return;

        android.content.SharedPreferences prefs =
                context.getSharedPreferences("noor_prayer_alarms", Context.MODE_PRIVATE);
        for (Object value : prefs.getAll().values()) {
            if (!(value instanceof String)) continue;
            try {
                JSONObject alarm = new JSONObject((String) value);
                if (alarm.optLong("at", 0) > System.currentTimeMillis()) {
                    NoorAlarmPlugin.scheduleStoredAlarm(context, alarm);
                }
            } catch (Exception e) {
                android.util.Log.e("NoorAlarm", "Could not restore scheduled prayer alarm", e);
            }
        }
    }
}