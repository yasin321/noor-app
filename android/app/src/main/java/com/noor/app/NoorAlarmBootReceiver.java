package com.noor.app;

import android.app.AlarmManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import org.json.JSONObject;

public class NoorAlarmBootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !Intent.ACTION_TIME_CHANGED.equals(action)
                && !Intent.ACTION_TIMEZONE_CHANGED.equals(action)
                && !"android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED".equals(action)) return;

        // Android removes exact alarms when access is revoked. Do not attempt
        // to restore them until the user grants access again.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (manager == null || !manager.canScheduleExactAlarms()) {
                android.util.Log.w("NoorAlarm", "Skipping alarm restore: exact-alarm access is not granted");
                return;
            }
        }

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
